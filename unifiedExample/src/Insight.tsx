// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.

import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, Button, StyleSheet, AppState } from "react-native";
import Picker from './Picker';
import TVEventHandler from "./TVEventHandler";
//import Package from "../example-0.63.4/package.json";
import type {
  OTVPlayerWithInsightRef,
  OnLoadStartParam,
  OnLoadParam,
  OnProgressParam,
  OnSeekParam,
  OnProgressEvent,
  OnTracksChangedParam,
  OnErrorParam,
  OnAudioTrackSelectedParam,
  OnTextTrackSelectedParam,
} from "@nagra/react-otvplayer";
import styles from "./styles";
import RNInsight from "@nagra/react-native-insight";
import type {
  InsightConfig,
  VodContent,
  LiveContent,
  UserInfo,
} from "@nagra/react-native-insight";
import { STATISTICS_TYPES } from "@nagra/react-otvplayer";
import { OnSelectedBitrateChangedParam } from "@nagra/react-otvplayer";
import { OnBitratesAvailableParam } from "@nagra/react-otvplayer";
import {
  OTVPlayerWithInsight,
  OTVSDK,
  OTVSDK_LOGLEVEL,
} from "@nagra/react-otvplayer";
import { isWeb, isHandheld, isApple, isMobileWeb } from "./Utils";

interface RefOTVPlayerWIthInsight {
  current: OTVPlayerWithInsightRef;
}

const dashSourceList: any = [
  {
    name: "Sintel [OTT VOD Clear, Multiple subtitle, multiple audio]",
    source: {
      src: "https://d3bqrzf9w11pn3.cloudfront.net/sintel/sintel.mpd",
      type: "application/dash+xml",
    },
  },
  {
    name: "Test Pic [OTT Live Clear UTC]",
    source: {
      src: "https://livesim.dashif.org/livesim/utc_direct-head/testpic_2s/Manifest.mpd",
      type: "application/dash+xml",
    },
  },
];
const hlsSourceList: any = [
  {
    name: "Advanced Stream",
    source: {
      src: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8",
      type: "application/x-mpegURL",
    },
  },
  {
    name: "Apple Basic Stream 16x9 with MA",
    source: {
      src: "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8",
      type: "application/x-mpegURL",
    },
  },
];

let sourceList = isApple() ? hlsSourceList : dashSourceList;

let sourceIndex = 0;

function Insight({ navigation }) {
  let otvplayerInstance: RefOTVPlayerWIthInsight = React.useRef();
  let tvEventHandler: any;
  let currentPlaybackPos: number;
  let mediaTracks: OnTracksChangedParam;
  let selectedAudioTrackIndex: number;
  let selectedTextTrackIndex: number;
  let isStopped = React.useRef(false);
  let isLiveContent: { current: string } = React.useRef(null);
  let currentLiveContentPossition: { current: number } = React.useRef(0); //to store current live content position
  let currentSourceListIndex: { current: number } = React.useRef(0);
  let keyShortCuts: string;

  const SEEK_TIME: number = 10;
  const VOLUME_DELTA: number = 0.1;
  const [message, setMessage] = useState("");
  const [progressPosition, setProgressPosition] = useState(0);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [source, setSource] = useState(sourceList[0].source);
  const [keyHints, setKeyHints] = useState(keyShortCuts);
  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedAudio, setSelectedAudio] = useState(0);
  const [textTracks, setTextTracks] = useState([]);
  const [selectedText, setSelectedText] = useState(-1);

  const appState = useRef(AppState.currentState)

  const rcuKeyHandler = (component, event: { eventType: string }) => {
    console.log("Insight Key event: ", event);
    switch (event.eventType) {
      case "exit":
        // @ts-ignore
        window.hbbTvApp.destroyApplication();
        break;
      case "back":
        navigation.navigate("Home");
        break;
      case "play":
        otvplayerInstance.current.play();
        break;
      case "pause":
        otvplayerInstance.current.pause();
        break;
      case "Seek Back":
        otvplayerInstance.current.seek(currentPlaybackPos - SEEK_TIME);
        break;
      case "Seek Fwd":
        otvplayerInstance.current.seek(currentPlaybackPos + SEEK_TIME);
        break;
      case "Vol Up":
        setVolume((prevVolumeLevel) =>
          Math.min(1, prevVolumeLevel + VOLUME_DELTA)
        );
        break;
      case "Vol Down":
        setVolume((prevVolumeLevel) =>
          Math.max(0, prevVolumeLevel - VOLUME_DELTA)
        );
        break;
      case "(un)Mute":
        setMuted((prevMuteStatus) => !prevMuteStatus);
        break;
      case "channelUp":
        isLiveContent.current = null; //reseting flag to null for every channel/content change
        if (currentSourceListIndex.current === sourceList.length - 1) {
          currentSourceListIndex.current = 0;
        } else {
          currentSourceListIndex.current++;
        }
        // Resetting audio track, text track, resolution, bitrate, capped bitrate and available bitrates on channel change
        selectedAudioTrackIndex = 0;
        selectedTextTrackIndex = -1;

        setSource({ ...sourceList[currentSourceListIndex.current].source });
        isStopped.current = false; //player no longer in stop state.
        break;
      case "channelDown":
        isLiveContent.current = null; //reseting flag to null for every channel/content change

        if (currentSourceListIndex.current === 0) {
          currentSourceListIndex.current = sourceList.length - 1;
        } else {
          currentSourceListIndex.current--;
        }
        // Resetting audio track, text track, resolution, bitrate, chapped bitrate  and available bitrates on channel change
        selectedAudioTrackIndex = 0;
        selectedTextTrackIndex = -1;
        setSource({ ...sourceList[currentSourceListIndex.current].source });
        isStopped.current = false; //player no longer in stop state.
        break;
      case "audioTrk":
        if (
          selectedAudioTrackIndex <
          (mediaTracks && mediaTracks.audioTracks.length - 1)
        ) {
          otvplayerInstance.current.selectAudioTrack(
            selectedAudioTrackIndex + 1
          );
        } else {
          otvplayerInstance.current.selectAudioTrack(0);
        }
        break;
      case "textTrk":
        if (
          selectedTextTrackIndex <
          (mediaTracks && mediaTracks.textTracks.length - 1)
        ) {
          otvplayerInstance.current.selectTextTrack(selectedTextTrackIndex + 1);
        } else if (selectedTextTrackIndex === undefined) {
          otvplayerInstance.current.selectTextTrack(0);
        } else {
          selectedTextTrackIndex = -1;
          otvplayerInstance.current.selectTextTrack(-1);
        }
        break;
      case "Stop":
        otvplayerInstance.current.stop();
        break;
    }
  };

  const handleAppStateChange = (nextAppState: string) => {
    console.log("Appstate " + nextAppState)
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      if (otvplayerInstance != null) {
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

  const getDeviceType = () => {
    let devType = "desktop";

    if (/SMART/i.test(window.navigator.userAgent)) {
      devType = "stb";
    }

    return devType;
  };

  const getDeviceManufacturer = () => {
    let mfr = "TBD";

    if (/tizen/i.test(window.navigator.userAgent)) {
      mfr = "Samsung";
    } else if (/web0s/i.test(window.navigator.userAgent)) {
      mfr = "LG";
    } else if (/VIDAA/i.test(window.navigator.userAgent)) {
      mfr = "Hisense";
    } else if (/vestel/i.test(window.navigator.userAgent)) {
      mfr = "vestel";
    } else if (/windows/i.test(window.navigator.userAgent)) {
      mfr = "Windows";
    } else if (/macintosh/i.test(window.navigator.userAgent)) {
      mfr = "Macintosh";
    }

    return mfr;
  };

  const getDeviceModel = () => {
    let model = "TBD";

    if (/Tizen/i.test(window.navigator.userAgent)) {
      model = "tizen";
    } else if (/web0s/i.test(window.navigator.userAgent)) {
      model = "webOS";
    } else if (/VIDAA/i.test(window.navigator.userAgent)) {
      model = "VIDAA";
    } else if (/vestel/i.test(window.navigator.userAgent)) {
      model = "vestel";
    } else if (/windows/i.test(window.navigator.userAgent)) {
      model = "win";
    } else if (/macintosh/i.test(window.navigator.userAgent)) {
      model = "mac";
    }

    return model;
  };

  const insightConfiguration = () => {
    let insightConfig: InsightConfig;
    if (!isHandheld()) {
      insightConfig = {
        operatorId: "9c703ed0309f",
        deviceId: "0A1B2C3D4E5",
        deviceType: getDeviceType(),
        deviceManufacturer: getDeviceManufacturer(),
        deviceModel: getDeviceModel(),
        appName: "OpenTV Insight React refApp",
        appVersion: "1.x",
        //@ts-ignore
        osName: window.navigator.platform,
        osVersion: "8.1",
        screenWidth: 100,
        screenHeight: 100,
        screenDensity: 48,
        // timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        samplingInterval: 10,
        reportingInterval: 0.5,
        maxRetryInterval: 300,
        maxSamplingSize: 5,
        collectorURL: "https://collector.insight-stats.com/api/v1",
        frameDropEnabled: true,
        minSessionLength: 20,
      };
    }
    else {
      insightConfig = {
        //@ts-ignore
        insightCollectorURL: "https://collector.insight-stats.com/api/v1/",
        samplingInterval: 10,
        reportingInterval: 30,
        appName: "OpenTV Insight React refApp",
        appVersion: "1.x",
        deviceType: "handheld",
        deviceId: "appleTestDeviceId",
        operatorId: "9c703ed0309f",
        frameDropsEnabled: true
      }
    }

    let userInfo: UserInfo = {
      userId: "123455",
      accountId: "A12B32",
      fullName: "John Doe",
      gender: "male",
      age: 23,
      ageRange: "20-25",
      category: "Junior",
      street: "275 Sacramento Street",
      city: "San Francisco",
      state: "CA",
      postCode: "94111",
      country: "US",
    };
    if (isWeb()) {
      RNInsight.initialize(insightConfig);
    } else {
      // @ts-ignore
      RNInsight.initialize(insightConfig, userInfo);
    }
  };
  React.useMemo(() => insightConfiguration(), []);

  useEffect(() => {

    let userInfo: UserInfo = {
      userId: "123455",
      accountId: "A12B32",
      fullName: "John Doe",
      gender: "male",
      age: 23,
      ageRange: "20-25",
      category: "Junior",
      street: "275 Sacramento Street",
      city: "San Francisco",
      state: "CA",
      postCode: "94111",
      country: "US",
    };
    otvplayerInstance.current.setUserInfo(userInfo);
    //setting plugin log level
    OTVSDK.setSDKLogLevel(OTVSDK_LOGLEVEL.DEBUG);
    AppState.addEventListener('change', handleAppStateChange);
    if (!isHandheld() && !isMobileWeb()) {
      console.log("Insight.tsx :: useEffect: set TV Events");
      tvEventHandler = new TVEventHandler();
      tvEventHandler.enable(null, rcuKeyHandler);
      keyShortCuts = tvEventHandler.getKeyShortCuts();
      setKeyHints(keyShortCuts);
    }


    return () => {
      if (!isHandheld()) {
        tvEventHandler.disable();
      }
      RNInsight.terminate();
      AppState.removeEventListener('change', handleAppStateChange);
    };

  }, []);

  const currentSource = () => {
    const el = sourceList.find((el) => {
      return JSON.stringify(el.source) === JSON.stringify(source);
    });
    return el.name;
  };

  const onVideoProgress = useCallback((data: OnProgressParam) => {
    currentPlaybackPos = data && data.currentPosition;
    currentLiveContentPossition.current = currentPlaybackPos;
    setProgressPosition(currentPlaybackPos);
  }, []);

  const onLoad = useCallback((event: OnLoadParam) => {
    setMessage("onLoad received");
    if (event.duration === Infinity || event.duration <= 0) {
      isLiveContent.current = "LIVE";
      let liveContent: LiveContent = {
        genre: ["drama"],
        scrambled: false,
        bitrates: [1000000, 2000000, 5000000],
        duration: 0,
        uri: source.src,
        channelId: "CHANNEL1",
        channelName: sourceList[currentSourceListIndex.current].name,
        //eventId: "1000012606",
        //eventName: "News",
      };
      otvplayerInstance.current.setLiveContent(liveContent);
    } else {
      isLiveContent.current = "VOD";
      let vodContent: VodContent = {
        contentId: "416781",
        contentName: sourceList[currentSourceListIndex.current].name,
        genre: ["drama"],
        scrambled: false,
        //bitrates: [1000000, 2000000, 5000000],
        duration: 1,
        uri: source.src,
      };
      otvplayerInstance.current.setVodContent(vodContent);
    }
  }, []);

  const onPaused = useCallback(() => {
    setMessage("onPaused received");
  }, []);

  const onSeek = useCallback((event: OnSeekParam) => {
    let seekPos =
      event && event.seekPosition && event.seekPosition.toFixed(2);
    currentPlaybackPos = event && event.currentPosition;
    setMessage("onSeek position :: " + seekPos);
    setProgressPosition(currentPlaybackPos.toFixed(2));
  }, []);

  const onStopped = useCallback(() => {
    isStopped.current = true; //player in stop state.
    console.log("onStopped in Insight");
    setMessage("onStopped received");
  }, []);

  const onPlaying = useCallback(() => {
    setMessage("onPlaying received");
  }, [])

  const onPlay = useCallback(() => {
    setMessage("onPlay received");
  }, [])

  const onWaiting = useCallback(() => {
    setMessage("onWaiting received");
  }, [])

  const onTracksChanged = useCallback((tracks: OnTracksChangedParam) => {
    mediaTracks = tracks;
    setSelectedAudio(0);
    setAudioTracks(tracks.audioTracks);
    setSelectedText(-1);
    setTextTracks(tracks.textTracks);
    setMessage(
      "onTracksChanged :: audioTracks:{" +
      tracks.audioTracks.length +
      "} & textTracks:{" +
      (tracks.textTracks ? tracks.textTracks.length : 0) +
      "}"
    );
  }, [])

  const onEnd = useCallback(() => {
    setMessage("onEnd received");
  }, []);

  const onError = useCallback((event: OnErrorParam) => {
    console.log("onError in Insight" + JSON.stringify(event));
    let code = event.code;
    setMessage("onError received with error code: " + code);
  }, []);

  const onAudioTrackSelected = useCallback((event: OnAudioTrackSelectedParam) => {
    selectedAudioTrackIndex = event.index;
    setSelectedAudio(selectedAudioTrackIndex);
  }, []);

  const onLoadStart = useCallback((event: OnLoadStartParam) => {
    setMessage("onLoadStart received");
    let vodContent: VodContent = {
      contentId: "416781",
      contentName: sourceList[currentSourceListIndex.current].name,
      genre: ["drama"],
      scrambled: null,
      //bitrates: [1000000, 2000000, 5000000],
      duration: 0,
      uri: source.src,
    };
    otvplayerInstance.current.setVodContent(vodContent);
  }, []);

  const onBitratesAvailable = useCallback((event: OnBitratesAvailableParam) => {
    let bitratesArr = event && event.bitrates;
    setMessage("onBitratesAvailable received");
  }, []);

  const onSelectedBitrateChanged = useCallback((event: OnSelectedBitrateChangedParam) => {
    setMessage("onSelectedBitrateChanged received");
  }, []);

  const onTextTrackSelected = useCallback((event: OnTextTrackSelectedParam) => {
    selectedTextTrackIndex = event.index;
  }, []);

  const onStatisticsUpdate = useCallback((event) => {
    console.log(
      "Insight :: onStatisticsUpdate received::" + JSON.stringify(event)
    );
    setMessage("onStatisticsUpdate received");
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <OTVPlayerWithInsight
        ref={otvplayerInstance}
        source={source}
        insightAgent={RNInsight}
        progressUpdateInterval={1}
        autoplay={true}
        muted={muted}
        volume={volume}
        onLoad={onLoad}
        onPlay={onPlay}
        onPlaying={onPlaying}
        onPaused={onPaused}
        onProgress={onVideoProgress}
        onSeek={onSeek}
        onEnd={onEnd}
        onWaiting={onWaiting}
        onTracksChanged={onTracksChanged}
        onSelectedBitrateChanged={onSelectedBitrateChanged}
        statisticsConfig={{
          statisticsTypes: STATISTICS_TYPES.ALL,
          statisticsUpdateInterval: 5000,
        }}
        onLoadStart={onLoadStart}
        onBitratesAvailable={onBitratesAvailable}
        onAudioTrackSelected={onAudioTrackSelected}
        onTextTrackSelected={onTextTrackSelected}
        onStatisticsUpdate={onStatisticsUpdate}
        onStopped={onStopped}
        onError={onError}
        style={{
          top: 0,
          left: 0,
          width: isHandheld() ? "100%" : "100vw",
          height: isHandheld() ? "100%" : (isMobileWeb()) ? "90vh" : "100vh",
        }}
      />

      <View style={styles.keyHintsViewStyle}>
        <Text style={styles.keyHintsTextStyle}>{keyHints}</Text>
      </View>
      <View style={localStyles.viewStyle}>
        <View style={localStyles.buttonRowStyle}>
          <Button
            data-testid="playButton"
            title="Play"
            onPress={() => rcuKeyHandler(null, { eventType: "play" })}
          />
          <Button
            data-testid="pauseButton"
            title="Pause"
            onPress={() => rcuKeyHandler(null, { eventType: "pause" })}
          />
          <Button
            data-testid="muteButton"
            title={muted ? "\u{1F507}" : "\u{1F508}"}
            onPress={() => rcuKeyHandler(null, { eventType: "(un)Mute" })}
          />
          <Button
            data-testid="zapButton"
            title="Zap"
            onPress={() => setSource({ ...sourceList[sourceIndex = sourceIndex ^ 1].source })}
          />
          <Button
            data-testid="backButton"
            title="Back"
            onPress={() => navigation.navigate("Home")}
          />
        </View>

        <Text style={localStyles.textStyle}>{message}</Text>
        <Text data-testid="progressPosition" style={localStyles.textStyle}>
          pos :: {progressPosition}
        </Text>
        <View style={{ flexDirection: "row" }}>
          <Text style={localStyles.smallerTextStyle}>Audio Track:</Text>
          {Boolean(audioTracks.length) && (
            <Picker
              selectedValue={audioTracks[selectedAudio].title}
              onValueChange={(itemValue, itemIndex) => {
                otvplayerInstance.current.selectAudioTrack(itemIndex);
              }}
            >
              {audioTracks.map((track, index) => {
                return (
                  <Picker.Item
                    label={track.title}
                    value={track.title}
                    key={index}
                  />
                );
              })}
            </Picker>
          )}
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={localStyles.smallerTextStyle}>Text Track</Text>
          {Boolean(textTracks.length) && (
            <Picker
              selectedValue={
                selectedText === -1
                  ? "Disabled"
                  : textTracks[selectedText].title
              }
              onValueChange={(itemValue, itemIndex) => {
                otvplayerInstance.current.selectTextTrack(itemIndex - 1);
              }}
            >
              <Picker.Item label="Disabled" value="Disabled" key={-1} />
              {textTracks.map((track, index) => {
                return (
                  <Picker.Item
                    label={track.title}
                    value={track.title}
                    key={index}
                  />
                );
              })}
            </Picker>
          )}
        </View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  textStyle: {
    fontSize: 30,
    color: "orange",
    textAlign: "center",
  },

  buttonRowStyle: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 5,
    borderColor: "gray",
    borderWidth: 2,
  },
  smallerTextStyle: {
    fontSize: 20,
    color: "white",
    textAlign: "center",
  },

  viewStyle: {
    alignItems: "center",
    height: 80,
    backgroundColor: "black",
    opacity: 0.7,
    top: 0,
    left: 0,
    width: "100%",
    position: "absolute",
  },
});

export default Insight;
