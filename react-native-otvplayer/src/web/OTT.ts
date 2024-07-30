// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import {
  OttPlayerProps,
  OTTPlayerStates,
  DRMStates,
  OTTMimeTypes,
  OttPlayerSource,
  EncryptionTypes,
  PlayerSource,
  ShakaErrorParam,
  ErrorCodeTypes,
  PluginErrorParam,
  ContentInformation,
  PlatformTypes,
  StatisticsInformation,
  LicenseMsgTypes,
} from "./common/interface";
import otvplayer from "./NMPWebPlayer";
import PlayerException from "./common/PlayerException";
import { OTTHelper } from "./OTTHelper";
import { DRM } from "./DRM";
import {
  OnLoadEvent,
  OnLoadStartEvent,
  OnProgressEvent,
  OnSeekEvent,
  OnLoadParam,
  OnProgressParam,
  OnLoadStartParam,
  OnSeekParam,
  OnTracksChangedParam,
  AudioMediaTrack,
  TextMediaTrack,
  TextTrack,
  SideLoadedTextTrack,
  Resolution,
  OnBitratesAvailableParam,
  OnSelectedBitrateChangedParam,
  OnSelectedBitrateChangedEvent,
  OnDownloadResChangedEvent,
  OnDownloadResChangedParam,
  OnLoadedDataEvent,
  OnAudioTrackSelectedParam,
  OnTextTrackSelectedParam,
  OnStatisticsUpdateEvent,
  OnLicenseRequest,
  Source,
  ThumbnailType,
  OnAudioTrackSelectedEvent,
} from "./../OTVPlayer.d";

import {
  OTVSDK_LOGLEVEL as LOG_LEVEL,
  STATISTICS_TYPES,
  DRMTypes,
  AUDIO_ENCODING_TYPE,
  TEXT_ENCODING_TYPE,
} from "../common/enums";

import { Logger } from "./../Logger";
import { PluginErrorCode, ErrorHandler } from "./common/ErrorHandler";

import Thumbnail from './ThumbnailHelper';

export enum OTTResetTypes {
  RESET_FOR_SRC_CHANGE = 0,
  RESET_FOR_STOP = 1,
  RESET_FOR_UNMOUNT_OR_TYPE_CHANGE = 2
};

// define global OTT instance object
let instance: OTT = null;

export class OTT implements OttPlayerProps {
  // define const value
  static readonly CERTIFICATE_PAYLOAD_LENGTH: number = 100;
  static readonly DEFAULT_PROGRESS_INTERVAL: number = 250;
  static readonly DEFAULT_STATISTICS_INTERVAL: number = 0;
  static readonly MS_IN_SECONDS: number = 1000;
  static readonly VID_SDK_ELEMENT_ID = "vid-sdk";
  static readonly SDK_ROOT_ELEMENT_ID = "opy-videowindow"; // WARNING: Hack, root element only found out after debugging
  // WARNING: Used as a workaround to keep only necessary DOM used by OTVPlayer
  static readonly VIDEO_TAG_ID = OTT.VID_SDK_ELEMENT_ID + "_shaka_api"; // WARNING: Hack, postfix found after debugging
  static readonly TIME_DECIMAL_LIMIT: number = 1000; // 1000 for 3 decimal places
  static readonly SHAKA_LOAD_INTERRUPTED: number = 7000; // VIDEOJS: ERROR: (CODE:0 MEDIA_ERR_CUSTOM) 7000 - Shaka Error PLAYER.LOAD_INTERRUPTED () error code

  //public property and methods
  public _onLoadStart: OnLoadStartEvent;
  public _onLoad: OnLoadEvent;
  public _onLoadedData: OnLoadedDataEvent;
  public _onPlay: Function;
  public _onPlaying: () => void;
  public _paused: () => void;
  public _onEnd: Function;
  public _onWaiting: Function;
  public _statisticsInterval: number;
  public _onProgress: OnProgressEvent;
  public _onSeek: OnSeekEvent;
  public _onSelectedBitrateChanged?: OnSelectedBitrateChangedEvent;
  public _onDownloadResChanged?: OnDownloadResChangedEvent;
  public _onThumbnailAvailable?: () => void;
  public _onStopped: () => void;
  public _onStatisticsUpdate: OnStatisticsUpdateEvent;
  public _statisticTypeInfo?: number;

  private _playerInstance: otvplayer;
  private _playerState: OTTPlayerStates = OTTPlayerStates.UNINITIALISED;
  private _drm: DRM;
  private _vidSdkHtmlElement: HTMLElement;
  private _pendingTextTracks: TextTrack[];
  private _autoPlay: boolean;
  private _isInitialAudioTrackSelectedSent: boolean;
  private _volume: number;
  private _progressInterval: number;
  private _sourceSet: PlayerSource;
  private _requestedSeekPos: number;
  private _maxResolution: Resolution;

  private _progressEvtTimerID: ReturnType<typeof setTimeout>;
  private _statisticsEvtTimerID: ReturnType<typeof setTimeout>;

  private _prevProgressTime: number;
  private _prevStatisticsTime: number;
  private _logger: Logger = new Logger();
  private _muted: boolean;
  private _vidViewElId: string;

  private _onTracksChanged?: Function;
  private _onBitratesAvailable?: Function;
  private _onAudioTrackSelected?: Function;
  private _onTextTrackSelected?: Function;
  private _errorHandler: ErrorHandler;

  private thumbnailClass: Thumbnail = new Thumbnail();
  private _onLicenseRequest?: OnLicenseRequest;
  private _thumbnail: ThumbnailType;
  private _onLoaded: boolean = false;

  private _setupCompleted: boolean = false;

  /**
   * @function
   * @summary
   * @param
   */
  constructor(params, properties) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: constructor():",
      "constructor triggered"
    );
    // singleton
    if (instance === null) {
      this._initializeInstance(properties);
    }
    // setup player instance
    this._configInstance(params, properties);
    return instance;
  }

  private _initializeInstance = (properties) => {
    instance = this;
    this._updateState(OTTPlayerStates.INITIALISING);

    // Update dynamic div creation logic after ticket is concluded
    // create div to pass to SDK
    // TO DO: Add a check if the App has already added an element with the same id, and throw error
    // TO DO: check why instance._vidSdkHtmlElement starts pointing to OTT.VID_SDK_ELEMENT_ID+'_html5_api'
    // after the otvplayer initializes successfully!!

    let sdkHtmlElement = document.createElement("div");
    if (sdkHtmlElement) {
      sdkHtmlElement.setAttribute("id", OTT.VID_SDK_ELEMENT_ID);
      // WARNING: Workaround to override the width and height values set by videojs
      sdkHtmlElement.style["width"] = "inherit";
      sdkHtmlElement.style["height"] = "inherit";
      sdkHtmlElement.style.display = "block";
      if (OTTHelper.isCurrentPlatform(PlatformTypes.PC_SAFARI)) {
        sdkHtmlElement.setAttribute("playsInline", "true");
      }
      instance._vidSdkHtmlElement = sdkHtmlElement;

      // The videojs (specifically seek feature) requires a video tag already created
      // otherwise seek operation results in a typeerror for play() API
      let vidTag = document.createElement("video");
      // Attributes taken from example code of SDK
      vidTag.id = "videoPlayer";
      vidTag.className = "video-js vjs-default-skin vjs-16-9";
      vidTag.controls = false;
      vidTag.crossOrigin = "anonymous";

      // Add this as first child to the sdk tag
      instance._vidSdkHtmlElement.prepend(vidTag);

      // Add sdk as first child to the body tag
      let bodyElement = document.getElementsByTagName("body")[0];
      bodyElement.prepend(instance._vidSdkHtmlElement);
    }

    // Initialize DRM
    instance._drm = new DRM(this.onDrmStateChanged);

    instance._playerInstance = OTTHelper.initialiseSDKPlayer(
      instance._vidSdkHtmlElement,
      instance.initialiseSDKPlayerSuccessCallback,
      instance.initialiseSDKPlayerFailureCallback,
      instance.licenseRetrievalCallback,
      instance._certificateRetrievalCallback,
      typeof (properties.onLicenseRequest) === 'function' ? true : false
    );
  }

  private _configInstance = (params, properties) => {
    // These need to be updated with every request?
    instance._onLoadStart = params.onLoadStart;
    instance._onLoad = params.onLoad;
    instance._onLoadedData = params.onLoadedData;
    instance._onPlay = params.onPlay;
    instance._onPlaying = params.onPlaying;
    instance._paused = params.onPaused;
    instance._progressInterval = OTT.DEFAULT_PROGRESS_INTERVAL;
    instance._statisticsInterval = OTT.DEFAULT_STATISTICS_INTERVAL;
    instance._onProgress = params.onProgress;
    instance._onSeek = params.onSeek;
    instance._sourceSet = params.source;
    instance._autoPlay = properties.autoplay;
    instance._progressEvtTimerID = null;
    instance._statisticsEvtTimerID = null;
    instance._requestedSeekPos = null;
    instance._onEnd = params.onEnd;
    instance._onWaiting = params.onWaiting;
    instance._muted = properties.muted;
    instance._maxResolution = properties.maxResolution;
    instance._onBitratesAvailable = params.onBitratesAvailable;
    instance._onTracksChanged = params.onTracksChanged;
    instance._onAudioTrackSelected = params.onAudioTrackSelected;
    instance._onTextTrackSelected = params.onTextTrackSelected;
    instance._errorHandler = params.errorHandler;
    instance._onSelectedBitrateChanged = params.onSelectedBitrateChanged;
    instance._onDownloadResChanged = params.onDownloadResChanged;
    instance._onStopped = params.onStopped;
    instance._isInitialAudioTrackSelectedSent = false;
    instance._onStatisticsUpdate = params.onStatisticsUpdate;
    instance._thumbnail = properties.thumbnail
    instance._onThumbnailAvailable = params.onThumbnailAvailable;
  }

  /**
   * @function
   * @summary
   * @param
   */
  public initialiseSDKPlayerSuccessCallback = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: initialiseSDKPlayerSuccessCallback(): ",
      "initialiseSDKPlayerSuccessCallback triggered"
    );

    // If the player already encountered an error occured before the SDK inititalized
    // Do not change state and do not set the source into player
    if (this._playerState === OTTPlayerStates.ERROR) {
      this._logger.log(
        LOG_LEVEL.DEBUG,
        "OTT.ts: initialiseSDKPlayerSuccessCallback(): ",
        "Player in state: ",
        JSON.stringify(this._playerState)
      );

      // Only setup thumbnail object and HTML
      this.thumbnailClass.initialiseThumbnailClass(this._playerInstance, this._errorHandler);
      this.thumbnailClass.createThumbnailContainerAndAttach(OTT.VID_SDK_ELEMENT_ID);

      return;
    }

    this._updateState(OTTPlayerStates.INITIALISED);

    //Check and move the OTT sdk created DOM tree into RN View
    let sdkVidRootElement = document.getElementsByClassName(
      OTT.SDK_ROOT_ELEMENT_ID
    ) as HTMLCollectionOf<HTMLElement>;
    let vidViewEl = document.getElementById(this._vidViewElId);

    if (sdkVidRootElement[0]) {
      // setup base styles to inherit from parent
      sdkVidRootElement[0].style.width = "inherit";
      sdkVidRootElement[0].style.height = "inherit";

      // move it under RN View
      if (vidViewEl) {
        vidViewEl.appendChild(sdkVidRootElement[0]);

        // Enable video display
        sdkVidRootElement[0].style.display = "block";
      }
    }

    /* Note:There is problem while creating vid-sdk element in the constructor.
      Instead of creating element with ID "vid-sdk", it is creating id as "vid-sdk_html5_api".
      So even if we attach child node to vid-sdk element in constructor, it is not accepting.
      "vid-sdk" is kept in the DOM tree by otvplayer() function.
      So we add thumbnailContainer after the otvplayer() is called */

    this.thumbnailClass.initialiseThumbnailClass(this._playerInstance, this._errorHandler);
    this.thumbnailClass.createThumbnailContainerAndAttach(OTT.VID_SDK_ELEMENT_ID);

    // Setup player listerners
    this.setup();

    // Set source property now if source has been provided
    if (this._sourceSet) {
      this.source = this._sourceSet;
    }

    if (this._thumbnail) {
      this.thumbnailClass.setThumbnailProperties(this._thumbnail, this._playerState);
    }
  };

  public onDrmStateChanged = (state: DRMStates, source: PlayerSource, error: PluginErrorParam) => {
    let errorMessage = error ? ",error: " + JSON.stringify(error) : "";
    this._logger.log(LOG_LEVEL.DEBUG, "OTT: onDrmStateChange, state:  ", OTTHelper.getDRMStateString(state),
      ", source: ", JSON.stringify(source), errorMessage);
    if (state === DRMStates.ERROR && error) {
      // report DRM errors from DRM module to application
      // send the error message to application in a promise
      // to avoid event dead loop.
      const eventPromise = new Promise((resolve) => {
        this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, error);
        resolve(true);
      });
      eventPromise.then(() => {
        this._logger.log(LOG_LEVEL.INFO, "OTT: onDrmStateChange: send error message to App: ", errorMessage);
      });
    }
  };


  /**
   * @function
   * @summary
   * @param
   */
  public initialiseSDKPlayerFailureCallback = () => {
    this._logger.log(
      LOG_LEVEL.ERROR,
      "OTT.ts: initialiseSDKPlayerFailureCallback(): ",
      "initialiseSDKPlayerFailureCallback triggered"
    );
  };


  public _certificateRetrievalCallback = () => {
    const that = this;
    const source: Source = {
      preferredDRM: EncryptionTypes.FAIRPLAY,
      preferredPlayer: null,
      src: that._sourceSet?.src,
      token: null,
      tokenType: undefined,
      type: that._sourceSet?.type
    }
    if (that._onLicenseRequest) {
      // Callback mode
      //incase of fairplay, forwarding the certificate request to application
      //anticipating that the application will return certificate data similar
      //to widevine, params source and request_payload are set to null,
      //as the player is not sending it as params and also they are not being utilised
      //on application level for making a certificate request
      return new Promise((resolve, reject) => {
        const certReq = that._onLicenseRequest(EncryptionTypes.FAIRPLAY, source, null, LicenseMsgTypes.CERTIFICATE_REQUEST);
        certReq
          .then((res) => {
            that._logger.log(LOG_LEVEL.INFO, "OTT.ts: Entered certificateRetriever() onLicenseRequest promise resolved")
            resolve(res)
          })
          .catch((err) => {
            that._logger.log(LOG_LEVEL.ERROR, "OTT.ts: Entered certificateRetriever() onLicenseRequest promise rejected")
            reject(err);
          })
      })
    } else {
      return this._drm.certificateRetriever();
    }
  };

  /**
   * @function
   * @summary
   * @param
   */
  //
  // prettier-ignore
  public licenseRetrievalCallback = (
    keySystem,
    source,
    requestPayload,
    messageType
  ) => { //NOSONAR
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Entered licenseRetrievalCallback()"
    );

    if (instance._onLicenseRequest) {
      // License callback mode
      const that = this;
      if (this._sourceSet?.drm?.type === DRMTypes.WIDEVINE) {
        if (requestPayload.byteLength < OTT.CERTIFICATE_PAYLOAD_LENGTH) {
          messageType = LicenseMsgTypes.CERTIFICATE_REQUEST;
        }
      }
      return new Promise(function (resolve, reject) {
        let licenseReq = that._onLicenseRequest(keySystem, source, requestPayload, messageType);
        licenseReq.then((res) => {
          //uint8array is expected in response from application and set down to the player
          that._logger.log(LOG_LEVEL.INFO, "OTT.ts: Entered licenseRetrievalCallback() onLicenseRequest promise resolved")
          if (that._sourceSet?.src !== source.src) {
            licenseReq = null;
          } else {
            resolve(res)
          }
        }).catch((err) => {
          that._logger.log(LOG_LEVEL.ERROR, "OTT.ts: Entered licenseRetrievalCallback() onLicenseRequest promise rejected")
          if (that._sourceSet?.src !== source.src) {
            licenseReq = null;
          } else {
            reject(err);
          }
        })
      })

    } else {
      return this._drm.licenseRetriever(keySystem, source, requestPayload, messageType);
    }
  };

  set onLicenseRequest(value: OnLicenseRequest) {
    // reset DRM at first
    this._resetDRM();
    this._logger.log(LOG_LEVEL.INFO, "set new license request callback.");
    this._onLicenseRequest = value;
  }

  /**
   * @function
   * @summary
   * @param
   */
  set source(value: PlayerSource) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: source: ",
      "source set: ",
      JSON.stringify(value)
    );

    // Play is reset in ERROR state
    if (this._playerState === OTTPlayerStates.ERROR) {
      // In error state the SDK should be reset.
      this.reset(OTTResetTypes.RESET_FOR_SRC_CHANGE);
    }

    this._sourceSet = Object.assign({}, value);
    if (!this._isInitialized()) {
      this._logger.log(
        LOG_LEVEL.WARNING,
        "OTT.ts: source: ",
        "Operation not possible in player state: ",
        JSON.stringify(this._playerState)
      );
      // don't do anything
      return;
    }

    //updating state on src change
    this._updateState(OTTPlayerStates.PLAY_REQUESTED);
    this._isInitialAudioTrackSelectedSent = false;

    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: source: ",
      "player is ready: ",
      JSON.stringify(this._playerState)
    );

    //[OTVPL-3305] When source was being set before mute,it was not working. So,now content will be muted first and then the source will be set.
    //TO-DO: Mute State should not be handled in set source.
    //TO-DO: Mute sate should be handled only inside the muted setter.
    this._playerInstance.muted(this._muted);
    this.maxResolution = this._maxResolution;

    let ottSrc: OttPlayerSource;
    let drmType = this._sourceSet.drm?.type ? this._drm.getEncryptionType(this._sourceSet.drm?.type) : undefined;
    ottSrc = {
      src: this._sourceSet.src,
      type: this._sourceSet.type,
      token: this._sourceSet.token,
      tokenType: this._sourceSet.tokenType,
      preferredDRM: drmType,
    };

    this._logger.log(LOG_LEVEL.DEBUG, "OTT.ts: source: set source to Shaka SDK: ", JSON.stringify(ottSrc));

    // Setup default audio if provided by app
    if (this._sourceSet.preferredAudioLanguage) {
      this._playerInstance.otvtoolkit().configure("preferredAudioLanguage", this._sourceSet.preferredAudioLanguage);
      this._logger.log(LOG_LEVEL.DEBUG, "OTT.ts: preferredAudioLanguage: ", this._sourceSet.preferredAudioLanguage);
    } else {
      // let player decide the default audio
      this._playerInstance.otvtoolkit().configure("preferredAudioLanguage", "")
    }

    this._playerInstance.src(ottSrc);
    this._updateState(OTTPlayerStates.SOURCE_SET);
    // setting error listener in source  because the error listener is reset for each src changing,
    this._playerInstance.otvtoolkit().errorReporting.setErrorListener({
      errorChanged: this._sdkError,
    });

    //Warning added this check because of unregister of streamBitrateChanged and resolutionChanged is not working
    let shouldSetPlaybackListener =
      this._playerInstance.otvtoolkit()?.playbackStatistics
        ?.playbackListenerList?.listenerArray?.length === 0;

    if (shouldSetPlaybackListener) {
      this._playerInstance
        .otvtoolkit()
        ?.playbackStatistics?.addPlaybackListener({
          streamBitrateChanged: this.onSelectedBitrateChanged,
          resolutionChanged: this.onDownloadResChanged,
        });
    }
    this._playerInstance.volume(this._volume);
  }

  /**
   * @function token
   * @summary set content source token in async token mode.
   * @param token
   */
  set token(token: string) {
    this._logger.log(LOG_LEVEL.DEBUG, "OTT.ts: set async content token: ", token);
    if (this._sourceSet &&
      (this._sourceSet.token === null || this._sourceSet.token === undefined)) {
      this._sourceSet.token = token;
      // update source in DRM module.
      this._drm.setSource(this._sourceSet);
    } else {
      this._logger.log(LOG_LEVEL.WARNING, "OTT.ts: source has not been set or token has been set.");
    }
  }

  /**
   * @function
   * @summary
   * @param
   */
  set autoplay(value: boolean) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: autoplay: ",
      JSON.stringify(value)
    );
    // Chrome browser has autoplay issues.
    // To resolve, we do not set autoplay into SDK
    // and only use this value content is loaded
    this._autoPlay = value;
  }

  /**
   * @function volume
   * @summary sets volume level for the content
   * 0 - 1 is the range of volume
   * @param value
   */
  set volume(volumeLevel: number) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: volume: ",
      JSON.stringify(volumeLevel)
    );

    this._volume = volumeLevel;
    if (this._isInitialized()) {
      this._playerInstance.volume(this._volume);
    }
  }

  /**
   * @function muted
   * @summary sets mute status for the current playing media content
   * @param
   */
  set muted(muteStatus: boolean) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: muted: ",
      JSON.stringify(muteStatus)
    );

    this._muted = muteStatus;
    if (this._isInitialized()) {
      this._playerInstance.muted(this._muted);
    }
  }

  /**
   * @function SET :: maxResolution
   * @summary sets max resolution for the current playing media content
   * @param // { width: number, height: number }
   */
  set maxResolution(resolution: Resolution) {
    let unCapResolution: Resolution = {
      width: Infinity,
      height: Infinity,
    };
    let updateRes: boolean = true;

    if (resolution === null || resolution === undefined) {
      this._maxResolution = unCapResolution;
    } else {
      if (
        typeof resolution.width !== "number" ||
        typeof resolution.height !== "number"
      ) {
        let errorObj: PluginErrorParam = {
          errorCode: PluginErrorCode.INVALID_RESOLUTION_CHANGE_PARAMETER,
          errorMessage: "Invalid Resolution values for prop maxResolution",
        };
        this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
        updateRes = false;
      } else {
        // resolution values like negative, 0 and other values lesser than the stream adaptation set lowest video resolution
        // is considered by SDK as the lowest capping.
        // TODO: Adaptation set switching from HD to UHD is not working as because of browser supports only HD.
        this._maxResolution = resolution;
      }
    }

    if (this._maxResolution && updateRes) {
      if (this._isInitialized()) {
        this._logger.log(
          LOG_LEVEL.DEBUG,
          "OTT.ts: maxResolution: width ",
          this._maxResolution.width,
          "OTT.ts: maxResolution: height ",
          this._maxResolution.height
        );
        this._playerInstance
          .otvtoolkit()
          .setMaxResolution(
            this._maxResolution.width,
            this._maxResolution.height
          );
      } else {
        this._logger.log(
          LOG_LEVEL.WARNING,
          "OTT.ts: maxResolution(): ",
          "Operation not possible in player state: ",
          JSON.stringify(this._playerState)
        );
      }
    }
  }

  /**
   * @function SET :: thumbnail
   * @summary sets thumbnail properties
   * @param thumbnailObj
   */
  set thumbnail(thumbnailObj: ThumbnailType) {
    if (thumbnailObj) {
      this.thumbnailClass.setThumbnailProperties(thumbnailObj, this._playerState)
    } else {
      this._logger.log(LOG_LEVEL.WARNING, "OTT.ts: thumbnail prop is " + JSON.stringify(thumbnailObj));
    }
  }


  /**
   * @function GET :: getCurrentResolution
   * @summary gets max resolution for the current playing media content
   * @param // { width: number, height: number }
   */
  get _getCurrentResolution() {
    const resolution: Resolution = this._playerInstance
      .otvtoolkit()?.playbackStatistics?.getResolution();
    if (resolution) {
      this._logger.log(
        LOG_LEVEL.DEBUG,
        `OTT.ts: resolution: ${JSON.stringify(resolution)}`
      );
      return resolution;
    } else {
      return null;
    }
  }

  /**
   * @function
   * @summary
   * @param
   */
  set progressInterval(interval: number) {
    try {
      if (typeof interval !== "number" || interval < 0) {
        throw new PlayerException("progressUpdateInterval Invalid");
      }
      this._progressInterval = this._roundValue(interval * OTT.MS_IN_SECONDS);
    } catch (error) {
      this._progressInterval = OTT.DEFAULT_PROGRESS_INTERVAL;
      this._logger.log(
        LOG_LEVEL.ERROR,
        "OTT.ts: progressInterval(): ",
        error.name,
        ":",
        error.message
      );
      let errorObj: PluginErrorParam = {
        errorCode: PluginErrorCode.INVALID_PROGRESS_UPDATE_INTERVAL,
        errorMessage: error.message,
      };
      this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
    }
  }

  /**
   * @function
   * @summary
   * @param
   */
  set statisticsUpdateInterval(_interval: number) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: statisticsUpdateInterval(), the interval value:" + _interval
    );
    try {
      if (typeof _interval !== "number" || _interval < 0) {
        throw new PlayerException("statisticsInterval Invalid");
      }
      if (this._statisticsInterval !== _interval) {
        this._statisticsInterval = _interval;
        this._prevStatisticsTime = null;
        // Restart statistics timer if it has been started.
        if (this._statisticsEvtTimerID) {
          this.createEventStatisticsTimer();
        }
      }
    } catch (error) {
      this._statisticsInterval = OTT.DEFAULT_STATISTICS_INTERVAL;
      this._logger.log(
        LOG_LEVEL.ERROR,
        "OTT.ts: statisticsUpdateInterval(): ",
        error.name,
        ":",
        error.message
      );
      let errorObj: PluginErrorParam = {
        errorCode: PluginErrorCode.INVALID_STATISTICS_UPDATE_INTERVAL,
        errorMessage: error.message,
      };
      this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
    }
  }

  /**
   * @function
   * @summary
   * @param
   */
  set statisticsTypes(type: number) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: set statisticstypes() with Type:" + type
    );
    this._statisticTypeInfo = type;
  }

  /**
   * @function
   * @summary
   * @param
   */
  set maxBitrate(_bitrate: number) {
    if (_bitrate === null || _bitrate === Infinity || _bitrate === undefined) {
      // NULL or Infinity is for resetting the capping
      // NONE is mapped to null
      // For uncapping and resetting we set Inifinity to SDK.
      this._logger.log(
        LOG_LEVEL.DEBUG,
        "OTT.ts: resetting the bitrate to:" + _bitrate
      );
      this._playerInstance.otvtoolkit().setMaxBandwidth(Infinity);
    } else if (_bitrate > 0 && typeof _bitrate === "number") {
      this._logger.log(
        LOG_LEVEL.DEBUG,
        "OTT.ts: set maxBitrate with Type:" + _bitrate
      );
      this._playerInstance.otvtoolkit().setMaxBandwidth(_bitrate);
    } else {
      this._logger.log(
        LOG_LEVEL.ERROR,
        `OTT.ts: set maxBitrate: Invalid Bitrate ${JSON.stringify(_bitrate)}`
      );
    }
  }

  /**
   * @function
   * @summary set onAudioTrackSelected callback
   * @param
   */
  set onAudioTrackSelectedEvent(onAudioTrackSelectedCallback: OnAudioTrackSelectedEvent) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onAudioTrackSelectedEvent()"
    );
    this._onAudioTrackSelected = onAudioTrackSelectedCallback;
  }

  /**
   * @function
   * @summary set onBitratesAvailable callback
   * @param
   */
  set onBitratesAvailableEvent(onBitratesAvailableCallback: Function) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onBitratesAvailableEvent()"
    );
    this._onBitratesAvailable = onBitratesAvailableCallback;
  }

  /**
   * @function
   * @summary set onDownloadResChanged callback
   * @param
   */
  set onDownloadResChangedEvent(onDownloadResChangedCallback: OnDownloadResChangedEvent) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onDownloadResChangedEvent()"
    );
    this._onDownloadResChanged = onDownloadResChangedCallback;
  }

  /**
   * @function
   * @summary set onLoad callback
   * @param
   */
  set onLoadEvent(onLoadCallback: OnLoadEvent) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onLoadEvent()"
    );
    this._onLoad = onLoadCallback;
  }

  /**
   * @function
   * @summary set onLoadStart callback
   * @param
   */
  set onLoadStartEvent(onLoadStartCallback: OnLoadStartEvent) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set OnLoadStartEvent()"
    );
    this._onLoadStart = onLoadStartCallback;
  }

  /**
   * @function
   * @summary set onProgress callback
   * @param
   */
  set onProgressEvent(onProgressCallback: OnProgressEvent) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onProgressEvent()"
    );
    this._onProgress = onProgressCallback;
  }

  /**
   * @function
   * @summary set onSeek callback
   * @param
   */
  set onSeekEvent(onSeekCallback: OnSeekEvent) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onSeekEvent()"
    );
    this._onSeek = onSeekCallback;
  }

  /**
  * @function
  * @summary set onSelectedBitrateChanged callback
  * @param
  */
  set onSelectedBitrateChangedEvent(onSelectedBitrateChangedCallback: OnSelectedBitrateChangedEvent) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onSelectedBitrateChangedEvent()"
    );
    this._onSelectedBitrateChanged = onSelectedBitrateChangedCallback;
  }

  /**
   * @function
   * @summary set onEnd callback
   * @param
   */
  set onEndEvent(onEndCallback: Function) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onEndEvent()"
    );
    this._onEnd = onEndCallback;
  }

  /**
   * @function
   * @summary set onError callback
   * @param
   */
  set onErrorEvent(onErrorCallback: Function) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onErrorEvent()"
    );
    this._errorHandler.onErrorEvent = onErrorCallback;
  }

  /**
   * @function
   * @summary set onPaused callback
   * @param
   */
  set onPausedEvent(onPausedCallback: () => void) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onPausedEvent()"
    );
    this._paused = onPausedCallback;
  }

  /**
   * @function
   * @summary set onPlaying callback
   * @param
   */
  set onPlayingEvent(onPlayingCallback: () => void) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onPlayingEvent()"
    );
    this._onPlaying = onPlayingCallback;
  }

  /**
   * @function
   * @summary set onPlay callback
   * @param
   */
  set onPlayEvent(onPlayCallback: Function) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onPlayEvent()"
    );
    this._onPlay = onPlayCallback;
  }

  /**
   * @function
   * @summary set onStatisticsUpdate callback
   * @param
   */
  set onStatisticsUpdateEvent(onStatisticsUpdateCallback: OnStatisticsUpdateEvent) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onStatisticsUpdateEvent()"
    );
    this._onStatisticsUpdate = onStatisticsUpdateCallback;
  }

  /**
   * @function
   * @summary set onStopped callback
   * @param
   */
  set onStoppedEvent(onStoppedCallback: () => void) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onStoppedEvent()"
    );
    this._onStopped = onStoppedCallback;
  }

  /**
   * @function
   * @summary set onTextTrackSelected callback
   * @param
   */
  set onTextTrackSelectedEvent(onTextTrackSelectedCallback: Function) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onTextTrackSelectedEvent()"
    );
    this._onTextTrackSelected = onTextTrackSelectedCallback;
  }

  /**
  * @function
  * @summary set onThumbnailAvailable callback
  * @param
  */
  set onThumbnailAvailableEvent(onThumbnailAvailableCallback: () => void) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onThumbnailAvailableEvent()"
    );
    this._onThumbnailAvailable = onThumbnailAvailableCallback;
  }

  /**
   * @function
   * @summary set onTracksChanged callback
   * @param
   */
  set onTracksChangedEvent(onTracksChangedCallback: Function) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onTracksChangedEvent()"
    );
    this._onTracksChanged = onTracksChangedCallback;
  }

  /**
  * @function
  * @summary set onWaiting callback
  * @param
  */
  set onWaitingEvent(onWaitingCallback: Function) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: Set onWaitingEvent()"
    );
    this._onWaiting = onWaitingCallback;
  }

  /**
   * @function
   * @summary To map encryption Type
   * @param
   */
  public getEncryptionType = (source: PlayerSource) => {
    if (source?.drm?.type) {
      return this._drm.getEncryptionType(source?.drm?.type);
    } else {
      return "";
    }
  }

  /**
   * @function
   * @summary
   * @param
   */
  public connectPlayerNode = (elementId: string) => {
    if (!elementId) {
      this._logger.log(
        LOG_LEVEL.ERROR,
        "OTT.ts: connectPlayerNode(): ",
        "Invalid elementId passed"
      );

      return;
    }

    let vidViewEl = document.getElementById(elementId);
    if (!vidViewEl) {
      this._logger.log(
        LOG_LEVEL.ERROR,
        "OTT.ts: connectPlayerNode(): ",
        "Invalid elementId does not exist",
        elementId
      );
      return;
    }

    this._vidViewElId = elementId;

    // If the SDK is not initialized yet, the HTML collection for SDK
    // would not be completly ready. Just return
    if (!this._isInitialized()) {
      return;
    }

    // check and move the OTT sdk created DOM tree into RN View
    let sdkVidRootElement = document.getElementsByClassName(
      OTT.SDK_ROOT_ELEMENT_ID
    ) as HTMLCollectionOf<HTMLElement>;

    if (sdkVidRootElement) {
      vidViewEl.appendChild(sdkVidRootElement[0]);
      sdkVidRootElement[0].style.display = "block";
    }
  };

  /**
   * @function
   * @summary
   * @param
   */
  public disconnectPlayerNode = () => {
    // Remove the SDK HTML Vid collection from RN View
    // and add it back into main body
    let sdkVidRootElement = document.getElementsByClassName(
      OTT.SDK_ROOT_ELEMENT_ID
    ) as HTMLCollectionOf<HTMLElement>;

    document.body.insertBefore(
      sdkVidRootElement[0],
      document.body.firstElementChild
    );
    sdkVidRootElement[0].style.display = "none";
  };

  /**
   * @function
   * @summary
   * @param
   */
  private _registerEventListeners = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: _registerEventListeners():",
      "_registerEventListeners called"
    );
    this._playerInstance.on("ready", this._onReady);
    this._playerInstance.on("loadstart", this.onLoadStart);
    this._playerInstance.on("loadedmetadata", this.onLoad);
    this._playerInstance.on("loadeddata", this.onLoadedData);
    this._playerInstance.on("play", this.onPlay);
    this._playerInstance.on("playing", this.onPlaying);
    this._playerInstance.on("pause", this.onPaused);
    this._playerInstance.on("ended", this.onEnd);
    this._playerInstance.on("waiting", this.onWaiting);
  };

  /**
   * @function
   * @summary
   * @param
   */
  private _unregisterEventListeners = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: _unregisterEventListeners():",
      "_unregisterEventListeners called"
    );
    this._clearProgressIntervalTimer();
    this._clearStatisticsIntervalTimer();
    this._playerInstance.off("ready", this._onReady);
    this._playerInstance.off("loadstart", this.onLoadStart);
    this._playerInstance.off("loadedmetadata", this.onLoad);
    this._playerInstance.off("loadeddata", this.onLoadedData);
    this._playerInstance.off("play", this.onPlay);
    this._playerInstance.off("playing", this.onPlaying);
    this._playerInstance.off("pause", this.onPaused);
    this._playerInstance.off("seeked", this.onSeek);
    this._playerInstance.off("ended", this.onEnd);
    this._playerInstance.off("waiting", this.onWaiting);

    if (this._playerInstance.audioTracks()) {
      this._playerInstance.audioTracks().off("addtrack", this.onTracksChanged);
      this._playerInstance.audioTracks().off("removetrack", this.onTracksChanged);
      this._playerInstance.audioTracks().off("change", this.onAudioTrackSelected);
    }

    if (this._playerInstance.textTracks()) {
      this._playerInstance.textTracks().off("addtrack", this.onTracksChanged);
      this._playerInstance.textTracks().off("removetrack", this.onTracksChanged);
      this._playerInstance.textTracks().off("change", this.onTextTrackSelected);
    }
    this._playerInstance.otvtoolkit().errorReporting.setErrorListener(null);
    //unregistration of bitrate resultion event is not happing
    this._playerInstance
      .otvtoolkit()
      ?.playbackStatistics?.removePlaybackListener({
        streamBitrateChanged: this.onSelectedBitrateChanged,
        resolutionChanged: this.onDownloadResChanged,
      });
    this._setupCompleted = false;
  };

  /**
   * @function
   * @summary Fires when the player is completed its initialization
   */
  public _onReady = () => {
    this._logger.log(LOG_LEVEL.DEBUG, "OTT.ts: onReady() event is triggered ");
    this._registerPlayerOttPluginListeners();
  };

  /**
   * @function
   * @summary Fires when the browser starts looking for the video.
   * @param {Object} event
   */
  public onLoadStart = () => {
    let currentSrc: string = this._playerInstance.currentSrc();
    let currentType: string = this._playerInstance.currentType();

    //added to check the unwanted onloadstart received during initialization of otvplayer()
    //Jira ticket: OTVPL-3265
    if (currentSrc && currentSrc.length > 0) {
      let event: OnLoadStartParam;
      event = {
        src: currentSrc,
        type: currentType,
      };

      this._logger.log(
        LOG_LEVEL.DEBUG,
        "OTT.ts: onLoadStart(): onLoadStart triggered",
        JSON.stringify(event)
      );
      if (this._onLoadStart) {
        this._onLoadStart(event);
      }
    }
  };

  private _audioTrackHandling = () => {
    if (this._onAudioTrackSelected) {
      const audioTrackList = this._playerInstance.audioTracks().tracks_;
      for (let index = 0; index < audioTrackList.length; index++) {

        // Assumption : At least 1 audio track would be available
        if (audioTrackList[index].enabled || 1 === audioTrackList.length) {
          let eventObj: OnAudioTrackSelectedParam = {
            index,
          };
          this._onAudioTrackSelected(eventObj);
          this._isInitialAudioTrackSelectedSent = true;
          break;
        }
      }
    }
  };

  /**
   * @function
   * @summary Fires when the browser has loaded the current frame of the audio/video.
   * @param {Object} event
   */
  //prettier-ignore
  public onLoad = () => { //NOSONAR
    this._logger.log(LOG_LEVEL.DEBUG, "OTT.ts: onLoad()");
    let event: OnLoadParam;
    if (!this._isInitialized()) {
      // Player not ready yet
      return;
    }

    let vidTag = document.querySelector("video");
    if (vidTag) {
      // width and height to inherit from parent (RN View)
      vidTag.style.width = "inherit";
      vidTag.style.height = "inherit";

      // TO DO: Until the resizeMode prop is implemented
      // set the object-fit to fill the entire size of the parent
      vidTag.style.objectFit = "fill";
    }

    event = {
      duration: this._playerInstance.duration() || Infinity,
      naturalSize: {
        height: this._playerInstance.videoHeight(),
        width: this._playerInstance.videoWidth(),
      },
    };
    //updating state on content load
    this._updateState(OTTPlayerStates.LOADED);
    if (this._onLoad) {
      this._onLoad(event);
    }

    // Handling Bitrates
    this.onBitratesAvailable();

    //Handle thumbnails
    this.thumbnailClass.checkThumbnailAvailableAndTriggerEvent(this._onThumbnailAvailable);

    this._handleTrackEvents();
  };

  private _handleTrackEvents = () => {
    // Handling Audio Tracks
    const audioTrack = this._playerInstance.audioTracks();
    if (audioTrack) {
      this._logger.log(
        LOG_LEVEL.DEBUG,
        "OTT.ts: onLoad(): audioTracks"
      );
      // registering the audio tracks events here as the player instance
      // would have the audiotracks_
      // available only after the loadedmetadata event
      audioTrack.on("addtrack", this.onTracksChanged);
      audioTrack.on("removetrack", this.onTracksChanged);
      audioTrack.on("change", this.onAudioTrackSelected);

      // Assumption : At least 1 audio track would be available
      this.onTracksChanged();
      this._audioTrackHandling();
    }
    // Handling text track
    const textTracks = this._playerInstance.textTracks();
    if (textTracks) {
      this._logger.log(
        LOG_LEVEL.DEBUG,
        "OTT.ts: onLoad(): textTracks"
      );
      // registering the audio tracks events here as the player instance
      // would have the textTracks_
      // available only after the loadedmetadata event
      textTracks.on("addtrack", this.onTracksChanged);
      textTracks.on("removetrack", this.onTracksChanged);
      textTracks.on("change", this.onTextTrackSelected);
      if (this._onTextTrackSelected) {
        const textTrackList = textTracks.tracks_;
        for (let index = 0; index < textTrackList.length; index++) {
          if (textTrackList[index].mode === "showing") {
            let eventObj: OnTextTrackSelectedParam = {
              index,
            };
            this._onTextTrackSelected(eventObj);
            break;
          }
        }
      }
      if (this._pendingTextTracks?.length) {
        this.addTextTracks(this._pendingTextTracks);
        this._pendingTextTracks = [];
      }
    }
  };

  /**
   * @function
   * @summary Fires when the browser has loaded the current frame of the audio/video.
   * @param {Object} event
   */
  public onLoadedData = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: onLoadedData()"
    );
    if (!this._isInitialized()) {
      // Player not ready yet
      return;
    }
    // fix for this policy issue: Uncaught (in promise) DOMException: The play() request was interrupted by a new load request.
    // To manage chrome autoplay issue, we play content only after receiving onload
    if (this._autoPlay === true) {
      this._play();
    }

    this._onLoaded = true;

    if (this._onLoadedData) {
      this._onLoadedData();
    }
  };

  /**
   * @function
   * @summary Fires when the media is no longer blocked from playback, and has started playing.
   * @param
   */
  public onPlaying = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: onPlaying(): onPlaying triggered"
    );
    this._updateState(OTTPlayerStates.PLAYING);
    if (this._onPlaying) {
      this._onPlaying();
    }

    if (OTTHelper.isCurrentPlatform(PlatformTypes.PC_SAFARI) && !this._isInitialAudioTrackSelectedSent) {
      this._audioTrackHandling();
    }
  };

  /**
   * @function
   * @summary Fires when the playback starts.
   * @param
   */
  public onPlay = () => {
    this._logger.log(LOG_LEVEL.DEBUG, "OTT.ts: onPlay(): onPlay triggered");
    this._updateState(OTTPlayerStates.PLAY);
    // Restart the progress timer
    // Added the check to handle the case for pause on live.
    if (!this._progressEvtTimerID) {
      this.createEventProgressTimer();
    }

    if (!this._statisticsEvtTimerID) {
      this.createEventStatisticsTimer();
    }

    if (this._onPlay) {
      this._onPlay();
    }
  };

  /**
   * @function
   * @summary player has not enough data for continuing playback, but it may recover in a short time.
   * @param
   */
  public onWaiting = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: onWaiting(): ",
      "onWaiting triggered"
    );

    this._updateState(OTTPlayerStates.WAITING);
    if (this._onWaiting) {
      this._onWaiting();
    }
  };

  /**
   * @function
   * @summary Fires when the playback ends.
   */
  public onEnd = () => {
    this._logger.log(LOG_LEVEL.DEBUG, "OTT.ts: onEnd(): onEnd triggered");
    // Should been DRM reset?
    this._clearStatisticsIntervalTimer(); //fix for: OTVPL-3517: clearing statistics update timer when content reached end
    if (this._onEnd) {
      this._onEnd();
    }
  };

  /**
   * @function
   * @summary Fires when the bitrates are available.
   */
  public onBitratesAvailable = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: onBitratesAvailable(): ",
      "onBitratesAvailable triggered"
    );

    const adaptive = this._playerInstance
      .otvtoolkit()
      .networkStatistics.getAdaptiveStreaming();

    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: onBitratesAvailable(): Available bitrates: ",
      adaptive?.availableBitrates
    );

    let availableBitrates: number[] = adaptive?.availableBitrates;
    if (this._onBitratesAvailable) {
      let event: OnBitratesAvailableParam;
      event = {
        bitrates: availableBitrates,
      };
      this._onBitratesAvailable(event);
    }
  };


  /**
   * @function
   * @summary Fires when the resolution gets changed
   */
  public onDownloadResChanged = (width, height) => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      `OTT.ts: onDownloadResChanged(): event triggered: resolution {${width}, ${height}}`
    );
    // evt returned in callback doesnt contain height, so
    // getting width and heigth from playerStatistics
    if (this._onDownloadResChanged) {
      let resolution: Resolution = this._getCurrentResolution || {
        width: 0,
        height: 0,
      };
      let event: OnDownloadResChangedParam = {
        width: resolution.width,
        height: resolution.height,
      };
      this._onDownloadResChanged(event);
    }
  };

  /**
   * @function
   * @summary fired when the bitrate being rendered changes.
   * @param bitrate
   */
  public onSelectedBitrateChanged = (bitrate) => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: onSelectedBitrateChanged(): ",
      "onSelectedBitrateChanged event triggered: bitrate",
      bitrate
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
   * @summary Get the base and profile of a codec string. Where [0] will be the codec
   * base and [1] will be the profile.
   * Credit: Shaka Player mime_utils.js
   * @param {string} codecString
   * @return {!Array.<string>}
   */
  private _getCodecParts = (codecString: string) => {
    const parts = codecString ? codecString.split('.') : ["",""];

    const base = parts[0];

    parts.shift();
    const profile = parts.join('.');

    // Make sure that we always return a "base" and "profile".
    return [base, profile];
  };

  /**
   * @function
   * @summary Translates from codec into encoding type.
   * Credit: Shaka Player mime_utils.js
   * @param {string} codecString
   */
  private _getNormalizedCodec = (codecString:string) => {
    const parts = this._getCodecParts(codecString);
    const base = parts[0];
    const profile = parts[1].toLowerCase();
    switch (true) {
      case base === 'mp4a' && profile === '69':
      case base === 'mp4a' && profile === '6b':
      case base === 'mp4a' && profile === '40.34':
        return 'mp3';
      case base === 'mp4a' && profile === '66':
      case base === 'mp4a' && profile === '67':
      case base === 'mp4a' && profile === '68':
      case base === 'mp4a' && profile === '40.2':
      case base === 'mp4a' && profile === '40.02':
      case base === 'mp4a' && profile === '40.5':
      case base === 'mp4a' && profile === '40.05':
      case base === 'mp4a' && profile === '40.29':
      case base === 'mp4a' && profile === '40.42': // Extended HE-AAC
        return 'aac';
      case base === 'mp4a' && profile === 'a5':
        return 'ac-3'; // Dolby Digital
      case base === 'mp4a' && profile === 'a6':
        return 'ec-3'; // Dolby Digital Plus
      case base === 'mp4a' && profile === 'b2':
        return 'dtsx'; // DTS:X
      case base === 'mp4a' && profile === 'a9':
        return 'dtsc'; // DTS Digital Surround
    }
    return base;
  };

  /**
   * @function
   * @summary Translates from codec into encoding type
   * as we need to provide the enum `AUDIO_ENCODING_TYPE`
   * @return value from `AUDIO_ENCODING_TYPE` enum
   */
  private _translateCodecToEncodingType = (codec: string) => {
    let returnValue = AUDIO_ENCODING_TYPE.UNKNOWN;
    const aacSet = ['aac'];
    const ac3Set = ['ac-3', 'ec-3'];
    const dtsSet = ['dts', 'dtsc', 'dtsx'];
    const mpegSet = ['mp3'];
    
    const codecBase = this._getNormalizedCodec(codec);

    if (aacSet.includes(codecBase)) {
      returnValue = AUDIO_ENCODING_TYPE.AAC;
    } else if (ac3Set.includes(codecBase)) {
      returnValue = AUDIO_ENCODING_TYPE.AC3;
    } else if (dtsSet.includes(codecBase)) {
      returnValue = AUDIO_ENCODING_TYPE.DTS;
    } else if (mpegSet.includes(codecBase)) {
      returnValue = AUDIO_ENCODING_TYPE.MPEG;
    }

    return returnValue;
  };

  private _translateToAudioChannelCount = (channelConfig: string) => {
    let channelCount = 2;

    if (channelConfig) {
      switch (channelConfig) {
        case "6":
        case "F801":
          channelCount = 6;
          break;

        case "2":
        case "A000":
        default:
          // default value set above
          break;
      }
    }
    return channelCount;
  }

  /**
   * @function
   * @summary Fires when the audioTrack/textTracks load from loaded metadata.
   */
  public onTracksChanged = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: onTracksChanged(): ",
      "onTracksChanged triggered"
    );
    let event: OnTracksChangedParam,
      audioTracks: AudioMediaTrack[],
      textTracks: TextMediaTrack[];

    const descriptionsSet = ["main-desc", "descriptions"];

    if (this._onTracksChanged) {
      audioTracks = this._playerInstance.audioTracks().tracks_.map((currentTrack) => {
        return {
          language: currentTrack.language,
          title: currentTrack.label,
          // encodeType metadata not available yet, so setting to default UNKNOWN
          encodeType: this._translateCodecToEncodingType(currentTrack.audioCodec),
          characteristics: descriptionsSet.includes(currentTrack.kind.toLowerCase()) ? ["public.accessibility.describes-video"] : [],
          channelCount: this._translateToAudioChannelCount(currentTrack.audioChannelConfig),
        };
      });
      textTracks = this._playerInstance.textTracks().tracks_.map((currentTrack) => {
        return {
          language: currentTrack.language,
          title: currentTrack.label,
          // encodeType metadata not available yet, so setting to default UNKNOWN
          encodeType: TEXT_ENCODING_TYPE.UNKNOWN,
          // Empty list as no characteristics info could be extracted from the text track list.
          characteristics: [],
        };
      });
      if (textTracks && audioTracks) {
        event = {
          audioTracks: audioTracks,
          textTracks: textTracks,
        };
      } else {
        event = {
          audioTracks: audioTracks,
          textTracks: [],
        };
      }
      this._onTracksChanged(event);
    }
  };

  /**
   * @function
   * @summary Fires when the audioTrack is changed.
   */
  public onAudioTrackSelected = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: onAudioTrackSelected(): ",
      "onAudioTrackSelected triggered"
    );
    let selectedAudioTrackIndex: number;
    if (this._onAudioTrackSelected) {
      selectedAudioTrackIndex =
        this._playerInstance.audioTracks().tracks_.findIndex(
          (element) => element.enabled
        );
      /*
      WARNING : this is a workaround as the change event for audio track selection
      is recieved twice in case if the language is und(undermined)ISO_639-2_code.
      Once with audiotracks_.track_ object with none of the tracks having the
      parameter "enabled" as true, and then again with the parameter(enabled) set to
      true for the selected audio track.
      */
      if (selectedAudioTrackIndex !== -1) {
        let event: OnAudioTrackSelectedParam = {
          index: selectedAudioTrackIndex,
        };
        this._onAudioTrackSelected(event);
      }
    }
  };

  /**
   * @function
   * @summary Fires when the subtitle is selected/changed
   * @param
   */
  public onTextTrackSelected = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: onTextTrackSelected(): ",
      "onTextTrackSelected triggered"
    );
    let selectedTextTrackIndex: number;
    if (this._onTextTrackSelected) {
      selectedTextTrackIndex =
        this._playerInstance.textTracks().tracks_.findIndex(
          (element) => element.mode === "showing"
        );
      // findIndex returns -1 when Captions are turned Off
      let event: OnTextTrackSelectedParam = {
        index: selectedTextTrackIndex,
      };
      this._onTextTrackSelected(event);
    }
  };

  /**
   * @function
   * @summary Fires when the playback is paused.
   * @param
   */
  public onPaused = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: onPaused(): ",
      "onPaused triggered"
    );
    this._updateState(OTTPlayerStates.PAUSED);
    if (this._playerInstance.duration() !== Infinity) {
      this._clearProgressIntervalTimer();
    }
    if (this._paused) {
      this._paused();
    }
  };

  /**
   * @function
   * @summary Fires when the stop api call, it only will triggered by reset method
   *   which will update player state to STOPPED.
   */
  public onStopped = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: onStopped(): ",
      "onStopped event triggered"
    );
    if (this._onStopped) {
      this._onStopped();
    }
  };

  /**
   * @function getAvailableSeekableRange
   * @summary to get information of available seekable time ranges.
   * @param
   */
  public getAvailableSeekableRange = () => {
    return OTTHelper.getAvailableSeekableRange(this._playerInstance);
  };

  /**
   * @function
   * @summary Fires when the playback is in progress.
   * @param
   */
  public dispatchProgressEvent = () => {
    if (
      OTTPlayerStates.PLAY === this._playerState ||
      OTTPlayerStates.PLAYING === this._playerState ||
      OTTPlayerStates.WAITING === this._playerState ||
      this._playerInstance.duration() === Infinity
    ) {
      let eventData: OnProgressParam;
      let _playableDuration: number = 0;
      let _seekableDuration = this.getAvailableSeekableRange();
      const bufferedEnd = this._playerInstance.bufferedEnd();
      const _currentTime = this._playerInstance.currentTime();

      if (bufferedEnd && _currentTime) {
        let _duration = bufferedEnd - _currentTime;
        _playableDuration = _duration <= 0 ? 0 : _duration;
      }

      if (this._onProgress) {
        eventData = {
          currentPosition: this._roundValue(_currentTime - _seekableDuration.start),
          playableDuration: this._roundValue(_playableDuration),
          seekableDuration: this._roundValue(_seekableDuration.duration),
          currentTime: this._roundValue(_currentTime),
        };
        this._onProgress({ ...eventData });
      }
      this.createEventProgressTimer();
    }
  };

  private _roundValue(value: number) {
    return value ? Math.round(value * OTT.TIME_DECIMAL_LIMIT) / OTT.TIME_DECIMAL_LIMIT : 0;
  }

  /**
   * @function
   * @summary clear timer: Progress Interval.
   * media content end aswell.
   * @param
   */
  private _clearProgressIntervalTimer = () => {
    if (this._progressEvtTimerID) {
      clearTimeout(this._progressEvtTimerID);
      this._progressEvtTimerID = null;
    }
  };

  /**
   * @function dispatchingStatisticsEvent
   * @summary Fires when the playback is in progress.
   * @param
   */
  public dispatchStatisticsEvent = () => {
    if (this._onLoaded) {
      if (this._statisticTypeInfo === undefined || this._statisticTypeInfo === null) {
        this._logger.log(
          LOG_LEVEL.WARNING,
          "OTT.ts: dispatchStatisticsEvent(): statistic type info is invalid."
        );
        return;
      }

      if (this._statisticTypeInfo == STATISTICS_TYPES.ALL) {
        this._logger.log(
          LOG_LEVEL.DEBUG,
          "OTT.ts: dispatchStatisticsEvent(): all statistics"
        );
        this._statisticTypeInfo =
          STATISTICS_TYPES.RENDERING |
          STATISTICS_TYPES.NETWORK |
          STATISTICS_TYPES.PLAYBACK |
          STATISTICS_TYPES.EVENT |
          STATISTICS_TYPES.DRM;
      }

      const renderingStatisticsInfo = OTTHelper.getRenderingStats(this._playerInstance
        .otvtoolkit()
        .renderingStatistics, (this._statisticTypeInfo & STATISTICS_TYPES.RENDERING) > 0);

      const networkStatisticsInfo = OTTHelper.getNetworkStats(this._playerInstance
        .otvtoolkit()
        .networkStatistics, (this._statisticTypeInfo & STATISTICS_TYPES.NETWORK) > 0);

      const playbackStatisticsInfo = OTTHelper.getPlaybackStats(this._playerInstance
        .otvtoolkit()
        .playbackStatistics, (this._statisticTypeInfo & STATISTICS_TYPES.PLAYBACK) > 0);

      let eventData: StatisticsInformation = {};

      if (this._statisticTypeInfo & STATISTICS_TYPES.NETWORK) {
        eventData.network = networkStatisticsInfo;
      }
      if (this._statisticTypeInfo & STATISTICS_TYPES.PLAYBACK) {
        eventData.playback = playbackStatisticsInfo;
      }
      if (this._statisticTypeInfo & STATISTICS_TYPES.RENDERING) {
        eventData.rendering = renderingStatisticsInfo;
      }

      this._onStatisticsUpdate(eventData);
      this.createEventStatisticsTimer();
    }
  };

  /**
   * @function
   * @summary clear timer: Statistics Interval.
   * media content end aswell.
   * @param
   */
  private _clearStatisticsIntervalTimer = () => {
    if (this._statisticsEvtTimerID) {
      clearTimeout(this._statisticsEvtTimerID);
      this._statisticsEvtTimerID = null;
    }
  };

  /**
   * @function
   * @summary Handles the download failed event triggered on any network error.
   * @param event contains the error and url details of the failed network download.
   */
  private _handleDownloadFailed = (event) => {
    const BAD_HTTP_STATUS = 1001;
    // trigger 3003 error for APP, if HTTP network request returned an HTTP
    // status that indicated a failure.
    // RequestType in event.error.data[4] is defined as
    // 0=> Manifest, 1=>Segment, 2=>License, 3=>App, 4=>Timing, 5=>Server cert
    if (
      event?.error?.code === BAD_HTTP_STATUS &&
      event.httpResponseCode === 404 &&
      event.error.data[4] < 2
    ) {
      let contentInfo: ContentInformation = {
        serverUrl: event.error.data[0],
        source: this._sourceSet?.src,
        sessionToken: this._sourceSet?.token,
        serverResponse: event.error.data[2],
      };
      let errorObj: PluginErrorParam = {
        errorCode: event.error.code,
        errorMessage: event.error.message,
        content: contentInfo,
      };
      /* keep the ErrorCodeTypes as OTT rather than PLUGIN as it has thrown from SDK*/
      this._errorHandler.triggerError(ErrorCodeTypes.OTT, errorObj);
    }
  };

  /**
   * @function
   * @summary register the listeners to shaka player from the OTT plugin internally
   */
  private _registerPlayerOttPluginListeners = () => {
    const shakaPlayer = this._playerInstance.tech_.shaka_;
    if (shakaPlayer) {
      shakaPlayer.addEventListener(
        "downloadfailed",
        this._handleDownloadFailed
      );
    }
  };

  /**
   * @function
   * @summary unregister the listeners registered with shaka player from OTT plugin internally
   */
  private _unRegisterPlayerOttPluginListeners = () => {
    const shakaPlayer = this._playerInstance.tech_.shaka_;
    if (shakaPlayer) {
      shakaPlayer.removeEventListener(
        "downloadfailed",
        this._handleDownloadFailed
      );
    }
  };

  /**
   * @function _jitterizeInterval
   * @summary Jitterizes the time interval for next timer.
   * Async timers are not reliable, hence time latency is expected
   * function will adjusts the next interval value.
   * intervalTimeGap is difference between last timer creation to the current time
   * jitter will decide what should be the next interval value.
   * @param
   */
  public jitterizeInterval = (baseInterval: number, prevTime: number) => {
    let jitterInterval = baseInterval;
    if (prevTime) {
      const currentTime = Date.now();
      const intervalTimeGap = currentTime - prevTime;
      if (intervalTimeGap > baseInterval) {
        const jitter = Math.abs(intervalTimeGap % baseInterval);
        jitterInterval = baseInterval - jitter;
      }
    }
    return jitterInterval;
  };

  /**
   * @function
   * @summary creates timer to provide video progress details.
   * @param
   */
  public createEventProgressTimer = () => {
    this._clearProgressIntervalTimer();
    this._progressEvtTimerID = setTimeout(() => {
      this.dispatchProgressEvent();
    }, this.jitterizeInterval(this._progressInterval, this._prevProgressTime));
    this._prevProgressTime = Date.now();
  };

  public createEventStatisticsTimer = () => {
    this._clearStatisticsIntervalTimer();
    this._statisticsEvtTimerID = setTimeout(() => {
      this.dispatchStatisticsEvent();
    }, this.jitterizeInterval(this._statisticsInterval, this._prevStatisticsTime));
    this._prevStatisticsTime = Date.now();
  };
  /**
   * @function
   * @summary Fires when the seek completes.
   */
  public onSeek = () => {
    let event: OnSeekParam;

    // Get the details again to find the relative position
    const seekableRange = this._playerInstance.seekable();
    if (seekableRange && seekableRange.length) {
      const startPosition = seekableRange.start(seekableRange.length - 1);
      // Assumption: for VoD content the startTime would always be zero
      event = {
        currentPosition: this._roundValue(this._playerInstance.currentTime() - startPosition),
        seekPosition: this._roundValue(this._requestedSeekPos),
      };

      this._logger.log(
        LOG_LEVEL.DEBUG,
        "OTT.ts: onSeek(): onSeek triggered ",
        JSON.stringify(event)
      );
      if (this._onSeek) {
        this._onSeek(event);
      }
    } else {
      this._logger.log(
        LOG_LEVEL.ERROR,
        "OTT.ts: onSeek(): onSeek received for unseekable content!"
      );
      let errorObj: PluginErrorParam = {
        errorCode: PluginErrorCode.SEEK_ERROR,
        errorMessage: "Seek Is Not Allowed For This Content",
      };
      this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
    }
  };

  /**
   * @function
   * @summary To Play a content.
   * @param
   */
  public play = () => {
    this._logger.log(LOG_LEVEL.DEBUG, "OTT.ts: play(): play called");
    //dont allow play if state is play_requested and source_set
    switch (this._playerState) {
      case OTTPlayerStates.LOADED:
      case OTTPlayerStates.PAUSED:
      // Player could be actually waiting to be played
      // as state PLAYING means only that it is
      // ready to play the content
      case OTTPlayerStates.PLAYING:
      // Special case of OTT VoD: network disconnect -> connect. Player is in WAITING state.
      // Content does not start autoplaying after a network connection is restored
      // Allow the App to call play()
      case OTTPlayerStates.WAITING:
        {
          this._play();
        }
        break;
      default:
        this._logger.log(
          LOG_LEVEL.WARNING,
          "OTT.ts: play(): Operation not possible in player state: ",
          JSON.stringify(this._playerState)
        );
    }
  };

  /**
   * @function
   * @summary
   * @param
   */
  public pause = () => {
    this._logger.log(LOG_LEVEL.DEBUG, "OTT.ts: pause(): pause called");
    switch (this._playerState) {
      case OTTPlayerStates.PLAY:
      case OTTPlayerStates.PLAYING:
      case OTTPlayerStates.WAITING:
        this._playerInstance.pause();
        break;
      default:
        this._logger.log(
          LOG_LEVEL.WARNING,
          "OTT.ts: pause(): Operation not possible in player state: ",
          JSON.stringify(this._playerState)
        );
    }
  };

  /**
   * @function seek
   * @summary seek to the time, provided by application.
   * seekable window is provided by SDK player and seek time
   * position: provided by app will be calculated from start seekable window(start prop of time range)
   * @param position in seconds
   */

  /**
   * to do:
   * need to revisit when the seek time clarified from native platforms understanding
   * (current seek time is expected from start of seekable window start property)
   * behavior needs to finalized when seek time is beyond time ranges.
   * clarification: is check for range errors has to be handled here?
   */
  public seek = (position: number) => {
    this._logger.log(LOG_LEVEL.DEBUG, "OTT.ts: seek(): seek called");
    try {
      if (typeof position !== "number" || position < 0) {
        throw new PlayerException("non number or invalid value");
      }
      if (this._isReadyForSeek()) {
        this._playerInstance.one("seeked", this.onSeek);
        const seekableRange = this._playerInstance.seekable();
        if (seekableRange && seekableRange.length) {
          const startPosition = seekableRange.start(seekableRange.length - 1);
          const endPosition = seekableRange.end(seekableRange.length - 1);
          const actualSeekPos = startPosition + this._roundValue(position);
          this._requestedSeekPos = position;
          if (actualSeekPos < endPosition) {
            this._playerInstance.currentTime(actualSeekPos);
          } else {
            throw new PlayerException("Seek time is out of seekable range");
          }
        } else {
          throw new PlayerException("Seek is not allowed for this content");
        }
      } else {
        this._logger.log(
          LOG_LEVEL.WARNING,
          "OTT.ts: seek(): Operation not possible in player state: ",
          JSON.stringify(this._playerState)
        );
      }
    } catch (error) {
      this._logger.log(
        LOG_LEVEL.ERROR,
        "OTT.ts: seek(): ",
        error.name,
        ":",
        error.message
      );
      let errorObj: PluginErrorParam = {
        errorCode: PluginErrorCode.SEEK_ERROR,
        errorMessage: error.message,
      };
      this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
    }
  };

  private _isReadyForSeek = () => {
    return OTTPlayerStates.PLAY === this._playerState ||
      OTTPlayerStates.PLAYING === this._playerState ||
      OTTPlayerStates.PAUSED === this._playerState ||
      OTTPlayerStates.WAITING === this._playerState ||
      OTTPlayerStates.LOADED === this._playerState;
  }

  /**
   * @function selectAudioTrack
   * @summary Function to set the audio track
   * @param index
   */
  public selectAudioTrack = (selectedIndex: number) => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      `OTT.ts: selectAudioTrack(${selectedIndex}) called`
    );

    if (
      this._playerInstance.audioTracks() &&
      this._playerInstance.audioTracks().length
    ) {
      if (selectedIndex < 0) {
        this._logger.log(
          LOG_LEVEL.ERROR,
          `OTT.ts: selectAudioTrack(${selectedIndex}): wrong index input`
        );
        let errorObj: PluginErrorParam = {
          errorCode: PluginErrorCode.INVALID_AUDIO_TRACK_INDEX,
          errorMessage: "Invalid Audio Track Index",
        };
        this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
        return;
      }

      for (let loopIndex = 0;
        loopIndex < this._playerInstance.audioTracks().length;
        loopIndex++) {
        (this._playerInstance.audioTracks())[loopIndex].enabled =
          loopIndex === selectedIndex
      }
    }
  };

  /**
   * @function selectTextTrack
   * @summary Function to set the text track
   * @param index
   */

  public selectTextTrack = (index: number) => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: selectTextTrack(): selectTextTrack called"
    );

    if (
      this._playerInstance.textTracks() &&
      this._playerInstance.textTracks().length
    ) {
      const currentSelectedTextTrackIndex =
        this._playerInstance.textTracks().tracks_.findIndex(
          (element) => element.mode === "showing"
        );

      if (currentSelectedTextTrackIndex === index) {
        // Silent return, not an error
        return;
      }

      // Usecase : Switching off captions
      if (index === -1) {
        (this._playerInstance.textTracks())[currentSelectedTextTrackIndex].mode =
          "disabled";
        return;
      }

      // Enabling new track and disabling previous track
      if (index >= 0 && index < this._playerInstance.textTracks().length) {
        // Enabling mode to showing for new track
        // Disabling previously selected track using mode as "disabled"
        if (currentSelectedTextTrackIndex !== -1) {
          (this._playerInstance.textTracks())[currentSelectedTextTrackIndex].mode =
            "disabled";
        }
        (this._playerInstance.textTracks())[index].mode = "showing";
      } else {
        this._logger.log(
          LOG_LEVEL.ERROR,
          "OTT.ts: selectTextTrack(): wrong index input"
        );
        let errorObj: PluginErrorParam = {
          errorCode: PluginErrorCode.INVALID_TEXT_TRACK_INDEX,
          errorMessage: "Invalid Text Track Index",
        };
        this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
      }
    }
  };

  /**
   * @function
   * @summary Fires when the shaka error occurs.
   * @param {number} errorSeverity
   * @param {number} errorCategory
   * @param {number} errorCode
   * @param {string} errorMessage
   */
  private _sdkError = (
    errorSeverity: number,
    errorCategory: number,
    errorCode: number,
    errorMessage: string
  ) => {
    //added check to ignore "Source was changed" error.
    //in license request/renenewal callback to ignore response for old source added checks there.
    //if response is not for ongoing content then rejecting response with "Source was changed"
    // this error RN Plugin should not propagate to app.
    // errorCode 7000 is for VIDEOJS: ERROR: (CODE:0 MEDIA_ERR_CUSTOM) 7000 - Shaka Error PLAYER.LOAD_INTERRUPTED()
    // Shaka Error PLAYER.LOAD_INTERRUPTED() error is getting from sdk for quick zap: ignoring
    // to do : use shaka enum for LOAD_INTERRUPTED instead of hardcoding value.
    // if platform is safari then following check is not rqurired
    //for other platform following check is required.
    if (
      !OTTHelper.isCurrentPlatform(PlatformTypes.PC_SAFARI) &&
      (errorMessage.includes("Source was changed") ||
        errorCode === OTT.SHAKA_LOAD_INTERRUPTED)
    ) {
      return;
    }
    let errorObj: ShakaErrorParam = {
      errorSeverity,
      errorCategory,
      errorCode,
      errorMessage,
    };

    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: _sdkError(): _sdkError method called",
      JSON.stringify(errorObj)
    );
    const ERROR_SEVERITY_CRITICAL = 2;
    if (errorSeverity === ERROR_SEVERITY_CRITICAL) {
      this._updateState(OTTPlayerStates.ERROR);
    }
    this._errorHandler.triggerError(ErrorCodeTypes.OTT, errorObj);
  };

  /**
   * @function addTextTracks
   * @summary To add sideloaded text tracks.
   * @param
   */
  public addTextTracks = (textTracks: TextTrack[]) => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: addTextTracks(): addTextTracks called "
    );
    //wait untill onLoad to consume the text tracks. Don't need to update _pendingTextTracks on props change.
    if (
      this._playerState === OTTPlayerStates.SOURCE_SET ||
      !this._isInitialized()
    ) {
      this._pendingTextTracks = textTracks;
    } else {
      for (const _sideLoadedTextTrack of textTracks) {
        let _textTrack = {} as SideLoadedTextTrack;
        _textTrack.label = _sideLoadedTextTrack.language; //language is used for both label and language from textTrack prop as the label and language,
        _textTrack.language = _sideLoadedTextTrack.language; // both have same language codes (ISO 639-1 codes or ISO 639-2 codes ).
        _textTrack.src = _sideLoadedTextTrack.url;
        //the second parameter, "manualCleanup" in the function addRemoteTextTrack  is set to false
        //so that the TextTrack will be automatically removed from the video element whenever the source changes.
        this._logger.log(
          LOG_LEVEL.DEBUG,
          `OTT.ts: addTextTracks(): addTextTracks called: _textTrack: "${_textTrack}"`
        );
        this._playerInstance.addRemoteTextTrack(_textTrack, false);
      }
    }
  };

  /**
   * @function
   * @summary To check mimeType supported.
   * @param
   */
  public isSrcTypeSupported = (srcType: string) => {
    let mimeTypeSupported: string[] = [OTTMimeTypes.DASH, OTTMimeTypes.HLS];
    return mimeTypeSupported.indexOf(srcType) > -1;
  };

  /**
   * @function
   * @summary to start player
   * @param
   */
  public setup = () => {
    this._logger.log(LOG_LEVEL.DEBUG, "OTT.ts: setup(): setup called ");
    if (this._playerState === OTTPlayerStates.INITIALISING) {
      // Listeners cannot be registered unless the SDK is initialised
      // setup() is called in the SDKs success callback
      this._logger.log(LOG_LEVEL.DEBUG, "OTT.ts: setup(): ignored as state is ", this._playerState);
      return;
    }
    if (!this._setupCompleted) {
      this._registerEventListeners();
      this._setupCompleted = true;
    } else {
      this._logger.log(LOG_LEVEL.DEBUG, "OTT.ts: setup(): setup had been called before, so do nothing.");
    }
  };

  /**
 * @function
 * @summary To bring the player to a stop state
 * @param triggerStoppedEvent
 */
  public reset = (resetType: OTTResetTypes) => {
    this._logger.log(LOG_LEVEL.DEBUG,
      `OTT.ts: reset(): reset called, resetType: "${resetType}"`);

    this._prevProgressTime = null;
    this._prevStatisticsTime = null;
    this._sourceSet = null;

    this._pendingTextTracks = [];
    //to do:need to reset props value in OTVPlayer.web.tsx
    this._autoPlay = false;
    this._volume = 1.0;
    this._muted = false;
    this._progressInterval = OTT.DEFAULT_PROGRESS_INTERVAL;
    this._statisticsInterval = OTT.DEFAULT_STATISTICS_INTERVAL;
    this._maxResolution = null;

    this._isInitialAudioTrackSelectedSent = false;
    this.thumbnail = {
      display: false,
      positionInSeconds: 0,
      style: {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      }
    }

    // In the initializing state of the player we do not need to manage listeners
    // and reset player
    if (this._playerState !== OTTPlayerStates.INITIALISING) {
      this._unregisterEventListeners();
      this._unRegisterPlayerOttPluginListeners();

      // Unload the shaka player to immediately stop playback.
      if (this._playerInstance.tech_.shaka_) {
        this._playerInstance.tech_.shaka_.unload();
      }

      // if app call stop api then RN Plugin should reset the player instance and
      // propagate onStopped event to the app.
      // for every src change the RN Plugin internally calls this reset() to just
      // clear the listeners and it should not propagate onStopped event to the
      // app.
      if (OTTResetTypes.RESET_FOR_SRC_CHANGE !== resetType) {
        // Reset the player to stop playback.
        this._playerInstance.reset();
      }

      this._updateState(OTTPlayerStates.STOPPED);

      //reset thumbnail properties
      this.thumbnailClass.resetThumbnailProperties();
    }

    // Trigger onStopped anyway, even if the player is in initialising state
    if (OTTResetTypes.RESET_FOR_STOP === resetType) {
      this.onStopped();
    }
  };

  private _resetDRM = () => {
    this._logger.log(LOG_LEVEL.DEBUG, "OTT.ts: resetDRM() called");
    this._drm.setSource(null);
  }

  private _updateState = (newState: OTTPlayerStates) => {
    if (newState !== this._playerState) {
      switch (newState) {
        case OTTPlayerStates.INITIALISED:
          this._drm.setPlayer(this._playerInstance);
          break;
        case OTTPlayerStates.PLAY_REQUESTED:
          this._drm.setSource(this._sourceSet);
          break;
        case OTTPlayerStates.STOPPED:
          this._resetDRM();
          break;
        default:
          break;
      }
      this._logger.log(LOG_LEVEL.INFO, "OTT.ts, _updateState(): " + OTTHelper.getStateString(this._playerState) + " -> "
        + OTTHelper.getStateString(newState));
      this._playerState = newState;
    }
  }

  private _isInitialized = () => {
    return this._playerState !== OTTPlayerStates.UNINITIALISED &&
      this._playerState !== OTTPlayerStates.INITIALISING &&
      this._playerState !== OTTPlayerStates.ERROR;
  }

  /**
   * @function _play
   * @summary  Wrapper for the SDK play call.  Throws plugin error if the play functionality is failed.
   * @param    none
   */
  private _play = () => {
    let that = this;
    let contentInfo: ContentInformation = {
      serverUrl: undefined,
      source: this._sourceSet?.src,
      sessionToken: this._sourceSet?.token,
      serverResponse: null,
    };
    let errorObj: PluginErrorParam = {
      errorCode: PluginErrorCode.AUTOPLAY_REJECTED_BY_BROWSER,
      errorMessage: "Autoplay rejected by Browser",
      content: contentInfo,
    };

    const playReq = this._playerInstance.play();
    if (playReq) {
      playReq.then(() => {
        that._logger.log(LOG_LEVEL.INFO, "OTT.ts: _play(), play promise is resolved for autoPlay prop successfully");
      })
        .catch((err) => {
          that._logger.log(LOG_LEVEL.DEBUG, "OTT.ts: _play(), play promise is not resolved for autoPlay prop. err: ", err);
          if (that._sourceSet?.src === contentInfo.source) {
            that._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
          }
          else {
            that._logger.log(LOG_LEVEL.DEBUG, "OTT.ts: _play(), source got changed");
          }
        })
    }
  }
}
