// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
// @ts-ignore

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Platform, Text, Alert, AppState } from 'react-native';
import TVEventHandler from '../TVEventHandler';
import OTVPlayer, { OTVSDK, OTVSDK_LOGLEVEL } from '@nagra/react-otvplayer';
import type {
  OTVPlayerRef,
  OnLoadStartParam,
  OnLoadParam,
  OnProgressParam,
  OnSeekParam,
  OnProgressEvent,
  OnTracksChangedParam,
  OnBitratesAvailableParam,
  OnErrorParam,
  OnAudioTrackSelectedParam,
  OnTextTrackSelectedParam,
  OnDownloadResChangedParam,
  OnLicenseRequest,
  TextTrack
} from '@nagra/react-otvplayer';
import {
  sourceList,
  sourceListClear,
  sourceListEncryptedSSP,
  sourceListEncryptedSSM,
} from '../constants/sourceList';
import VideoControls from '../components/VideoControls';
import VolumeControl from './VolumeControl';
import SeekTimeControl from './SeekTimeControl';
import BitrateAndResolution from './BitrateAndResolution';
import BitratePicker from './BitratePicker';
import ResolutionPicker from './ResolutionPicker';
import videoStyles from '../assets/styles/videoStyles';
import Logging from './Logging';
import EventLogging from './EventLogging';
import StatisticsLogging from './StatisticsLogging';
import ActionButton from './common/ActionButton';
import assets from '../constants/assets';
import { Slider } from 'react-native-elements';
import RNInsight from '@nagra/react-native-insight';

import {
  CONTENT_TYPE,
  AVAILABLE_RESOLUTION,
  VOLUME_DELTA,
  INIT_VOLUME,
  SEEK_TIME,
  SEEK_TIME_DELTA,
} from '../constants/constants';
import VideoPicker from './VideoPicker';
import PreferredAudioPicker from './PreferredAudioPicker';
import AudioPicker from './AudioPicker';
import SubtitlePicker from './SubtitlePicker';
import commonStyles from '../assets/styles/commonStyles';
import KeyHints from './KeyHints';
import serverList from '../constants/serverList';
import ServerPicker from './ServerPicker';
import * as LogLevelPicker from './LogLevelPicker';
import insightConfig from '../config/insightConfig';
import userInfo from '../config/userInfo';
import { LogBox } from 'react-native';
import { isHandheld, isLandscape, isMobileWeb, isSafari } from '../utils/helper';
import ConnectResetPicker from './ConnectResetPicker';
import controls from '../constants/controls';
import Header from './common/Header';

interface RefOTVPlayer {
  current: OTVPlayerRef;
}
let mediaTracks: OnTracksChangedParam;
let selectedAudioTrackIndex: number;
let selectedTextTrackIndex: any;
let selectedMaxBitrateIndex: number = 0;
let selectedResolutionIndex: number = 0;
let isSeek: boolean = false;
let channelChangeStartTime = Date.now();
let contentType: string;
let infoDisplay: number = 0;
const NUM_INFO_DISPLAYS = 4;
let duration = 0;
let tokenRequestTimer: ReturnType<typeof setTimeout>;
let tokenRequestTimeout: number = 3000;  // time in milliseconds
let contentToken: any;
let currentPos: number = 0;
let isThumbnailAvailable: boolean = false;
let paused: boolean = false;

interface Resolution {
  width: any;
  height: any;
}

const DRM_KEYSYSTEM = {
  WIDEVINE: 'com.widevine.alpha',
  PLAYREADY: 'com.microsoft.playready',
  FAIRPLAY: 'com.apple.fps',
  FAIRPLAY_1_0: 'com.apple.fps.1_0',
  TVKEY: 'com.tvkey.drm'
}

let initialThumbnailInfo = {
  display: false,
  positionInSeconds: 0,
  style: {
    top: 10,
    left: 10,
    width: 200,
    height: 200,
    borderWidth: 10.0,
    borderColor: '#ff0000',
  }
}

let opvault: string = ""
let OPVAULT_URL: string = "https://tenantname-ov.anycast.nagra.com/filedownload/v1/opvault/";

interface SourceType {
  src: string;
  type?: string;
  token?: string;
  tokenType?: string;
  textTracks?: TextTrack[];
  preferredAudioLanguage?: string;
  drm?: {
    type: "Widevine" | "Playready" | "Fairplay" | "TVKey" | "Connect";
    licenseURL: string;
    certificateURL?: string;
    ssmServerURL?: string;
    ssmSyncMode?: boolean;
  };
}

interface LicenseRequest {
  url: string,
  method: string,
  headers: any,
  token: string,
  payload: any,
  responseType: "text" | "arraybuffer",
  drmSystem: String
}
let currentSource: SourceType = { src: sourceList[0].source.src };
const Video = () => { //NOSONAR
  //@ts-ignore
  let otvplayerInstance: RefOTVPlayer = React.useRef();
  let tvEventHandler: any;
  tvEventHandler = new TVEventHandler();
  let currentSourceListIndex: number;
  let bitratesArr: any[];
  let channelPlayStartTime: number;
  let onLoadStartTimeDifference: number;
  let onPlayingTime: number;
  let onLoadStartTime: number;
  let statisticsData: any;

  const [selectedStream, setSelectedStream] = useState(sourceList[0]);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(INIT_VOLUME);
  const [playing, setPlaying] = useState(false);
  const [selectedBitrate, setSelectedBitrate] = useState(0);
  const [maxBitrate, setMaxBitrate] = useState(Infinity);
  const [availableBitrates, setAvailableBitrates] = useState([] as any); // The stream's declared bitrates
  const [selectableBitrates, setSelectableBitrates] = useState([] as any); // The declared bitrates, plus extra values for testing
  const [selectedResolution, setSelectedResolution] = useState<Resolution>({
    width: Infinity,
    height: Infinity,
  });
  const [currentResolution, setCurrentResolution] = useState<Resolution>({
    width: Infinity,
    height: Infinity,
  });
  const [progressPosition, setProgressPosition] = useState(0);
  const [selectedPreferredAudio, setSelectedPreferredAudio] = useState<string>("");  // No preferred audio set at the beginning
  const [selectedAudio, setSelectedAudio] = useState(0);
  const [selectedTextTrack, setSelectedTextTrack] = useState(-1);
  const [onLoadStartEvent, setOnLoadStartEvent] = useState(0);
  const [audioTracks, setAudioTracks] = useState([] as any);
  const [textTracks, setTextTracks] = useState([] as any);
  const [onPlayingEvent, setOnPlayingEvent] = useState(0);
  const [isLogEnabled, setLogIsEnabled] = useState(false);
  const [isBitrateLogEnabled, setBitrateLogIsEnabled] = useState(false);
  const [isKeyMapsEnabled, setKeyMapsIsEnabled] = useState(false);
  const [isEventLogEnabled, setEventLogIsEnabled] = useState(false);
  const [isStatisticsEnabled, setStatisticsEnabled] = useState(false);
  const [isInsightEnabled, setInsightEnabled] = useState(true);
  const [isFullscreenEnabled, setFullscreenEnabled] = useState(false);
  const [messageHistory, setMessageHistory] = useState([] as any);
  const [thumbnailInfo, setThumbnailInfo] = useState(initialThumbnailInfo)
  const [sliderValue, setSliderValue] = useState(0);
  const [seekTime, setSeekTime] = useState(SEEK_TIME);
  const [selectedServer, setSelectedServer] = useState(-1);
  const [isTimerOn, setTokenTimer] = useState(false);
  const [contentTokenTimeout, setContentTokenTimeout] = useState(tokenRequestTimeout);
  const [selectedContentToken, setContentToken] = useState(contentToken);
  const drm = useRef();
  const updatedStreamList = useRef([...sourceListClear]);
  const [level, setLevel] = useState(2);
  const [connectResetType, setConnectResetType] = useState<string>("all");
  const selectedStreamData = useRef(sourceList[0]);
  const appState = useRef(AppState.currentState);
  const [focusOnEnter, setFocusOnEnter] = useState("");
  const [focusedControl, setFocusedControl] = useState(Platform.OS === "web" ? controls[0] : null);
  const [infoEnabled, setInfoEnabled] = useState(false);
  const logLevels = [
    OTVSDK_LOGLEVEL.ERROR,
    OTVSDK_LOGLEVEL.WARNING,
    OTVSDK_LOGLEVEL.INFO,
    OTVSDK_LOGLEVEL.DEBUG,
    OTVSDK_LOGLEVEL.VERBOSE,
    -1
  ];
  const preferredAudioTracks = [
    { "title": "English", "code": "en" },
    { "title": "French", "code": "fr" },
    { "title": "Spanish", "code": "es" },
    { "title": "German", "code": "de" },
    { "title": "Italian", "code": "it" },
    { "title": "Reset", "code": "" },
  ];
  const resetTypes = [
    "all",
    "current"
  ];

  const toggleLogButton = () =>
    setLogIsEnabled((previousState) => !previousState);
  const toggleBitrateButton = () =>
    setBitrateLogIsEnabled((previousState) => !previousState);
  const toggleKeyMapsButton = () =>
    setKeyMapsIsEnabled((previousState) => !previousState);
  const toggleEventLogButton = () =>
    setEventLogIsEnabled((previousState) => !previousState);
  const toggleStatisticsButton = () =>
    setStatisticsEnabled((previousState) => !previousState);
  const toggleInsightButton = () => {
    // Close down if it was on and now turned of
    isInsightEnabled && RNInsight.terminate();

    // But re-init if its the other direction
    initializeRNInsight(!isInsightEnabled);

    setInsightEnabled((previousState) => !previousState);
  };

  const toggleInfo = () => {
    setInfoEnabled((previousState) => !previousState);
  }

  const toggleFullscreenButton = () =>
    setFullscreenEnabled((previousState) => !previousState);
  const playContent = () => rcuKeyHandler(null, { eventType: 'play' });
  const pauseContent = () => rcuKeyHandler(null, { eventType: 'pause' });
  const muteContent = () => rcuKeyHandler(null, { eventType: '(un)Mute' });
  const volumeUp = () => rcuKeyHandler(null, { eventType: 'Vol Up' });
  const volumeDown = () => rcuKeyHandler(null, { eventType: 'Vol Down' });
  const onSeekBack = () => rcuKeyHandler(null, { eventType: 'Seek Back' });
  const onSeekForward = () => rcuKeyHandler(null, { eventType: 'Seek Fwd' });
  const seekTimeUp = () => rcuKeyHandler(null, { eventType: 'Seek Time Up' });
  const seekTimeDown = () => rcuKeyHandler(null, { eventType: 'Seek Time Down' });
  const stopContent = () => rcuKeyHandler(null, { eventType: 'Stop' });

  const factoryResetConnect = () => {
    console.log(`Resetting connect DRM`);
    OTVSDK.connectFactoryReset(opvault, connectResetType);
  }

  // @ts-ignore
  const rcuKeyHandler = (component, event) => {
    console.log('Player Key event: ', event);
    switch (event.eventType) {
      case 'play':
        // @ts-ignore
        otvplayerInstance.current.play();
        if (!isTimerOn) { startTokenUpdateTimer(); }
        paused = false;
        break;

      case 'pause':
        // @ts-ignore
        otvplayerInstance.current.pause();
        paused = true;
        break;

      case 'play/pause':
        if (paused === false) {
          // @ts-ignore
          otvplayerInstance.current.pause();
          paused = true;
        } else {
          // @ts-ignore
          otvplayerInstance.current.play();
          paused = false;
        }
        break;

      case 'Seek Back':
        if (Platform.OS !== 'web') {
          isInsightEnabled && RNInsight.seeking();
        }
        // @ts-ignore
        otvplayerInstance.current.seek(
          Math.max(0, currentPos - seekTime),
        );
        break;

      case 'Seek Fwd':
        if (Platform.OS !== 'web') {
          isInsightEnabled && RNInsight.seeking();
        }
        // @ts-ignore
        otvplayerInstance.current.seek(currentPos + seekTime);
        break;

      case 'Vol Up':
        setVolume((prevVolumeLevel) =>
          Math.min(1, prevVolumeLevel + VOLUME_DELTA),
        );
        break;

      case 'Vol Down':
        setVolume((prevVolumeLevel) =>
          Math.max(0, prevVolumeLevel - VOLUME_DELTA),
        );
        break;

      case 'Seek Time Up':
        setSeekTime((prevSeekTime) => prevSeekTime + SEEK_TIME_DELTA);
        break;

      case 'Seek Time Down':
        setSeekTime((prevSeekTime) =>
          Math.max(5, prevSeekTime - SEEK_TIME_DELTA),
        );
        break;

      case '(un)Mute':
        setMuted((prevMuteStatus) => !prevMuteStatus);
        break;

      case 'channelUp':
        currentSourceListIndex =
          currentSourceListIndex === sourceList.length - 1
            ? 0
            : currentSourceListIndex + 1;
        setVideoContent(currentSourceListIndex);
        break;

      case 'channelDown':
        currentSourceListIndex =
          currentSourceListIndex === 0
            ? sourceList.length - 1
            : currentSourceListIndex - 1;
        setVideoContent(currentSourceListIndex);
        break;

      case 'audioTrk':
        selectNextAudioTrack();
        break;

      case 'textTrk':
        selectNextTextTrack();
        break;

      case 'resolution':
        selectNextResolution();
        break;

      case 'bitrate':
        selectNextBitrate();
        break;

      case 'LogLevel':
        toggleLogButton();
        break;

      case 'Reset Perf Data':
        setOnLoadStartEvent(0);
        setOnPlayingEvent(0);
        break;

      case 'events':
        toggleEventLogButton();
        break;

      case 'Bitrate':
        toggleBitrateButton();
        break;

      case 'Stats':
        toggleStatisticsButton();
        break;

      case 'InsightInfo':
        toggleInsightButton();
        break;

      case 'KeyHints':
        toggleKeyMapsButton();
        break;

      case 'cycleInfo':
        infoDisplay++;
        switch (infoDisplay % (NUM_INFO_DISPLAYS + 1)) {
          case 1:
            toggleBitrateButton();
            break;
          case 2:
            toggleLogButton();
            break;
          case 3:
            toggleEventLogButton();
            break;
          case 4:
            toggleKeyMapsButton();
            break;
          case 0:
            toggleBitrateButton();
            toggleLogButton();
            toggleEventLogButton();
            toggleKeyMapsButton();
            break;
        }
        break;

      case 'Stop':
        // @ts-ignore
        otvplayerInstance.current.stop();
        setProgressPosition(0);
        setSliderValue(0);
        currentPos = 0;
        paused = true;
        if (isTimerOn) { setTokenTimer(false); clearTimeout(tokenRequestTimer); }
        break;

      case 'Show TN':
        setThumbnailInfo((previousState) => {
          return { ...previousState, positionInSeconds: currentPos, display: !previousState.display }
        });
        break;

      case 'Factory Reset':
        OTVSDK.connectFactoryReset(opvault, connectResetType);
        break;

      case 'Info':
        toggleInfo();
        break;

      case 'Select Stream':
      case 'Select Preferred Audio':
      case 'Select Audio':
      case 'Select Subtitle':
      case 'Select Resolution':
      case 'Select Bitrate (kbps)':
      case 'Select Log Level':
      case 'Select Connect Reset Type':
        setFocusOnEnter(event.eventType);
        break;

      default:
        // do nothing
        break;
    }
  };

  const handleEvent = (eventMessage: string) => {
    const currentTime = new Date(Date.now());
    const messageStr = `[${currentTime.toISOString()}] ${eventMessage}\n`;
    setMessageHistory((prevHist: any) => [messageStr, ...prevHist]);
  };

  const handleAppStateChange = (nextAppState: string) => {
    console.log("Appstate " + nextAppState)
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // Avoid resume if user has paused or stopped by hand.
      if (otvplayerInstance != null && !paused) {
        //@ts-ignore
        otvplayerInstance.current.play();
      }
    } else if (nextAppState === 'background') {
      if (otvplayerInstance != null) {
        //@ts-ignore
        otvplayerInstance.current.pause();
      }
    }
    //@ts-ignore
    appState.current = nextAppState;
  }

  const opVaultDownload = async () => {
    try {
      const response = await fetch(
        OPVAULT_URL,
      );
      const json = await response.json();
      opvault = JSON.stringify(json);
      console.log("opvault : " + opvault);
    } catch (error) {
      console.error(error);
    }
  };

  const initializeRNInsight = (enabled: boolean) => {
    if (Platform.OS === 'web') {
      enabled && RNInsight.initialize(insightConfig);
      enabled && RNInsight.setUserInfo(userInfo);
    } else {
      // @ts-ignore
      enabled && RNInsight.initialize(insightConfig, userInfo);
    }
  };


  useEffect(() => {
    console.log('Player.tsx :: useEffect: set TV Events');
    console.log(serverList);
    console.log(Platform.OS);
    opVaultDownload();
    tvEventHandler.enable(null, rcuKeyHandler);
    AppState.addEventListener('change', handleAppStateChange);
    initializeRNInsight(isInsightEnabled);

    // Initialising source list index
    currentSourceListIndex = 0;
    // Start the the content token timer while setting up
    startTokenUpdateTimer();
    //setting plugin log level
    OTVSDK.setSDKLogLevel(OTVSDK_LOGLEVEL.DEBUG, false);
    LogBox.ignoreLogs(['VirtualizedLists should never be nested']);
    LogBox.ignoreLogs(['Cannot update a component from inside the function body']);

    return () => {
      tvEventHandler.disable();
      mediaTracks = { audioTracks: [] };
      selectedAudioTrackIndex = 0;
      selectedTextTrackIndex = -1;
      //AppState.removeEventListener('change', handleAppStateChange)
    };
  }, []);

  const handleKeyDown = (e: any) => {
    if (e.key === "ArrowRight") {
      const currentIndex = controls.indexOf(focusedControl);
      const nextIndex = (currentIndex + 1) % controls.length;
      setFocusedControl(controls[nextIndex]);
    } else if (e.key === "ArrowLeft") {
      const currentIndex = controls.indexOf(focusedControl);
      const prevIndex = currentIndex === 0 ? controls.length - 1 : currentIndex - 1;
      setFocusedControl(controls[prevIndex]);
    } else if (e.key === "Enter") {
      rcuKeyHandler(null, { eventType: focusedControl });
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      };
    }
  }, [handleKeyDown]);

  const onVideoProgress = useCallback((data: OnProgressParam) => {
    const currentPlaybackPos = data && data.currentPosition;
    setProgressPosition(currentPlaybackPos);
    // the progressPosition is NOT updated by state hook setProgressPosition as
    // unknown reason on TVKey Capable platform
    // So Using currentPos to store it, then calculate seek position with this
    // value when seeking with remote control.
    currentPos = currentPlaybackPos;
    setSliderValue(currentPlaybackPos / duration);
  }, []);

  const selectNextAudioTrack = () => {
    let updatedAudio = 0;
    if (
      selectedAudioTrackIndex <
      (mediaTracks && mediaTracks.audioTracks.length - 1)
    ) {
      updatedAudio = selectedAudioTrackIndex + 1;
    }
    // @ts-ignore
    otvplayerInstance.current.selectAudioTrack(updatedAudio);
  };

  const selectAudioTrack = (index: string) => {
    // @ts-ignore
    otvplayerInstance.current.selectAudioTrack(Number(index));
  };

  const selectNextTextTrack = () => {
    let updatedText = -1;
    if (
      selectedTextTrackIndex <
      // @ts-ignore
      (mediaTracks &&
        mediaTracks.textTracks &&
        mediaTracks.textTracks.length - 1)
    ) {
      updatedText = selectedTextTrackIndex + 1;
    } else if (selectedTextTrackIndex === undefined) {
      updatedText = 0;
    } else {
      selectedTextTrackIndex = -1;
    }
    // @ts-ignore
    otvplayerInstance.current.selectTextTrack(updatedText);
  };

  const selectTextTrack = (index: string) => {
    // @ts-ignore
    otvplayerInstance.current.selectTextTrack(Number(index));
  };

  const selectNextResolution = () => {
    selectedResolutionIndex =
      selectedResolutionIndex < AVAILABLE_RESOLUTION.length - 1
        ? selectedResolutionIndex + 1
        : 0;
    setSelectedResolution({
      width: AVAILABLE_RESOLUTION[selectedResolutionIndex].width,
      height: AVAILABLE_RESOLUTION[selectedResolutionIndex].height,
    });
  };

  const selectResolution = (index: string) => {
    selectedResolutionIndex = Number(index);
    setSelectedResolution({
      width: AVAILABLE_RESOLUTION[selectedResolutionIndex].width,
      height: AVAILABLE_RESOLUTION[selectedResolutionIndex].height,
    });
  };

  const selectNextBitrate = () => {
    let selectableBitrates = [Infinity, ...bitratesArr, null, undefined];
    selectedMaxBitrateIndex =
      selectedMaxBitrateIndex <
        (selectableBitrates && selectableBitrates.length - 1)
        ? selectedMaxBitrateIndex + 1
        : 0;
    setMaxBitrate(selectableBitrates[selectedMaxBitrateIndex]);
  };

  const selectBitrate = (index: string) => {
    selectedMaxBitrateIndex = Number(index);
    let bitrate =
      selectedMaxBitrateIndex !== -1
        ? selectableBitrates[selectedMaxBitrateIndex]
        : Infinity;
    setMaxBitrate(bitrate);
  };

  const loadEventReceived = useCallback((event: OnLoadParam) => {
    console.log('onLoad in App' + JSON.stringify(event));
    handleEvent('onLoad received');
    contentType = event.duration < 0 || event.duration === Infinity ? CONTENT_TYPE.LIVE : CONTENT_TYPE.VOD;
    duration = event.duration;
    const selectedData = selectedStreamData.current;
    if (selectedData) {
      // @ts-ignore
      const { source, name } = selectedData;
      let content: any = { uri: source.src };
      if (contentType === CONTENT_TYPE.LIVE) {
        content['channelId'] = 'LIVEContentId';
        content['channelName'] = name;
        content['type'] = 'LIVE';
        content['duration'] = 0
        console.log('Insight content', content);
        isInsightEnabled && RNInsight.setLiveContent(content);
      } else {
        content['contentId'] = 'VODContentId';
        content['contentName'] = name;
        content['type'] = 'VOD';
        content['duration'] = event.duration;
        console.log('Insight content', content);
        isInsightEnabled && RNInsight.setVodContent(content);
      }
    }
  }, []);

  const loadStartEventReceived = useCallback((event: OnLoadStartParam) => {
    console.log('onLoadStart in App' + JSON.stringify(event));
    handleEvent('onLoadStart received');
    onLoadStartTime = Date.now();
    onLoadStartTimeDifference = 0;
    onLoadStartTimeDifference =
      (onLoadStartTime - channelChangeStartTime) / 1000;
    setOnLoadStartEvent(onLoadStartTimeDifference);
    console.log(onLoadStartEvent);
    console.log(
      'OTT :: onLoadStartTime :: Difference(in seconds) ' +
      onLoadStartTimeDifference,
    );
    duration = 0;
    isInsightEnabled && RNInsight.play();
  }, []);

  const statisticsUpdate = useCallback((event: any) => {
    console.log('App :: onStatisticsUpdate received::' + JSON.stringify(event));

    /* Report available bitrates to insight only once on playback start */
    if (statisticsData?.network.adaptiveStreaming.availableBitrates === undefined) {
      isInsightEnabled &&
        RNInsight.setAvailableBitrates(event.network.adaptiveStreaming.availableBitrates);
    }
    /* Report selected bitrate during playback start and when a different bitrate is selected in between playback */
    if (
      statisticsData?.network.adaptiveStreaming.selectedBitrate === undefined ||
      statisticsData?.network.adaptiveStreaming.selectedBitrate != event.network.adaptiveStreaming.selectedBitrate
    ) {
      isInsightEnabled && RNInsight.setBitrate(event.network.adaptiveStreaming.selectedBitrate);
    }
    /* Report frame Drops during start and if frame Drops changes */
    if (
      statisticsData?.rendering.frameDrops === undefined ||
      statisticsData?.rendering.frameDrops != event.rendering.frameDrops
    ) {
      isInsightEnabled && RNInsight.setFrameDrops(event.rendering.frameDrops);
    }

    handleEvent('onStatisticsUpdate received');
    statisticsData = event;
  }, []);

  const playEventReceived = useCallback(() => {
    channelPlayStartTime = Date.now();
    console.log('onPlay in App');
    handleEvent('onPlay received');
  }, []);

  const playingEventReceived = useCallback(() => {
    setPlaying(true);
    console.log('onPlaying in App');
    handleEvent('onPlaying received');
    if (!isSeek) {
      onPlayingTime = Date.now();
      if (typeof channelPlayStartTime !== 'undefined') {
        let onAutoplay = 0;
        onAutoplay = (onPlayingTime - channelChangeStartTime) / 1000;
        setOnPlayingEvent(onAutoplay);
        console.log(onPlayingEvent);
        console.log('OTT :: onPlaying :: Difference(in seconds) ' + onAutoplay);
      }
    }
    isInsightEnabled && RNInsight.playing();
  }, []);

  const pauseEventReceived = useCallback(() => {
    setPlaying(false);
    console.log('onPaused in App');
    handleEvent('onPaused received');
    isInsightEnabled && RNInsight.pause();
  }, []);

  const seekEventReceived = useCallback((event: OnSeekParam) => {
    console.log('onSeek in App ' + JSON.stringify(event));
    let seekPos = event && event.seekPosition;
    const currentPlaybackPos = event && event.currentPosition;
    handleEvent('onSeek position :: ' + seekPos);
    currentPos = currentPlaybackPos;
    setProgressPosition(currentPlaybackPos);
    isInsightEnabled && RNInsight.seekTo(event.seekPosition);
  }, []);

  const waitingEventReceived = useCallback(() => {
    console.log('onWaiting in App');
    handleEvent('onWaiting received');
    isInsightEnabled && RNInsight.buffering();
  }, []);

  const endEventReceived = useCallback(() => {
    console.log('onEnd in App');
    handleEvent('onEnd received');
    isInsightEnabled && RNInsight.stop();
  }, []);

  const audioTrackSelection = useCallback((event: OnAudioTrackSelectedParam) => {
    let lang = '';
    selectedAudioTrackIndex = event.index;
    setSelectedAudio(selectedAudioTrackIndex);
    if (
      mediaTracks &&
      mediaTracks.audioTracks &&
      mediaTracks.audioTracks[selectedAudioTrackIndex]
    ) {
      lang = mediaTracks.audioTracks[selectedAudioTrackIndex].language;
      isInsightEnabled && RNInsight.setAudioLanguage(lang);
    }
    console.log('onAudioTrackSelected in App::::' + lang);
    handleEvent('onAudioTrackSelected received :: audioLanguage :: ' + lang);
  }, []);

  const textTrackSelection = useCallback((event: OnTextTrackSelectedParam) => {
    selectedTextTrackIndex = event.index;
    setSelectedTextTrack(selectedTextTrackIndex);
    let lang =
      selectedTextTrackIndex !== -1
        ? //@ts-ignore
        mediaTracks.textTracks[selectedTextTrackIndex].language
        : 'text track disabled';
    if (selectedTextTrackIndex !== -1) {
      isInsightEnabled && RNInsight.setSubtitleLanguage(lang);
    }
    console.log('onTextTrackSelected in App::::' + lang);
    handleEvent('onTextTrackSelected received :: textLanguage :: ' + lang);
  }, []);

  const tracksChanged = useCallback((tracks: OnTracksChangedParam) => {
    mediaTracks = tracks;
    setSelectedAudio(0);
    setAudioTracks(tracks.audioTracks);
    setSelectedTextTrack(-1);
    setTextTracks(tracks.textTracks);
    console.log(
      'onTracksChanged in App :: audioTracks:{' +
      tracks.audioTracks.length +
      '} & textTracks:{' +
      (tracks.textTracks ? tracks.textTracks.length : 0) +
      '}',
    );
    handleEvent(
      'onTracksChanged :: audioTracks:{' +
      tracks.audioTracks.length +
      '} & textTracks:{' +
      (tracks.textTracks ? tracks.textTracks.length : 0) +
      '}',
    );
  }, []);

  const bitratesAvailable = useCallback((event: OnBitratesAvailableParam) => {
    bitratesArr = event && event.bitrates;
    setAvailableBitrates(bitratesArr);
    setSelectableBitrates([Infinity, ...bitratesArr, null, undefined]);
    handleEvent('onBitratesAvailable received');
  }, []);

  const resolutionChanged = useCallback((event: OnDownloadResChangedParam) => {
    setCurrentResolution({
      width: event.width,
      height: event.height,
    });
    handleEvent('onDownloadResChanged received');
  }, []);

  const errorEventReceived = useCallback((event: OnErrorParam) => {
    console.log('onError in App' + JSON.stringify(event));
    handleEvent('onError received with error code: ' + event.code);
    Alert.alert(
      'onError',
      `Error code ${event.code.toString()}`,
      [
        {
        },
      ],
      { cancelable: true },
    );
    // AUTOPLAY_REJECTED_BY_BROWSER
    if (event.code === 7026) {
      paused = true;
    }

    isInsightEnabled &&
      RNInsight.addErrorEvent(
        event.code.toString(),
        ' Error: ' + event.nativeError.details.errorMessage,
      );
  }, []);

  const stoppedEventReceived = useCallback(() => {
    setPlaying(false);
    console.log('onStopped in App');
    handleEvent('onStopped received');
    isInsightEnabled && RNInsight.stop();
  }, []);

  const setVideoContent = (itemIndex: number) => {
    isSeek = false;
    channelChangeStartTime = Date.now();
    selectedAudioTrackIndex = 0;
    selectedTextTrackIndex = -1;
    selectedMaxBitrateIndex = 0;
    selectedResolutionIndex = 0;
    isThumbnailAvailable = false;
    //Reseting resolution, bitrate, capped bitrate and available bitrates on every source change
    setAvailableBitrates([]);
    setSelectableBitrates([]);
    setMaxBitrate(Infinity);
    setSelectedBitrate(0);
    setSelectedResolution({ width: Infinity, height: Infinity });
    const currentList =
      Platform.OS === 'web' ? sourceList : updatedStreamList.current;

    let theStream = currentList[itemIndex];
    if (Platform.OS === 'web') {
      // Avoiding this complexity due to crash on iOS
      theStream.source.src = makeSourceUrlUnique(
        currentList[itemIndex].source.src,
        currentList[itemIndex].name);
      currentSource = theStream.callbackMode ?
        { src: theStream.source.src, preferredAudioLanguage: selectedPreferredAudio } :
        { src: theStream.source.src, token: theStream.source.token, drm: theStream.source.drm, preferredAudioLanguage: selectedPreferredAudio }
    } else {
      currentSource = { src: theStream.source.src, token: theStream.source.token, drm: drm.current }
    }
    console.log(" Zapping to stream " + JSON.stringify(currentSource));
    setSelectedStream(theStream);
    selectedStreamData.current = theStream;
    statisticsData = undefined;

    isInsightEnabled && RNInsight.stop();
    //Reset the contentTokenTimer and isTimerOn flag on every zap
    console.log("Reset and Restart content token timer");
    clearTimeout(tokenRequestTimer);
    setTokenTimer(false);
    setContentTokenTimeout(tokenRequestTimeout);
    startTokenUpdateTimer();
  };

  const selectServer = (index: number) => {
    if (index !== -1) {
      //@ts-ignore
      drm.current = updateDrmConfig(serverList[index]);
      //@ts-ignore
      const encryptedData = serverList[index].ssm_url
        ? sourceListEncryptedSSM
        : sourceListEncryptedSSP;
      updatedStreamList.current = [...sourceListClear, ...encryptedData];
    } else {
      //@ts-ignore
      updatedStreamList.current = [...sourceListClear];
    }
    setSelectedServer(index);
  };

  const updateDrmConfig = (headendServerInfo: {
    ssmSyncMode: any | null;
    drm: any;
    certificateURL: any;
    url: any;
    ssm_url: any;
  }) => {
    let ssmTearDownMode =
      headendServerInfo.ssmSyncMode != null
        ? headendServerInfo.ssmSyncMode
        : true;
    return {
      type: headendServerInfo.drm,
      certificateURL: headendServerInfo.certificateURL,
      licenseURL: headendServerInfo.url,
      ssmServerURL: headendServerInfo.ssm_url,
      ssmSyncMode: ssmTearDownMode,
    };
  };

  // A timer is used to show how to set the content token separately in Async mode.
  const startTokenUpdateTimer = () => {
    console.log("Async content token is enabled.");
    console.log("Set content token after " + contentTokenTimeout + " ms");
    setTokenTimer(true);
    tokenRequestTimer = setTimeout(() => {
      const contentEncryption = Platform.OS === 'web'
        ? selectedStream.source.drm : drm.current;
      if (contentEncryption != null) {
        setContentToken(selectedStream.source.token);
        console.log(" selected stream token : " + selectedContentToken);
      }
    }, contentTokenTimeout);
  };

  const setLogLevel = (index: number) => {
    console.log(
      'Setting LogLevel to index ' + index + ' level ' + logLevels[index],
    );

    if (index === 5) {
      OTVSDK.setSDKLogLevel(logLevels[level], false);
    } else {
      OTVSDK.setSDKLogLevel(logLevels[index], true);
    }
    setLevel(index);
  };

  const setResetType = (index: number) => {
    console.log(`setting connect reset type to ${resetTypes[index]}`);
    setConnectResetType(resetTypes[index]);
  }

  const setPreferredAudioTrack = (index: number) => {
    console.log(`Setting preferred audio languange to ${preferredAudioTracks[index].code}`);
    setSelectedPreferredAudio(preferredAudioTracks[index].code);
  }

  /**
   * Make a stream url unique.
   * This is because we have a defined limitation/behaviour of the plugin in
   * that we ignore a "zap" if the source's URL has not changed.
   * This is justified to be used here in our manual test/reference app because
   * it is expected real world customer configurations will not mix DRMs for
   * their catalog of streams and that all stream URLs will anyway be unique.
   * @param url The URL to zap to
   */
  const makeSourceUrlUnique = (inputURL: string, inputName: string) => {
    const suffixIndex = inputURL.indexOf("?");

    // Does it contain a query already?
    let outputURL = suffixIndex !== -1 ? inputURL.substring(0, suffixIndex) : inputURL;

    let searchParams = "";

    // Append it with a query param including the name
    searchParams += `name=${inputName}`;

    // Append it with a query param including and encoding of the timestamp
    searchParams += `&timestamp=${Math.round(Date.now() / 1000).toString()}`;

    outputURL += `?${searchParams}`;
    return outputURL;
  }

  const fetchLicense = (request: LicenseRequest) => {
    return new Promise(function resolver(resolve, reject) { //NOSONAR

      let xhr = new XMLHttpRequest();
      xhr.open(request.method, request.url, true);
      xhr.responseType = request.responseType;
      for (let key in request.headers) {
        if (request.headers.hasOwnProperty(key)) {
          xhr.setRequestHeader(key, request.headers[key]);
        }
      }

      xhr.onload = function onload() {
        if (xhr.status === 200) {
          try {
            if (request.responseType === "arraybuffer") {
              resolve(new Uint8Array(xhr.response));
            } else {
              let json = JSON.parse(xhr.responseText);
              let raw = window.atob(json.CkcMessage);
              let arr = new Uint8Array(new ArrayBuffer(raw.length));
              for (let i = 0; i < raw.length; i++) {
                arr[i] = raw.charCodeAt(i);
              }
              resolve(arr);
            }
          } catch (err) {
            reject(`Invalid ${request.drmSystem}  License: ${err}`);
          }
        } else {
          reject("Failed to receive license, HTTP status:" + xhr.status);
        }
      };

      xhr.onerror = function onerror(err) {
        reject("Error on license request " + request.drmSystem);
      };
      const tokenKey = "nv-authorizations";
      xhr.setRequestHeader(tokenKey, request.token);
      xhr.send(request.payload);
    });
  }

  /**
   * In callback mode , app passes the `onLicenseRequest` prop to fetch license
   */

  const getDRMLicense: OnLicenseRequest = (keySystem, Source, requestPayload, messageType) => {
    const { licenseURL, token, certificateURL } = selectedStream.license;
    console.log(`keySystem ${keySystem} source : ${Source} requestPayload: ${requestPayload} messageType:${messageType}`)

    let HEADERS = keySystem === DRM_KEYSYSTEM.TVKEY
      ? {
        Accept: "application/json",
        "Content-Type": "application/json",
      }
      : {
        Accept: "application/octet-stream",
        "Content-Type": "application/octet-stream"
      };
    let reqObj: LicenseRequest = { headers: HEADERS, url: licenseURL, responseType: "arraybuffer", token: token, payload: requestPayload, drmSystem: keySystem, method: 'POST' }
    switch (keySystem) {
      case DRM_KEYSYSTEM.WIDEVINE:
        if (messageType === 'certificate-request') {
          reqObj.url = certificateURL;
        }
        break;
      case DRM_KEYSYSTEM.FAIRPLAY:
      case DRM_KEYSYSTEM.FAIRPLAY_1_0:
        if (messageType === 'certificate-request') {
          reqObj.method = 'GET';
          reqObj.url = certificateURL;
          reqObj.headers = {};
        } else {
          reqObj.responseType = "text";
        }
        break;
      case DRM_KEYSYSTEM.PLAYREADY:
      case DRM_KEYSYSTEM.TVKEY:
        break;
    }
    return fetchLicense(reqObj);
  }

  const onSelectedBitrateChanged = useCallback((event) => {
    setSelectedBitrate(event.bitrate);
    handleEvent('onSelectedBitrateChanged received');
  }, []);

  const onThumbnailAvailable = useCallback(() => {
    console.log('onThumbnailAvailable in App');
    isThumbnailAvailable = true;
    handleEvent('onThumbnailAvailable received');
  }, []);

  const videoContainerStyle = (isHandheld) ? { width: '100%', height: Platform.OS === 'ios' ? 1000 : 1500 } : { width: '100%', height: '100%', backgroundColor: 'steelblue' };
  return (
    <>
      <Header toggleInfo={toggleInfo} infoEnabled={infoEnabled} focusedControl={focusedControl} setFocusedControl={setFocusedControl} infoLabel={"Info"} />
      <View style={videoContainerStyle}>
        <View
          style={[
            videoStyles.videoSubHeader,
            {
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-around',
              alignItems: 'center',
              paddingLeft: 5,
              paddingRight: 5,
            },
          ]}
          focusable={false}>
          {Platform.OS !== 'web' && (
            <Text style={commonStyles.whiteBoldText}>
              SERVER : {selectedServer === -1 ? 'none' : serverList[selectedServer].name}
            </Text>
          )}
          <Text style={commonStyles.whiteBoldText}>
            PLAYING : {selectedStream.name}
          </Text>
          {Platform.OS !== 'web' && selectedServer !== -1
            && (serverList[selectedServer].name === "OPY_MDRM_SSM_Cloud" ||
              serverList[selectedServer].name === "OPY_FPS_SSP_SSM")
            && (selectedStream.name.includes('Encrypted') ||
              selectedStream.name.includes('SSM')) && (
              <Text style={commonStyles.whiteBoldText}>
                TokenRequestTimeout : {contentTokenTimeout}
              </Text>
            )}
          <Text style={commonStyles.whiteBoldText}>TYPE: {contentType}</Text>
          {selectedPreferredAudio !== "" && (
            <Text style={commonStyles.whiteBoldText}>
              PREFERRED AUDIO: {selectedPreferredAudio}
            </Text>
          )}
          {audioTracks && audioTracks.length > 0 && (
            <Text style={commonStyles.whiteBoldText}>
              AUDIO: {audioTracks[selectedAudio].title}
            </Text>
          )}
          {textTracks && textTracks.length > 0 && (
            <Text style={commonStyles.whiteBoldText}>
              SUBTITLE:{' '}
              {selectedTextTrack === -1
                ? 'Disabled'
                : textTracks[selectedTextTrack].title}
            </Text>
          )}
        </View>
        <View
          style={
            isFullscreenEnabled && (Platform.OS !== 'web' || !Platform.isTV)
              ? (isLandscape()
                ? videoStyles.fullscreenModeLandscape
                : videoStyles.fullscreenMode)
              : ((Platform.isTV || Platform.OS === 'web') ? videoStyles.contentWebAndTVStyle : videoStyles.contentStyle)
          }
          focusable={false}>
          <OTVPlayer
            style={{
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
            ref={otvplayerInstance}
            source={currentSource}
            progressUpdateInterval={1}
            autoplay={true}
            muted={muted}
            volume={volume}
            maxBitrate={maxBitrate}
            maxResolution={selectedResolution}
            thumbnail={thumbnailInfo}
            onLoad={loadEventReceived}
            onLoadStart={loadStartEventReceived}
            onStatisticsUpdate={statisticsUpdate}
            onPlay={playEventReceived}
            onPlaying={playingEventReceived}
            onPaused={pauseEventReceived}
            onProgress={onVideoProgress}
            onSeek={seekEventReceived}
            onEnd={endEventReceived}
            onWaiting={waitingEventReceived}
            onTracksChanged={tracksChanged}
            onBitratesAvailable={bitratesAvailable}
            onSelectedBitrateChanged={onSelectedBitrateChanged}
            onDownloadResChanged={resolutionChanged}
            onAudioTrackSelected={audioTrackSelection}
            onTextTrackSelected={textTrackSelection}
            onError={errorEventReceived}
            onStopped={stoppedEventReceived}
            onThumbnailAvailable={onThumbnailAvailable}
            {...(selectedStream.callbackMode ? { onLicenseRequest: getDRMLicense } : {})}
          />
        </View>
        <View style={videoStyles.videoControlsBanner}>

          <VideoControls
            playing={playing}
            playContent={playContent}
            pauseContent={pauseContent}
            position={progressPosition}
            onSeekBack={onSeekBack}
            onSeekForward={onSeekForward}
            stopContent={stopContent}
            duration={duration}
            toggleFullscreenButton={toggleFullscreenButton}
            isFullscreenEnabled={isFullscreenEnabled}
            focusedControl={focusedControl}
            setFocusedControl={setFocusedControl}
          />
          <Slider
            minimumValue={0}
            maximumValue={1}
            value={sliderValue}
            onValueChange={(value) => {
              if (isThumbnailAvailable) {
                setThumbnailInfo({ ...thumbnailInfo, positionInSeconds: value * duration, display: true })
              }
            }}
            onSlidingStart={() => {
              if (!paused) {
                //@ts-ignore
                otvplayerInstance.current.pause();
              }
              if (Platform.OS !== 'web') {
                isInsightEnabled && RNInsight.seeking();
              }
            }}
            onSlidingComplete={(value) => {
              if (isThumbnailAvailable) {
                setThumbnailInfo({ ...thumbnailInfo, positionInSeconds: value * duration, display: true });
              }
              //@ts-ignore
              otvplayerInstance.current.seek(value * duration);
              if (!paused) {
                //@ts-ignore
                otvplayerInstance.current.play();
              }
              if (isThumbnailAvailable) {
                setTimeout(() => {
                  setThumbnailInfo({ ...thumbnailInfo, display: false });
                }, 2000);
              }

              console.log('Sliding  ' + value + 'Duration ' + duration);
            }}
            thumbStyle={{ height: 15, width: 15 }}
            thumbTintColor={'#343434'}
            style={{ width: (isHandheld || isMobileWeb()) ? '90%' : '20%' }}></Slider>

          <VolumeControl
            muted={muted}
            volume={volume}
            onUp={volumeUp}
            onDown={volumeDown}
            muteContent={muteContent}
            focusedControl={focusedControl}
            setFocusedControl={setFocusedControl}
          />
          <View style={videoStyles.rowContainerSmall}>
            <ActionButton onPress={toggleLogButton} imgUrl={assets.log} focusedControl={focusedControl} label={'LogLevel'} setFocusedControl={setFocusedControl} />
            <ActionButton onPress={toggleEventLogButton} imgUrl={assets.events} focusedControl={focusedControl} label={'events'} setFocusedControl={setFocusedControl} />
            <ActionButton
              onPress={toggleBitrateButton}
              imgUrl={assets.resolution}
              focusedControl={focusedControl}
              label={'Bitrate'}
              setFocusedControl={setFocusedControl}
            />
            <ActionButton
              onPress={toggleStatisticsButton}
              imgUrl={assets.statistics}
              focusedControl={focusedControl}
              label={'Stats'}
              setFocusedControl={setFocusedControl}
            />
            {(Platform.OS === 'web' || Platform.isTV) && (
              <>
                <ActionButton
                  onPress={toggleKeyMapsButton}
                  imgUrl={assets.keypad}
                  focusedControl={focusedControl}
                  label={'KeyHints'}
                  setFocusedControl={setFocusedControl}
                />
              </>
            )}
            <ActionButton
              onPress={toggleInsightButton}
              imgUrl={isInsightEnabled ? assets.insightOn : assets.insightOff}
              focusedControl={focusedControl}
              label={'InsightInfo'}
              setFocusedControl={setFocusedControl}
            />
            {!isHandheld && (
              <ActionButton
                onPress={() => rcuKeyHandler(null, { eventType: "Show TN" })}
                imgUrl={thumbnailInfo.display ? assets.thumbnailOn : assets.thumbnailOff}
                focusedControl={focusedControl}
                label={'Show TN'}
                setFocusedControl={setFocusedControl}
              />
            )}
          </View>

          <View style={videoStyles.rowContainerSmall}>
            <Text style={videoStyles.contentType}>Set Seek Time</Text>
            <SeekTimeControl
              seekTime={seekTime}
              onDown={seekTimeDown}
              onUp={seekTimeUp}
              focusedControl={focusedControl}
              setFocusedControl={setFocusedControl}
            />
          </View>

          <VideoPicker
            setVideoContent={setVideoContent}
            sourceList={
              Platform.OS === 'web' ? sourceList : updatedStreamList.current
            }
            selectedStream={{ selectedStream }}
            focusedControl={focusedControl}
            setFocusedControl={setFocusedControl}
            focusOnEnter={focusOnEnter}
            setFocusOnEnter={setFocusOnEnter}
          />
          {Platform.OS !== 'web' && (
            <ServerPicker
              serverList={serverList}
              selectedServer={selectedServer}
              onSelect={selectServer}
            />
          )}
          {!isSafari() && (
            <PreferredAudioPicker
              preferredAudioTracks={preferredAudioTracks}
              selectedPreferredAudio={selectedPreferredAudio}
              onPreferredAudioChange={setPreferredAudioTrack}
              focusedControl={focusedControl}
              setFocusedControl={setFocusedControl}
              focusOnEnter={focusOnEnter}
              setFocusOnEnter={setFocusOnEnter}
            />
          )}
          <AudioPicker
            audioTracks={audioTracks}
            selectedAudio={selectedAudio}
            onAudioChange={selectAudioTrack}
            focusedControl={focusedControl}
            setFocusedControl={setFocusedControl}
            focusOnEnter={focusOnEnter}
            setFocusOnEnter={setFocusOnEnter}
          />
          <SubtitlePicker
            textTracks={textTracks}
            selectedTextTrack={selectedTextTrack}
            onTextTrackChange={selectTextTrack}
            focusedControl={focusedControl}
            setFocusedControl={setFocusedControl}
            focusOnEnter={focusOnEnter}
            setFocusOnEnter={setFocusOnEnter}
          />
          <ResolutionPicker
            resolutions={AVAILABLE_RESOLUTION}
            selectedResolution={selectedResolutionIndex}
            selectResolution={selectResolution}
            focusedControl={focusedControl}
            setFocusedControl={setFocusedControl}
            focusOnEnter={focusOnEnter}
            setFocusOnEnter={setFocusOnEnter}
          />
          <BitratePicker
            bitrates={availableBitrates}
            selectedBitrate={selectedMaxBitrateIndex}
            selectBitrate={selectBitrate}
            focusedControl={focusedControl}
            setFocusedControl={setFocusedControl}
            focusOnEnter={focusOnEnter}
            setFocusOnEnter={setFocusOnEnter}
          />
          <LogLevelPicker.default
            levels={logLevels}
            selectedLevel={level}
            selectLogLevel={setLogLevel}
            focusedControl={focusedControl}
            setFocusedControl={setFocusedControl}
            focusOnEnter={focusOnEnter}
            setFocusOnEnter={setFocusOnEnter}
          />
          <ConnectResetPicker
            resetTypes={resetTypes}
            selectedResetType={connectResetType}
            setConnectResetType={setResetType}
            focusedControl={focusedControl}
            setFocusedControl={setFocusedControl}
            focusOnEnter={focusOnEnter}
            setFocusOnEnter={setFocusOnEnter}
          />
          <ActionButton
            imgUrl={assets.clear}
            onPress={factoryResetConnect}
            focusedControl={focusedControl}
            setFocusedControl={setFocusedControl}
            label={'Factory Reset'}
          />
        </View>

        <View style={videoStyles.logContainer}>
          {isLogEnabled && <Logging level={LogLevelPicker.getLabel(level)} focusedControl={focusedControl} />}
          {isEventLogEnabled && (
            <EventLogging messageHistory={messageHistory} historySize={20} />
          )}
          {isBitrateLogEnabled && (
            <BitrateAndResolution
              availableBitrates={availableBitrates}
              availableResolution={AVAILABLE_RESOLUTION}
              maxBitrate={maxBitrate}
              selectedBitrate={selectedBitrate}
              selectedResolution={selectedResolution}
              currentResolution={currentResolution}
            />
          )}
          {isStatisticsEnabled && (
            <StatisticsLogging statisticsData={statisticsData} />
          )}
          {isKeyMapsEnabled && <KeyHints />}
        </View>
      </View>
    </>
  );
};

export default Video;
