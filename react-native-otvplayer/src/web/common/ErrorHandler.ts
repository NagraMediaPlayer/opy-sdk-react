// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { OnErrorParam } from "../../OTVPlayer.d";
import {
  ErrorCodeTypes,
  PluginErrorParam,
  ShakaErrorParam,
  OIPFErrorParam,
} from "./interface.d";
let instance = null;
// one to many mapping
// This object defines Key: Value pair as follows:
// Key-> platform player specific code
// Value-> Unique RN Error value provided to App
let ErrorCodes = {
  OTT_ERROR_CODE: {
    //shakaErrorCodes: unifiedErrorCodes
    //HTTP request error
    1001: 3003, //An HTTP network request returned an HTTP status that indicated a failure.
    1002: 3003, //An HTTP network request failed with an error, but not from the server.
    //MEDIA
    2008: 2001, //MP4 segment does not contain VTT.
    //MANIFEST error
    4001: 1003, //The DASH Manifest contained invalid XML markup.
    4002: 1003, //The DASH Manifest contained a Representation with insufficient segment information.
    4003: 1003, //The DASH Manifest contained an AdaptationSet with no Representations.
    4004: 1003, //The DASH Manifest contained a Period with no AdaptationSets.
    4005: 1003, //The DASH Manifest does not specify an init segment with a WebM container.
    4006: 1003, //The DASH Manifest contained an unsupported container format.
    4010: 1003, //The DASH Manifest specifies conflicting key IDs.
    4020: 1003, //HLS manifest has several #EXT-X-MAP tags. We can only support one at the moment.
    4024: 1003, //One of the required tags was not provided, so the HLS manifest is invalid.
    4027: 1003, //The manifest parser only supports xlink links with xlink:actuate="onLoad".
    4028: 1003, //The manifest parser has hit its depth limit on xlink link chains.
    4036: 1003, //The Manifest contained no Variants.
    4039: 1003, //The HLS manifest refers to an undeclared variables.
    6000: 1003, //The manifest indicated protected content, but the manifest parser was unable to determine what key systems should be used.
    //DRM error
    6007: 5006, //The license request failed. This could be a timeout, a network failure, or a rejection by the server.
    6008: 5007, //The license response was rejected by the CDM.
    6010: 5001, //The manifest does not specify any DRM info, but the content is encrypted. Either the manifest or the manifest parser are broken.
    6012: 5005, //No license server was given for the key system signaled by the manifest. A license server URI is required for every key system.
    6014: 5004, //The license has expired. This is triggered when all keys in the key status map have a status of 'expired'.
  },
  IPTV_ERROR_CODE: {
    0: 8001, // channel not supported by tuner.
    1: 8002, // cannot tune to given transport stream (e.g. no signal)
    2: 8003, //	tuner locked by other object.
    3: 8004, //	parental lock on channel.
    4: 8005, //	encrypted channel, key/module missing.
    5: 8006, //	unknown channel (e.g. can’t resolve DVB or ISDB triplet).
    6: 8007, //	channel switch interrupted (e.g. because another channel switch was activated before the previous one completed).
    7: 8008, //	channel cannot be changed, because it is currently being recorded.
    8: 8009, //	cannot resolve URI of referenced IP channel.
    9: 8010, //	insufficient bandwidth.
    10: 8011, // channel cannot be changed by nextChannel()/prevChannel() methods either because the OITF does not maintain a favourites or channel list or because the video/broadcast object is in the Unrealized state.
    11: 8012, // insufficient resources are available to present the given channel (e.g. a lack of available codec resources).
    12: 8013, // specified channel not found in transport stream.
    100: 8100, //	unidentified error.
  },
  PLUGIN_ERROR_CODE: {
    // Following are 1 to Mime mapping for error code (PluginErrorCode: unifiedErrorCode)
    // Below 1 to 7 are plugin's and 7001 to 7010 are their respective unified error codes
    // PluginErrorCode.INVALID_MIMETYPE: 7001
    1: 7001, //Mime Type invalid
    2: 7002, //progressUpdateInterval invalid
    3: 7003, //Invalid Audio Track index
    4: 7003, //Invalid Text Track index
    5: 7003, //Text Track already disabled
    6: 7004, //out of bound seek request.
    7: 7010, // Plugin internal error
    8: 1002, // Source is NULL
    9: 8014, // Channel List is NULL
    10: 8015, // Channel object is NULL
    11: 8016, // Invalid broadcast URL
    12: 2003, // Invalid Volume Level
    13: 8017, // Platform doesn't support OIPF capabilities
    14: 8018, // Video object creation failed
    15: 8019, // Configuration object creation failed
    16: 2004, // No Text Track available
    17: 7005, //Invalid Bitrate Index
    18: 6001, //setup error
    19: 6002, //teardown error
    20: 6003, //heartbeat send message failure
    21: 7020, //Thumbnail item error
    22: 7021, //Thumbnail position error
    23: 7022, //Thumbnail Style error
    24: 7023, //Thumbnail not available
    25: 7024, //Thumbnail Status unknown
    26: 7026, //Autoplay rejected by Browser
    29: 5022, //SSM Content toke error
    30: 6003, //SSM License renew error
    31: 5002, //Invalid key system
    32: 5005, //license request data not matching source
    33: 5006, //license request failure
    34: 5005, //license data error
    35: 5006, //certificate request failure
    1007: 6004, //User Reached maximum session limit
  },
};
export const enum PluginErrorCode {
  INVALID_MIMETYPE = 1,
  INVALID_PROGRESS_UPDATE_INTERVAL,
  INVALID_AUDIO_TRACK_INDEX,
  INVALID_TEXT_TRACK_INDEX,
  TEXT_TRACK_ALREADY_OFF,
  SEEK_ERROR,
  INTERNAL_ERROR,
  NULL_SOURCE,
  NULL_CHANNEL_LIST,
  /*10*/ NULL_CHANNEL_OBJECT,
  INVALID_BROADCAST_URL,
  INVALID_VOLUME_LEVEL,
  OIPF_NOT_SUPPORTED,
  VIDEO_OBJ_CREATION_FAILED,
  CONFIG_OBJ_CREATION_FAILED,
  NO_TEXT_TRACK_AVAILABLE,
  INVALID_BITRATE_INDEX,
  SSM_SETUP_FAILURE,
  SSM_TEARDOWN_FAILURE,
  /*20*/ SSM_HEARTBEAT_SEND_MESSAGE_FAILURE,
  THUMBNAIL_ITEM_ERROR,
  THUMBNAIL_POSITION_ERROR,
  THUMBNAIL_STYLING_ERROR,
  THUMBNAIL_NOT_AVAILABLE_ERROR,
  THUMBNAIL_STATUS_UNKNOWN_ERROR,
  AUTOPLAY_REJECTED_BY_BROWSER,
  INVALID_STATISTICS_UPDATE_INTERVAL, // TODO need to marry up PLUGIN_ERROR_CODE above
  INVALID_RESOLUTION_CHANGE_PARAMETER, // TODO need to marry up PLUGIN_ERROR_CODE above
  SSM_CONTENT_TOKEN_ERROR,
  SSM_RENEW_ERROR,
  INVALID_KEY_SYSTEM,
  DRM_INVAILD_SOURCE,
  DRM_LICENSE_REQUEST_FAILURE,
  DRM_LICENSE_DATA_ERROR,
  DRM_CERTIFICATE_REQUEST_FAILURE,
  USER_REACHED_MAXIMUM_SESSIONS_LIMIT = 1007,
}
export const IPTV_ERRORS = {
  NullSource: "Source is NULL",
  NullChannelList: "Channel List is NULL",
  NullChannelObject: "Channel Obj is NULL",
  InvalidBroadcastUrl: "Invalid Broadcast URL",
  InvalidVolumeLevel: "Invalid Volume Level",
  InvalidAudioTrackIndex: "Invalid Audio Track Index",
  InvalidTextTrackIndex: "Invalid Text Track Index",
  OipfNotSupported: "Platform doesn't support OIPF capabilities",
  VideoObjCreationFailed: "Video/Broadcast object creation failed",
  ConfigObjCreationFailed: "Configuration object creation failed",
  TextTrackAlreadyOff: "Text Track Is Already Disabled",
  NoTextTrackAvailable: "No text track found",
};
export class ErrorHandler {
  static readonly DEFAULT_ERROR_CODE: number = 1000;
  _onError: Function;
  constructor(params) {
    if (instance) {
      return instance;
    }
    this._onError = params.onError;
    instance = this;
  }

  /**
   * @function
   * @summary set onError callback
   * @param
   */
  set onErrorEvent(onErrorCallback: Function) {
    this._onError = onErrorCallback;
  }

  /**
   * @function
   * @summary mapping shaka/oipf error codes to unified error codes.
   * code mapping will be one to many.
   * @param {ErrorCodeTypes} errorType
   * @param {number} code
   */
  _getCode = (playerType: ErrorCodeTypes, code: number) => {
    if (!isNaN(code)) {
      const _errorList = ErrorCodes[playerType];
      let _mapCode = _errorList[code.toString()];
      return _mapCode ? _mapCode : ErrorHandler.DEFAULT_ERROR_CODE;
    } else {
      return ErrorHandler.DEFAULT_ERROR_CODE;
    }
  };

  /**
   * @function
   * @summary gets called when error occured.
   * @param {ErrorCodeTypes} errorType
   * @param {ShakaErrorParam | PluginErrorParam} errorData
   */
  triggerError = (
    errorType: ErrorCodeTypes,
    errorData: ShakaErrorParam | PluginErrorParam | OIPFErrorParam
  ) => {
    let event: OnErrorParam = {
      code: this._getCode(errorType, errorData.errorCode),
      nativeError: {
        platform: "Browser",
        details: errorData,
      },
    };
    if (this._onError) {
      this._onError(event);
    }
  };
}
