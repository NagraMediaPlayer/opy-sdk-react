// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React, { useRef, useImperativeHandle, useEffect } from "react";
import { Platform } from "react-native";
import OTVPlayer from "./OTVPlayer";
import { STATISTICS_TYPES } from "./common/enums";

import { OTVPlayerWithInsightRef } from "./web/common/interface";
import {
  OTVPlayerWithInsightProps,
  OnProgressParam,
  OnSeekParam,
  OnTracksChangedParam,
  OnErrorParam,
  OnAudioTrackSelectedParam,
  OnTextTrackSelectedParam,
  OTVPlayerRef,
  AudioMediaTrack,
  TextMediaTrack,
  OnBitratesAvailableParam,
  OnSelectedBitrateChangedParam,
} from "./OTVPlayer.d";
import {
  ErrorObjectTypes,
  PlatformType,
  ContentType,
} from "./common/interface";
// prettier-ignore
const OTVPlayerWithInsight: React.FunctionComponent<OTVPlayerWithInsightProps> =
  React.forwardRef(
    (
      props: OTVPlayerWithInsightProps,
      ref: React.RefObject<OTVPlayerWithInsightRef>
    ) => { //NOSONAR
      const DEFAULT_STATISTICS_INTERVAL: number = 5000; //default statistics update interval in milliseconds
      const {
        insightAgent,
        progressUpdateInterval = 0.25
      } = props;

      let otvPlayerRef: { current: OTVPlayerRef } = useRef(null);
      let audioTracks: { current: AudioMediaTrack[] } = useRef([]); //to store audioTracks info
      let textTracks: { current: TextMediaTrack[] } = useRef([]); //to store textTracks info
      let isLiveContent: { current: string } = useRef(null);
      let currentLiveContentPosition: { current: number } = useRef(0); //to store current live content position

      useImperativeHandle(ref, () => ({
        setLiveContent,
        setVodContent,
        setUserInfo,
        play: otvPlayerRef.current.play,
        pause: otvPlayerRef.current.pause,
        seek: otvPlayerRef.current.seek,
        selectAudioTrack: otvPlayerRef.current.selectAudioTrack,
        selectTextTrack: otvPlayerRef.current.selectTextTrack,
        stop: otvPlayerRef.current.stop,
      }));

      /**
       * @useEffect
       * @summary Gets triggered if there is any change in src/drm.
       */
      useEffect(() => {
        if (insightAgent) {
          console.log(
            "OTVPlayerWithInsight: useEffect(): useEffect called: src/drm change: ",
            JSON.stringify(props.source)
          );

          // for every channel change the plugin should call stop to notify the agent old content is stopped.
          insightAgent.stop(); //Notifies the agent that the playback was stopped.
          insightAgent.play(); //Notifies the agent that the user requested the playback of some content.

          isLiveContent.current = null; //resetting flag to null for every channel/content change
        }
      }, [props.source.src, props.source.drm]);

      /**
       * @function setUserInfo
       * @summary Sets the current user information.
       * @param userInfo
       */
      const setUserInfo = (userInfo) => {
        if (insightAgent) {
          console.log(
            "OTVPlayerWithInsight: setUserInfo(): setUserInfo called: userInfo: ",
            JSON.stringify(userInfo)
          );
          insightAgent.setUserInfo(userInfo); //Sets the current user information.
        }
      };

      /**
       * @function setLiveContent
       * @summary Sets the current live content information.
       * @param content
       */
      const setLiveContent = (content) => {
        if (insightAgent) {
          isLiveContent.current = ContentType.LIVE;
          console.log(
            "OTVPlayerWithInsight: setLiveContent(): setLiveContent called: content: ",
            JSON.stringify(content)
          );
          insightAgent.setLiveContent(content); //Notifies the agent that the content playing is a live content
        }
      };

      /**
       * @function setVodContent
       * @summary Sets the current vod content information.
       * @param content
       */
      const setVodContent = (content) => {
        if (insightAgent) {
          isLiveContent.current = ContentType.VOD;
          console.log(
            "OTVPlayerWithInsight: setVodContent(): setVodContent called: content: ",
            JSON.stringify(content)
          );
          insightAgent.setVodContent(content); //Notifies the agent that the content playing is a VOD content
        }
      };

      /**
       * @function onPlaying
       * @summary Fires when the media is no longer blocked from playback, and has started playing.
       *
       */
      const onPlaying = () => {
        if (insightAgent) {
          console.log("OTVPlayerWithInsight: onPlaying(): playing called");
          //Notifies the agent that a playback started. That is, all needed buffering has been done and content is playing
          //on the screen.
          insightAgent.playing();
        }

        if (props.onPlaying) {
          console.log("OTVPlayerWithInsight: onPlaying(): onPlaying called");
          props.onPlaying();
        }
      };

      /**
       * @function onError
       * @summary Fires when the error occurs.
       * @param event
       */
      const onError = (event: OnErrorParam) => {
        if (insightAgent) {
          let errorObj: ErrorObjectTypes;
          switch (Platform.OS) {
            case PlatformType.WEB:
              errorObj = {
                code: String(event.code),
                message:
                  event.nativeError.details?.errorMessage ?? String(event.code),
              };
              break;
            case PlatformType.ANDROID:
              errorObj = {
                code: String(event.code),
                message:
                  //@ts-ignore added ts-ignore as type definition needs to be implemented for android platform
                  event.nativeError.details.message ?? String(event.code),
              };
              break;
            case PlatformType.IOS:
              errorObj = {
                code: String(event.code),
                message:
                  //@ts-ignore added ts-ignore as type definition needs to be implemented for ios platform
                  event.nativeError.details.localizedDescription ??
                  String(event.code),
              };
              break;
          }
          console.log(
            `OTVPlayerWithInsight: onError(): addErrorEvent called: Platform: ${Platform.OS
            } error: 
            ${JSON.stringify(errorObj)}`
          );
          insightAgent.addErrorEvent(errorObj.code, errorObj.message); //Notifies the agent that an error occurred.
        }

        if (props.onError) {
          console.log(
            "OTVPlayerWithInsight: onError(): onError called: error: ",
            JSON.stringify(event)
          );
          props.onError(event);
        }
      };

      /**
       * @function onSeek
       * @summary Fires when the seek completes.
       * @param event
       */
      const onSeek = (event: OnSeekParam) => {
        if (insightAgent) {
          console.log(
            "OTVPlayerWithInsight: onSeek(): seekTo called: seekPosition: ",
            JSON.stringify(event.seekPosition)
          );
          let seekPosition = event?.seekPosition ?? null;
          let currentPosition = event?.currentPosition ?? null;
          //Notifies the agent that the user requested playback at a different position.
          insightAgent.seekTo(seekPosition);
          if (isLiveContent.current === ContentType.LIVE) {
            let offset = Math.abs(
              currentLiveContentPosition.current - currentPosition
            );

            console.log(
              "OTVPlayerWithInsight: onSeek(): setOffsetFromLive called: offset: ",
              JSON.stringify(offset)
            );
            //Notifies the agent of the playback offset from the live stream.
            //This is only applicable if the current content is a live content.
            insightAgent.setOffsetFromLive(offset);
          }
        }
        if (props.onSeek) {
          console.log(
            "OTVPlayerWithInsight: onSeek(): onSeek called: event: " +
            JSON.stringify(event.seekPosition)
          );
          props.onSeek(event);
        }
      };

      /**
       * @function onPaused
       * @summary Fires when playback is paused.
       */
      const onPaused = () => {
        if (insightAgent) {
          console.log("OTVPlayerWithInsight: onPause(): pause called");
          insightAgent.pause(); //Notifies the agent that the user paused playback.
        }
        if (props.onPaused) {
          console.log("OTVPlayerWithInsight: onPause(): onPause called");
          props.onPaused();
        }
      };

      /**
       * @function onWaiting
       * @summary Fires when the player has not enough data for continuing playback, but it may recover in a short time.
       */
      const onWaiting = () => {
        if (insightAgent) {
          console.log("OTVPlayerWithInsight: onWaiting(): buffering called");
          insightAgent.buffering(); //Notifies the agent that the player started buffering.
        }
        if (props.onWaiting) {
          console.log("OTVPlayerWithInsight: onWaiting(): onWaiting called");
          props.onWaiting();
        }
      };

      /**
       * @function onProgress
       * @summary Fires when playback is in progress.
       * @param event
       */
      const onProgress = (event: OnProgressParam) => {
        if (insightAgent) {
          let currentPosition = event?.currentPosition ?? null;
          currentLiveContentPosition.current = currentPosition;
          insightAgent.setPosition(currentPosition); //Notifies the agent of playback progression.
        }
        if (props.onProgress) {
          props.onProgress(event);
        }
      };

      /**
       * @function onStopped
       * @summary Fires when stop api called.
       */
      const onStopped = () => {
        //If handheld don't have this implementation ,there is no stop called for insight unless we zap ?
        if (insightAgent) {
          console.log("OTVPlayerWithInsight: onStopped(): stop called");
          insightAgent.stop(); //Notifies the agent that the playback was stopped.
        }
        if (props.onStopped) {
          console.log("OTVPlayerWithInsight: onStopped(): onStopped called");
          props.onStopped();
        }
      };

      /**
       * @function onTracksChanged
       * @summary Fires when the audioTrack/textTracks load from loaded metadata.
       * @param event
       */
      const onTracksChanged = (event: OnTracksChangedParam) => {
        audioTracks.current = event.audioTracks; //keeping copy of audioTracks info for further use
        textTracks.current = event.textTracks; //keeping copy of textTrack info for further use
        if (props.onTracksChanged) {
          console.log(
            "OTVPlayerWithInsight: onTracksChanged(): onTracksChanged called: event: ",
            JSON.stringify(event)
          );
          props.onTracksChanged(event);
        }
      };

      /**
       * @function onAudioTrackSelected
       * @summary Fires when audio track is changed and when the default audio track is selected.
       * @param event
       */
      const onAudioTrackSelected = (event: OnAudioTrackSelectedParam) => {
        if (insightAgent) {
          console.log(
            "OTVPlayerWithInsight: onAudioTrackSelected() called: event: ",
            JSON.stringify(event));

          if (event.index >= 0) {
            console.log(" audioTracks.current[event.index].language",
              JSON.stringify(audioTracks.current[event.index].language)
            );
            let selectedAudioLanguage = audioTracks.current[event.index].language;
            insightAgent.setAudioLanguage(selectedAudioLanguage); //Notifies the agent that the user changed the audio language
          }
        }
        if (props.onAudioTrackSelected) {
          console.log(
            "OTVPlayerWithInsight: onAudioTrackSelected(): onAudioTrackSelected called: event: ",
            JSON.stringify(event)
          );
          props.onAudioTrackSelected(event);
        }
      };

      /**
       * @function onTextTrackSelected
       * @summary Fires when subtitle track is changed and when the default subtitle track is selected.
       * @param event
       */
      const onTextTrackSelected = (event: OnTextTrackSelectedParam) => {
        if (insightAgent) {
          console.log(
            "OTVPlayerWithInsight: onTextTrackSelected(): setSubtitleLanguage called: event: ",
            JSON.stringify(event)
          );
          let selectedSubtitleLanguage =
            (event.index >= 0) ? textTracks.current[event.index].language : " ";
          //Notifies the agent that the user changed the subtitles language.
          insightAgent.setSubtitleLanguage(selectedSubtitleLanguage);
        }
        if (props.onTextTrackSelected) {
          console.log(
            "OTVPlayerWithInsight: onTextTrackSelected(): onTextTrackSelected called: event: ",
            JSON.stringify(event)
          );
          props.onTextTrackSelected(event);
        }
      };

      /**
       * @function onBitratesAvailable
       * @summary Fires when the bitrates are available.
       * @param event
       */
      //to do: bitrate capping yet to be implemented for ios and android platform
      const onBitratesAvailable = (event: OnBitratesAvailableParam) => {
        if (insightAgent) {
          let bitrates = event?.bitrates ?? [];
          console.log(
            "OTVPlayerWithInsight: onBitratesAvailable(): setAvailableBitrates called: bitrates: ",
            JSON.stringify(bitrates)
          );
          insightAgent.setAvailableBitrates(bitrates);
        }
        if (props.onBitratesAvailable) {
          console.log(
            "OTVPlayerWithInsight: onBitratesAvailable(): onBitratesAvailable called: event: ",
            JSON.stringify(event)
          );
          props.onBitratesAvailable(event);
        }
      };

      /**
       * @function onSelectedBitrateChanged
       * @summary fired when the bitrate being rendered changes.
       * @param event
       */
      const onSelectedBitrateChanged = (event: OnSelectedBitrateChangedParam) => {
        if (insightAgent) {
          let bitrate = event?.bitrate ?? null;
          console.log(
            "OTVPlayerWithInsight: onSelectedBitrateChanged(): setBitrate called: bitrate: ",
            JSON.stringify(bitrate)
          );
          insightAgent.setBitrate(bitrate);
        }
        if (props.onSelectedBitrateChanged) {
          console.log(
            "OTVPlayerWithInsight: onSelectedBitrateChanged(): onSelectedBitrateChanged called: event: ",
            JSON.stringify(event)
          );
          props.onSelectedBitrateChanged(event);
        }
      };

      /**
       * @function onStatisticsUpdate
       * @summary Fires when statisticsUpdate api called.
       * @param event
       */

      const onStatisticsUpdate = (event: any) => {
        if (insightAgent) {
          let frameDrops = event?.rendering?.frameDrops ?? null;
          console.log(
            "OTVPlayerWithInsight: onStatisticsUpdate(): setFrameDrops called: frameDrops: ",
            JSON.stringify(frameDrops)
          );
          insightAgent.setFrameDrops(frameDrops); //Notifies the agent that some frame where dropped.
        }
        if (props.onStatisticsUpdate) {
          console.log(
            "OTVPlayerWithInsight: onStatisticsUpdate(): onStatisticsUpdate called: event: ",
            JSON.stringify(event)
          );
          props.onStatisticsUpdate(event);
        }
      };

      return (
        //@ts-ignore
        <OTVPlayer
          ref={otvPlayerRef}
          {...props}
          //if app does not pass onProgress props then set progressUpdateInterval to 5 sec
          progressUpdateInterval={props.onProgress ? progressUpdateInterval : 5}
          statisticsConfig={{
            //if app does not pass onStatisticsUpdate props then set statisticsUpdateInterval to 5 sec
            statisticsUpdateInterval: props.onStatisticsUpdate
              ? props.statisticsConfig.statisticsUpdateInterval
              : DEFAULT_STATISTICS_INTERVAL,
            statisticsTypes: STATISTICS_TYPES.ALL,
          }}
          onPlaying={onPlaying}
          onError={onError}
          onWaiting={onWaiting}
          onPaused={onPaused}
          onSeek={onSeek}
          onProgress={onProgress}
          onStopped={onStopped}
          onAudioTrackSelected={onAudioTrackSelected}
          onTextTrackSelected={onTextTrackSelected}
          onTracksChanged={onTracksChanged}
          onBitratesAvailable={onBitratesAvailable}
          onSelectedBitrateChanged={onSelectedBitrateChanged}
          onStatisticsUpdate={onStatisticsUpdate}
        />
      );
    }
  );

export { OTVPlayerWithInsight };
