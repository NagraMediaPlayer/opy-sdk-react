// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import {
  PlayerSource,
  OIPFChannelConfig,
  IPTVPlayerProps,
  OipfMimeTypes,
  OipfComponentTypes,
  OIPFPlayerStates,
  PluginErrorParam,
  ErrorCodeTypes,
} from "./common/interface";
import {
  TextTrack, Resolution,
  // ThumbnailStyle 
} from "../OTVPlayer.d";

import {
  OTVSDK_LOGLEVEL as LOG_LEVEL
} from "./../common/enums";

import Broadcast from "./Broadcast";
import { Logger } from "./../Logger";
import { PluginErrorCode, IPTV_ERRORS } from "./common/ErrorHandler";

let instance = null;
// Singleton class
export class IPTVBroadcast extends Broadcast implements IPTVPlayerProps {
  private src: string;
  _mimeTypeSupported: string[];
  _pendingTextTracks: TextTrack[];
  _channelConfig: OIPFChannelConfig;
  _logger: Logger = new Logger();
  constructor(params) {
    super(params);
    if (instance === null) {
      instance = this;
      this._mimeTypeSupported = [
        OipfMimeTypes.IPTV_URI,
        OipfMimeTypes.IPTV_SDS,
        OipfMimeTypes.DVB_CAB,
      ];
    }

    return instance;
  }

  public set source(source: PlayerSource) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "IPTVBroadcast.ts: source: ",
      "URI: ",
      JSON.stringify(source)
    );

    if (!source.src) {
      this._logger.log(
        LOG_LEVEL.WARNING,
        "IPTVBroadcast.ts: source is NULL ",
        "returning"
      );
      let errorObj: PluginErrorParam = {
        errorCode: PluginErrorCode.NULL_SOURCE,
        errorMessage: IPTV_ERRORS.NullSource,
      };
      this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
      return;
    }

    this.src = source.src;

    // TODO : To be moved to constuctor
    this._channelConfig = this.videoRef.getChannelConfig();

    // extration of src: dvb://<ONID>:<TSID>:<SID>
    let onid: number, tsid: number, sid: number;

    let triplet = this.src.split("//");
    if (triplet.length === 2) {
      triplet = triplet[1].split(":");
      if (triplet.length === 3) {
        onid = parseInt(triplet[0]);
        tsid = parseInt(triplet[1]);
        sid = parseInt(triplet[2]);
      } else {
        let errorObj: PluginErrorParam = {
          errorCode: PluginErrorCode.INVALID_BROADCAST_URL,
          errorMessage: IPTV_ERRORS.InvalidBroadcastUrl,
        };
        this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
        return;
      }
    } else {
      let errorObj: PluginErrorParam = {
        errorCode: PluginErrorCode.INVALID_BROADCAST_URL,
        errorMessage: IPTV_ERRORS.InvalidBroadcastUrl,
      };
      this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
      return;
    }

    let channelList = this._channelConfig.channelList;
    if (channelList == null) {
      this._logger.log(
        LOG_LEVEL.WARNING,
        "IPTVBroadcast.ts: source: ",
        "NULL Channel List. Cannot play any channel"
      );
      let errorObj: PluginErrorParam = {
        errorCode: PluginErrorCode.NULL_CHANNEL_LIST,
        errorMessage: IPTV_ERRORS.NullChannelList,
      };
      this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
      return;
    }

    let channelObj = channelList.getChannelByTriplet(onid, tsid, sid);
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "IPTVBroadcast.ts: source: ",
      "ONID: ",
      onid,
      ":: TSID: ",
      tsid,
      ":: SID: ",
      sid
    );

    if (channelObj) {
      // Explicitly removing the selected subtitle track from
      // currently active component
      instance._bcSuperVisor.unselectComponent(
        OipfComponentTypes.COMPONENT_TYPE_SUBTITLE
      );

      // TODO : To be moved to constuctor
      instance._bcSuperVisor.setChannel(channelObj, false);
      instance.videoRef.bindToCurrentChannel();

      //updating state on src change
      this._playerState = OIPFPlayerStates.PLAY_REQUESTED;
    } else {
      this._logger.log(
        LOG_LEVEL.WARNING,
        "IPTVBroadcast.ts: source: ",
        "Channel Obj is NULL"
      );
      let errorObj: PluginErrorParam = {
        errorCode: PluginErrorCode.NULL_CHANNEL_OBJECT,
        errorMessage: IPTV_ERRORS.NullChannelObject,
      };
      this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
    }
  }

  /**
   * @fuction token
   * @summary added placeholder for IPTV Player to avoid typo
   * @param token
   */
  public set token(token: string) {
    this._logger.log(LOG_LEVEL.DEBUG, "IPTVBroadcast.ts: token: ", token);
  }

  // Not to do anything if play is pressed in case of Broadcast ( IPTV )
  play = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "IPTVBroadcast.ts: play(): ",
      "play called"
    );
    this._playerState = OIPFPlayerStates.PLAY;
  };

  // Not to do anything if pause is pressed in case of Broadcast ( IPTV )
  pause = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "IPTVBroadcast.ts: pause(): ",
      "pause called"
    );
    this._playerState = OIPFPlayerStates.PAUSED;
  };

  // Not to do anything if seek is pressed in case of Broadcast ( IPTV )
  seek = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "IPTVBroadcast.ts: seek(): ",
      "Seek not valid for IPTV content"
    );
  };

  //following ts ignore needed for dummy function
  public set autoplay(value: boolean) {
    //Broadcast doesn't support autoPlay
    this._logger.log(LOG_LEVEL.DEBUG, "IPTVBroadcast.ts: autoplay(): ", value);
  }

  /**
   * @function
   * @summary
   * @param
   */
  public set progressInterval(interval: number) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "IPTVBroadcast.ts: progressInterval(): ",
      interval
    );
  }

  //adding for stats to avoid type error and a log

  /**
   * @function
   * @summary
   * @param
   */
  public set statisticsUpdateInterval(interval: number) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "IPTVBroadcast.ts: statisticsUpdateInterval(): ",
      interval
    );
  }

  /**
   * @function
   * @summary
   * @param
   */
  public set statisticsTypes(type: number) {
    this._logger.log(
      LOG_LEVEL.ERROR,
      "OTT.ts: set statisticstypes() with Type:" + type
    );
  }

  public set maxBitrate(type: number) {
    this._logger.log(
      LOG_LEVEL.ERROR,
      "OTT.ts: set maxBitrate with Type:" + type
    );
  }

  // /**
  //  * @function
  //  * @summary
  //  * @param
  //  */
  // public set thumbnailStyle(type: ThumbnailStyle) {
  //   this._logger.log(
  //     LOG_LEVEL.ERROR,
  //     "OTT.ts: set thumbnailStyle() with Type:" + type
  //   );
  // }

  /**
   * @function
   * @summary
   * @param
   */
  public set displayThumbnail(type: boolean) {
    this._logger.log(
      LOG_LEVEL.ERROR,
      "OTT.ts: set displayThumbnail() with Type:" + type
    );
  }

  /**
   * @function
   * @summary
   * @param
   */
  public set thumbnailPosition(type: number) {
    this._logger.log(
      LOG_LEVEL.ERROR,
      "OTT.ts: set thumbnailPosition() with Type:" + type
    );
  }

  /**
   * @function
   * @summary To check mimeType supported.
   */
  isSrcTypeSupported = (srcType: string) => {
    return this._mimeTypeSupported.indexOf(srcType) > -1;
  };

  /**
   * @fuction muted
   * @summary sets mute status for the current playing media content
   * @param {boolean} muteStatus
   */
  set muted(muteStatus: boolean) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "IPTVBroadcast.ts: muted: ",
      JSON.stringify(muteStatus)
    );
    this.configRef.localSystem.mute = muteStatus;
  }

  /**
   * @function
   * @summary Adjusts the volume of the currently playing live media.
   * @param {number} volumeLevel
   */
  set volume(volumeLevel: number) {
    //Set the overall system volume. Valid values for this property are in the range 0 - 100.
    //TO-DO need to check mute scenarios.
    //As per OTVPlayer document the volume level expected from App is between 0 and 1.0 (not 0 and 100).
    //Mapping volumeLevel those into 0 - 100
    let _volumeLevel: number = Math.round(volumeLevel * 100);
    if (_volumeLevel >= 0 && _volumeLevel <= 100) {
      this._logger.log(
        LOG_LEVEL.DEBUG,
        "IPTVBroadcast.ts: volume: valid volume level",
        JSON.stringify(_volumeLevel)
      );
      this.configRef.localSystem.volume = _volumeLevel;
    } else {
      this._logger.log(
        LOG_LEVEL.WARNING,
        "IPTVBroadcast.ts: volume: invalid volume level",
        JSON.stringify(_volumeLevel)
      );
      let errorObj: PluginErrorParam = {
        errorCode: PluginErrorCode.INVALID_VOLUME_LEVEL,
        errorMessage: IPTV_ERRORS.InvalidVolumeLevel,
      };
      this._errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);
    }
  }

  //TODO: Need to revisit for IPTV
  get _getCurrentResolution() {
    return { width: 640, height: 480 };
  }

  /**
   * @fuction maxResolution
   * @summary sets max resolution for the current playing media content
   * @param // { width: number, height: number }
   */
  //TODO: Need to revisit for IPTV
  set maxResolution(resolution: Resolution) {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "IPTVBroadcast.ts: maxResolution: width ",
      resolution.width
    );
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "IPTVBroadcast.ts: maxResolution: height ",
      resolution.height
    );
  }

  /**
   * @function
   * @summary to start player
   * @param
   */
  setup = () => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "IPTVBroadcast.ts: setup(): ",
      "setup called "
    );
    this._registerEventListeners();
  };
  /**
   * @function
   * @summary To stop the player
   * @param triggerStoppedEvent
   */
  reset = (triggerStoppedEvent = false) => {
    this._logger.log(
      LOG_LEVEL.DEBUG,
      "IPTVBroadcast.ts: reset(): ",
      "reset called "
    );
    // TO DO: Add code to stop the player

    // Hide the player
    //@ts-ignore
    this._unregisterEventListeners();
    this.src = "";
    this.videoRef.stop();
    this._playerState = OIPFPlayerStates.STOPPED;
    if (triggerStoppedEvent) {
      this.onStopped();
    }
  };
}
