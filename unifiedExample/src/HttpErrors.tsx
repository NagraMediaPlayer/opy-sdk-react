// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.

import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, Button, StyleSheet, AppState } from "react-native";
import TVEventHandler from "./TVEventHandler";
import OTVPlayer, { OTVSDK, OTVSDK_LOGLEVEL } from "@nagra/react-otvplayer";
import type {
  OTVPlayerRef,
  OnLoadStartParam,
  OnLoadParam,
  OnProgressParam,
  OnSeekParam,
  OnProgressEvent,
  OnTracksChangedParam,
  OnErrorParam,
  OnHttpErrorParam,
  OnAudioTrackSelectedParam,
  OnTextTrackSelectedParam,
} from "@nagra/react-otvplayer";
import styles from "./styles";

import { isAndroid, isApple, isHandheld, isIOS, isMobileWeb, isLandscape } from "./Utils";

interface RefOTVPlayer {
  current: OTVPlayerRef;
}

const DASH_STREAM = {
  src: "https://replacemewithyourown.com/demo/content/cd_big_buck_bunny_1080p_miss_segment/big_buck_bunny.mpd",
  type: "application/dash+xml",
};

const HLS_STREAM = {
  src: "https://replacemewithyourown.com/demo/content/public_dev/DownloadToGo_MissChunks/some-chunks-not-exist.m3u8",
  type: "application/x-mpegURL",
}

const SOURCE_STREAM = isApple() ? HLS_STREAM : DASH_STREAM

function HttpErrors({ navigation }) {
  let otvplayerInstance: RefOTVPlayer = React.useRef();
  let tvEventHandler: any;
  let currentPlaybackPos: number;
  let mediaTracks: OnTracksChangedParam;
  let selectedAudioTrackIndex: number;
  let selectedTextTrackIndex: number;
  let keyShortCuts: string;
  const SEEK_TIME: number = 10;
  const VOLUME_DELTA: number = 0.1;

  const [message, setMessage] = useState("");
  const [httpErrorMessage, sethttpErrorMessage] = useState("");
  const [progressPosition, setProgressPosition] = useState(0);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [source, setSource] = useState(SOURCE_STREAM);
  const [keyHints, setKeyHints] = useState(keyShortCuts);

  const appState = useRef(AppState.currentState)

  const rcuKeyHandler = (component, event: { eventType: string }) => {
    console.log("HttpErrors Key event: ", event);
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
    console.log("Mounting HttpErrors")
    //setting plugin log level
    OTVSDK.setSDKLogLevel(OTVSDK_LOGLEVEL.DEBUG);
    const subscription = AppState.addEventListener('change', handleAppStateChange)
    if (!isHandheld() && !isMobileWeb()) {
      console.log("HttpErrors.tsx :: useEffect: set TV Events");
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
      console.log("Unmounting HttpErrors")
    };

  }, []);

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
    console.log("onError: " + JSON.stringify(event));
    setMessage("onError received with error code: " + event.code);
  }, []);

  const onHttpError = useCallback((event: OnHttpErrorParam) => {
    console.log("onHttpError: " + JSON.stringify(event));
    sethttpErrorMessage("HTTP error: " + event.statusCode + ", Message: " + event.message);
  }, []);

  const onAudioTrackSelected = useCallback((event: OnAudioTrackSelectedParam) => {
    selectedAudioTrackIndex = event.index;
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
        onHttpError={onHttpError}
        onStopped={onStopped}
        style={{
          top: 0,
          left: 0,
          //@ts-ignore
          width: isHandheld() ? "100%" : "100vw",
          //@ts-ignore
          height: isHandheld() ? "100%" : (isMobileWeb()) ? "90vh" : "100vh",
        }}
      />
      {!isHandheld() && (
        <View style={styles.keyHintsViewStyle}>
          <Text style={styles.keyHintsTextStyle}>{keyHints}</Text>
        </View>)}

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
            data-testid="backButton"
            title="Back"
            onPress={() => { console.log("Back to HOME"); navigation.navigate("Home") }}
          />
        </View>
        <Text style={localStyles.textStyle}>{message}</Text>
        <Text style={localStyles.httpErrorTextStyle}>{httpErrorMessage}</Text>
        <Text data-testid="progressPosition" style={localStyles.textStyle}>
          pos :: {progressPosition}
        </Text>

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
  httpErrorTextStyle: {
    fontSize: 28,
    color: "red",
    textAlign: "center",
  },
  buttonRowStyle: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "stretch",
    borderRadius: 5,
    borderColor: "gray",
    borderWidth: 2,
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

export default HttpErrors;
