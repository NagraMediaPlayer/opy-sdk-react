import { func } from "prop-types";

declare module "@nagra/react-native-insight" {
  export interface NetworkEvent {
    statusCode: number;
    originURL: string;
    requestType: string;
    mediaType: string;
    loadStartTimestamp: number;
    loadCompleteTimestamp: number;
  }
  export interface InsightConfig {
    operatorId: string;
    deviceId: string;
    deviceType?: string;
    deviceManufacturer?: string;
    deviceModel?: string;
    appName?: string;
    appVersion?: string;
    osName?: string;
    osVersion?: string;
    screenWidth?: number;
    screenHeight?: number;
    screenDensity?: number;
    timezone?: string;
    samplingInterval?: number;
    reportingInterval?: number;
    maxRetryInterval?: number;
    maxSamplingSize?: number;
    collectorURL: string;
    frameDropEnabled?: boolean;
    minSessionLength?: number;
  }
  export interface LiveContent {
    channelId: string;
    channelName: string;
    eventId?: string;
    eventName?: string;
    genre?: Array<string>;
    scrambled?: boolean;
    bitrates?: Array<number>;
    duration?: number;
    uri?: string;
  }
  export interface VodContent {
    contentId: string;
    contentName: string;
    genre?: Array<string>;
    scrambled?: boolean;
    bitrates?: Array<number>;
    duration?: number;
    uri?: string;
  }
  export interface UserInfo {
    userId: string;
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
    corp?: string;
    node?: string;
  }
  function addErrorEvent(code: string, message: string): void;
  function addErrorWithType(code: string, message: string, type: string): void;
  function addNamedEvent(name: string, description: string): void;
  function addNetworkEvent(event: NetworkEvent): void;
  function buffering(): void;
  function getAgentVersion(cb: (version: string) => void): void;
  function getContent(cb: (content: string) => void): void;
  function initialize(config: InsightConfig): void;
  function pause(): void;
  function play(): void;
  function playing(): void;
  function seeking(): void;
  function seekTo(position: number): void;
  function setAudioLanguage(language: string): void;
  function setSubtitleLanguage(language: string): void;
  function setBitrate(bitrate: number): void;
  function setAvailableBitrates(availableBitrates: Array<number>): void;
  function setBitrateResolutionCodec(
    bitrate: number,
    resoluton: string,
    codec: string
  ): void;
  function setContentQuality(quality: string): void;
  function setFrameDrops(frameDrops: number): void;
  function setFramesPerSecond(fps: number): void;
  function setLiveContent(liveContent: LiveContent): void;
  function setVodContent(vodContent: VodContent): void;
  function setOffsetFromLive(offset: number): void;
  function setPosition(position: number): void;
  function setUserInfo(userInfo: UserInfo): void;
  function stop(): void;
  function terminate(): void;
}
