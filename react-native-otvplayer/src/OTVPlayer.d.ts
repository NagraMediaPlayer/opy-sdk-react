// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { FlexStyle } from "react-native";

import { OTVSDK_LOGLEVEL, AUDIO_ENCODING_TYPE, TEXT_ENCODING_TYPE, DRMTypes } from "./common/enums";

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
  encodeType: AUDIO_ENCODING_TYPE;
  channelCount: number;
  characteristics: string[];
}

export interface TextMediaTrack {
  language: string;
  title: string;
  encodeType: TEXT_ENCODING_TYPE;
  characteristics: string[];
}

export interface TextTrack {
  url: string;
  mimeType: string;
  language: string;
}

export interface SideLoadedTextTrack {
  label: string;
  language: string;
  src: string;
}

export interface OnTracksChangedParam {
  audioTracks: AudioMediaTrack[];
  textTracks?: TextMediaTrack[];
}

export interface OnAudioTrackSelectedParam {
  index: number;
}

export interface OnTextTrackSelectedParam {
  index: number;
}

export interface OnBitratesAvailableParam {
  bitrates: number[];
}

export interface OnLogParam {
  logs?: string;
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

export interface ThumbnailType {
  display?: boolean,
  positionInSeconds?: number,
  style?: ThumbnailStyle,
}

export interface ThumbnailStyle {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  borderWidth?: number;
  borderColor?: any;
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

export interface OnHttpErrorParam {
  url: string;
  date: Date;
  statusCode: number;
  message: string;
  platform?: {
    name: "Android" | "iOS" | "Web";
    data: string[];
  }
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
  genre?: [];
  scrambled?: boolean;
  bitrates?: [];
  duration?: number;
  uri?: string;
}
interface ContentType {
  LIVE: "LIVE";
  CU: "CU";
  SO: "SO";
  CDVR: "CDVR";
  PVR: "PVR";
}
export interface LiveContentInfo {
  channelId: string;
  channelName: string;
  eventId?: string;
  eventName?: string;
  genre?: [];
  scrambled?: boolean;
  bitrates?: [];
  duration?: number;
  uri?: string;
  type?: ContentType;
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

export interface Source {
  preferredDRM: string
  preferredPlayer: string | null
  src: string
  token: string
  tokenType: string | undefined | null
  type: string | undefined
}

export type OnLoadStartEvent = (event: OnLoadStartParam) => void;
export type OnLoadEvent = (event: OnLoadParam) => void;
export type OnLoadedDataEvent = () => void;
export type OnProgressEvent = (event: OnProgressParam) => void;
export type OnStatisticsUpdateEvent = (event: StatisticsInformation) => void;
export type OnSeekEvent = (event: OnSeekParam) => void;
export type OnTracksChangedEvent = (event: OnTracksChangedParam) => void;
export type OnBitratesAvailableEvent = (
  event: OnBitratesAvailableParam
) => void;
export type OnAudioTrackSelectedEvent = (
  event: OnAudioTrackSelectedParam
) => void;
export type OnTextTrackSelectedEvent = (
  event: OnTextTrackSelectedParam
) => void;
export type OnSelectedBitrateChangedEvent = (event: OnSelectedBitrateChangedParam) => void;
export type OnDownloadResChangedEvent = (event: OnDownloadResChangedParam) => void;
export type Seek = (position: number) => void;
export type Play = () => void;
export type Pause = () => void;
export type SelectAudioTrack = (index: number) => void;
export type SelectTextTrack = (index: number) => void;
export type setSDKLogLevel = (level: OTVSDK_LOGLEVEL, emitToJs?: boolean) => void;
export type getVersion = () => SDKVersion;
export type OnErrorEvent = (event: OnErrorParam) => void;
export type OnHttpErrorEvent = (event: OnHttpErrorParam) => void;
export type Stop = () => void;
export type SetLiveContent = (content: LiveContentInfo) => void;
export type SetVodContent = (content: VodContentInfo) => void;
export type SetUserInfo = (userInfo: UserInfo) => void;
export type OnLicenseRequest = (keySystem: string, source: Source | null, requestPayload: ArrayBuffer | null, messageType: string) => Promise<any>
export type OnLogEvent = (
  event: OnLogParam
) => void;
export interface OTVPlayerProps {
  source: {
    src: string;
    type?: string;
    token?: string;
    tokenType?: string;
    textTracks?: TextTrack[];
    preferredAudioLanguage?: string;
    drm?: {
      type: DRMTypes;
      licenseURL: string;
      certificateURL?: string;
      ssmServerURL?: string;
      ssmSyncMode?: boolean;
    };
  };
  autoplay?: boolean;
  progressUpdateInterval?: number;
  statisticsConfig: {
    statisticsTypes?: number;
    statisticsUpdateInterval?: number;
  };
  style?: FlexStyle;
  maxResolution?: Resolution;
  availableBitrate: [];
  onLoadStart?: OnLoadStartEvent;
  onLoad?: OnLoadEvent;
  onLoadedData?: OnLoadedDataEvent;
  onLicenseRequest?: OnLicenseRequest;
  onPlay?: Function;
  onPlaying?: Function;
  onPaused?: Function;
  onProgress?: OnProgressEvent;
  onSeek?: OnSeekEvent;
  onEnd?: Function;
  onWaiting?: Function;
  onSelectedBitrateChanged?: OnSelectedBitrateChangedEvent;
  onDownloadResChanged?: OnDownloadResChangedEvent;
  volume?: number;
  muted?: boolean;
  maxBitrate?: number;
  thumbnail?: ThumbnailType;
  onTracksChanged?: Function;
  onBitratesAvailable?: Function;
  onAudioTrackSelected?: Function;
  onTextTrackSelected?: Function;
  onError: OnErrorEvent;
  onHttpError: OnHttpErrorEvent;
  onStopped?: Function;
  onStatisticsUpdate?: OnStatisticsUpdateEvent;
  onThumbnailAvailable?: Function;
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
  insightAgent: InsightAgentType;
}
