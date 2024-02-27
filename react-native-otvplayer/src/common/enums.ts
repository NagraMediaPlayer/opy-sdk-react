// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * The available stats when setting the 'statisticsEnabled' property.
 * Use bitwise or to enable multiple groups, eg. RENDERING | NETWORK | DRM
 * @enum {number}
 * @property {number} STATISTICS_TYPES.NONE 0 
 * @property {number} STATISTICS_TYPES.ALL  ~0
 * @property {number} STATISTICS_TYPES.RENDERING 1
 * @property {number} STATISTICS_TYPES.NETWORK 1<<1
 * @property {number} STATISTICS_TYPES.PLAYBACK 1<<2
 * @property {number} STATISTICS_TYPES.EVENT 1<<3
 * @property {number} STATISTICS_TYPES.DRM 1<<4
 */

export enum STATISTICS_TYPES {
    NONE = 0,
    ALL = ~0,
    RENDERING = 1,
    NETWORK = 1 << 1,
    PLAYBACK = 1 << 2,
    EVENT = 1 << 3,
    DRM = 1 << 4,
};

/**
 * The available detail-levels for the SDK's logs
 * @enum {number}
 * @property {number} OTVSDK_LOGLEVEL.ERROR 0
 * @property {number} OTVSDK_LOGLEVEL.WARNING 1
 * @property {number} OTVSDK_LOGLEVEL.INFO 2
 * @property {number} OTVSDK_LOGLEVEL.DEBUG 3
 * @property {number} OTVSDK_LOGLEVEL.VERBOSE 4
 */
export enum OTVSDK_LOGLEVEL {
    ERROR = 0,
    WARNING = 1,
    INFO = 2,
    DEBUG = 3,
    VERBOSE = 4,
};

/**
 * The supported audio track encoding types.
 * @enum {number}
 * @property {number} AUDIO_ENCODING_TYPE.AAC 0
 * @property {number} AUDIO_ENCODING_TYPE.AC3 1
 * @property {number} AUDIO_ENCODING_TYPE.DTS 2
 * @property {number} AUDIO_ENCODING_TYPE.MPEG 3
 * @property {number} AUDIO_ENCODING_TYPE.UNKNOWN 1000
 */
export enum AUDIO_ENCODING_TYPE {
    AAC = 0,
    AC3 = 1,
    DTS = 2,
    MPEG = 3,
    UNKNOWN = 1000,
};

/**
 * The supported text track encoding types.
 * @enum {number}
 * @property {number} TEXT_ENCODING_TYPE.BITMAP 0  
 * @property {number} TEXT_ENCODING_TYPE.EIA_608 1 
 * @property {number} TEXT_ENCODING_TYPE.EIA_708 2
 * @property {number} TEXT_ENCODING_TYPE.ID3 3
 * @property {number} TEXT_ENCODING_TYPE.SMPTE 4
 * @property {number} TEXT_ENCODING_TYPE.SRT 5
 * @property {number} TEXT_ENCODING_TYPE.WEBVTT 6
 * @property {number} TEXT_ENCODING_TYPE.UNKNOWN 1000
 */
export enum TEXT_ENCODING_TYPE {
    BITMAP = 0,
    EIA_608 = 1,
    EIA_708 = 2,
    ID3 = 3,
    SMPTE = 4,
    SRT = 5,
    WEBVTT = 6,
    UNKNOWN = 1000,
};

/**
 * supported DRM types
 * @enum {string}
 * @property {string} DRMTypes.WIDEVINE "Widevine"
 * @property {string} DRMTypes.PLAYREADY "Playready"
 * @property {string} DRMTypes.FAIRPLAY  "Fairplay"
 * @property {string} DRMTypes.TVKEY "TVKey"
 * @property {string} DRMTypes.CONNECT "Connect"
 */
export enum DRMTypes {
    WIDEVINE = "Widevine",
    PLAYREADY = "Playready",
    TVKEY = "TVKey",
    FAIRPLAY = "Fairplay",
    CONNECT = "Connect",
}

