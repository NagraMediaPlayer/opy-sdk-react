// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import {
  OnLoadStartEvent,
  OnLoadEvent,
  OnProgressEvent,
  OnSeekEvent,
  Seek,
  Play,
  Pause,
  OnAudioTrackSelectedEvent,
  OnTextTrackSelectedEvent,
  OnTracksChangedEvent,
  OnBitratesAvailableEvent,
  SelectAudioTrack,
  SelectTextTrack,
  OnErrorEvent,
  TextTrack,
  DRMTypes,
  OnSelectedBitrateChangedEvent,
  OnResolutionChangedEvent,
  OnLoadedDataEvent,
  Stop,
  SetVodContent,
  SetLiveContent,
  SetUserInfo,
  OnStatisticsUpdateEvent,
  ThumbnailStyle,
  OnLicenseRequest
} from "./../../OTVPlayer.d";
import { ErrorHandler } from "./ErrorHandler";

import { FlexStyle } from "react-native";

declare global {
  interface Window {
    oipfObjectFactory: Object;
  }
}
export interface NativeEventProps {
  onLoadStart: OnLoadStartEvent;
  onLoad: OnLoadEvent;
  onLoadedData: OnLoadedDataEvent;
  onPlaying: () => void;
  onPaused: () => void;
  onPlay: () => void;
  onProgress: OnProgressEvent;
  onSeek: OnSeekEvent;
  onEnd: () => void;
  onWaiting: () => void;
  onTracksChanged: OnTracksChangedEvent;
  onBitratesAvailable: OnBitratesAvailableEvent;
  onAudioTrackSelected: OnAudioTrackSelectedEvent;
  onTextTrackSelected: OnTextTrackSelectedEvent;
  errorHandler: ErrorHandler;
  onSelectedBitrateChanged: OnSelectedBitrateChangedEvent;
  onDownloadResChanged: OnDownloadResChangedEvent;
  onStopped: Function;
  onStatisticsUpdate: OnStatisticsUpdateEvent;
  onThumbnailAvailable?: Function;
  onLicenseRequest?: OnLicenseRequest;
}

type OIPFonLoad = (channelName: string) => void;

export interface NativePlayerProps {
  source: PlayerSource;
  autoplay: boolean;
  style?: FlexStyle;
  volume?: number;
  muted?: boolean;
  _onLoadStart: OnLoadStartEvent;
  _onLoad: OnLoadEvent;
  _onLoadedData: OnLoadedDataEvent;
  play: Play;
  pause: Pause;
  seek: Seek | Function; //TODO: check if void method signature can be used
  onLoad: OnLoadEvent | OIPFonLoad;
  onLoadedData: OnLoadedDataEvent;
  onLoadStart: OnLoadStartEvent | Function; //TODO: check if void method signature can be used
  onSelectedBitrateChanged: OnSelectedBitrateChangedEvent;
  onDownloadResChanged: OnDownloadResChangedEvent;
}

export interface OttPlayerProps extends NativePlayerProps {
  progressInterval: number;
  _statisticsInterval?: number;
  _statisticTypeInfo?: number;
  _thumbnailStyle?: ThumbnailStyle;
  _displayThumbnail?: boolean;
  _thumbnailPosition?: number;
  _onPlaying: () => void;
  _paused: () => void;
  _onProgress: OnProgressEvent;
  _onSeek: OnSeekEvent;
  onPlaying: () => void;
  onPaused: () => void;
  _onStopped: () => void;
  _onThumbnailAvailable?: () => void;
  _onStatisticsUpdate: OnStatisticsUpdateEvent;
  onSeek: OnSeekEvent;
  _onSelectedBitrateChanged?: OnSelectedBitrateChangedEvent;
  _onDownloadResChanged?: OnDownloadResChangedEvent;
  initialiseSDKPlayerSuccessCallback: () => void;
  initialiseSDKPlayerFailureCallback: () => void;
  getAvailableSeekableRange: () => {
    start: number;
    end: number;
    duration: number;
  };
  dispatchProgressEvent: () => void;
  dispatchStatisticsEvent: () => void;
  jitterizeInterval: (baseInterval: number, prevTime: number) => number;
  createEventProgressTimer: () => void;
  createEventStatisticsTimer: () => void;
  isSrcTypeSupported: (srcType: string) => void;
  addTextTracks: (textTracks: TextTrack[]) => void;
  getEncryptionType: (source: PlayerSource) => string;
}

export interface IPTVPlayerProps extends NativePlayerProps {
  videoRef: OIPFVideoRef;
  configRef: OIPFConfigRef;
}

export interface PlayerSource {
  src: string;
  type?: string;
  token?: string;
  tokenType?: string;
  textTracks?: TextTrack[];
  preferredAudioLanguage?: string;
  drm?: {
    type: DRMTypes | null; // keep default to null
    licenseURL: string;
    certificateURL?: string;
    ssmServerURL?: string;
  };
}

export interface OttPlayerSource {
  src: string;
  type?: string;
  token?: string;
  tokenType?: string;
  preferredDRM?: EncryptionTypes;
  textTracks?: TextTrack[];
}

export interface SsmSessionInfo {
  sessionToken?: string;
  serverUrl?: string;
}

export interface CustomDataResponse {
  sessionToken?: string;
}
export interface SsmResponse {
  sessionToken?: string;
  serverUrl?: string;
  heartbeat?: number;
}

export interface ContentInformation {
  serverUrl?: string;
  source?: string;
  sessionToken?: string;
  serverResponse?: any;
}

export const enum BroadcastPlayStates {
  UNREALIZED = 0,
  CONNECTING = 1,
  PRESENTING = 2,
  STOPPED = 3,
}

export const enum OTTPlayerStates {
  UNINITIALISED = 0,
  INITIALISING = 1,
  INITIALISED = 2,
  PLAY_REQUESTED = 3, // src change requested
  LOADED = 4, // onLoad triggered
  PLAY = 5,
  PLAYING = 6,
  PAUSED = 7,
  STOPPED = 8,
  ERROR = 9,
  WAITING = 10,
  SOURCE_SET = 11,
}

export const enum DRMStates {
  INACTIVE,
  AWAITING_CONTENT_TOKEN,
  AWAITING_SESSION_TOKEN,
  LICENSE_REQUESTED,
  ACTIVE,
  RENEWAL_REQUESTED,
  ERROR
}

export const enum SSMStates {
  SESSION_OFF,
  SESSION_ON,
  SETUP_REQUESTED,
  TEARDOWN_REQUESTED,
  RENEWAL_REQUESTED,
  AWAITING_CONTENT_TOKEN,
  ERROR,
  SSM_DISABLED,
}

export const enum OIPFPlayerStates {
  INITIALISING = "initialising",
  INITIALISED = "initialised",
  PLAY_REQUESTED = "play_requested", // src change requested
  LOADED = "loaded", // onLoad triggered
  PLAY = "play",
  PLAYING = "playing",
  PAUSED = "paused",
  STOPPED = "stopped",
  ERROR = "error",
  WAITING = "waiting",
  UNREALIZED = "unrealized",
}

export const enum LicenseMsgTypes {
  CERTIFICATE_REQUEST = 'certificate-request',
  LICENSE_REQUEST = 'license-request',
  LICENSE_RENEWAL = 'license-renewal'
}
export const enum OTTMimeTypes {
  DASH = "application/dash+xml",
  HLS = "application/x-mpegURL",
}

export const enum OipfMimeTypes {
  IPTV_URI = "ID_IPTV_URI",
  IPTV_SDS = "ID_IPTV_SDS",
  DVB_CAB = "ID_DVB_C", //this needs to be moved to DVB_C implementation
}

export const enum OipfComponentTypes {
  COMPONENT_TYPE_VIDEO = 0,
  COMPONENT_TYPE_AUDIO = 1,
  COMPONENT_TYPE_SUBTITLE = 2,
  COMPONENT_TYPE_ALL = 3,
}

export const enum EncryptionTypes {
  WIDEVINE = "com.widevine.alpha",
  PLAYREADY = "com.microsoft.playready",
  TVKEY = "com.tvkey.drm",
  FAIRPLAY = "com.apple.fps",
  FAIRPLAY_1_0 = "com.apple.fps.1_0",
}

export const enum ContentTypes {
  SSM = "ssm",
  SSM_OR_NON_SSM = "ssm_or_nonssm",
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

type GetChannelConfig = () => OIPFChannelConfig;
type GetChannelByTriplet = (onid: number, tsid: number, sid: number) => {};
type OIPFEventListener = (event: string, cb: Function) => void;

export interface OTVPlayerRef {
  play: Play;
  pause: Pause;
  seek: Seek;
  selectAudioTrack: SelectAudioTrack;
  selectTextTrack: SelectTextTrack;
  stop: Stop;
}

export interface OTVPlayerWithInsightRef extends OTVPlayerRef {
  setLiveContent: SetLiveContent;
  setVodContent: SetVodContent;
  setUserInfo: SetUserInfo;
}

export interface OIPFChannelConfig {
  channelList: {
    getChannelByTriplet: GetChannelByTriplet;
  };
  getBroadcastSupervisor: () => {
    setChannel: (channelObj: object, value: boolean) => void;
  };
}

export interface OIPFVideoRef {
  addEventListener: OIPFEventListener;
  removeEventListener: OIPFEventListener;
  playState?: number;
  getChannelConfig?: GetChannelConfig;
  selectAudioTrack: SelectAudioTrack;
  getComponents: getComponents;
  getCurrentActiveComponents: getCurrentActiveComponents;
  selectComponent: selectComponent;
  unselectComponent: unselectComponent;
  style: {
    visibility: string | number;
    left: string | number;
    top: string | number;
    height: string | number;
    width: string | number;
    display: string;
  };
  stop: Function;
}

export interface OIPFConfigRef {
  localSystem: {
    volume: number;
    mute: boolean;
  };
  configuration: {
    preferredAudioLanguage: string;
    preferredSubtitleLanguage: string;
    subtitlesEnabled: boolean;
  };
}

export const enum SHAKA_LOG_LEVEL {
  ERROR = 1,
  WARNING,
  INFO,
  DEBUG,
  VERBOSE,
}

export interface ShakaErrorParam {
  errorSeverity: number;
  errorCategory: number;
  errorCode: number;
  errorMessage: string;
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

export interface Resolution {
  width: number;
  height: number;
}

export const enum ErrorCodeTypes {
  OTT = "OTT_ERROR_CODE",
  IPTV = "IPTV_ERROR_CODE",
  PLUGIN = "PLUGIN_ERROR_CODE",
}

export interface PluginErrorParam {
  errorCode: number;
  errorMessage: string;
  content?: ContentInformation;
}

export interface OIPFErrorParam {
  errorCode: number;
  errorState: number;
}

export interface ErrorHandler {
  _getCode: Function;
  triggerError: Function;
}

export const enum PlatformTypes {
  TVKeyCapable = "TVKeyCapable",
  SMARTTV = "smarttv",
  PC_SAFARI = "pc_safari",
}
