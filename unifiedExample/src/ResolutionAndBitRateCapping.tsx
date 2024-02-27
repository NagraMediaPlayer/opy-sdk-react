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
  OnDownloadResChangedParam,
  OnSelectedBitrateChangedParam,
  OnBitratesAvailableParam,
  OnAudioTrackSelectedParam,
  OnTextTrackSelectedParam,
} from "@nagra/react-otvplayer";
import styles from "./styles";
import { isApple, isHandheld, isMobileWeb } from "./Utils";

interface RefOTVPlayer {
  current: OTVPlayerRef;
}

const DASH_STREAM = {
  src: "https://d3bqrzf9w11pn3.cloudfront.net/basic_dash_bbb_clear/bbb_public.mpd",
  type: "application/dash+xml",
};

const HLS_STREAM = {
  src: "https://d3bqrzf9w11pn3.cloudfront.net/basic_hls_bbb_clear/index.m3u8",
};
let SOURCE_STREAM = isApple() ? HLS_STREAM : DASH_STREAM;

let bitratesArr;
let selectedMaxBitrateIndex: number = Infinity;
let selectedResolutionIndex: number = Infinity;

function ResolutionAndBitRateCapping({ navigation }) {
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
  const [progressPosition, setProgressPosition] = useState(0);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [source, setSource] = useState(SOURCE_STREAM);
  const [keyHints, setKeyHints] = useState(keyShortCuts);
  const [selectedBitrate, setSelectedBitrate] = useState(0);

  const [maxBitrate, setMaxBitrate] = useState(null);
  const [availableBitrates, setAvailableBitrates] = useState([]);

  const appState = useRef(AppState.currentState)

  const resolutionCappingOptions = [
    { resolution: "360p", width: 640, height: 360 },
    { resolution: "720p", width: 1280, height: 720 },
    { resolution: "1080p", width: 1920, height: 1080 },
    { resolution: "1440p", width: 2560, height: 1440 },
    { resolution: "4K", width: 3840, height: 2160 },
    { resolution: "(uncapped)", width: Infinity, height: Infinity },
  ];

  const [selectedResolution, setSelectedResolution] = useState({
    width: Infinity,
    height: Infinity,
  });

  const [currentResolution, setCurrentResolution] = useState({
    width: Infinity,
    height: Infinity,
  });

  const rcuKeyHandler = (component, event: { eventType: string }) => {
    console.log(`specific example key handler for "${event.eventType}"`);
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
      case "bitrate":
        if (selectedMaxBitrateIndex < (bitratesArr && bitratesArr.length - 1)) {
          selectedMaxBitrateIndex++;
        } else {
          selectedMaxBitrateIndex = 0;
        }
        setMaxBitrate(bitratesArr[selectedMaxBitrateIndex]);
        break;

      case "resolution":
        if (selectedResolutionIndex < resolutionCappingOptions.length - 1) {
          selectedResolutionIndex++;
        } else {
          selectedResolutionIndex = 0;
        }

        setSelectedResolution({
          width: resolutionCappingOptions[selectedResolutionIndex].width,
          height: resolutionCappingOptions[selectedResolutionIndex].height,
        });
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
    console.log("Mounting ResolutionCapping")
    //setting plugin log level
    OTVSDK.setSDKLogLevel(OTVSDK_LOGLEVEL.DEBUG);
    const subscription = AppState.addEventListener('change', handleAppStateChange)
    if (!isHandheld() && !isMobileWeb()) {
      console.log("ResolutionAndBitRateCapping.tsx :: useEffect: set TV Events");
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
      console.log("UnMounting ResolutionCapping")
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
    console.log("onError in ResolutionAndBitRateCapping" + JSON.stringify(event));
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

  const onBitratesAvailable = useCallback((event: OnBitratesAvailableParam) => {
    bitratesArr = event && event.bitrates;
    setMessage(
      "onBitratesAvailable received with bitrates: " + bitratesArr
    );
    let cappingOptions = bitratesArr;
    cappingOptions.push(Infinity);
    setAvailableBitrates(cappingOptions);
  }, []);

  const onSelectedBitrateChanged = useCallback((event: OnSelectedBitrateChangedParam) => {
    setMessage(
      "onSelectedBitrateChanged received with bitrate: " +
      event.bitrate / 1000 +
      "kbps"
    );
    setSelectedBitrate(event.bitrate);
  }, []);

  const onDownloadResChanged = useCallback((event: OnDownloadResChangedParam) => {
    console.log(
      "onDownloadResChanged event received with event " +
      +"width: " +
      event.width +
      " X " +
      "height: " +
      event.height
    );
    setMessage(
      "onDownloadResChanged received with resolution " +
      +"width: " +
      event.width +
      " X " +
      "height: " +
      event.height
    );
    setCurrentResolution({ width: event.width, height: event.height });
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
        maxBitrate={maxBitrate}
        maxResolution={selectedResolution}
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
        onStopped={onStopped}
        style={{
          top: 0,
          left: 0,
          //@ts-ignore
          width: isHandheld() ? "100%" : "100vw",
          //@ts-ignore
          height: isHandheld() ? "100%" : (isMobileWeb()) ? "90vh" : "100vh",
        }}
        onBitratesAvailable={onBitratesAvailable}
        onSelectedBitrateChanged={onSelectedBitrateChanged}
        onDownloadResChanged={onDownloadResChanged}
      />
      <View
        style={{
          zIndex: 1,
          top: 0,
          left: 0,
          position: "absolute",
        }}
      >
      </View>

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
            data-testid="backButton"
            title="Back"
            onPress={() => navigation.navigate("Home")}
          />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Button
            title={"Change Bitrate"}
            onPress={() => rcuKeyHandler(null, { eventType: "bitrate" })}
          />
          <Button
            title={"Change Resolution"}
            onPress={() => rcuKeyHandler(null, { eventType: "resolution" })}
          />
        </View>

        <Text style={localStyles.textStyle}>{message}</Text>
        <Text data-testid="progressPosition" style={localStyles.textStyle}>
          pos :: {progressPosition}
        </Text>
        <Text style={localStyles.bitrateResolutionTextStyle}>
          Available Bitrates (kbps) :{" "}
          {availableBitrates.map((b) => b / 1000 + ", ")}
        </Text>
        <Text style={localStyles.bitrateResolutionTextStyle}>
          Capped Bitrate (kbps) : {maxBitrate ? maxBitrate / 1000 : "none"}
        </Text>
        <Text style={localStyles.bitrateResolutionTextStyle}>
          Current Playing Bitrate (kbps) : {selectedBitrate / 1000}
        </Text>
        <Text style={localStyles.bitrateResolutionTextStyle}>
          Resolutions list:{" "}
          {resolutionCappingOptions.map((b) => b.resolution + ", ")}
        </Text>

        <Text style={localStyles.bitrateResolutionTextStyle}>
          Selected Resolution :{" "}
          {selectedResolution.width !== Infinity &&
            selectedResolution.height !== Infinity
            ? selectedResolution.width +
            "px" +
            " X " +
            selectedResolution.height +
            "px"
            : "none"}
        </Text>

        <Text style={localStyles.bitrateResolutionTextStyle}>
          Current Playing Resolution : {currentResolution.width + "px"} X{" "}
          {currentResolution.height + "px"}
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

  bitrateResolutionTextStyle: {
    top: 100,
    fontSize: 11,
    color: "orange",
    textAlign: "left",
  },

  buttonRowStyle: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 5,
    borderColor: "gray",
    borderWidth: 2,
  },

  viewStyle: {
    alignItems: "center",
    height: 90,
    backgroundColor: "black",
    opacity: 0.7,
    top: 0,
    left: 0,
    width: "100%",
    position: "absolute",
  },
});

export default ResolutionAndBitRateCapping;
