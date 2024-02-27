// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
export interface OTVPlayerProps {
  source?: {
    src: string;
    type?: string;
    token?: string;
    tokenType?: string;
    preferredAudioLanguage?: string;
    drm?: {
      type?: string;
      licenseURL?: string;
      certificateURL?: string;
      ssmServerURL?: string;
      ssmSyncMode?: boolean;
    };
  };
  seek?: {
    time: number;
  };
  autoplay?: boolean;
  volume?: number;
  muted?: boolean;
  maxBitrate?: number;
  progressUpdateInterval?: number;
  thumbnail?: ThumbnailType;
  style?: any;
  onLoadStart?: Function;
  onLoad: Function;
  onPlay: Function; // paired with onPause
  onPaused?: Function;
  onWaiting?: Function;
  onPlaying?: Function; // needs to be implemented. Paired with onWaiting
  onTracksChanged?: Function;
  onAudioTrackSelected?: Function;
  onTextTrackSelected?: Function;
  onProgress?: Function;
  onSeek?: Function;
  onEnd?: Function;
  onError?: Function;
  onStatisticsUpdate?: Function;
  onStopped?: Function;
  maxResolution?: {
    width?: number;
    height?: number;
  };
  statisticsConfig?: {
    statisticsTypes?: number,
    statisticsUpdateInterval?: number,
  };
  onDownloadResChanged?: Function;
  onBitratesAvailable?: Function;
  onSelectedBitrateChanged?: Function;
  onThumbnailAvailable?: Function;
  onLog?: Function;
}

export interface PlayerSource {
  src: string;
  type?: string;
  token?: string;
  tokenType?: string;
  drm?: {
    type?: string;
    licenseURL?: string;
    certificateURL?: string;
    ssmServerURL?: string;
    ssmSyncMode?: boolean;
  };
}

export interface OttPlayerSource {
  src: string;
  type?: string;
  token?: string;
  tokenType?: string;
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

export interface OnLoadStartEvent {
  src?: string;
  type?: string;
}

export interface OnLoadStartNativeEvent {
  nativeEvent: OnLoadStartEvent;
}

export interface OnLoadEvent {
  duration?: number;
  naturalSize?: {
    width: number;
    height: number;
  };
}
export interface OnLoadNativeEvent {
  nativeEvent: OnLoadEvent;
}

export const enum OTTMimeTypes {
  DASH = "application/dash+xml",
  HLS = "application/x-mpegURL",
}

export const enum EncryptionTypes {
  WIDEVINE = "com.widevine.alpha",
  PLAYREADY = "com.microsoft.playready",
  TVKEY = "com.tvkey.drm",
  FAIRPLAY = "com.apple.fps",
}

/*
export interface ChannelConfig {
  readonly idType: number;
  readonly channeType: number;
  readonly ccid: string;
  readonly onid: string;
  readonly tsid: string;
  readonly nid: string;
  readonly name: string;
  readonly ipBroadcastId: string;
}

export interface Channel {
  isBroadcast: boolean;
}

export interface ServiceInfo {
  isBroadcast: boolean;
  channel: ChannelConfig;
}

//Not needed
export enum BroadcastType {
  DVB = "DVB",
  IPTV = "IPTV",
}


export enum ServiceType {
  ID_DVB_C = 10,
  ID_DVB_S = 11,
  ID_DVB_T = 12,
  ID_IPTV_SDS = 40,
  ID_IPTV_URI = 41,
}

export enum Events {
  channelChangeSuccess = "ChannelChangeSucceeded",
}
*/

export interface OTVPlayerRef {
  play?: Function;
  pause?: Function;
  stop?: Function;
}

export interface OIPFVideoRef {
  addEventListener: Function;
  removeEventListener: Function;
  playState?: number;
  getChannelConfig?: Function;
  style: {
    visibility: string | number;
    left: string | number;
    top: string | number;
    height: string | number;
    width: string | number;
  };
  stop: Function;
}

export interface OIPFChannelConfig {
  channelList: {
    getChannelByTriplet: Function;
  };
  getBroadcastSupervisor: Function;
}

export interface OnProgressEvent {
  currentTime: number;
  currentPosition: number;
  playableDuration: number;
  seekableDuration: number;
}

export interface OnProgressNativeEvent {
  nativeEvent: OnProgressEvent;
}

export interface SelectedMediaTrack {
  title: string;
  language: string;
  encodeType: number;
}

export interface AvailableMediaTrack extends SelectedMediaTrack {
  enabled: boolean;
}

export interface AvailableTextTrack extends AvailableMediaTrack {
  characteristics: string[];
}

export interface OnTracksChangedEvent {
  audioTracks?: AvailableMediaTrack[];
  textTracks?: AvailableTextTrack[];
}

export interface OnTracksChangedNativeEvent {
  nativeEvent: OnTracksChangedEvent;
}

export interface OnAudioTrackSelectedEvent {
  index: number;
}

export interface OnAudioTrackSelectedNativeEvent {
  nativeEvent: OnAudioTrackSelectedEvent;
}

export interface OnTextTrackSelectedEvent {
  index: number;
}

export interface OnTextTrackSelectedNativeEvent {
  nativeEvent: OnTextTrackSelectedEvent;
}

export interface OnSeekEvent {
  currentPosition: number;
  seekPosition: number;
}

export interface OnSeekNativeEvent {
  nativeEvent: OnSeekEvent;
}

export interface OnEndEvent {
  // intentionally empty
}

export interface OnEndNativeEvent {
  nativeEvent: OnEndEvent;
}

export interface OnPlayEvent {
  // intentionally empty
}

export interface OnPlayNativeEvent {
  nativeEvent: OnPlayEvent;
}

export interface OnPausedEvent {
  // intentionally empty
}

export interface OnPausedNativeEvent {
  nativeEvent: OnPausedEvent;
}

export interface OnWaitingEvent {
  // intentionally empty
}

export interface OnWaitingNativeEvent {
  nativeEvent: OnWaitingEvent;
}

export interface OnPlayingEvent {
  // intentionally empty
}

export interface OnPlayingNativeEvent {
  nativeEvent: OnPlayingEvent;
}

export interface OnErrorEvent {
  // intentionally empty
  // awaiting full implementation
}

export interface OnErrorNativeEvent {
  nativeEvent: OnErrorEvent;
}

export interface Resolution {
  width: number;
  height: number;
}

export interface StatisticsInformation {
  network: {
    adaptiveStreaming: {
      availableBitrates?: Array<number>;
      selectedBitrate?: number;
      bitrateSwitches?: number;
      bitrateDowngrade?: number;
      averageBitrate?: number;
      averageVideoBitrate?: number;
      averageAudioBitrate?: number;
    }
    contentServer: {
      finalIPAddress?: string;
      finalURL?: string;
      url?: string;
      numberOfServerAddressChanges?: number;
    }
    networkUsage: {
      bytesDownloaded?: number;
      downloadBitrate?: number;
      downloadBitrateAverage?: number;
      numberOfMediaRequests?: number;
      transferDuration?: number;
      downloadsOverdue?: number;
    }
  }
  playback: {
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
  rendering: {
    frameDrops?: number;
    frameDropsPerSecond?: number;
    framesPerSecondNominal?: number;
    framesPerSecond?: number;
  }
}

export interface OnStatisticsUpdateEvent {
  eventData: StatisticsInformation;
}

export interface OnStatisticsUpdateNativeEvent {
  nativeEvent: OnStatisticsUpdateEvent;
}

export interface OnBitratesAvailableEvent {
  availableBitrates: Array<number>
}

export interface OnBitratesAvailableNativeEvent {
  nativeEvent: OnBitratesAvailableEvent
}
export interface OnSelectedBitrateEvent {
  selectedBitrate: number
}
export interface OnSelectedBitrateNativeEvent {
  nativeEvent: OnSelectedBitrateEvent
}
export interface OnDownloadResChangedEvent {
  width: number,
  height: number
}

export interface OnDownloadResChangedNativeEvent {
  nativeEvent: OnDownloadResChangedEvent
}
export interface OnLogEvent {
  logs?: string;
}

export interface OnThumbnailAvailableEvent {
  // intentionally empty
}

export interface OnLogNativeEvent {
  nativeEvent: OnLogEvent;
}

export interface ErrorObjectTypes {
  code: string;
  message: string;
}

export const enum PlatformType {
  WEB = "web",
  ANDROID = "android",
  IOS = "ios",
}

export const enum ContentType {
  LIVE = "live",
  VOD = "vod",
}