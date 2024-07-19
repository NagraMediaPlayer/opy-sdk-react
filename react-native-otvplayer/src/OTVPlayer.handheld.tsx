// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * @file
 * @publicApi
 * @description
 * This module provides Javascript Wrapper of React Native Player Plugin with iOS and Android support.
 */
import React, { useRef, useEffect, useImperativeHandle, useState } from "react";
import {
  StyleSheet,
  requireNativeComponent,
  // ViewPropTypes,  Deprecated 0.68.0 onwards
  UIManager,
  findNodeHandle,
  Platform
} from "react-native";

// import ViewPropTypes from depreacted-react-native-prop-types
import { ViewPropTypes } from 'deprecated-react-native-prop-types';

import {
  OnLoadNativeEvent,
  OnLoadStartNativeEvent,
  OnProgressNativeEvent,
  OnSeekNativeEvent,
  OnEndNativeEvent,
  OnTracksChangedNativeEvent,
  OnAudioTrackSelectedNativeEvent,
  OnTextTrackSelectedNativeEvent,
  OTVPlayerProps,
  OnPlayNativeEvent,
  OnPausedNativeEvent,
  OnWaitingNativeEvent,
  OnPlayingNativeEvent,
  OnStatisticsUpdateNativeEvent,
  OnLogNativeEvent,
  OnErrorNativeEvent,
  OnBitratesAvailableNativeEvent,
  OnSelectedBitrateNativeEvent,
  OnDownloadResChangedNativeEvent,
} from "./common/interface";
import { OTVPlayerWithInsight } from "./OTVPlayerWithInsight";
import PropTypes from "prop-types";
import {
  OnLoadStartParam,
  OnAudioTrackSelectedParam,
  OnLoadParam,
  OnTextTrackSelectedParam,
  OTVPlayerRef,
  OnLogParam
} from "./OTVPlayer";

import {
  OTVSDK_LOGLEVEL as LOG_LEVEL
} from "./common/enums";

import { OTVSDKManager } from "./OTVSDKManager.handheld";
import { Logger } from "./Logger";

// to handle player state transition
const enum PlayerStatus {
  // state to indicate player is playing content when source changed or play called
  PLAYING,
  // state to indicate player was stopped and play call triggered to re-start it
  STOP_TO_PLAY,
  //state to indicate player is stopped by stop call
  STOPPED,
}

// Custom hook to retrive previous value
const usePrevious = (value) => {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

/**
 * @namespace
 * @description React Native Player Plugin
 */

const OTVPlayer: React.FC<OTVPlayerProps> = React.forwardRef(
  (props: OTVPlayerProps, ref: React.RefObject<OTVPlayerRef>) => { //NOSONAR
    const DEFAULT_VOLUME_LEVEL: number = 1;
    const DEFAULT_PROGRESS_INTERVAL: number = 0.25; //default progress update interval value in sec
    const playerRef = useRef(null);
    const viewId = useRef(null);
    let [playerStatus, setPlayerStatus] = useState(PlayerStatus.PLAYING);
    // save previous props data to use in STOP_TO_PLAY and STOPPED state
    const savedProps = useRef(null);
    let logger: Logger = new Logger();

    useImperativeHandle(ref, () => ({
      play,
      pause,
      seek,
      stop,
      selectAudioTrack,
      selectTextTrack,
    }));

    const prevSrc = usePrevious(props.source?.src);

    useEffect(() => {
      console.log("OTVPlayer component mounted");
      // saved viewId will be used for dispatching command to native layer.
      viewId.current = findNodeHandle(playerRef.current);

      return () => {
        console.log("OTVPlayer component unmounted");
      }
    }, []);

    useEffect(() => {
      // reset savedProp and player status when source changes
      resetToPlaying();
    }, [props.source?.src]);

    /**
     * @function
     * @summary reset savedProp(previous props data) and player status
     * @description
     * reset savedProp and player status when player transition from stop to play or if source changes
     */
    const resetToPlaying = () => {
      setPlayerStatus(PlayerStatus.PLAYING);
      savedProps.current = null;
    };

    /**
     * @function
     * @summary dispatch commond to native layer to perform play, pause, stop, seek, selectAudioTrack and selectTextTrack
     * @description
     * function to trigger action in native layer
     * @param {string} command these command expected - play, pause, stop, seek, selectAudioTrack and selectTextTrack
     * @param {Array} args array of args expected, args can be empty or required payload
     */
    const dispatchNativeCommand = (command: string, args = []) => {
      logger.log(LOG_LEVEL.DEBUG, "dispatchNativeCommand enter");
      // trigger native method to perform action on player
      UIManager.dispatchViewManagerCommand(viewId.current, command, [...args]);
      logger.log(LOG_LEVEL.DEBUG, "dispatchNativeCommand exit");
    };

    /**
     * @function
     * @summary Start or resume playback of media data.
     *
     * @description
     * Can be called to resume playing a stopped or paused content.
     * Before calling this method, props.source must be set and for encrypted content props.source.token must be set at the same time or be set in 5 seconds after set source </p>
     * From a stop to play scenario props.source.token can be set after play if it was reset to empty string after stop call. </p>
     * After calling this method, {@link OTVPlayer.props.onPlay} event is triggered. </p>
     * Callback {@link OTVPlayer.props.onProgress} is called when media data is playing in progress. </p>
     * Callback {@link OTVPlayer.props.onWaiting} is called when the playback gets stalled.
     *
     */
    const play = () => {
      logger.log(LOG_LEVEL.DEBUG, "play enter");
      if (playerStatus === PlayerStatus.STOPPED) {
        setPlayerStatus(PlayerStatus.STOP_TO_PLAY);
      } else if (playerStatus === PlayerStatus.PLAYING) {
        dispatchNativeCommand("play");
      }
      logger.log(LOG_LEVEL.DEBUG, "play exit");
    };

    /**
     * @function
     * @summary Pause the playback of the media data.
     *
     * @description
     * Before calling this method props.source must be set. </p>
     * After calling this method {@link OTVPlayer.props.onPaused} event is triggered</p>
     *
     */
    const pause = () => {
      if (playerStatus === PlayerStatus.PLAYING) {
        logger.log(LOG_LEVEL.DEBUG, "pause enter");
        dispatchNativeCommand("pause");
        logger.log(LOG_LEVEL.DEBUG, "pause exit");
      }
    };

    /**
     * @function
     * @summary Set the current playback position of the media data.
     *
     * @description
     * Before calling this method, props.source must be set. </p>
     * Callback {@link OTVPlayer.props.onSeek} is called when the seeking completes. </p>
     * @param {Number} position The position in seconds.
     * @param {Number} tolerance The tolerance in milliseconds of the seeking accuracy. Only Applicable for iOS/tvOS. Default value is 100.
     *
     * @see {@link OTVPlayer.props.onSeek}
     */
    const seek = (position: number, tolerance = 100) => {
      if (playerStatus === PlayerStatus.PLAYING) {
        logger.log(LOG_LEVEL.DEBUG, "seek enter");
        if (isNaN(position)) {
          throw new Error("seek: position is not a number");
        } else {
          logger.log(LOG_LEVEL.DEBUG, "seek position: " + position);
        }
        if (isNaN(tolerance)) {
          throw new Error("seek: tolerance is not a number");
        } else {
          logger.log(LOG_LEVEL.DEBUG, "seek tolerance: " + tolerance);
        }
        dispatchNativeCommand("seek", [
          { position: position, tolerance: tolerance },
        ]);
        logger.log(LOG_LEVEL.DEBUG, "seek exit");
      }
    };

    /**
     * @function
     * @summary Select one audio track to render.
     * @description
     * Calling this method only when you receive the available tracks from callback {@link OTVPlayer.props.onTracksChanged}.
     * After calling this method, {@link OTVPlayer.props.onTracksChanged} is triggered and the selectedAudioTrack from the event is updated
     * @param {OTVPlayer.props.mediaTrack} value Index to the audio track selected to render.
     * @see {@link OTVPlayer.props.onTracksChanged}
     */
    const selectAudioTrack = (index: number) => {
      if (playerStatus === PlayerStatus.PLAYING) {
        logger.log(LOG_LEVEL.DEBUG, "selectAudioTrack enter");
        if (isNaN(index)) {
          throw new Error("selectAudioTrack: index is not a number");
        } else {
          logger.log(LOG_LEVEL.DEBUG, "selectAudioTrack index: " + index);
        }
        if (index >= -1) {
          dispatchNativeCommand("selectAudioTrack", [index]);
        }
        logger.log(LOG_LEVEL.DEBUG, "selectAudioTrack exit");
      }
    };

    /**
     * @function
     * @summary Select one text track to render.
     *
     * @description
     * Calling this method only when you receive the available tracks from callback {@link OTVPlayer.props.onTracksChanged}.
     * After calling this method, {@link OTVPlayer.props.onTracksChanged} is triggered and the selectedTextTrack from the event is updated
     * @param {OTVPlayer.props.mediaTrack} value Index to the text track selected to render.
     * @see {@link OTVPlayer.props.onTracksChanged}
     */
    const selectTextTrack = (index: number) => {
      if (playerStatus === PlayerStatus.PLAYING) {
        logger.log(LOG_LEVEL.DEBUG, "selectTextTrack enter");
        if (isNaN(index)) {
          throw new Error("selectTextTrack: index is not a number");
        } else {
          logger.log(LOG_LEVEL.DEBUG, "selectTextTrack index: " + index);
        }
        dispatchNativeCommand("selectTextTrack", [index]);
        logger.log(LOG_LEVEL.DEBUG, "selectTextTrack exit");
      }
    };

    /**
     * @function
     * @summary Stop playback of the video.
     *
     * @description
     * Before calling this method, props.source must be set. </p>
     * {@link OTVPlayer.props.onStopped} event is triggered after the content stops playing. </p>
     */
    const stop = () => {
      if (playerStatus === PlayerStatus.PLAYING) {
        logger.log(LOG_LEVEL.DEBUG, "stop enter");
        // WARNING: The props should be saved before the player status is updated
        // as changing the state would trigger a render where these are used
        savedProps.current = Object.assign({}, props);
        dispatchNativeCommand("stop");
        setPlayerStatus(PlayerStatus.STOPPED);

        logger.log(LOG_LEVEL.DEBUG, "stop exit");
      }
    };

    /**
     * @private
     * @summary Wrap the native callback.
     * @param {Object} event
     */
    const _onLoadStart = (event: OnLoadStartNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG, "_onLoadStart enter");
      // playerStatus is not stopped should be checked to handle the case where src is passed empty to trigger the stop to play.
      // props.onLoadStart should only called if player is not stopped.
      if (playerStatus !== PlayerStatus.STOPPED && props.onLoadStart) {
        logger.log(LOG_LEVEL.DEBUG, "_onLoadStart src: " + event?.nativeEvent?.src);
        logger.log(LOG_LEVEL.DEBUG, "_onLoadStart type: " + event?.nativeEvent?.type);
        let outgoingEvent: OnLoadStartParam;
        outgoingEvent = {
          src: event?.nativeEvent?.src,
          type: event?.nativeEvent?.type,
        };
        props.onLoadStart(outgoingEvent);
      }
      logger.log(LOG_LEVEL.DEBUG, "_onLoadStart exit");
    };

    /**
     * @private
     * @summary Wrap the native callback.
     * @param {Object} event
     */
    const _onLoad = (event: OnLoadNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG,
        `_onLoad enter: ` +
        `duration: ${event?.nativeEvent?.duration} ` +
        `w x h: ${event?.nativeEvent?.naturalSize?.width}x` +
        `${event?.nativeEvent?.naturalSize?.height} `
      );

      if (props.onLoad) {
        let outgoingEvent: OnLoadParam;
        let streamDuration = event?.nativeEvent?.duration;
        if (streamDuration && streamDuration < 0) {
          // live stream
          streamDuration = Infinity;
        }
        logger.log(LOG_LEVEL.DEBUG, "_onLoad: final duration value  " + streamDuration);
        outgoingEvent = {
          duration: streamDuration,
          naturalSize: event?.nativeEvent?.naturalSize,
        };
        props.onLoad(outgoingEvent);
      }
      logger.log(LOG_LEVEL.DEBUG, "_onLoad exit");
    };

    /**
     * @private
     * @summary Wrap the native callback.
     * @param {Object} event
     */
    const _onTracksChanged = (event: OnTracksChangedNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG,
        `_onTracksChanged enter: ` +
        `audioTracks: ${JSON.stringify(event?.nativeEvent?.audioTracks)} ` +
        `textTracks: ${JSON.stringify(event?.nativeEvent?.textTracks)}`
      );

      if (props.onTracksChanged) {
        props.onTracksChanged({
          textTracks: event.nativeEvent.textTracks,
          audioTracks: event.nativeEvent.audioTracks,
        });
      }

      logger.log(LOG_LEVEL.DEBUG, "_onTracksChanged Exit");
    };

    /**
     * @private
     * @summary Wrap the native callback.
     * @param {Object} event
     */
    const _onAudioTrackSelected = (event: OnAudioTrackSelectedNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG,
        `_onAudioTrackSelected enter: audioTrack index: ${event?.nativeEvent?.index}`
      );

      if (props.onAudioTrackSelected) {
        let outgoingEvent: OnAudioTrackSelectedParam;
        outgoingEvent = {
          index: event?.nativeEvent?.index,
        };
        props.onAudioTrackSelected(outgoingEvent);
      }
      logger.log(LOG_LEVEL.DEBUG, "_onAudioTrackSelected exit");
    };

    /**
     * @private
     * @summary Wrap the native callback.
     * @param {Object} event
     */
    const _onTextTrackSelected = (event: OnTextTrackSelectedNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG,
        `_onTextTrackSelected enter: textTrack index: ${event?.nativeEvent?.index}`
      );

      if (props.onTextTrackSelected) {
        let outgoingEvent: OnTextTrackSelectedParam;
        outgoingEvent = {
          index: event?.nativeEvent?.index,
        };
        props.onTextTrackSelected(outgoingEvent);
      }
      logger.log(LOG_LEVEL.DEBUG, "_onTextTrackSelected exit");
    };

    /**
     * @private
     * @summary Wrap the native callback.
     * @param {Object} event
     */
    const _onProgress = (event: OnProgressNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG, "_onProgress enter");

      if (props.onProgress) {
        let outgoingEvent = {
          seekableDuration: event?.nativeEvent?.seekableDuration,
          currentPosition: event?.nativeEvent?.currentPosition,
          playableDuration: event?.nativeEvent?.playableDuration,
          currentTime: event?.nativeEvent?.currentTime,
        };
        props.onProgress(outgoingEvent);
      }
      logger.log(LOG_LEVEL.DEBUG, "_onProgress exit");
    };

    /**
     * @private
     * @summary Wrap the native callback.
     * @param {Object} event
     */
    const _onSeek = (event: OnSeekNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG, "_onSeek enter");
      logger.log(LOG_LEVEL.DEBUG,
        `_onSeek enter: currentPosition: ` +
        `${event?.nativeEvent?.currentPosition} seekPosition: ` +
        `${event?.nativeEvent?.seekPosition}`
      );
      if (props.onSeek) {
        let outgoingEvent = {
          seekPosition: event?.nativeEvent?.seekPosition,
          currentPosition: event?.nativeEvent?.currentPosition,
        };
        props.onSeek(outgoingEvent);
      }
      logger.log(LOG_LEVEL.DEBUG, "_onSeek exit");
    };

    /**
     * @private
     * @summary Wrap the native callback.
     * @param {Object} event
     */
    // @ts-ignore
    const _onEnd = (event: OnEndNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG, "_onEnd enter");
      if (props.onEnd) {
        props.onEnd({});
      }
      logger.log(LOG_LEVEL.DEBUG, "_onEnd exit");
    };

    /**
     * @private
     * @summary Wrap the native callback.
     * @param {Object} event
     */
    // @ts-ignore
    const _onPaused = (event: OnPausedNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG, "_onPaused enter");
      if (props.onPaused) {
        props.onPaused({});
      }
      logger.log(LOG_LEVEL.DEBUG, "_onPaused exit");
    };

    /**
     * @private
     * @summary Wrap the native callback.
     * @param {Object} event
     */
    // @ts-ignore
    const _onPlay = (event: OnPlayNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG, "_onPlay enter");
      if (props.onPlay) {
        props.onPlay({});
      }
      logger.log(LOG_LEVEL.DEBUG, "_onPlay exit");
    };

    /**
     * @private
     * @summary Wrap the native callback.
     * @param {Object} event
     */
    // @ts-ignore
    const _onPlaying = (event: OnPlayingNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG, "_onPlaying enter");
      // player status should be updated to playing once player starts playing and was in stop to play transition
      if (playerStatus === PlayerStatus.STOP_TO_PLAY) {
        setPlayerStatus(PlayerStatus.PLAYING);
        savedProps.current = null;
      }
      if (props.onPlaying) {
        props.onPlaying({});
      }
      logger.log(LOG_LEVEL.DEBUG, "_onPlaying exit");
    };

    /**
     * @private
     * @summary Wrap the native callback.
     * @param {Object} event
     */
    const _onError = (event: OnErrorNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG, "_onError enter");
      // player status should be updated to playing even when player gives error and was in stop to play transition.
      if (playerStatus === PlayerStatus.STOP_TO_PLAY) {
        setPlayerStatus(PlayerStatus.PLAYING);
        savedProps.current = null;
      }
      // props.onError should only called if player is not stopped.
      if (playerStatus !== PlayerStatus.STOPPED && props.onError) {

        // Ignore SSM teardown error as it is not an error for the App
        // @ts-ignore
        if (event?.nativeEvent?.code === ERROR_TABLE["Teardown error"]) {
          logger.log(LOG_LEVEL.DEBUG, "Ignoring SSM teardown error");
          return;
        }

        props.onError(event.nativeEvent);
      }
      logger.log(LOG_LEVEL.DEBUG, "_onError exit");
    };

    /**
     * @private
     * @summary Wrap the native callback.
     * @param {Object} event
     */
    // @ts-ignore
    const _onWaiting = (event: OnWaitingNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG, "_onWaiting enter");
      if (props.onWaiting) {
        props.onWaiting({});
      }
      logger.log(LOG_LEVEL.DEBUG, "_onWaiting exit");
    };

    /**
     * @private
     * @summary Wrap the native callback.
     * @param {Object} event
     */
    const _onStatisticsUpdate = (event: OnStatisticsUpdateNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG, "_onStatisticsUpdate enter");
      if (props.onStatisticsUpdate) {
        props.onStatisticsUpdate(event.nativeEvent);
      }
      logger.log(LOG_LEVEL.DEBUG, "_onStatisticsUpdate exit");
    };

    // @ts-ignore
    const _onLog = (event: OnLogNativeEvent) => {
      let outgoingEvent: OnLogParam;
      outgoingEvent = {
        logs: event?.nativeEvent?.logs,
      };
      console.log(outgoingEvent.logs);
    };

    /**
     * @private
     * @summary Wrap the native callback.
     */
    const _onStopped = () => {
      logger.log(LOG_LEVEL.DEBUG, "_onStopped enter");
      if (props.onStopped) {
        props.onStopped({});
      }
      logger.log(LOG_LEVEL.DEBUG, "_onStopped exit");
    };

    /**
     * @private
     * @summary Wrap the native callback.
     */
    const _onThumbnailAvailable = () => {
      logger.log(LOG_LEVEL.DEBUG, "_onThumbnailAvailable enter");
      if (props.onThumbnailAvailable) {
        props.onThumbnailAvailable({});
      }
      logger.log(LOG_LEVEL.DEBUG, "_onThumbnailAvailable exit");
    };

    /**
     * @private
     * @summary wrap the native callback
     */
    const _onBitratesAvailable = (event: OnBitratesAvailableNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG, "_onBitratesAvailable enter");
      if (props.onBitratesAvailable) {
        props.onBitratesAvailable({
          bitrates: event.nativeEvent.availableBitrates,
        });
      }
      logger.log(LOG_LEVEL.DEBUG, "_onBitratesAvailable exit");
    };

    /**
     * @private
     * @summary wrap the native callback
     */
    const _onSelectedBitrateChanged = (event: OnSelectedBitrateNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG, "_onSelectedBitrateChanged enter");
      if (props.onSelectedBitrateChanged) {
        props.onSelectedBitrateChanged({
          bitrate: event.nativeEvent.selectedBitrate,
        });
      }
      logger.log(LOG_LEVEL.DEBUG, "_onSelectedBitrateChanged exit");
    };

    /**
     * @private
     * @summary wrap the native callback
     */
    const _onDownloadResChanged = (event: OnDownloadResChangedNativeEvent) => {
      logger.log(LOG_LEVEL.DEBUG, "_onDownloadResChanged enter");
      if (props.onDownloadResChanged) {
        props.onDownloadResChanged({
          width: event.nativeEvent.width,
          height: event.nativeEvent.height,
        });
      }
      logger.log(LOG_LEVEL.DEBUG, "_onDownloadResChanged exit");
    };

    let {
      style,
      source,
      autoplay = false,
      volume = DEFAULT_VOLUME_LEVEL,
      muted = false,
      thumbnail,
      progressUpdateInterval = DEFAULT_PROGRESS_INTERVAL,
      statisticsConfig,
      maxBitrate,
      maxResolution,
    } = props;

    let nativeProps = {
      style: [styles.base, style],
      source: source,
      autoplay: autoplay,
      volume: volume,
      muted: muted,
      progressUpdateInterval: progressUpdateInterval,
      statisticsConfig: statisticsConfig,
      maxBitrate: maxBitrate === Infinity ? Number.MAX_VALUE : maxBitrate,
      maxResolution:
        maxResolution != null &&
          (maxResolution.width === Infinity || maxResolution.height === Infinity)
          ? { width: Number.MAX_VALUE, height: Number.MAX_VALUE }
          : maxResolution,
    };

    let thumbnailProp = { thumbnail: thumbnail };

    //Handle STOP_TO_PLAY and STOPPED state for STOP API
    if (
      playerStatus === PlayerStatus.STOPPED ||
      playerStatus === PlayerStatus.STOP_TO_PLAY
    ) {
      const {
        style,
        source,
        volume,
        muted,
        thumbnail,
        progressUpdateInterval
      } = savedProps.current;
      // resetting source to trigger player re-rendering in native layer
      let updatedSource = { ...source };
      if (playerStatus === PlayerStatus.STOPPED) {
        updatedSource.src = "";
      }
      // Update the content token for same stream if token is updated by App.
      if (playerStatus === PlayerStatus.STOP_TO_PLAY &&
        nativeProps.source?.src === source?.src &&
        nativeProps.source?.token &&
        nativeProps.source?.token !== source?.token
      ) {
        updatedSource.token = nativeProps.source.token;
        logger.log(LOG_LEVEL.DEBUG, "The content token is updated for the stream: " + source?.src);
      }
      nativeProps = {
        style: [styles.base, style],
        autoplay: true,
        source: updatedSource,
        volume: volume,
        muted: muted,
        progressUpdateInterval: progressUpdateInterval,
        statisticsConfig: statisticsConfig,
        maxBitrate: maxBitrate === Infinity ? Number.MAX_VALUE : maxBitrate,
        maxResolution:
          maxResolution != null &&
            (maxResolution.width === Infinity ||
              maxResolution.height === Infinity)
            ? { width: Number.MAX_VALUE, height: Number.MAX_VALUE }
            : maxResolution,
      };
      thumbnailProp = { thumbnail: thumbnail };
    }

    const nativeEventList = {
      onVideoLoadStart: _onLoadStart,
      onVideoLoad: _onLoad,
      onTracksChanged: _onTracksChanged,
      onTextTrackSelected: _onTextTrackSelected,
      onAudioTrackSelected: _onAudioTrackSelected,
      onVideoProgress: _onProgress,
      onVideoSeek: _onSeek,
      onVideoEnd: _onEnd,
      onVideoPaused: _onPaused,
      onVideoPlay: _onPlay,
      onVideoPlaying: _onPlaying,
      onVideoError: _onError,
      onVideoWaiting: _onWaiting,
      onStatisticsUpdate: _onStatisticsUpdate,
      onVideoStopped: _onStopped,
      onDownloadResChanged: _onDownloadResChanged,
      onSelectedBitrateChanged: _onSelectedBitrateChanged,
      onBitratesAvailable: _onBitratesAvailable,
      onThumbnailAvailable: _onThumbnailAvailable,
      onLog: _onLog,


    };

    // When src changes do not provide thumbnail props 
    if (prevSrc === props.source?.src) {
      return <PlayerView ref={playerRef} {...nativeProps} {...thumbnailProp} {...nativeEventList} />;
    } else {
      return <PlayerView ref={playerRef} {...nativeProps} {...nativeEventList} />;
    }
  }
);

// @ts-ignore - PropTypes is currently not quite compatible with typescript so suppress this issue
OTVPlayer.propTypes = {
  ...ViewPropTypes,
  /* Native props */
  // @ts-ignore
  source: PropTypes.shape({
    src: PropTypes.string.isRequired,
    type: PropTypes.string,
    token: PropTypes.string,
    tokenType: PropTypes.string,
    textTracks: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string.isRequired,
        mimeType: PropTypes.string.isRequired,
        language: PropTypes.string.isRequired,
      })
    ),
    drm: PropTypes.shape({
      type: PropTypes.string,
      certificateURL: PropTypes.string,
      licenseURL: PropTypes.string.isRequired,
      ssmServerURL: PropTypes.string,
      ssmSyncMode: PropTypes.bool,
    }),
  }).isRequired,
  autoplay: PropTypes.bool,
  volume: PropTypes.number,
  muted: PropTypes.bool,
  thumbnail: PropTypes.shape({
    display: PropTypes.bool,
    positionInSeconds: PropTypes.number,
    style: PropTypes.shape({
      top: PropTypes.number,
      left: PropTypes.number,
      width: PropTypes.number,
      height: PropTypes.number,
      borderWidth: PropTypes.number,
      borderColor: PropTypes.string,
    }),
  }),
  progressUpdateInterval: PropTypes.number,
  maxBitrate: PropTypes.number,
  maxResolution: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  statisticsConfig: PropTypes.shape({
    statisticsTypes: PropTypes.number,
    statisticsUpdateInterval: PropTypes.number
  }),
  onLoadStart: PropTypes.func,
  onLoad: PropTypes.func,
  onTracksChanged: PropTypes.func,
  onTextTrackSelected: PropTypes.func,
  onAudioTrackSelected: PropTypes.func,
  onProgress: PropTypes.func,
  onSeek: PropTypes.func,
  onEnd: PropTypes.func,
  onPaused: PropTypes.func,
  onPlay: PropTypes.func,
  onError: PropTypes.func,
  onWaiting: PropTypes.func,
  onStopped: PropTypes.func,
  onStatisticsUpdate: PropTypes.func,
  onDownloadResChanged: PropTypes.func,
  onSelectedBitrateChanged: PropTypes.func,
  onBitratesAvailable: PropTypes.func,
  onThumbnailAvailable: PropTypes.func
};

// @ts-ignore - PropTypes is currently not quite compatible with typescript so suppress this issue
OTVPlayerWithInsight.propTypes = {
  ...OTVPlayer.propTypes,
  /* Native props */
  // @ts-ignore
  insightAgent: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});

//For interoperability layer to work android plugin should be renamed to `RNCOTVPlayerView`
//For ios, interoperability layer is working without renaming.
// TODO: rename ios to `RNCOTVPlayerView` so that component name is same
let PlayerView = null;
if (Platform.OS == 'android') {
  PlayerView = requireNativeComponent("RNCOTVPlayerView");
} else {
  PlayerView = requireNativeComponent("RCTOTVPlayerView");
}

/**
 * The OTVSDK class
 * @namespace OTVSDK
 */
export const OTVSDK = new OTVSDKManager();

/**
 * @function setSDKLogLevel
 * @memberof OTVSDK
 * @summary To set OTVPlayer log level. {@link OTVSDK_LOGLEVEL}
 * @example
 * OTVSDK.setSDKLogLevel(OTVSDK_LOGLEVEL.ERROR, true)
 * OTVSDK.setSDKLogLevel(OTVSDK_LOGLEVEL.WARNING, false) -> default
 * OTVSDK.setSDKLogLevel(OTVSDK_LOGLEVEL.INFO)
 * @param {number} level Log level to be set.
 * @param {boolean} emitToJs Whether to emit native logs (Invalid for web platform)
 */

/**
 * @typedef SDKVersion
 * @summary Version numbers.
 * @memberof OTVSDK
 * @property {String} sdkVersion The underlying Player SDK version.
 * @property {String} otvPlayerVersion The Plugin version.
 */

/**  
 * @function multiSession
 * @memberof OTVSDK
 * @property {boolean} OTVSDK.multiSession multisession flag.
 *  The get, set accessors are used to update this multiSession flag value in OTVSDK.
 *  This value is used only once during the very first mount of the OTVPlayer in the Apps lifecycle,
 *  and any change after to this is not tracked. 
 *  These methods are not applicable in Android and IOS platfroms.  
 *  This property can be directly accessed and used in code using getter and setter methods as follows
 * @example
 * //To get the multiSession value 
 * let value = OTVSDK.multiSession
 * 
 * //To Set the multiSession value to true
 * OTVSDK.multiSession = true
 */

/**
 * @function getVersion
 * @memberof OTVSDK
 * @summary Provides version details of the plugin and the underlying
 * native Player SDK.
 * @example
 * OTVSDK.getVersion()
 * @return {@link OTVSDK.SDKVersion}
 */


/**
 * Error table enum
 * @enum {number}
 */
// @ts-ignore
const ERROR_TABLE = {
  /** Unknown */
  Unknown: 1000,
  /** Source type error */
  "Source not supported": 1001,
  /** Source type error */
  "Source not found": 1002,
  /** Source type error */
  "Manifest error": 1003,
  /** Media type error */
  "Demux/decode error": 2001,
  /** Media type error */
  "Invalid volume level": 2003,
  /** Media type error */
  "No text track available": 2004,
  /** Media type error */
  "Invalid stream format": 2005,
  /** Media type error */
  "Unknown media": 2100,
  /** Network type error */
  "Response timeout": 3002,
  /** Network type error */
  "HTTP network request failed": 3003,
  /** DRM type error */
  "Provisioning error": 5001,
  /** DRM type error */
  "DRM type not supported": 5002,
  /** DRM type error */
  "Instance creation failure": 5003,
  /** DRM type error */
  "License expired": 5004,
  /** DRM type error */
  "License data error": 5005,
  /** DRM type error */
  "License request failed": 5006,
  /** DRM type error */
  "License response was rejected by CDM": 5007,
  /** DRM type error */
  "Content decryption error": 5008,
  /** DRM type error */
  "Unspecified DRM Management error": 5009,
  /** DRM type error */
  "SSP Error": 5020,
  /** DRM type error */
  "CONNECT error": 5021,
  /** Content token error */
  "Content token not available": 5022,
  /** Feching Connect opVault error */
  "Feching Connect opVault error": 5023,
  /** SSM type error */
  "Setup error": 6001,
  /** SSM type error */
  "Teardown error": 6002,
  /** SSM type error */
  "Heartbeat error": 6003,
  /** User Reached maximum session limit */
  "User Reached maximum session limit": 6004,
  /** Player type error */
  "Mime type invalid": 7001,
  /** Player type error */
  "progressUpdateInterval- invalid": 7002,
  /** Player type error */
  "Invalid text/audio track index": 7003,
  /** Player type error */
  "Out of bound seek request": 7004,
  /** Player type error */
  "Invalid bitrate index": 7005,
  /** Player type error */
  "Plugin internal error": 7010,
  /** Thumbnail Item Error */
  "Thumbnail Item error": 7020,
  /** Thumbnail Position Error */
  "Thumbnail Position error": 7021,
  /** Thumbnail Style error */
  "Thumbnail Style error": 7022,
  /** Thumbnail not available */
  "Thumbnail not available": 7023,
  /** Thumbnail Status unknown */
  "Thumbnail Status unknown": 7024,
  /** Autoplay rejected by Browser */
  "Autoplay rejected by Browser": 7026,
};

/**
 * @example
 *		&lt;OTVPlayer ref={otvplayer => this.otvplayer.ref = otvplayer}
 * 			style={styles.player.video}
 *			source={
 *				src: "https://BigBuckBunny.mpd,
 * 				type: "application/dash+xml"
 *				token: "base64 token",
 * 				tokenType: "nv-authorizations"
 *				textTracks: [{
 *					url: "https://BigBuckBunny.subtitles.srt",
 * 					mimeType: "application/x-subrip",
 * 					language: "eng"
 *				}],
 *				drm: {
 * 					type: "Widevine",
 * 					certificateURL: "certificate server URL",
 * 					licenseURL: "license server URL",
 * 					ssmServerURL: "SSM server URL",
 * 					ssmSyncMode: 0
 *				}
 *			}
 *			autoplay={true}
 *			progressUpdateInterval={1000}
 *			muted={false}
 *			volume={1.0}
 *      maxBitrate = {Value}
 *      statisticsConfig={
 *        statisticsTypes: STATISTICS_TYPE.ALL,
 *        statisticsUpdateInterval: 5000,
 *      }
 *      thumbnail = {
 *        display:false,
 *        positionInSeconds:10,
 *        style:{
 *        top: 100
 *        left: 100
 *        width: 300
 *        height: 400
 *        borderColor: "red"
 *        borderWidth: 1
 *      },
 *      }
 *			onLoadStart={ console.log("OnLoadStart event called"); }
 *			onLoad={ console.log("OnLoad event called"); }
 *			onProgress={ console.log("onProgress event called"); }
 * 			onPaused={ console.log("onPaused event called"); }
 * 			onPlay={ console.log("onPlay event called"); }
 *			onEnd={ console.log("onEnd event called"); }
 *			onTracksChanged={ console.log("onTracksChanged event called"); }
 * 			onAudioTrackSelected={ console.log("onAudioTrackSelected event called"); }
 * 			onTextTrackSelected={ console.log("onTextTrackSelected event called"); }
 * 			onDownloadResChanged={ console.log("onDownloadResChanged event called"); }
 *			onError={ console.log("onError event called"); }
 *			onWaiting={ console.log("onWaiting event called"); }
 *			onPlaying={ console.log("onPlaying event called"); }
 *			onStopped={ console.log("onStopped event called"); }
 *      onStatisticsUpdate={ console.log("onStatisticsUpdate event called"); }
 *			/>
 */

/**
 * @namespace props
 * @memberof OTVPlayer
 * @description Public properties
 * @property {Object} source Source for the content to be played.
 * @property {String} source.src Source URI of the content.
 * @property {String} source.type Mime type of the content.
 * @property {String} source.token The SSP stream token in base64. It is required for SSP encrypted stream, not required for clear stream. it can be set in 5 seconds after set source.
 * @property {String} source.tokenType The SSPHeader type, defaults as nv-authorizations
 * @property {Array<Object>} source.textTracks The side loaded text track for the content. <b>Optional</b>.
 * @property {Number} source.textTracks[].url The url of text track source.
 * @property {String} source.textTracks[].mimeType The mime type of the text track.
 * @property {String} source.textTracks[].language The language of the text track.
 * @property {String} source.preferredAudioLanguage When user sets the preferred audio languange, it allows the player to use it as a reference for selecting the appropriate default track when switching channels.
 * @property {Object} source.drm The drm configuration for the encrypted media data <b>Optional</b>.
 * @property {String} source.drm.type The drm scheme for the media data. (FairPlay, Widevine, PlayReady, or TVKey) <b>Optional</b>.
 * @property {String} source.drm.certificateURL The DRM Certificate URL
 * @property {String} source.drm.licenseURL The DRM License URL
 * @property {String} source.drm.ssmServerURL The Secure Session Management(SSM) Server URL
 * @property {String} source.drm.ssmSyncMode The flag indicates whether the SSM is in sync mode.
 * @property {Boolean} autoplay Whether to autoplay the video. Default value is false. if autoPlay in player fails then error callback {@link OTVPlayer.props.onError} will be called with code 7026.
 * @property {Number} volume The volume for playback (0-1).
 * @property {Boolean} muted Whether the player is muted or not. Default value is false.
 * @property {Number} maxBitrate User sets the maximum bitrate to be capped. To reset the capping we need to pass NULL or Infinity as maxBitrate. If nothing is passed, it is treated as undefined
 * @property {Object} maxResolution User sets the maximum resolution to be capped. Resolution is an object with width and height. To reset the capping we need to pass NULL or Infinity as maxResolution. If nothing is passed, it is treated as undefined
 * @property {Number} maxResolution.width Maximum resolution width to be set.
 * @property {Number} maxResolution.height Maximum resolution height to be set.
 * @property {Number} progressUpdateInterval The update period for the progress event in seconds with up to 3 decimal places for milliseconds. The default value will be 0.25 seconds.
 * @property {Object} statisticsConfig The statistics Configuration. An Object with statisticsTypes and statisticsUpdateInterval as its properties.
 * @property {Number} statisticsConfig.statisticsUpdateInterval The update period for onStatisticsUpdate event in milliseconds.
 * @property {Number} statisticsConfig.statisticsTypes The type of statistics to be enabled - NONE, ALL, RENDERING, NETWORK, PLAYBACK, EVENT, DRM.

 * @property {Object} thumbnail The thumbnail configuration. An Object with thumbnail display, thumbnail position and thumbnail style as its properties.
 * @property {Boolean} thumbnail.display Whether to display thumbnails or not. Default is false. 
 * @property {Number} thumbnail.positionInSeconds The postion of the thumbnail to be shown. If positionInSeconds is not set, when display is true, a thumbnail at the current postion will be shown.
 * @property {Object} thumbnail.style The screen postion, size and styling of the thumbnail to be shown. top, left, width and height are mandatory. borderColor and borderWidth are optional.
 * @property {Number} thumbnail.style.top top position of the thumbnail
 * @property {Number} thumbnail.style.left left position of the thumbnail
 * @property {Number} thumbnail.style.width width of the thumbnail
 * @property {Number} thumbnail.style.height height of the thumbnail
 * @property {any} thumbnail.style.borderColor borderColor of the thumbnail. This can be a string or a number in rgba Format. default is black color
 * @property {Number} thumbnail.style.borderWidth borderWidth of the thumbnail. If this is not set border is not shown on the screen.

 * @property {Function} onLoadStart Get called when the video starts loading. </p>
 * Application needs to set handler to receive and handle information from the event. </p>
 * See {@link OTVPlayer.props.onLoadStart}
 * @property {Function} onLoad Get called when the video has finished loading. </p>
 * Application needs to set handler to receive and handle information from the event. </p>
 * See {@link OTVPlayer.props.onLoad}
 * @property {Function} onTracksChanged Called when a change has occurred to the player's tracks (i.e. addition, removal or select/deselect a track). </p>
 * Application needs to set handler to receive and handle information from the event. </p>
 * See {@link OTVPlayer.props.onTracksChanged}
 * @property {Function} onTextTrackSelected Called when a change to the text track that has been selected (i.e. user select/deselect a track). </p>
 * Application needs to set handler to receive and handle information from the event. </p>
 * See {@link OTVPlayer.props.onTextTrackSelected}
 * @property {Function} onAudioTrackSelected Called when a change to the audio track that has been selected (i.e. user select/deselect a track). </p>
 * Application needs to set handler to receive and handle information from the event. </p>
 * See {@link OTVPlayer.props.onAudioTrackSelected}
 * @property {Function} onProgress Called when the video playback progresses. </p>
 * Application needs to set handler to receive and handle information from the event. </p>
 * See {@link OTVPlayer.props.onProgress}
 * @property {Function} onSeek Called when the player has completed a seek operation. </p>
 * Application needs to set handler to receive and handle information from the event. </p>
 * See {@link OTVPlayer.props.onSeek}
 * @property {Function} onEnd Called when the player has completed playback of the video to its end. </p>
 * Application needs to set handler to receive and handle information from the event. </p>
 * See {@link OTVPlayer.props.onEnd}
 * @property {Function} onPaused Called when the player has paused playback of the video. </p>
 * Application needs to set handler to receive and handle the event. </p>
 * See {@link OTVPlayer.props.onPaused}
 * @property {Function} onPlay Called when the player starts or resumes playback of the video. </p>
 * Application needs to set handler to receive and handle the event. </p>
 * See {@link OTVPlayer.props.onPlay}.
 * @property {Function} onError Called when OTVPlayerView has encountered an error it will return an errorType, error and error message. </p>
 * Application needs to set handler to receive and handle information from the event. </p>
 * See {@link OTVPlayer.props.onError}
 * @property {Function} onWaiting Called when playback has stalled. </p>
 * Application needs to set handler to receive and handle the event. </p>
 * See {@link OTVPlayer.props.onWaiting}
 * @property {Function} onStopped Called when the player stop playback of the video, after stop api call. </p>
 * Application needs to set handler to receive and handle the event. </p>
 * See {@link OTVPlayer.props.onStopped}
 * @property {Function} onStatisticsUpdate Gets called periodically to display the stats. </p>
 * Application needs to set handler to receive and handle information from the event. </p>
 * See {@link OTVPlayer.props.onStatisticsUpdate}
 * @property {Function} onDownloadResChanged Event triggered when resolution is changed </p>
 * Application triggers the event from the player to specify the selected resolution </p>
 * See {@link OTVPlayer.props.onDownloadResChanged}
 * @property {Function} onThumbnailAvailable Called when the Thumbnails for the content being played become availible to be shown. </p>
 * Application needs to set handler to receive and handle the event. </p>
 * See {@link OTVPlayer.props.onThumbnailAvailable}
 */

/**
 * @callback OTVPlayer.props.onLoadStart
 * @summary Callback set by application to handle the event onLoadStart.
 * @param {Object} event The event object.
 * @param {String} event.src The Source URI of the media data.
 * @param {String} event.type The Source type.
 */

/**
 * @callback OTVPlayer.props.onLoad
 * @summary Callback set by application to handle event onLoad.
 * @param {Object} event The event object.
 * @param {Number} event.duration The duration of the content in seconds.
 * @param {Boolean} event.canPlayReverse A Boolean value that indicates whether the item can be played in reverse. </p>
 * Only for iOS, and the value is true for Android.
 * @param {Boolean} event.canPlayFastForward A Boolean value that indicates whether the item can be fast forwarded. </p>
 * Only for iOS, and the value is true for Android.
 * @param {Boolean} event.canPlaySlowForward A Boolean value that indicates whether the item can be played slower than normal. </p>
 * Only for iOS, and the value is true for Android.
 * @param {Boolean} event.canPlaySlowReverse A Boolean value that indicates whether the item can be played slowly backward. </p>
 * Only for iOS, and the value is true for Android.
 * @param {Boolean} event.canStepBackward  A Boolean value that indicates whether the item supports stepping backward. </p>
 * Only for iOS, and the value is true for Android.
 * @param {Boolean} event.canStepForward A Boolean value that indicates whether the item supports stepping forward. </p>
 * Only for iOS, and the value is true for Android.
 * @param {Object} event.naturalSize Indicates the natural dimensions of the media data referenced by the track.
 * @param {Number} event.naturalSize.width The width of the media data.
 * @param {Number} event.naturalSize.height The height of the media data.
 * @param {String} event.naturalSize.orientation "landscape" or "portrait" to indicate the orientation.
 */

/**
 * @callback OTVPlayer.props.onTracksChanged
 * @summary Callback set by application to handle event onTracksChanged.
 * @param {Object} event The event object.
 * @param {Array<Object>} event.audioTracks Array of available audio tracks.
 * @param {String} event.audioTracks[].title The title of the track.
 * @param {String} event.audioTracks[].language The language of the track.
 * @param {Number} event.audioTracks[].encodeType Refer to {@link AUDIO_ENCODING_TYPE}.
 * @param {Number} event.audioTracks[].channelCount The count of channels in the track.
 * @param {Array<String>} event.audioTracks[].characteristics Characteristics of the track.
 * @param {Array<Object>} event.textTracks Array of available text tracks.
 * @param {String} event.textTracks[].title The title of the track.
 * @param {String} event.textTracks[].language The language of the track.
 * @param {Number} event.textTracks[].encodeType Refer to {@link TEXT_ENCODING_TYPE}.
 * @param {Array<String>} event.textTracks[].characteristics Characteristics of the track.
 */

/**
 * @callback OTVPlayer.props.onTextTrackSelected
 * @summary Callback set by application to handle event onTextTrackSelected.
 * @param {Object} event The event object.
 * @param {Number} event.index The native index of the text track.
 */

/**
 * @callback OTVPlayer.props.onAudioTrackSelected
 * @summary Callback set by application to handle event onAudioTrackSelected.
 * @param {Object} event The event object.
 * @param {Number} event.index The native index of the audio track.
 */
/**

 * @callback OTVPlayer.props.onProgress
 * @summary Callback set by application to handle event onProgress.
 * @param {Object} event The event object.
 * @param {Number} event.currentTime The current time from the content of the playback in seconds. </p>
 * <ul style="list-style: marker">
 * <li> For VOD content, the value is the current playback time between 0 and total duration ({@link event.seekableDuration}).
 * <li> For LIVE content, the value is the program date time of the current playback.
 * </ul>
 * @param {Number} event.currentPosition The current position of the playback in seconds.
 * @param {Number} event.playableDuration The duration of the media data.
 * @param {Number} event.seekableDuration The seekable duration of the media data. </p>
 * <ul style="list-style: marker">
 * <li> For VOD content, the value is equal to {@link event.playableDuration}.
 * <li> For LIVE content, the value is equal to the seekable windows size in seconds.
 * </ul>
 */

/**
 * @callback OTVPlayer.props.onSeek
 * @summary Callback set by application to handle event onSeek.
 * @param {Object} event The event object.
 * @param {Number} event.currentPosition The current position of the playback in seconds.
 * @param {Number} event.seekPosition The seek position value set from props.seek.position.
 * @see {@link OTVPlayer.seek}
 */

/**
 * @callback OTVPlayer.props.onEnd
 * @summary Callback set by application to handle event onEnd.
 * @param {Object} event The event object. This will be empty.
 */

/**
 * @callback OTVPlayer.props.onPaused
 * @summary Callback set by application to handle event onPaused.
 * @param {Object} event The event object. This will be empty.
 * @see {@link OTVPlayer.pause}
 */

/**
 * @callback OTVPlayer.props.onPlay
 * @summary Callback set by application to handle event onPlay.
 * @param {Object} event The event object. This will be empty.
 * @see {@link OTVPlayer.play}
 */

/**
 * @callback OTVPlayer.props.onError
 * @summary Callback set by application to handle event onError.
 * @param {Object} event The event object.
 * @param {number} event.code Refer {@link ERROR_TABLE} for error codes.
 * @param {Object} event.nativeError Platform specific error object
 */

/**
 * @callback OTVPlayer.props.onWaiting
 * @summary Callback set by application to handle event onWaiting.
 * @param {Object} event The event object. This will be empty.
 */

/**
 * @callback OTVPlayer.props.onPlaying
 * @summary Callback set by application to handle event onPlaying.
 * @param {Object} event The event object. This will be empty.
 */

/**
 * @callback OTVPlayer.props.onStopped
 * @summary Callback set by application to handle event onStopped.
 * @param {Object} event The event object. This will be empty.
 * @see {@link OTVPlayer.stop}
 */

/**
 * @callback OTVPlayer.props.onBitratesAvailable
 * @summary Callback set by application to handle event onBitratesAvailable.
 * @description If provided by the App, will be triggered by the RN Plugin once bitrates information is available for a currently played content.
 * @param {Object} event The event object.
 * @param {Array<Number>} event.bitrates Array of bitrates (in bits per second) for the currently selected content.
 */

/**
 * @callback OTVPlayer.props.onSelectedBitrateChanged
 * @summary Callback set by application to handle event onSelectedBitrateChanged.
 * @description If provided by the App, will be triggered by the RN Plugin on every change of bitrate at which the current content is running.<br>
 * This is the actual rate at which content is running (depending on currently available bandwidth on the Client).
 * @param {Object} event The event object.
 * @param {Number} event.bitrate bitrate in bits per second.
 */

/**
 * @callback OTVPlayer.props.onDownloadResChanged
 * @summary Callback given by application to the player for getting the event onDownloadResChanged.
 * @param {Object} event The event object.
 * @param {number} event.width the width, in pixels, to cap the content.
 * @param {number} event.height the height, in pixels, to cap the content.
 */

/**
 * @callback OTVPlayer.props.onThumbnailAvailable
 * @summary Callback set by application to notify when thumbnails are available.
 * @param {Object} event The event object. This will be empty.
 */


/**
 * @callback OTVPlayer.props.onStatisticsUpdate
 * @summary Callback set by application to handle the event onStatisticsUpdate and display required statistics.
 * @param {Object} event The event object.
 * @param {Array} event.availableBitrates The available bitrates while playback. Applicable for iOS/tvOS, Android and Web(DASH).
 * @param {Number} event.selectedBitrate The selected bitrate from the available bitrate. Applicable for iOS/tvOS, Android and Web(DASH).
 * @param {Number} event.bitrateSwitches Number of bitrate switches happening from start to the end of the playback. Applicable for iOS/tvOS, Android.
 * @param {Number} event.bitrateDowngrade Number of times the bitrate has switched to a lower bitrate. Applicable for iOS/tvOS, Android.
 * @param {Number} event.averageVideoBitrate This value indicates the average video bitrate. Applicable for iOS/tvOS.
 * @param {Number} event.averageAudioBitrate This value indicates the average audio bitrate. Applicable for iOS/tvOS.
 * @param {Number} event.bytesDownloaded The number of bytes downloaded. Applicable for iOS/tvOS, Android.
 * @param {Number} event.downloadBitrate The download bitrate. Applicable for iOS/tvOS, Android and Web(DASH).
 * @param {Number} event.downloadBitrateAverage The average download bitrate. Applicable for iOS/tvOS, Android and Web(DASH).
 * @param {Number} event.numberOfMediaRequests The number of media read requests from the server to this client. The number of media requests Applicable for iOS/tvOS.
 * @param {Number} event.transferDuration The accumulated duration, in seconds, of active network transfer of bytes. Applicable for iOS/tvOS.
 * @param {Number} event.downloadsOverdue The total number of times that downloading the segments took too long. Applicable for iOS/tvOS.
 * @param {String} event.finalIPAddress IPAddress of the playing content. Applicable for iOS/tvOS, Android.
 * @param {String} event.finalURL finalURL of the content. Applicable for iOS/tvOS, Android.
 * @param {String} event.url url of the content. Applicable for iOS/tvOS, Android and Web(HLS).
 * @param {Number} event.numberOfServerAddressChanges A count of changes to the server address over the last uninterrupted period of playback. Applicable for iOS/tvOS.
 * @param {Number} event.bufferedDuration The time taken to buffer. Applicable for iOS/tvOS, Android.
 * @param {ArrayBuffer} event.availableResolutions This gives the available resolutions as array of Objects. Each object contains width and height. Applicable for iOS/tvOS.
 * @param {Object} event.selectedResolution  This is the selected resolution width and resolution height. Applicable for iOS/tvOS, Android, Web(DASH) and Web(HLS).
 * @param {Number} event.selectedResolution.width  Resolution width in pixels.
 * @param {Number} event.selectedResolution.height  Resolution height in pixels.
 * @param {Number} event.streamBitrate The stream bitrate.  Applicable for Android and Web(DASH).
 * @param {Number} event.startUpTime The accumulated duration, in seconds, until the player item is ready to play. Applicable for iOS/tvOS.
 * @param {Number} event.numberOfStalls The total number of playback stalls encountered. Applicable for iOS/tvOS.
 * @param {String} event.playbackType  The playback type - VOD/LIVE. Applicable for iOS/tvOS.
 * @param {String} event.playbackStartDate The date and time at which playback began for this event. Applicable for iOS/tvOS.
 * @param {Number} event.playbackStartOffset The offset, in seconds, in the playlist where the last uninterrupted period of playback began. Applicable for iOS/tvOS.
 * @param {Number} event.frameDrops The number of frame drops. Applicable for iOS/tvOS, Android and Web(DASH).
 * @param {Number} event.frameDropsPerSecond The number of frame drops per second. Applicable for iOS/tvOS, Android and Web(DASH).
 * @param {Number} event.framesPerSecondNominal {@label iOS} The number of frames per second nominal. Applicable for iOS/tvOS, Android and Web(DASH).
 * @param {Number} event.framesPerSecond The number of frames per second. Applicable for iOS/tvOS, Android and Web(DASH).
 */

/**
 * @callback OTVPlayer.props.onLicenseRequest
 * @summary Callback set by application to handle the event onLicenseRequest if application chooses to handle license requests by itself.
 * @description If App sets this callback prop, it will be called whenever Player wants App to provide any of the following:
 * <ul style="list-style: marker">
 * <li> license data.
 * <li> Certificate data.
 * <li>  Renewed license data.
 * </ul>
 * The App should return a <b>Promise</b> from this callback.<br>
 * Once the <b>Promise</b> is fulfilled, the data provided should be an <b>ArrayBuffer</b>.<br>
 * If the <b>Promise</b> is rejected, the playback shall fail and an <b>onError</b> shall be triggered.<br>
 * If a channel/content change is requested before fulfilling or rejecting a promise, the Player will discard the last <b>Promise</b>.<br>
 * <b>NOTE:</b> Apps should make sure not to accept/reject <b>Promise</b>s which were made for the previous content (if a new content request was made).<br>
 * <b>NOTE:</b> Currently supported for browser-based SDK only.
 * @param {String} keySystem The key System string value:
 * <ul style="list-style: marker">
 * <li> <b>Widevine:</b> "com.widevine.alpha"
 * <li> <b>Playready:</b> "com.microsoft.playready"
 * <li> <b>TVKey:</b> "com.tvkey.drm"  (For HbbTV supporting TVKey only)
 * <li> <b>Fairplay:</b> "com.apple.fps" (for Safari and iOS/tvOS devices)
 * </ul>
 * <b>NOTE:</b> Can be the <b>source→drm→type</b> or if <b>source→drm→type</b> not available, the highest security DRM available.
 * @param {Object} source The source this request is related to:
 * @param {String} source.src The resource URL. Should be what App provided as a prop: <b>source→src</b>.
 * @param {String} source.token The token string. Should be what App provided as a prop: <b>source→token</b>. Undefined if not provided as a prop.
 * @param {String} source.type Mime type of the src request. Should be what App provided as a prop: source→type. Undefined if not provided as a prop.
 * @param {ArrayBuffer} requestPayload Payload data to be used for making license request
 * @param {String} licenseRequestType Request type: 
 * <ul style="list-style: marker">
 * <li> <b>"license-request":</b> a new license
 * <li> <b>"license-renewal":</b>  a renewal of license
 * <li> <b>"certificate-request":</b> a certificate request (applicable for Widevine and FairPlay only).
 * </ul>
 */

/**
 * @function play
 * @memberof OTVPlayer
 * @summary Start or resume playback of media data.
 *
 * @description
 * Can be called to resume playing a stopped or paused content.
 * Before calling this method, props.source must be set and for encrypted content props.source.token must be set at the same time or be set in 5 seconds after set source. </p>
 * From a stop to play scenario props.source.token can be set after play if it was reset to empty string after stop call. </p>
 * After calling this method, {@link OTVPlayer.props.onPlay} event is triggered. </p>
 * Callback {@link OTVPlayer.props.onProgress} is called when media data is playing in progress. </p>
 * Callback {@link OTVPlayer.props.onWaiting} is called when the playback gets stalled.
 */

/**
 * @function pause
 * @memberof OTVPlayer
 * @summary Pause the playback of the media data.
 *
 * @description
 * Before calling this method props.source must be set. </p>
 * After calling this method {@link OTVPlayer.props.onPaused} event is triggered</p>
 */

/**
 * @function stop
 * @memberof OTVPlayer
 * @summary Stop the playback of the media data.
 *
 * @description
 * Before calling this method props.source must be set. </p>
 * After calling this method {@link OTVPlayer.props.onStopped} event is triggered</p>
 */

/**
 * @function seek
 * @memberof OTVPlayer
 * @summary Set the current playback position of the media data.
 *
 * @description
 * Before calling this method, props.source must be set.</p>
 * Callback {@link OTVPlayer.props.onSeek} is called when the seeking completes. </p>
 * @param {Number} position The position in seconds.
 * @param {Number} tolerance The tolerance in milliseconds of the seeking accuracy. Only Applicable for iOS/tvOS. Default value is 100.
 *
 * @see {@link OTVPlayer.props.onSeek}
 */

/**
 * @function selectAudioTrack
 * @memberof OTVPlayer
 * @summary Select one audio track to render.
 * @description
 * Calling this method only when you receive the available tracks from callback {@link OTVPlayer.props.onTracksChanged}.
 * After calling this method, {@link OTVPlayer.props.onTracksChanged} is triggered and the selectedAudioTrack from the event is updated
 * @param {OTVPlayer.props.mediaTrack} value Index to the audio track selected to render.
 * @see {@link OTVPlayer.props.onTracksChanged}
 */

/**
 * @function selectTextTrack
 * @memberof OTVPlayer
 * @summary Select one text track to render.
 *
 * @description
 * Calling this method only when you receive the available tracks from callback {@link OTVPlayer.props.onTracksChanged}.
 * After calling this method, {@link OTVPlayer.props.onTracksChanged} is triggered and the selectedTextTrack from the event is updated
 * @param {OTVPlayer.props.mediaTrack} value Index to the text track selected to render.
 * @see {@link OTVPlayer.props.onTracksChanged}
 */

/**
 * The OTVPlayerWithInsight class
 * @namespace OTVPlayerWithInsight
 * @description
 * OTVPlayerWithInsight is the extension of OTVPlayer which receives Insight agent as param to collect user's statistics.
 */

/**
 * @namespace props
 * @memberof OTVPlayerWithInsight
 * @description Public properties
 * @property {Object}  insightAgent param to collect user's statistics.
 */

/**
 * @function setUserInfo
 * @memberof OTVPlayerWithInsight
 * @summary Sets the current user information.
 *  @example
 *    otvplayerWithInsight.current.setUserInfo({
        userId: "123455",
        accountId: "A12B32",
        fullName: "John Doe",
        gender: "male",
        age: 23,
        ageRange: "20-25",
        category: "Junior",
        street: "275 Sacramento Street",
        city: "San Francisco",
        state: "CA",
        postCode: "94111",
        country: "US",
      });
 * @param {object} userInfo user information to be passed to set user details
 */

/**
 * @function setLiveContent
 * @memberof OTVPlayerWithInsight
 * @summary Sets the current live content information.
 * @example
 * otvplayerWithInsight.current.setLiveContent({
      genre: ["drama"],
      scrambled: true,
      bitrates: [1000000, 2000000, 5000000],
      duration: null,
      uri: 'https://BigBuckBunny.mpd',
      channelId: "CHANNEL1",
      channelName: "Channel One",
      eventId: "123456789",
      eventName: "News",
      type: "LIVE",
    });
 * @param {object} content data required to play live content
 */

/**
 * @function setVodContent
 * @memberof OTVPlayerWithInsight
 * @summary Sets the current vod content information.
 * @example
 * otvplayerWithInsight.current.setVodContent({
    contentId: "416781",
    contentName: "test content",
    genre: ["drama"],
    scrambled: true,
    bitrates: [1000000, 2000000, 5000000],
    duration: 1000,
    uri: 'https://BigBuckBunny.mpd',
  });
 * @param {object} content data required to play vod content
 */

export default OTVPlayer;
