// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import {
  OnLoadStartEvent,
  OnLoadEvent,
  OnLoadedDataEvent,
  OTVPlayerProps,
  OnLoadParam,
  OnTracksChangedParam,
  AudioMediaTrack,
  TextMediaTrack,
  TextTrack,
  OnSelectedBitrateChangedEvent,
  OnSelectedBitrateChangedParam,
  OnDownloadResChangedEvent,
  OnDownloadResChangedParam,
  OnAudioTrackSelectedParam,
  OnTextTrackSelectedParam,
} from "../OTVPlayer.d";

import {
  OTVSDK_LOGLEVEL as LOG_LEVEL,
  AUDIO_ENCODING_TYPE,
  TEXT_ENCODING_TYPE,
} from "../common/enums";

import {
  OIPFVideoRef,
  BroadcastPlayStates,
  OIPFConfigRef,
  OipfComponentTypes,
  OIPFPlayerStates,
  ErrorCodeTypes,
  ErrorHandler,
  OIPFErrorParam,
  PluginErrorParam,
} from "./common/interface.d";
import { Logger } from "./../Logger";
import { PluginErrorCode, IPTV_ERRORS } from "./common/ErrorHandler";

let instance = null;

// Singleton Class
export default class Broadcast {
  _params: OTVPlayerProps;
  _bcSuperVisor: any;
  _playerState: OIPFPlayerStates;
  _oipfPlayerElement: HTMLElement;
  _oipfObjectFactoryRef: object;
  _logger: Logger = new Logger();
  _onLoadStart: OnLoadStartEvent;
  _onLoad: OnLoadEvent;
  _onLoadedData: OnLoadedDataEvent;
  _onSelectedBitrateChanged: OnSelectedBitrateChangedEvent;
  _onDownloadResChanged: OnDownloadResChangedEvent;
  videoRef: OIPFVideoRef;
  configRef: OIPFConfigRef;
  _vidViewElId: string;
  static readonly VID_OIPF_Elment_ID = "vidBroadcast";
  _errorHandler: ErrorHandler;
  _onStopped: Function;
  // prettier-ignore
  constructor(params) { //NOSONAR
    if (instance === null) {
      instance = this;
      instance._playerState = OIPFPlayerStates.INITIALISING;
      if (instance.isOIPFSupported()) {
        this._logger.log(
          LOG_LEVEL.DEBUG,
          "Broadcast.ts: constructor(): ",
          "OIPF supported platform"
        );
        let bodyElement = document.getElementsByTagName("body")[0];
        let firstChildNode = bodyElement.firstElementChild;

        instance._oipfObjectFactoryRef = window.oipfObjectFactory;

        instance.videoRef =
          instance._oipfObjectFactoryRef.createVideoBroadcastObject();
        if (instance.videoRef) {
          this._logger.log(
            LOG_LEVEL.DEBUG,
            "Broadcast.ts: constructor(): ",
            "video/Broadcast object created successfully"
          );
          instance.videoRef.id = "vidBroadcast";
          //fullscreen has to be false to apply dynamic width and height otherwise custom width and height will be neglected
          instance.videoRef.fullScreen = false;
          //TO-DO: Need to check for the initial screen size required for parent player div
          // instance.videoRef.style.top = "0";
          // instance.videoRef.style.left = "0";
          // instance.videoRef.style.width = "100vw";
          // instance.videoRef.style.height = "100vh";
          // instance.videoRef.style.display = "block";
          // instance.videoRef.style.position = "absolute";

          instance.videoRef.style.width = 0;
          instance.videoRef.style.height = 0;
          instance.videoRef.style.display = "block";

          // TO DO: Until the resizeMode prop is implemented
          // set the object-fit to fill the entire size of the parent
          instance.videoRef.style.objectFit = "fill";
        } else {
          this._logger.log(
            LOG_LEVEL.ERROR,
            "Broadcast.ts: constructor(): ",
            "video/Broadcast object creation failed"
          );
          //OIPF platform not supported
          instance.videoRef = null;
          let errorObj: PluginErrorParam = {
            errorCode: PluginErrorCode.VIDEO_OBJ_CREATION_FAILED,
            errorMessage: IPTV_ERRORS.VideoObjCreationFailed,
          };
          this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
          return null;
        }

        if (firstChildNode) {
          //attaching the container as a second element in the body tag always
          firstChildNode.insertAdjacentElement("afterend", instance.videoRef);
        } else {
          //if no elements are present make it first element - unlikely to happen
          bodyElement.prepend(instance.videoRef);
        }

        try {
          instance.configRef =
            instance._oipfObjectFactoryRef.createConfigurationObject();
        } catch (error) {
          this._logger.log(
            LOG_LEVEL.ERROR,
            "Broadcast.ts: constructor(): ",
            "configuration object creation failed",
            "error name: " + error.name + " - error message: " + error.message
          );
          instance.configRef = null;
          let errorObj: PluginErrorParam = {
            errorCode: PluginErrorCode.CONFIG_OBJ_CREATION_FAILED,
            errorMessage: error.message || IPTV_ERRORS.ConfigObjCreationFailed,
          };
          this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
          return null;
        }

        instance._bcSuperVisor = instance.videoRef
          .getChannelConfig()
          .getBroadcastSupervisor();

        // SAMSUNG HACK FOR STOPPING RESET TIMER
        instance._bcSuperVisor.setChannel(null);

        // Resetting preferred subtitle language
        instance.configRef.configuration.preferredSubtitleLanguage = ",";

        // Switch off text track as it is getting enabled by default
        // on every channel change
        instance._bcSuperVisor &&
          instance._bcSuperVisor.unselectComponent(
            OipfComponentTypes.COMPONENT_TYPE_SUBTITLE
          );
      } else {
        this._logger.log(
          LOG_LEVEL.ERROR,
          "Broadcast.ts: constructor(): ",
          "Platform doesn't support OIPF capabilities"
        );
        let errorObj: PluginErrorParam = {
          errorCode: PluginErrorCode.OIPF_NOT_SUPPORTED,
          errorMessage: IPTV_ERRORS.OipfNotSupported,
        };
        this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
        return null;
      }
    }

    instance._playerState = OIPFPlayerStates.INITIALISED;
    instance._params = params;
    instance._onLoadStart = params.onLoadStart;
    instance._onLoad = params.onLoad;
    instance._onLoadedData = params.onLoadedData;
    instance._errorHandler = params.errorHandler;
    instance._onSelectedBitrateChanged = params.onSelectedBitrateChanged;
    instance._onDownloadResChanged = params.onDownloadResChanged;
    instance._onStopped = params.onStopped;
    return instance;
  }

  isOIPFSupported = () => {
    return window.oipfObjectFactory ? true : false;
  };

  /**
   * @function
   * @summary Fires when the browser starts looking for the video.
   * @param {Object} event
   */
  onLoadStart = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts: onLoadStart(): ",
      "onLoadStart triggered"
    );
    let event = {
      src: this._params.source.src,
      type: this._params.source.type,
    };
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts: onLoadStart(): ",
      "onLoadStart triggered",
      JSON.stringify(event)
    );
    if (this._playerState !== OIPFPlayerStates.INITIALISING) {
      if (this._onLoadStart) {
        this._onLoadStart(event);
      }
    }
  };

  /**
   * @function
   * @summary Fires when the browser has loaded the current frame of the audio/video.
   * @param {Object} event
   */
  // prettier-ignore
  onLoad = (currentChannel: string) => {//NOSONAR
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts: onLoad(): ",
      "channel successfully tuned",
      JSON.stringify(currentChannel)
    );
    let event: OnLoadParam = {
      duration: 100,
      naturalSize: {
        height: 1080,
        width: 1920,
      },
    };

    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts: onLoad(): ",
      "onLoad triggered",
      JSON.stringify(event)
    );

    if (this._playerState !== OIPFPlayerStates.INITIALISING) {
      //updating state on content load
      this._playerState = OIPFPlayerStates.LOADED;

      if (this._onLoad) {
        this._onLoad(event);
      }

      let avEvent: OnTracksChangedParam,
        audioTracks: AudioMediaTrack[] = [],
        textTracks: TextMediaTrack[] = [];

      // Get All Audio Components
      let audioComponent = this._bcSuperVisor.getComponents(
        OipfComponentTypes.COMPONENT_TYPE_AUDIO
      );

      // Get All Text Components
      let textComponent = this._bcSuperVisor.getComponents(
        OipfComponentTypes.COMPONENT_TYPE_SUBTITLE
      );

      if (this._params.onTracksChanged) {
        for (const _audioTrack of audioComponent) {
          let audioObj = {
            language: _audioTrack.language,
            // title field is not available in case of broadcast, hence
            // mapping language code as title
            title: _audioTrack.language,
            // encodeType metadata not available yet, so setting to default UNKNOWN
            encodeType: AUDIO_ENCODING_TYPE.UNKNOWN,
          };
          audioTracks.push(audioObj);
        }
        for (const _textTrack of textComponent) {
          let textObj = {
            language: _textTrack.language,
            // title field is not available in case of broadcast, hence
            // mapping language code as title
            title: _textTrack.language,
            // encodeType metadata not available yet, so setting to default UNKNOWN
            encodeType: TEXT_ENCODING_TYPE.UNKNOWN,
            //Empty list as no characteristics info could be extracted from the textComponent.
            characteristics: [],
          };
          textTracks.push(textObj);
        }

        if (audioTracks && textTracks) {
          avEvent = {
            audioTracks: audioTracks,
            textTracks: textTracks,
          };
        } else {
          avEvent = {
            audioTracks: audioTracks,
            textTracks: [],
          };
        }

        // TODO : Why OIPF doesnt provide tracks updated event
        this._params.onTracksChanged(avEvent);
      }

      if (this._params.onAudioTrackSelected) {
        let currentActiveAudioComponent =
          this._bcSuperVisor.getCurrentActiveComponents(
            OipfComponentTypes.COMPONENT_TYPE_AUDIO
          );

        for (let index = 0; index < audioComponent.length; index++) {
          if (
            currentActiveAudioComponent[0].pid === audioComponent[index].pid
          ) {
            let eventObj: OnAudioTrackSelectedParam = {
              index,
            };
            this._params.onAudioTrackSelected(eventObj);
            break;
          }
        }
      }
    }
  };

  /**
   * @function
   * @summary Called on change in the playState to presenting.
   */
  onLoadedData = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts: onLoadedData(): ",
      "onLoadedData called"
    );
    this._playerState = OIPFPlayerStates.PLAYING;
    if (this._onLoadedData) {
      this._onLoadedData();
    }
  };

  /**
   * @function onChannelChangeFailure
   * @summary Callback triggered when there is a failure
   *          during channel change
   * @param { OIPFErrorParam } error
   */
  onChannelChangeFailure = (error: OIPFErrorParam) => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts: onChannelChangeFailure(): ",
      "onChannelChangeFailure triggered :: error :: ",
      JSON.stringify(error)
    );

    error.errorCode = error.errorState;
    this._playerState = OIPFPlayerStates.ERROR;
    this._errorHandler.triggerError(ErrorCodeTypes.IPTV, error);
  };

  /**
   * @function
   * @summary Fires on change in the playState.
   * @param {Object} event
   */
  private onPlayStateChange = (playState) => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts: onPlayStateChange(): ",
      "onPlayStateChange triggered :: ",
      JSON.stringify(playState)
    );
    switch (playState) {
      case BroadcastPlayStates.UNREALIZED:
        // TO DO
        this._playerState = OIPFPlayerStates.UNREALIZED;
        break;
      case BroadcastPlayStates.CONNECTING:
        this.onWaiting();
        break;
      case BroadcastPlayStates.PRESENTING:
        this.onPlaying();
        break;
      case BroadcastPlayStates.STOPPED:
        // TO DO: handling of the cases when the terminal is not presenting media.
        this._playerState = OIPFPlayerStates.STOPPED;
        break;
      default:
        break;
      //TO DO handling of the error cases.
    }
  };

  /**
   * @function
   * @summary Called on change in the playState to connecting.
   */
  private onWaiting = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts: onWaiting(): ",
      "onWaiting called"
    );
    this._playerState = OIPFPlayerStates.WAITING;
    if (this._params.onWaiting) {
      this._params.onWaiting();
    }
  };

  /**
   * @function
   * @summary Called on change in the playState to presenting.
   */
  private onPlaying = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts: onPlaying(): ",
      "onPlaying called"
    );
    this._playerState = OIPFPlayerStates.PLAYING;
    if (this._params.onPlaying) {
      this._params.onPlaying();
    }
  };

  /**
   * @function
   * @summary fired when the bitrate being rendered changes.
   * @param bitrate
   */
  //TODO Need to check type defination for birate
  //TODO: Need to revisit for IPTV
  onSelectedBitrateChanged = (bitrate: any) => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts: onSelectedBitrateChanged(): ",
      "onSelectedBitrateChanged called"
    );
    if (this._onSelectedBitrateChanged) {
      let event: OnSelectedBitrateChangedParam = {
        bitrate: bitrate,
      };
      this._onSelectedBitrateChanged(event);
    }
  };

  /**
   * @function
   * @summary Fires when the resolution gets changed
   */
  //TODO Need to check type defination for birate
  //TODO: Need to revisit for IPTV
  onDownloadResChanged = (resolution: any) => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts: onDownloadResChanged(): ",
      "onDownloadResChanged called",
      resolution
    );
    if (this._onDownloadResChanged) {
      let event: OnDownloadResChangedParam = {
        width: 0,
        height: 0,
      };
      this._onDownloadResChanged(event);
    }
  };

  /**
   * @function
   * @summary
   * @param
   */

  connectPlayerNode = (elementId: string) => {
    if (!elementId) {
      this._logger.log(
        LOG_LEVEL.ERROR,
        "Broadcast.ts: connectPlayerNode(): ",
        "Invalid elementId passed"
      );

      return;
    }

    let vidViewEl = document.getElementById(elementId);
    if (!vidViewEl) {
      this._logger.log(
        LOG_LEVEL.ERROR,
        "Broadcast.ts: connectPlayerNode(): ",
        "Invalid elementId does not exist",
        elementId
      );
      return;
    }

    // move the OIPF created DOM tree into RN View
    // @ts-ignore
    vidViewEl.appendChild(this.videoRef);

    // take width and height of the parent RN View
    this.videoRef.style.width = "inherit";
    this.videoRef.style.height = "inherit";
  };

  /**
   * @function
   * @summary
   * @param
   */
  disconnectPlayerNode = () => {
    // Remove the OIPF HTML Vid collection from RN View
    // and add it back into main body
    this.videoRef.style.width = 0;
    this.videoRef.style.height = 0;

    // @ts-ignore
    //document.body.appendChild(this.videoRef);
    document.body.insertBefore(this.videoRef, document.body.firstElementChild);
  };

  /**
   * @function
   * @summary
   * @param
   */
  // prettier-ignore
  onSelectedComponentChanged = (componentType: OipfComponentTypes) => { //NOSONAR
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts: onSelectedComponentChanged(): ",
      JSON.stringify(componentType)
    );

    // Usecase : If more than one component type has changed,
    // componentType argument will take the value "undefined".
    if (
      componentType === OipfComponentTypes.COMPONENT_TYPE_AUDIO ||
      componentType === OipfComponentTypes.COMPONENT_TYPE_ALL ||
      componentType === undefined
    ) {
      // Get All Audio Components
      let audioComponents = this._bcSuperVisor.getComponents(
        OipfComponentTypes.COMPONENT_TYPE_AUDIO
      );

      // Get Current Active Audio Component
      let currentActiveAudioComponent =
        this._bcSuperVisor.getCurrentActiveComponents(
          OipfComponentTypes.COMPONENT_TYPE_AUDIO
        );

      // get index of active audio component
      for (let index = 0; index < audioComponents.length; index++) {
        if (audioComponents[index].pid === currentActiveAudioComponent[0].pid) {
          let eventObj: OnAudioTrackSelectedParam = {
            index,
          };
          this._params.onAudioTrackSelected &&
            this._params.onAudioTrackSelected(eventObj);
          break;
        }
      }
    }

    // Handling Subtitle component change
    if (
      componentType === OipfComponentTypes.COMPONENT_TYPE_SUBTITLE ||
      componentType === OipfComponentTypes.COMPONENT_TYPE_ALL ||
      componentType === undefined
    ) {
      // Get All Text Components
      let textComponents = this._bcSuperVisor.getComponents(
        OipfComponentTypes.COMPONENT_TYPE_SUBTITLE
      );

      // Get Current Active Text Component
      let currentActiveTextComponent =
        this._bcSuperVisor.getCurrentActiveComponents(
          OipfComponentTypes.COMPONENT_TYPE_SUBTITLE
        );

      // get index of active text component
      for (let index = 0; index < textComponents.length; index++) {
        if (textComponents[index].pid === currentActiveTextComponent[0].pid) {
          let eventObj: OnTextTrackSelectedParam = {
            index,
          };
          this._params.onTextTrackSelected &&
            this._params.onTextTrackSelected(eventObj);
          break;
        }
      }
    }
  };

  public set maxBitrate(_bitrate: number) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: set maxBitrate with Type:" + _bitrate);
  }

  public set onLicenseRequest(value: any) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts: set onLicenseRequest" + value);
  }

  /**
   * @fuction selectAudioTrack
   * @summary Function to set the audio track
   * @param index
   */
  selectAudioTrack = (index: number) => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts:: selectAudioTrack(): ",
      "selectAudioTrack called"
    );

    // Get All Audio Components
    let audioComponents = this._bcSuperVisor.getComponents(
      OipfComponentTypes.COMPONENT_TYPE_AUDIO
    );

    // Handling incorrect index
    if (index >= audioComponents.length || index < 0) {
      this._logger.log(
        LOG_LEVEL.WARNING,
        "Broadcast.ts:: selectAudioTrack(): ",
        "Index more than length of available audio tracks"
      );
      let errorObj: PluginErrorParam = {
        errorCode: PluginErrorCode.INVALID_AUDIO_TRACK_INDEX,
        errorMessage: IPTV_ERRORS.InvalidAudioTrackIndex,
      };
      this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
      return;
    }

    let currentActiveAudioComponent =
      this._bcSuperVisor.getCurrentActiveComponents(
        OipfComponentTypes.COMPONENT_TYPE_AUDIO
      );
    let userSelectedAudioTrackPid: string = audioComponents[index].pid;

    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts:: selectAudioTrack(): ",
      "currentActiveAudioComponentPid " + currentActiveAudioComponent[0].pid,
      "userSelectedAudioTrackPid " + userSelectedAudioTrackPid
    );

    if (currentActiveAudioComponent[0].pid !== userSelectedAudioTrackPid) {
      this._bcSuperVisor.selectComponent(audioComponents[index]);
    } else {
      this._logger.log(
        LOG_LEVEL.DEBUG,
        "Broadcast.ts:: selectAudioTrack(): ",
        "INDEX same as currently playing audio language index"
      );
    }
  };

  /**
   * @function selectTextTrack
   * @summary Function to set the text track
   * @param index
   */
  selectTextTrack = (index: number) => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts:: selectTextTrack(): ",
      "selectTextTrack called"
    );

    // Get All Text Components
    let textComponents = this._bcSuperVisor.getComponents(
      OipfComponentTypes.COMPONENT_TYPE_SUBTITLE
    );

    // Usecase : No Texttrack found
    if (textComponents && textComponents.length === 0) {
      this._logger.log(
        LOG_LEVEL.DEBUG,
        "Broadcast.ts:: selectTextTrack(): ",
        "No text track found !!!"
      );
      let errorObj: PluginErrorParam = {
        errorCode: PluginErrorCode.NO_TEXT_TRACK_AVAILABLE,
        errorMessage: IPTV_ERRORS.NoTextTrackAvailable,
      };
      this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
      return;
    }

    // Get Current Active Text Component
    let currentActiveTextComponent =
      this._bcSuperVisor.getCurrentActiveComponents(
        OipfComponentTypes.COMPONENT_TYPE_SUBTITLE
      );

    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts: selectTextTrack(): ",
      "currentActiveTextComponent ",
      JSON.stringify(currentActiveTextComponent)
    );

    // Usecase : Switching off captions
    if (index === -1) {
      if (
        currentActiveTextComponent &&
        currentActiveTextComponent.length !== 0
      ) {
        // subtitlesEnabled flag in configuration if not set to FALSE
        // the subtitles will continue to  be visible even after unselectComponent()
        // is invoked
        this._logger.log(
          LOG_LEVEL.DEBUG,
          "Broadcast.ts:: selectTextTrack(): ",
          "Removing 1st text track on channel change"
        );
        this.configRef.configuration.subtitlesEnabled = false;
        this._bcSuperVisor.unselectComponent(currentActiveTextComponent[0]);
      } else {
        this._logger.log(
          LOG_LEVEL.WARNING,
          "Broadcast.ts: selectTextTrack(): ",
          "text track is already in OFF state"
        );
        let errorObj: PluginErrorParam = {
          errorCode: PluginErrorCode.TEXT_TRACK_ALREADY_OFF,
          errorMessage: IPTV_ERRORS.TextTrackAlreadyOff,
        };
        this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
      }
      return;
    }

    // Usecase : Handling incorrect index ( out of bound )
    // -1 ---- Index representing OFF state
    // 0 to (totalTracks -1) ---> Valid Index
    if (index >= textComponents.length || index < -1) {
      this._logger.log(
        LOG_LEVEL.WARNING,
        "Broadcast.ts:: selectTextTrack(): ",
        "Index more than length of available text tracks"
      );
      let errorObj: PluginErrorParam = {
        errorCode: PluginErrorCode.INVALID_TEXT_TRACK_INDEX,
        errorMessage: IPTV_ERRORS.InvalidTextTrackIndex,
      };
      this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
      return;
    }

    let userSelectedTextTrackPid: string = textComponents[index].pid;

    // Usecase : 1st time subtitle track is selected
    if (
      currentActiveTextComponent === undefined ||
      (currentActiveTextComponent && currentActiveTextComponent.length === 0)
    ) {
      // subtitlesEnabled flag in configuration if not set to TRUE
      // the subtitles will not be visible even after selectComponent() is invoked
      this.configRef.configuration.subtitlesEnabled = true;
      this._bcSuperVisor.selectComponent(textComponents[index]);
      return;
    }

    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts:: selectTextTrack(): ",
      "currentActiveTextComponentPid " + currentActiveTextComponent[0].pid,
      "userSelectedTextTrackPid " + userSelectedTextTrackPid
    );

    // Change the track only if the Pid of userSelected track is different
    // from the currently playing track
    if (currentActiveTextComponent[0].pid !== userSelectedTextTrackPid) {
      // subtitlesEnabled flag in configuration if not set to TRUE
      // the subtitles will not be visible even after selectComponent() is invoked
      this.configRef.configuration.subtitlesEnabled = true;
      this._bcSuperVisor.selectComponent(textComponents[index]);
    } else {
      this._logger.log(
        LOG_LEVEL.DEBUG,
        "Broadcast.ts:: selectTextTrack(): ",
        "New Index is same as currently selected index. So NOT changing text track"
      );
    }
  };

  /**
   * @function addTextTracks
   * @summary To add sideloaded text tracks.
   * @param
   */
  addTextTracks = (textTracks: TextTrack[]) => {
    // TO DO: Add functionality
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts: addTextTracks(): ",
      JSON.stringify(textTracks)
    );
  };

  /**
   * @function onStopped
   * @summary  Fires when stop api called.
   */
  onStopped = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "Broadcast.ts: onStopped(): onStopped event getting triggered"
    );
    if (this._onStopped) {
      this._onStopped();
    }
  };

  /**
   * @function
   * @summary
   * @param
   */
  _registerEventListeners = () => {
    //add all event listener
    this._bcSuperVisor.addEventListener("ChannelChangeSucceeded", this.onLoad);
    this._bcSuperVisor.addEventListener(
      "ChannelChangeError",
      this.onChannelChangeFailure
    );
    this._bcSuperVisor.addEventListener(
      "PlayStateChange",
      this.onPlayStateChange
    );
    this._bcSuperVisor.onSelectedComponentChanged =
      this.onSelectedComponentChanged;
  };

  /**
   * @function
   * @summary
   * @param
   */
  _unregisterEventListeners = () => {
    //remove all event listener
    this._bcSuperVisor.removeEventListener(
      "ChannelChangeSucceeded",
      this.onLoad
    );
    this._bcSuperVisor.removeEventListener(
      "ChannelChangeError",
      this.onChannelChangeFailure
    );
    this._bcSuperVisor.removeEventListener(
      "PlayStateChange",
      this.onPlayStateChange
    );
    this._bcSuperVisor.onSelectedComponentChanged = null;
  };
}
