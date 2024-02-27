// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
declare module "@nagra/react-otvplayer" {
  import { FlexStyle } from "react-native";
  import React from 'react';

  export interface SDKVersion {
    sdkVersion: string;
    otvPlayerVersion: string;
  }
  export interface OnLoadStartParam {
    src: string;
    type: string;
  }

  export interface OnLoadParam {
    duration: number;
    naturalSize: {
      width: number;
      height: number;
    };
  }

  export interface OnSelectedBitrateChangedParam {
    bitrate: number;
  }

  export interface OnDownloadResChangedParam {
    width: number;
    height: number;
  }

  export interface AudioMediaTrack {
    language: string;
    title: string;
    encodeType: 0 | 1 | 2 | 3 | 1000;
  }

  export interface TextMediaTrack {
    language: string;
    title: string;
    encodeType: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 1000;
    characteristics: string[];
  }

  export interface TextTrack {
    url: string;
    mimeType: string;
    language: string;
  }

  export interface OnTracksChangedParam {
    audioTracks: AudioMediaTrack[];
    textTracks?: TextMediaTrack[];
  }

  export interface OnBitratesAvailableParam {
    bitrates: number[];
  }

  export interface OnTextTrackSelectedParam {
    index: number;
  }

  export interface OnAudioTrackSelectedParam {
    index: number;
  }

  export interface OnLogParam {
    logs: string;
  }

  export interface OTVPlayerRef {
    play?: Play;
    pause?: Pause;
    seek?: Seek;
    selectAudioTrack?: SelectAudioTrack;
    selectTextTrack?: SelectTextTrack;
    stop?: Stop;
  }

  export interface OTVPlayerWithInsightRef extends OTVPlayerRef {
    setLiveContent: SetLiveContent;
    setVodContent: SetVodContent;
    setUserInfo: SetUserInfo;
  }

  export interface OnProgressParam {
    currentPosition: number;
    playableDuration: number;
    seekableDuration: number;
    currentTime: number;
  }
  export interface OnSeekParam {
    currentPosition: number;
    seekPosition: number;
  }

  export interface Resolution {
    width: number;
    height: number;
  }

  export interface ThumbnailStyle {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
    borderWidth?: number;
    borderColor?: any;
  }

  export interface ThumbnailType {
    display?: boolean,
    positionInSeconds?: number,
    style?: ThumbnailStyle
  }

  export interface OnErrorParam {
    code: number;
    nativeError: {
      platform: string;
      details: {
        errorSeverity?: number;
        errorCategory?: number;
        errorCode?: number;
        errorMessage?: string;
      };
    };
  }

  export interface Source {
    preferredDRM: string
    preferredPlayer: string | null
    src: string
    token: string
    tokenType: string | undefined | null
    type: string | undefined
  }

  export interface UserInfo {
    userId?: string;
    accountId?: string;
    fullName?: string;
    gender?: string;
    age?: number;
    ageRange?: string;
    category?: string;
    street?: string;
    city?: string;
    state?: string;
    postCode?: string;
    country?: string;
  }
  export interface VodContentInfo {
    contentId: string;
    contentName: string;
    genre?: string[];
    scrambled?: boolean;
    bitrates?: number[];
    duration?: number;
    uri?: string;
  }

  export interface LiveContentInfo {
    channelId: string;
    channelName: string;
    eventId?: string;
    eventName?: string;
    genre?: string[];
    scrambled?: boolean;
    bitrates?: number[];
    duration?: number;
    uri?: string;
    type?: string;
  }

  export interface StatisticsInformation {
    network?: {
      adaptiveStreaming?: {
        availableBitrates?: Array<number>;
        selectedBitrate?: number;
        bitrateSwitches?: number;
        bitrateDowngrade?: number;
        averageBitrate?: number;
        averageVideoBitrate?: number;
        averageAudioBitrate?: number;
      }
      contentServer?: {
        finalIPAddress?: string;
        finalURL?: string;
        url?: string;
        numberOfServerAddressChanges?: number;
      }
      networkUsage?: {
        bytesDownloaded?: number;
        downloadBitrate?: number;
        downloadBitrateAverage?: number;
        numberOfMediaRequests?: number;
        transferDuration?: number;
        downloadsOverdue?: number;
      }
    }
    playback?: {
      bufferedDuration?: number;
      availableResolutions?: ArrayBuffer;
      selectedResolution?: Resolution;
      streamBitrate?: number;
      startUpTime?: number;
      numberOfStalls?: number;
      playbackType?: string;
      playbackStartDate?: string;
      playbackStartOffset?: number;
    }
    rendering?: {
      frameDrops?: number;
      frameDropsPerSecond?: number;
      framesPerSecondNominal?: number;
      framesPerSecond?: number;
    }
  }

  export type OnLoadStartEvent = (event: OnLoadStartParam) => void;
  export type OnLoadEvent = (event: OnLoadParam) => void;
  export type OnLoadedDataEvent = () => void;
  export type OnProgressEvent = (event: OnProgressParam) => void;
  export type OnSeekEvent = (event: OnSeekParam) => void;
  export type OnTracksChangedEvent = (event: OnTracksChangedParam) => void;
  export type OnAudioTrackSelectedEvent = (
    event: OnAudioTrackSelectedParam
  ) => void;
  export type OnTextTrackSelectedEvent = (
    event: OnTextTrackSelectedParam
  ) => void;
  export type OnSelectedBitrateChangedEvent = (event: OnSelectedBitrateChangedParam) => void;
  export type OnDownloadResChangedEvent = (
    event: OnDownloadResChangedParam
  ) => void;
  export type OnLogEvent = (
    event: OnLogParam
  ) => void;

  export type OnStatisticsUpdateEvent = (event: StatisticsInformation) => void;
  export type Seek = (position: number) => void;
  export type Play = () => void;
  export type Pause = () => void;
  export type SelectAudioTrack = (index: number) => void;
  export type SelectTextTrack = (index: number) => void;
  export type getVersion = () => SDKVersion;
  export type OnErrorEvent = (event: OnErrorParam) => void;
  export type Stop = () => void;
  export type SetLiveContent = (content: LiveContentInfo) => void;
  export type SetVodContent = (content: VodContentInfo) => void;
  export type SetUserInfo = (userInfo: UserInfo) => void;
  export type OnLicenseRequest = (keySystem: string, source: Source | null, requestPayload: ArrayBuffer | null, messageType: 'certificate-request' | 'license-request' | 'license-renewal') => void

  export interface OTVPlayerProps {
    ref?: React.RefObject<OTVPlayerRef>;
    source: {
      src: string;
      type?: string;
      token?: string;
      tokenType?: string;
      textTracks?: TextTrack[];
      preferredAudioLanguage?: string;
      drm?: {
        type: "Widevine" | "Playready" | "Fairplay" | "Connect" | "TVKey";
        licenseURL: string;
        certificateURL?: string;
        ssmServerURL?: string;
        ssmSyncMode?: boolean;
      };
    };
    statisticsConfig?: {
      statisticsTypes?: 0 | 1 | 2 | 4 | 8 | 16 | 255;
      statisticsUpdateInterval?: number;
    };
    onStatisticsUpdate?: OnStatisticsUpdateEvent;
    autoplay?: boolean;
    progressUpdateInterval?: number;
    statisticsUpdateInterval?: number;
    thumbnail?: ThumbnailType;
    style?: FlexStyle;
    onLoadStart?: OnLoadStartEvent;
    onLoad?: OnLoadEvent;
    onLoadedData?: OnLoadedDataEvent;
    onPlay?: Function;
    onPlaying?: () => void;
    onPaused?: () => void;
    onProgress?: OnProgressEvent;
    onSeek?: OnSeekEvent;
    onEnd?: Function;
    onWaiting?: Function;
    onSelectedBitrateChanged?: OnSelectedBitrateChangedEvent;
    onDownloadResChanged?: OnDownloadResChangedEvent;
    volume?: number;
    muted?: boolean;
    maxBitrate?: number;
    maxResolution?: Resolution;
    onTracksChanged?: Function;
    onBitratesAvailable?: Function;
    onAudioTrackSelected?: Function;
    onTextTrackSelected?: Function;
    onError: OnErrorEvent;
    onStopped?: Function;
    onThumbnailAvailable?: Function;
    onLicenseRequest?: OnLicenseRequest;
    onLog?: Function;
  }

  export interface InsightAgentType {
    addErrorEvent: (code: string, message: string) => void;
    buffering: () => void;
    pause: () => void;
    play: () => void;
    playing: () => void;
    seekTo: (position: number) => void;
    setAudioLanguage: (language: string) => void;
    setAvailableBitrates: ([]) => void;
    setBitrate: (bitrate: number) => void;
    setFrameDrops: (countFrames: number) => void;
    setLiveContent: SetLiveContent;
    setOffsetFromLive: (offset: number) => void;
    setPosition: (position: number) => void;
    setSubtitleLanguage: (language: string) => void;
    setUserInfo: SetUserInfo;
    setVodContent: SetVodContent;
    stop: () => void;
  }
  export interface OTVPlayerWithInsightProps extends OTVPlayerProps {
    ref?: React.RefObject<OTVPlayerWithInsightRef>;
    insightAgent: InsightAgentType;
  }

  export interface OTVSDKManager {
    multiSession: boolean;
    /**
     * @function
     * @summary Retrieves the SDK Version.
     * @return SDKVersion
     */
    getVersion: () => {
      otvPlayerVersion: string;
      sdkVersion: string;
    };
    /**
     * @function
     * @summary to set RNPlugin log level and shaka player log level.
     * @param {number} level
     */
    setSDKLogLevel: (level: 0 | 1 | 2 | 3 | 4, emitToJs?: boolean) => void;
    /**
    * @function
    * @summary To reset Connect DRM for Android only
    * @param {string} xOpVault opvault for connect DRM
    * @param {string} type connect DRM reset type( "all" or "current")
    */
    connectFactoryReset: (xOpVault: string, type: string) => void;
  }

  export const OTVSDK: OTVSDKManager;
  export const OTVPlayerWithInsight: React.FC<OTVPlayerWithInsightProps>;
  const OTVPlayer: React.FC<OTVPlayerProps>;


  /**
   * OTVSDK_LOGLEVEL: const defined and exported.
   * OTVSDk_LOGLEVEL.ERROR = 0,
   * OTVSDk_LOGLEVEL.WARNING = 1,
   * OTVSDk_LOGLEVEL.INFO = 2,
   * OTVSDk_LOGLEVEL.DEBUG = 3,
   * OTVSDk_LOGLEVEL.VERBOSE = 4,
   */
  export const OTVSDK_LOGLEVEL;
  /**
  * STATISTICS_TYPES: const defined and exported.
  * STATISTICS_TYPES.NONE = 0,
  * STATISTICS_TYPES.ALL = ~0,
  * STATISTICS_TYPES.RENDERING = 1,
  * STATISTICS_TYPES.NETWORK = 1 << 1,
  * STATISTICS_TYPES.PLAYBACK = 1 << 2,
  * STATISTICS_TYPES.EVENT = 1 << 3,
  * STATISTICS_TYPES.DRM = 1 << 4,
  */
  export const STATISTICS_TYPES;

  /**
   * AUDIO_ENCODING_TYPE: const defined and exported.
   * AUDIO_ENCODING_TYPE.AAC = 0
   * AUDIO_ENCODING_TYPE.AC3 = 1
   * AUDIO_ENCODING_TYPE.DTS = 2
   * AUDIO_ENCODING_TYPE.MPEG = 3
   * AUDIO_ENCODING_TYPE.UNKNOWN = 1000
   */

  export const AUDIO_ENCODING_TYPE;

  /**
   * TEXT_ENCODING_TYPE: const defined and exported.
   * TEXT_ENCODING_TYPE.BITMAP = 0
   * TEXT_ENCODING_TYPE.EIA_608 = 1
   * TEXT_ENCODING_TYPE.EIA_708 = 2
   * TEXT_ENCODING_TYPE.ID3 = 3
   * TEXT_ENCODING_TYPE.SMPTE = 4
   * TEXT_ENCODING_TYPE.SRT = 5
   * TEXT_ENCODING_TYPE.WEBVTT = 6
   * TEXT_ENCODING_TYPE.UNKNOWN = 1000
   */

  export const TEXT_ENCODING_TYPE;

  /**
   * DRMTypes: const defined and exported.
   * DRMTypes.WIDEVINE = "Widevine"
   * DRMTypes.PLAYREADY = "Playready"
   * DRMTypes.FAIRPLAY = "Fairplay"
   * DRMTypes.TVKEY = "TVKey"
   * DRMTypes.CONNECT = "Connect"
   */

  export const DRMTypes;

  export default OTVPlayer;
}
