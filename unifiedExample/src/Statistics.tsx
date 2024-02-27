// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.

import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, Button, StyleSheet, Pressable, AppState } from "react-native";
import TVEventHandler from "./TVEventHandler";
import OTVPlayer, {
  OTVSDK,
  OTVSDK_LOGLEVEL,
  STATISTICS_TYPES,
} from "@nagra/react-otvplayer";
import type {
  OTVPlayerRef,
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
import { isAndroid, isHandheld, isApple, isMobileWeb } from "./Utils";
import App from "./App";

interface RefOTVPlayer {
  current: OTVPlayerRef;
}


const dashSourceList = [
  {
    name: "Big Buck Bunny [OTT VOD, Clear]",
    source: {
      src: "https://d3bqrzf9w11pn3.cloudfront.net/basic_dash_bbb_clear/bbb_public.mpd",
      type: "application/dash+xml",
    },
  },
  {
    name: "Sintel [OTT VOD Clear, Multiple subtitle, multiple audio]",
    source: {
      src: "https://d3bqrzf9w11pn3.cloudfront.net/sintel/sintel.mpd",
      type: "application/dash+xml",
    },
  },
];
const hlsSourceList = [
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

function Statistics({ navigation }) {
  let otvplayerInstance: RefOTVPlayer = React.useRef();
  let tvEventHandler: any;
  let currentPlaybackPos: number;
  let mediaTracks: OnTracksChangedParam;
  let selectedAudioTrackIndex: number;
  let selectedTextTrackIndex: number;
  let keyShortCuts: string;
  const SEEK_TIME: number = 10;
  const VOLUME_DELTA: number = 0.1;
  // Initialising source list index
  let currentSourceListIndex: number = 0;

  const [message, setMessage] = useState("");
  const [progressPosition, setProgressPosition] = useState(0);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [source, setSource] = useState(sourceList[0].source);
  const [keyHints, setKeyHints] = useState(keyShortCuts);
  const [statistics, setStatistics] = useState("");
  const [statisticsLevel, setStatisticsLevel] = useState(STATISTICS_TYPES.ALL);
  const [statsInterval, setStatsInterval] = useState(2000);

  const appState = useRef(AppState.currentState);

  const rcuKeyHandler = (component, event: { eventType: string }) => {
    console.log("Statistics Key event: ", event);
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
        if (currentSourceListIndex === sourceList.length - 1) {
          currentSourceListIndex = 0;
        } else {
          currentSourceListIndex++;
        }
        setSource({ ...sourceList[currentSourceListIndex].source });
        break;
      case "channelDown":
        if (currentSourceListIndex === 0) {
          currentSourceListIndex = sourceList.length - 1;
        } else {
          currentSourceListIndex--;
        }
        setSource({ ...sourceList[currentSourceListIndex].source });
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
  useEffect(() => {
    //setting plugin log level
    OTVSDK.setSDKLogLevel(OTVSDK_LOGLEVEL.DEBUG);
    const subscription = AppState.addEventListener('change', handleAppStateChange)
    if (!isHandheld() && !isMobileWeb()) {
      console.log("Statistics.tsx :: useEffect: set TV Events");
      tvEventHandler = new TVEventHandler();
      tvEventHandler.enable(null, rcuKeyHandler);
      keyShortCuts = tvEventHandler.getKeyShortCuts();
      setKeyHints(keyShortCuts);
    }

    return () => {
      if (!isHandheld()) {
        tvEventHandler.disable();
      }
      subscription.remove();
    };

  }, []);

  const currentSource = () => {
    const el = sourceList.find((el) => {
      return JSON.stringify(el.source) === JSON.stringify(source);
    });
    return el.name;
  };

  const onVideoProgress: OnProgressEvent = useCallback((data: OnProgressParam) => {
    currentPlaybackPos = data && data.currentPosition;
    setProgressPosition(currentPlaybackPos.toFixed(2));
  }, []);

  const onLoad = useCallback((event: OnLoadParam) => {
    setMessage("onLoad received");
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
    console.log("onStopped in Stop");
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
    console.log("onError in Statistics" + JSON.stringify(event));
    setMessage("onError received with error code: " + event.code);
  }, []);

  const onAudioTrackSelected = useCallback((event: OnAudioTrackSelectedParam) => {
    selectedAudioTrackIndex = event.index;
    setMessage(
      "onAudioTrackSelected received :: audioLanguage :: " +
      mediaTracks.audioTracks[selectedAudioTrackIndex].language
    );
  }, []);

  const onTextTrackSelected = useCallback((event: OnTextTrackSelectedParam) => {
    selectedTextTrackIndex = event.index;
    setMessage(
      "onTextTrackSelected received :: textLanguage :: " +
      (event.index !== -1
        ? mediaTracks.textTracks[selectedTextTrackIndex].language
        : "text track disabled")
    );
  }, []);

  const onLoadStart = useCallback((event: OnLoadStartParam) => {
    setMessage("onLoadStart received");
  }, []);

  const onStatisticsUpdate = useCallback((stats) => {
    setMessage("onStatisticsUpdate received");
    // Because stats implementation is not yet complete
    if (stats) {
      setStatistics("Statistics:" + JSON.stringify(stats, null, 4));
    } else {
      const fakeStats = JSON.stringify(
        {
          AvailableBitrates: [
            986000, 1096000, 2096000, 2596000, 3596000, 4596000, 5096000,
            6596000,
          ],
          SelectedBitrate: 2096000,
          DownloadBitrate: 2096000,
          DownloadBitrateAverage: 2826152,
          Buffer: 28,
          RenderingBitrate: 2096000,
          etc: "blah blah blah this is fake info",
        },
        null,
        4
      );
      setStatistics("Statistics:" + fakeStats);
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <OTVPlayer
        ref={otvplayerInstance}
        source={source}
        progressUpdateInterval={1}
        autoplay={true}
        muted={muted}
        volume={volume}
        onLoad={onLoad}
        onLoadStart={onLoadStart}
        onPlay={onPlay}
        onPlaying={onPlaying}
        onPaused={onPaused}
        onProgress={onVideoProgress}
        onSeek={onSeek}
        onEnd={onEnd}
        onWaiting={onWaiting}
        onTracksChanged={onTracksChanged}
        onAudioTrackSelected={onAudioTrackSelected}
        onTextTrackSelected={onTextTrackSelected}
        onError={onError}
        onStopped={onStopped}
        style={{
          top: 0,
          left: 0,
          //@ts-ignore
          width: isHandheld() ? "100%" : "100vw",
          //@ts-ignore
          height: isHandheld() ? "100%" : (isMobileWeb()) ? "90vh" : "100vh",
        }}
        statisticsConfig={{
          statisticsTypes: statisticsLevel,
          statisticsUpdateInterval: statsInterval,
        }}
        onStatisticsUpdate={onStatisticsUpdate}
      />

      <View style={styles.keyHintsViewStyle}>
        <Text style={styles.keyHintsTextStyle}>{keyHints}</Text>
      </View>
      <View style={localStyles.viewStyle}>
        <View style={localStyles.checkBoxStyle}>
          <View>
            <Pressable onPress={() => setStatisticsLevel(statisticsLevel ^ 1)}>
              <Text style={{ color: statisticsLevel & 1 ? "blue" : "white" }}>Rendering</Text>
            </Pressable>

          </View>
          <View>

            <Pressable onPress={() => setStatisticsLevel(statisticsLevel ^ 2)}>
              <Text style={{ color: statisticsLevel & 2 ? "blue" : "white" }}>Network</Text>
            </Pressable>

          </View>
          <View>

            <Pressable onPress={() => setStatisticsLevel(statisticsLevel ^ 4)}>
              <Text style={{ color: statisticsLevel & 4 ? "blue" : "white" }}>Playback</Text>
            </Pressable>
          </View>
          <View>

            <Pressable onPress={() => setStatisticsLevel(statisticsLevel ^ 8)}>
              <Text style={{ color: statisticsLevel & 8 ? "blue" : "white" }}>Event</Text>
            </Pressable>

          </View>
          <View>
            <Pressable onPress={() => setStatisticsLevel(statisticsLevel ^ 16)}>
              <Text style={{ color: statisticsLevel & 16 ? "blue" : "white" }}>DRM</Text>
            </Pressable>

          </View>
          <View>
            <Pressable onPress={() => { let interval = statsInterval + 500; setStatsInterval(interval) }}>
              <Text style={{ color: "white" }}>Interval {statsInterval}(ms)</Text>
            </Pressable>
          </View>
        </View>

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
        <View style={localStyles.overlayStyle}>
          <Text style={{ color: "white" }}>{statistics}</Text>
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

  overlayStyle: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    width: "100%",
  },

  buttonRowStyle: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 5,
    borderColor: "gray",
    borderWidth: 2,
  },

  checkBoxStyle: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
  },

  viewStyle: {
    alignItems: "center",
    height: 200,
    backgroundColor: "black",
    opacity: 0.7,
    top: 0,
    left: 0,
    width: "100%",
    position: "absolute",
  },
});

export default Statistics;
