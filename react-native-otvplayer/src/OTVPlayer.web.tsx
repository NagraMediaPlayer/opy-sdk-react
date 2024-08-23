// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { OTT, OTTResetTypes } from "./web/OTT";
import {
  OTVPlayerRef,
  NativeEventProps,
  OTTMimeTypes,
  OipfMimeTypes,
  ErrorCodeTypes,
} from "./web/common/interface";
import React, { useRef, useEffect, useImperativeHandle, useLayoutEffect } from "react";
import { IPTVBroadcast } from "./web/IPTVBroadcast";
import {
  OTVPlayerProps,
  OnLoadParam,
  OnProgressParam,
  OnLoadStartParam,
  OnSeekParam,
  OnTracksChangedParam,
  OnBitratesAvailableParam,
  OnErrorParam,
  OnHttpErrorParam,
  OnSelectedBitrateChangedParam,
  OnDownloadResChangedParam,
  OnAudioTrackSelectedParam,
  OnTextTrackSelectedParam,
} from "./OTVPlayer.d";

import {
  OTVSDK_LOGLEVEL as LOG_LEVEL,
  STATISTICS_TYPES
} from "./common/enums";

import { OTVSDKManager } from "./web/OTVSDKManager";
import { Logger } from "./Logger";
import { ErrorHandler, PluginErrorCode } from "./web/common/ErrorHandler";
import { View } from "react-native";

// OTVPlayer RN Player component for web
const OTVPlayer: React.FC<OTVPlayerProps> = React.forwardRef(
  (props: OTVPlayerProps, ref: React.RefObject<OTVPlayerRef>) => {
    // TO DO: can be used later to reduce the number of new requests??
    // let ottPlayer: OTT = null;
    // let oipfPlayer: IPTVBroadcast & Broadcast = null;
    const player = useRef(null); // hold/update instance for the entire lifecycle
    const isPlayerStopped = useRef(true); //to track when app has called for stopping.
    const isPlayerReset = useRef(true); //to track underline player is reset.
    const DEFAULT_VOLUME_LEVEL: number = 1;
    const DEFAULT_PROGRESS_INTERVAL: number = 0.25; //default progress update interval value in sec
    const DEFAULT_STATISTICS_INTERVAL: number = 5000; //default statistics update interval in milli seconds
    const RN_VID_VIEW: string = "rn-vid";
    let errorHandler = useRef(null);
    let nativeProps: NativeEventProps;
    let logger: Logger = new Logger();
    let {
      autoplay = false,
      progressUpdateInterval = DEFAULT_PROGRESS_INTERVAL,
      volume = DEFAULT_VOLUME_LEVEL,
      muted = false,
      style,
      statisticsConfig = {
        statisticsUpdateInterval: DEFAULT_STATISTICS_INTERVAL,
        statisticsTypes: STATISTICS_TYPES.ALL,
      },
    } = props;

    useImperativeHandle(ref, () => ({
      play,
      pause,
      seek,
      stop,
      selectAudioTrack,
      selectTextTrack,
    }));

    useLayoutEffect(() => {
      return () => {
        logger.log(
          LOG_LEVEL.DEBUG,
          "OTVPlayer.web.tsx: useLayoutEffect: before unmount"
        );
        // Cleanup DOM elements here for OTT as it can only
        // be done synchronously here before React removes it from DOM

        // The player might have been already reset by stop call.
        if (!isPlayerStopped.current) {
          if (!isPlayerReset.current) {
            player.current.reset(OTTResetTypes.RESET_FOR_UNMOUNT_OR_TYPE_CHANGE);
            isPlayerReset.current = true;
          }
        }

        player.current.disconnectPlayerNode();
      };
    }, []);

    useEffect(() => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: useEffect: in mounting ",
        "Props: ",
        JSON.stringify(props)
      );
      errorHandler.current = new ErrorHandler({ onError, onHttpError});
      nativeProps.errorHandler = errorHandler.current;

      // Initialising IPTV player by default so that we can stop the default
      // broadcast content playback
      if (window.navigator.userAgent.includes("HbbTV") &&
        window.navigator.userAgent.includes("Tizen")) {
        new IPTVBroadcast(nativeProps); //NOSONAR
      }

      return () => {
        logger.log(
          LOG_LEVEL.DEBUG,
          "OTVPlayer.web.tsx: useEffect: OTVPlayer unmounting"
        );

        if (!isPlayerReset.current) {
          logger.log(
            LOG_LEVEL.ERROR,
            "OTVPlayer.web.tsx: useEffect: OTVPlayer not reset!!!"
          );
        }
        // For some unknown reason this is not getting reset, even on an unmount (in dev mode)!!!
        player.current = null;

        // SDK DOM Cleanup already done in the
        // useLayoutEffect()
      };
    }, []);

    // prettier-ignore
    useEffect(() => { //NOSONAR
      const currentPlayer = player.current;
      //added source undefined check because of this issue jira---> https://jira.opentv.com/browse/OTVPL-3378
      if (props.source !== undefined) {
        // Part1: initialize an instance (shaka or HbbTV player) based on the source type
        // OR switch to an already initlaized one
        switch (props.source.type) {
          case OipfMimeTypes.IPTV_URI:
          case OipfMimeTypes.IPTV_SDS:
          case OipfMimeTypes.DVB_CAB:
            // create HbbTV instance
            player.current = new IPTVBroadcast(nativeProps);
            break;

          case OTTMimeTypes.DASH:
          case OTTMimeTypes.HLS:
          default:
            // creating an OTT player instance anyway.
            player.current = new OTT(nativeProps, props);
        }

        if (
          props.source?.type &&
          player.current.isSrcTypeSupported(props.source.type)
        ) {
          logger.log(
            LOG_LEVEL.DEBUG,
            "OTVPlayer.web.tsx: useEffect: ",
            "source type supported"
          );

          //SDK throws the invalid mimetype warning/error only in the case when the mimetype is incorrect or not supported.
          //It does not throw any error if the type is undefined or not passed at all and plays the content.
        } else if (props.source.type !== undefined) {
          logger.log(
            LOG_LEVEL.ERROR,
            "OTVPlayer.web.tsx: useEffect: ",
            "Unknown source type provided"
          );
          let errorObj = {
            errorCode: PluginErrorCode.INVALID_MIMETYPE,
            errorMessage: "Mime Type Invalid",
          };
          errorHandler.current.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
        }
        // Part 2: Cleanup of the current instance and setup the newly selected one
        if (currentPlayer !== player.current) {
          if (currentPlayer) {
            // no need to call reset on first mount
            // app may change type after calling stop api
            if (!isPlayerReset.current) {
              currentPlayer.reset(OTTResetTypes.RESET_FOR_UNMOUNT_OR_TYPE_CHANGE);
              //update the reset state
              isPlayerReset.current = true;
            }
            currentPlayer.disconnectPlayerNode();
          }
          player.current.connectPlayerNode(RN_VID_VIEW);
        }
      } else {
        logger.log(
          LOG_LEVEL.WARNING,
          "OTVPlayer.web.tsx: useEffect: props.source.type",
          "undefined source"
        );
      }
    }, [props.source?.type]);

    /**
     * @function
     * @summary
     * @param
     */
    useEffect(() => {
      //added source undefined check because of this issue jira---> https://jira.opentv.com/browse/OTVPL-3378
      if (props.source !== undefined) {
        logger.log(
          LOG_LEVEL.DEBUG,
          "OTVPlayer.web.tsx: useEffect: ",
          " set source: ",
          JSON.stringify(props)
        );
        //no need to reset if app stopped the player then changed the source.
        if (!isPlayerReset.current) {
          player.current.reset(OTTResetTypes.RESET_FOR_SRC_CHANGE);
          //no need to change reset state as we are setting player immediately.
        }

        if (props.onLicenseRequest) {
          logger.log(
            LOG_LEVEL.DEBUG,
            "OTVPlayer.web.tsx: src useEffect: onLicenseRequest"
          );
          player.current.onLicenseRequest = props.onLicenseRequest;
        } else {
          player.current.onLicenseRequest = null;
        }
        player.current.setup();
        isPlayerReset.current = false;

        player.current.volume = props.volume;
        player.current.muted = props.muted;
        player.current.autoplay = autoplay;
        player.current.source = props.source;
        player.current.progressInterval = progressUpdateInterval;
        // Update again the settings given in props to the SDK as it was cleared on player reset()
        player.current.maxResolution = props.maxResolution;
        if (statisticsConfig) {
          setStatisticsConfig();
        }

        // commenting out thumbnail related docs and public facing api's

        //while src change and props are not changed from previous ones
        if (props.thumbnail) {
          player.current.thumbnail = props.thumbnail;
        }

        //player no longer in stop state.
        isPlayerStopped.current = false;
      } else {
        logger.log(
          LOG_LEVEL.WARNING,
          "OTVPlayer.web.tsx: useEffect: props.source",
          "undefined source"
        );
      }
    }, [props.source.src]);

    useEffect(() => {
      //to do: do we need to manage token change on the same content.
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: useEffect: props.source.token",
        "token: ",
        props.source.token
      );
      player.current.token = props.source.token;
    }, [props.source.token]);

    /**
     * @function
     * @summary
     * @param
     */
    useEffect(() => {
      //if app has already stopped using stop api maxResolution change is a no op.
      if (!isPlayerStopped.current) {
        logger.log(
          LOG_LEVEL.DEBUG,
          "OTVPlayer.web.tsx: useEffect: ",
          " set maxResolution: ",
          JSON.stringify(props)
        );
        player.current.maxResolution = props.maxResolution;
      } else {
        logger.log(
          LOG_LEVEL.WARNING,
          "OTVPlayer.web.tsx: useEffect: ",
          " set maxResolution: ",
          "Operation not possible in player state: STOPPED"
        );
      }
    }, [props.maxResolution]);


    // commenting out thumbnail related docs and public facing api's
    /**
     * @function
     * @summary
     * @param
     */
    useEffect(() => {
      //if app has already stopped using stop api, displaythumbnail change is a no op.
      if (!isPlayerStopped.current) {
        logger.log(
          LOG_LEVEL.DEBUG,
          "OTVPlayer.web.tsx: useEffect: ",
          " set thumbnail ",
          JSON.stringify(props)
        );

        player.current.thumbnail = props.thumbnail;
      } else {
        logger.log(
          LOG_LEVEL.WARNING,
          "OTVPlayer.web.tsx: useEffect: ",
          " set thumbnail: ",
          "Operation not possible in player state: STOPPED"
        );
      }
    }, [props.thumbnail]);

    /**
     * @function
     * @summary
     * @param
     */
    useEffect(() => {
      //if app has already stopped using stop api volume and muted change is a no op.
      if (!isPlayerStopped.current) {
        logger.log(
          LOG_LEVEL.DEBUG,
          "OTVPlayer.web.tsx: useEffect: ",
          " set volume: ",
          JSON.stringify(volume)
        );
        player.current.volume = volume;
        player.current.muted = muted;
      } else {
        logger.log(
          LOG_LEVEL.WARNING,
          "OTVPlayer.web.tsx: useEffect: ",
          " set volume: ",
          "Operation not possible in player state: STOPPED"
        );
      }
    }, [volume, muted]);

    /**
     * @function
     * @summary
     * @param
     */
    useEffect(() => {
      //if app has already stopped using stop api, maxbitrate should be ignored.
      if (!isPlayerStopped.current) {
        logger.log(
          LOG_LEVEL.DEBUG,
          "OTVPlayer.web.tsx: useEffect: ",
          " set maxBitrate: ",
          props.maxBitrate
        );
        player.current.maxBitrate = props.maxBitrate;
      } else {
        logger.log(
          LOG_LEVEL.WARNING,
          "OTVPlayer.web.tsx: useEffect: ",
          " set maxBitrate: ",
          "Operation not possible in player state: STOPPED"
        );
      }
    }, [props.maxBitrate]);

    /**
     * @function
     * @summary
     * @param
     */
    useEffect(() => {
      //if app has already stopped using stop api add text track is a no op.
      if (isPlayerStopped.current) {
        logger.log(
          LOG_LEVEL.WARNING,
          "OTVPlayer.web.tsx: useEffect: ",
          " add sideloaded text track: ",
          "Operation not possible in player state: STOPPED"
        );
        return;
      }

      if (props.source.textTracks) {
        logger.log(
          LOG_LEVEL.DEBUG,
          "OTVPlayer.web.tsx: useEffect: ",
          " set sideLoadedTextTrack: "
        );
        player.current.addTextTracks(props.source.textTracks);
      }
      // Note : textTracks will be moved out of source object as any change in
      // textTrack will trigger the above useEffect which has dependency on
      // props.source which will reset the src url
    }, [props.source?.textTracks]);

    /**
     * @function
     * @summary
     * @param
     */
    useEffect(() => {
      if (statisticsConfig) {
        setStatisticsConfig();
      }
    }, [props.statisticsConfig?.statisticsTypes, props.statisticsConfig?.statisticsUpdateInterval]);

    // Create useEffect to update event props, all event props should be
    // created with UseCallback hook from application.
    /**
     * @function
     * @summary Update onAudioTrackSelected event property
     * @param
     */
    useEffect(() => {
      player.current.onAudioTrackSelectedEvent = onAudioTrackSelected;
    }, [props.onAudioTrackSelected]);

    /**
     * @function
     * @summary Update onBitratesAvailable event property
     * @param
     */
    useEffect(() => {
      player.current.onBitratesAvailableEvent = onBitratesAvailable;
    }, [props.onBitratesAvailable]);

    /**
     * @function
     * @summary Update onDownloadResChanged event property
     * @param
     */
    useEffect(() => {
      player.current.onDownloadResChangedEvent = onDownloadResChanged;
    }, [props.onDownloadResChanged]);

    /**
      * @function
      * @summary Update onEnd event property
      * @param
      */
    useEffect(() => {
      player.current.onEndEvent = onEnd;
    }, [props.onEnd]);

    /**
     * @function
     * @summary Update onError event property
     * @param
     */
    useEffect(() => {
      player.current.onErrorEvent = onError;
    }, [props.onError]);

    /**
     * @function
     * @summary Update onLoad event property
     * @param
     */
    useEffect(() => {
      player.current.onLoadEvent = onLoad;
    }, [props.onLoad]);

    /**
     * @function
     * @summary Update onLoadStart event property
     * @param
     */
    useEffect(() => {
      player.current.onLoadStartEvent = onLoadStart;
    }, [props.onLoadStart]);

    /**
     * @function
     * @summary Update onPaused event property
     * @param
     */
    useEffect(() => {
      player.current.onPausedEvent = onPaused;
    }, [props.onPaused]);

    /**
     * @summary Update onPlay event property
     * @param
     */
    useEffect(() => {
      player.current.onPlayEvent = onPlay;
    }, [props.onPlay]);

    /**
     * @function
     * @summary Update onPlaying event property
     * @param
     */
    useEffect(() => {
      player.current.onPlayingEvent = onPlaying;
    }, [props.onPlaying]);

    /**
     * @function
     * @summary Update onProgress event property
     * @param
     */
    useEffect(() => {
      player.current.onProgressEvent = onProgress;
    }, [props.onProgress]);

    /**
      * @function
      * @summary Update onSeek event property
      * @param
      */
    useEffect(() => {
      player.current.onSeekEvent = onSeek;
    }, [props.onSeek]);

    /**
     * @function
     * @summary Update onSelectedBitrateChanged event property
     * @param
     */
    useEffect(() => {
      player.current.onSelectedBitrateChangedEvent = onSelectedBitrateChanged;
    }, [props.onSelectedBitrateChanged]);

    /**
     * @function
     * @summary Update onStatisticsUpdate event property
     * @param
     */
    useEffect(() => {
      player.current.onStatisticsUpdateEvent = onStatisticsUpdate;
    }, [props.onStatisticsUpdate]);

    /**
     * @function
     * @summary Update onStopped event property
     * @param
     */
    useEffect(() => {
      player.current.onStoppedEvent = onStopped;
    }, [props.onStopped]);

    /**
     * @function
     * @summary Update onTextTrackSelected event property
     * @param
     */
    useEffect(() => {
      player.current.onTextTrackSelectedEvent = onTextTrackSelected;
    }, [props.onTextTrackSelected]);

    /**
     * @function
     * @summary Update onThumbnailAvailable event property
     * @param
     */
    useEffect(() => {
      player.current.onThumbnailAvailableEvent = onThumbnailAvailable;
    }, [props.onThumbnailAvailable]);

    /**
     * @function
     * @summary Update onTracksChanged event property
     * @param
     */
    useEffect(() => {
      player.current.onTracksChangedEvent = onTracksChanged;
    }, [props.onTracksChanged]);

    /**
     * @function
     * @summary Update onWaiting event property
     * @param
     */
    useEffect(() => {
      player.current.onWaitingEvent = onWaiting;
    }, [props.onWaiting]);

    /**
     * @function
     * @summary
     * @param
     */
    const onLoadStart = (event: OnLoadStartParam) => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onLoadStart(): ",
        "onLoadStart triggered: ",
        JSON.stringify(event)
      );
      if (props.onLoadStart) {
        logger.log(
          LOG_LEVEL.DEBUG,
          "OTVPlayer.web.tsx: onLoadStart(): ",
          "inside"
        );
        // Trigger the event on next event loop to prevent indefinite
        // looping caused due to calling of OTVPlayer APIs from within the callback in App
        setTimeout(() => {
          props.onLoadStart(event);
        }, 0);
      }
    };

    /**
     * @function
     * @summary Fires when the browser has loaded the current frame of the audio/video.
     * @param {Object} event
     */
    const onLoad = (event: OnLoadParam) => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onLoad(): ",
        "onLoad triggered: ",
        JSON.stringify(event)
      );
      if (props.onLoad) {
        // Trigger the event on next event loop to prevent indefinite
        // looping caused due to calling of OTVPlayer APIs from within the callback in App
        setTimeout(() => {
          props.onLoad(event);
        }, 0);
      }
    };

    /**
     * @function
     * @summary The loadeddata event is fired when the frame at the current playback
     *          position of the media has finished loading; often the first frame.
     */
    const onLoadedData = () => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onLoadedData(): ",
        "onLoadedData triggered: "
      );
      if (props.onLoadedData) {
        // Trigger the event on next event loop to prevent indefinite
        // looping caused due to calling of OTVPlayer APIs from within the callback in App
        setTimeout(() => {
          props.onLoadedData();
        }, 0);
      }
    };

    /**
     * @function
     * @summary Fires when the media is no longer blocked from playback, and has started playing.
     * @param {Object} event
     */
    const onPlaying = () => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onPlaying(): ",
        "onPlaying triggered"
      );
      if (props.onPlaying) {
        // Trigger the event on next event loop to prevent indefinite
        // looping caused due to calling of OTVPlayer APIs from within the callback in App
        setTimeout(() => {
          props.onPlaying({});
        }, 0);
      }
    };

    /**
     * @function
     * @summary Fires when the the playback is playing.
     * @param {Object} event
     */
    const onPlay = () => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onPlay(): ",
        "onPlay triggered"
      );
      if (props.onPlay) {
        // Trigger the event on next event loop to prevent indefinite
        // looping caused due to calling of OTVPlayer APIs from within the callback in App
        setTimeout(() => {
          props.onPlay({});
        }, 0);
      }
    };

    /**
     * @function
     * @summary Fires when the player has not enough data for continuing playback, but it may recover in a short time.
     * @param {Object} event
     */
    const onWaiting = () => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onWaiting(): ",
        "onWaiting triggered"
      );
      if (props.onWaiting) {
        // Trigger the event on next event loop to prevent indefinite
        // looping caused due to calling of OTVPlayer APIs from within the callback in App
        setTimeout(() => {
          props.onWaiting({});
        }, 0);
      }
    };

    /**
     * @function
     * @summary Fires when the media has reached the end.
     */
    const onEnd = () => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onEnd(): ",
        "onEnd triggered"
      );
      if (props.onEnd) {
        // Trigger the event on next event loop to prevent indefinite
        // looping caused due to calling of OTVPlayer APIs from within the callback in App
        setTimeout(() => {
          props.onEnd({});
        }, 0);
      }
    };

    /**
     * @function
     * @summary Fires when the audioTrack/textTracks load from loaded metadata.
     */
    const onTracksChanged = (event: OnTracksChangedParam) => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onTracksChanged(): ",
        "onTracksChanged triggered"
      );
      if (props.onTracksChanged) {
        // Trigger the event on next event loop to prevent indefinite
        // looping caused due to calling of OTVPlayer APIs from within the callback in App
        setTimeout(() => {
          props.onTracksChanged(event);
        }, 0);
      }
    };

    /**
     * @function
     * @summary Fires when the bitrates are available.
     */
    const onBitratesAvailable = (event: OnBitratesAvailableParam) => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onBitratesAvailable(): ",
        "onBitratesAvailable triggered"
      );
      if (props.onBitratesAvailable) {
        // Trigger the event on next event loop to prevent indefinite
        // looping caused due to calling of OTVPlayer APIs from within the callback in App
        setTimeout(() => {
          props.onBitratesAvailable(event);
        }, 0);
      }
    };

    /**
     * @function
     * @summary Fires when audio track is changed and when the default audio track is selected
     */
    const onAudioTrackSelected = (event: OnAudioTrackSelectedParam) => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onAudioTrackSelected(): ",
        "onAudioTrackSelected triggered"
      );
      if (props.onAudioTrackSelected) {
        // Trigger the event on next event loop to prevent indefinite
        // looping caused due to calling of OTVPlayer APIs from within the callback in App
        setTimeout(() => {
          props.onAudioTrackSelected(event);
        }, 0);
      }
    };

    /**
     * @function
     * @summary Fires when subtitle track is changed and when the default subtitle track is selected
     */
    const onTextTrackSelected = (event: OnTextTrackSelectedParam) => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onTextTrackSelected(): ",
        "onTextTrackSelected triggered"
      );
      if (props.onTextTrackSelected) {
        // Trigger the event on next event loop to prevent indefinite
        // looping caused due to calling of OTVPlayer APIs from within the callback in App
        setTimeout(() => {
          props.onTextTrackSelected(event);
        }, 0);
      }
    };

    /**
     * @function
     * @summary Fires when playback is paused.
     * @param {Object} event
     */
    const onPaused = () => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onPaused(): ",
        "onPaused triggered"
      );
      if (props.onPaused) {
        // Trigger the event on next event loop to prevent indefinite
        // looping caused due to calling of OTVPlayer APIs from within the callback in App
        setTimeout(() => {
          props.onPaused({});
        }, 0);
      }
    };

    /**
     * @function
     * @summary fired when the bitrate being rendered changes.
     * @param {Object} event
     */
    const onSelectedBitrateChanged = (event: OnSelectedBitrateChangedParam) => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onSelectedBitrateChanged(): ",
        "onSelectedBitrateChanged triggered: ",
        JSON.stringify(event)
      );
      if (props.onSelectedBitrateChanged) {
        // Trigger the event on next event loop to prevent indefinite
        // looping caused due to calling of OTVPlayer APIs from within the callback in App
        setTimeout(() => {
          props.onSelectedBitrateChanged(event);
        }, 0);
      }
    };

    /**
     * @function
     * @summary fired when the bitrate being rendered changes.
     * @param {Object} event
     */
    const onDownloadResChanged = (event: OnDownloadResChangedParam) => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onDownloadResChanged(): ",
        "onDownloadResChanged triggered: ",
        JSON.stringify(event)
      );
      if (props.onDownloadResChanged) {
        // Trigger the event on next event loop to prevent indefinite
        // looping caused due to calling of OTVPlayer APIs from within the callback in App
        setTimeout(() => {
          props.onDownloadResChanged(event);
        }, 0);
      }
    };

    /**
     * @function play
     * @summary play will be called in the follwing two sceanrios:
     * 1) if app has pause and wants to the play content
     * 2) if app has stopped and wants start content
     */
    const play = () => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: play(): ",
        "play called: "
      );
      if (player.current) {
        //if app has already stopped using stop api and wants to start content.
        if (isPlayerStopped.current) {
          player.current.setup(); //register all events
          //need to change reset state as we are seting player.
          isPlayerReset.current = false;

          player.current.muted = props.muted;
          //if content is stopped with autoplay false, play should still ignore it and play the content.
          player.current.autoplay = true;
          player.current.volume = volume;
          player.current.maxResolution = props.maxResolution;
          player.current.source = props.source;
          player.current.token = props.source.token;
          player.current.progressInterval = progressUpdateInterval;

          if (statisticsConfig) {
            //resetting stats
            setStatisticsConfig();
          }

          //player no longer in stop state.
          isPlayerStopped.current = false;
        } else {
          //if app has already paused using pause api and wants to play content.
          player.current.play(); //this for paused to play
        }
      } else {
        logger.log(
          LOG_LEVEL.ERROR,
          "OTVPlayer.web.tsx: play(): ",
          "currentInstance not available"
        );
        let errorObj = {
          errorCode: PluginErrorCode.INTERNAL_ERROR,
          errorMessage: "Plugin Internal Error",
        };
        errorHandler.current.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
      }
    };

    /**
     * @function
     * @summary
     * @param
     */
    const pause = () => {
      //if app has already stopped using stop api pause is a no op.
      if (!isPlayerStopped.current) {
        logger.log(
          LOG_LEVEL.DEBUG,
          "OTVPlayer.web.tsx: pause(): ",
          "pause called"
        );
        if (player.current) {
          player.current.pause();
        } else {
          logger.log(
            LOG_LEVEL.ERROR,
            "OTVPlayer.web.tsx: pause(): ",
            "currentInstance not available"
          );
          let errorObj = {
            errorCode: PluginErrorCode.INTERNAL_ERROR,
            errorMessage: "Plugin Internal Error",
          };
          errorHandler.current.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
        }
      } else {
        logger.log(
          LOG_LEVEL.WARNING,
          "OTVPlayer.web.tsx: pause(): ",
          "Operation not possible in player state: STOPPED"
        );
      }
    };
    /**
     * @function onProgress
     * @summary Fires when playback is in progess.
     * @param {object} progressEvtData
     */
    const onProgress = (progressEvtData: OnProgressParam) => {
      if (props.onProgress) {
        // Trigger the event on next event loop to prevent indefinite
        // looping caused due to calling of OTVPlayer APIs from within the callback in App
        setTimeout(() => {
          props.onProgress(progressEvtData);
        }, 0);
      }
    };

    /**
     * @function
     * @summary
     * @param
     */
    const seek = (position: number) => {
      //if app has already stopped using stop api seek is a no op.
      if (!isPlayerStopped.current) {
        logger.log(
          LOG_LEVEL.DEBUG,
          "OTVPlayer.web.tsx: seek(): ",
          "seek called"
        );
        if (player.current) {
          player.current.seek(position);
        } else {
          logger.log(
            LOG_LEVEL.ERROR,
            "OTVPlayer.web.tsx: seek(): ",
            "currentInstance not available"
          );
          let errorObj = {
            errorCode: PluginErrorCode.INTERNAL_ERROR,
            errorMessage: "Plugin Internal Error",
          };
          errorHandler.current.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
        }
      } else {
        logger.log(
          LOG_LEVEL.WARNING,
          "OTVPlayer.web.tsx: seek(): ",
          "Operation not possible in player state: STOPPED"
        );
      }
    };

    /**
     * @function
     * @summary Fires when the seek completes.
     * @param {Object} event
     */
    const onSeek = (event: OnSeekParam) => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onSeek(): ",
        "onSeek triggered: ",
        JSON.stringify(event)
      );
      if (props.onSeek) {
        // Trigger the event on next event loop to prevent indefinite
        // looping caused due to calling of OTVPlayer APIs from within the callback in App
        setTimeout(() => {
          props.onSeek(event);
        }, 0);
      }
    };

    /**
     * @function selectAudioTrack
     * @summary Function to set the audio track
     * @param index
     */
    const selectAudioTrack = (index: number) => {
      //if app has already stopped using stop api selectAudioTrack is a no op.
      if (!isPlayerStopped.current) {
        logger.log(
          LOG_LEVEL.DEBUG,
          "OTVPlayer.web.tsx: selectAudioTrack(): ",
          "selectAudioTrack called: "
        );
        if (player.current) {
          player.current.selectAudioTrack(index);
        } else {
          logger.log(
            LOG_LEVEL.ERROR,
            "OTVPlayer.web.tsx: selectAudioTrack(): ",
            "currentInstance not available"
          );
          let errorObj = {
            errorCode: PluginErrorCode.INTERNAL_ERROR,
            errorMessage: "Plugin Internal Error",
          };
          errorHandler.current.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
        }
      } else {
        logger.log(
          LOG_LEVEL.WARNING,
          "OTVPlayer.web.tsx: selectAudioTrack(): ",
          "Operation not possible in player state: STOPPED"
        );
      }
    };

    /**
     * @function selectTextTrack
     * @summary Function to set the text track
     * @param index
     */
    const selectTextTrack = (index: number) => {
      //if app has already stopped using stop api selectTextTrack is a no op.
      if (!isPlayerStopped.current) {
        logger.log(
          LOG_LEVEL.DEBUG,
          "OTVPlayer.web.tsx: selectTextTrack(): ",
          "selectTextTrack called: "
        );
        if (player.current) {
          player.current.selectTextTrack(index);
        } else {
          logger.log(
            LOG_LEVEL.ERROR,
            "OTVPlayer.web.tsx: selectTextTrack(): ",
            "currentInstance not available"
          );
          let errorObj = {
            errorCode: PluginErrorCode.INTERNAL_ERROR,
            errorMessage: "Plugin Internal Error",
          };
          errorHandler.current.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
        }
      } else {
        logger.log(
          LOG_LEVEL.WARNING,
          "OTVPlayer.web.tsx: selectTextTrack(): ",
          "Operation not possible in player state: STOPPED"
        );
      }
    };

    /**
     * @function
     * @summary Fires when the error occurs.
     * @param {Object} event
     */
    const onError = (event: OnErrorParam) => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onError(): ",
        "onError event triggered",
        JSON.stringify(event)
      );
      if (props.onError) {
        setTimeout(() => {
          props.onError(event);
        }, 0);
      }
    };

    /**
     * @function
     * @summary Fires when the Http error occurs.
     * @param {Object} event
     */
    const onHttpError = (event: OnHttpErrorParam) => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onHttpError(): ",
        "onHttpError event triggered",
        JSON.stringify(event)
      );
      if (props.onHttpError) {
        setTimeout(() => {
          props.onHttpError(event);
        }, 0);
      }
    };

    /**
     * @function
     * @summary TO stop player.
     */
    const stop = () => {
      //if app has already stopped using stop api stop is a no op.
      if (!isPlayerStopped.current) {
        logger.log(
          LOG_LEVEL.DEBUG,
          "OTVPlayer.web.tsx: stop(): ",
          "stop called"
        );
        if (player.current) {
          player.current.reset(OTTResetTypes.RESET_FOR_STOP);
          isPlayerStopped.current = true;
          isPlayerReset.current = true;
        } else {
          logger.log(
            LOG_LEVEL.ERROR,
            "OTVPlayer.web.tsx: stop(): ",
            "currentInstance not available"
          );
          let errorObj = {
            errorCode: PluginErrorCode.INTERNAL_ERROR,
            errorMessage: "Plugin Internal Error",
          };
          errorHandler.current.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
        }
      } else {
        logger.log(
          LOG_LEVEL.WARNING,
          "OTVPlayer.web.tsx: stop(): ",
          "Operation not possible in player state: STOPPED"
        );
      }
    };

    /**
     * @function
     * @summary Fires when statisticsUpdate api called.
     */
    const onStatisticsUpdate = (event) => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onStatisticsUpdate(): ",
        "onStatisticsUpdate event triggered"
      );
      /* onStatisticsUpdate is triggered only if passed by app */
      if (props.onStatisticsUpdate) {
        setTimeout(() => {
          props.onStatisticsUpdate(event);
        }, 0);
      }
    };

    /**
     * @function
     * @summary Fires when stop api called.
     */
    const onStopped = () => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onStopped(): ",
        "onStopped event triggered"
      );
      if (props.onStopped) {
        setTimeout(() => {
          props.onStopped({});
        }, 0);
      }
    };

    /**
     * @function
     * @summary Set player statistics config.
     */
    const setStatisticsConfig = () => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: setStatisticsConfig(): ",
        " statisticsConfig " + JSON.stringify(props.statisticsConfig)
      );
      if (statisticsConfig.statisticsTypes !== undefined) {
        player.current.statisticsTypes = statisticsConfig.statisticsTypes;
      }
      if (statisticsConfig.statisticsUpdateInterval) {
        player.current.statisticsUpdateInterval =
          statisticsConfig.statisticsUpdateInterval;
      }
    }

    // commenting out thumbnail related docs and public facing api's
    /**
     * @function
     * @summary Fires when thumbnail available.
     */
    const onThumbnailAvailable = () => {
      logger.log(
        LOG_LEVEL.DEBUG,
        "OTVPlayer.web.tsx: onThumbnailAvailable(): ",
        "onThumbnailAvailable event triggered"
      );
      if (props.onThumbnailAvailable) {
        setTimeout(() => {
          props.onThumbnailAvailable({});
        }, 0);
      }
    };

    nativeProps = {
      onLoad: onLoad,
      onLoadedData: onLoadedData,
      onLoadStart: onLoadStart,
      onPlay: onPlay,
      onPlaying: onPlaying,
      onPaused: onPaused,
      onProgress: onProgress,
      onSeek: onSeek,
      onEnd: onEnd,
      onWaiting: onWaiting,
      onTracksChanged: onTracksChanged,
      onBitratesAvailable: onBitratesAvailable,
      onAudioTrackSelected: onAudioTrackSelected,
      onTextTrackSelected: onTextTrackSelected,
      onSelectedBitrateChanged: onSelectedBitrateChanged,
      onDownloadResChanged: onDownloadResChanged,
      onStopped: onStopped,
      onStatisticsUpdate: onStatisticsUpdate,
      // commenting out thumbnail related docs and public facing api's
      onThumbnailAvailable: onThumbnailAvailable,
      errorHandler: errorHandler.current,
    };

    return (
      <View
        nativeID={RN_VID_VIEW}
        focusable={false}
        pointerEvents={"none"}
        style={style}
      ></View>
    );
  }
);

OTVPlayer.displayName = "OTVPlayer";
/**
 * The OTVSDK class
 */
export const OTVSDK = new OTVSDKManager();

export default OTVPlayer;
