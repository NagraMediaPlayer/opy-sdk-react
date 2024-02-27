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
  OnAudioTrackSelectedParam,
  OnTextTrackSelectedParam,
} from "@nagra/react-otvplayer";
import styles from "./styles";
import { isAndroid, isHandheld, isApple, isMobileWeb } from "./Utils";

interface RefOTVPlayer {
  current: OTVPlayerRef;
}

const DASH_STREAM =
// OTT VOD Encrypted DASH - Widevine
{
  src: "https://d3bqrzf9w11pn3.cloudfront.net/basic_dash_bbb_encrypted/bbb_public.mpd",
  type: "application/dash+xml",
  token:
    "eyJraWQiOiI4MTI0MjUiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkdXJhdGlvbiI6NzIwMCwiZGVmYXVsdEtjSWRzIjpbIjAyMDgxMTNlLWU2ZTgtNDI0Mi04NjdjLWQ5NjNmNWQ3ODkyMyJdLCJjb250ZW50SWQiOiI0NjgyZjFkNi05ODIwLTQwNmEtOWJhMC03YzAzZGJjZjE5NmMiLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsIndhdGVybWFya2luZ0VuYWJsZWQiOnRydWUsImltYWdlQ29uc3RyYWludCI6dHJ1ZSwiaGRjcFR5cGUiOiJUWVBFXzEiLCJ1bmNvbXByZXNzZWREaWdpdGFsQ2FwcGluZ1Jlc29sdXRpb24iOiJOT19SRVNUUklDVElPTlMiLCJ1bnByb3RlY3RlZEFuYWxvZ091dHB1dCI6dHJ1ZSwiYW5hbG9nQ2FwcGluZ1Jlc29sdXRpb24iOiJOT19SRVNUUklDVElPTlMiLCJoZGNwIjp0cnVlLCJkZXZpY2VDYXBwaW5nUmVzb2x1dGlvbiI6Ik5PX1JFU1RSSUNUSU9OUyIsImRpZ2l0YWxPbmx5IjpmYWxzZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.fZpotjTjiddueE_nPVcON0FnJwBO4FecTcYIoMmocnw,eyJrY0lkcyI6WyIwMjA4MTEzZS1lNmU4LTQyNDItODY3Yy1kOTYzZjVkNzg5MjMiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjgxMjQyNSJ9..ntJUOAc-g8sXrGLjZhx-MQ.nHnm-aciNeCz6kwUZEjOQgg-1PsLN1Uc8eYihUv_OUK8EaBoFH7JcdIyB9igEFfR9Cufau_5H-EvTdrmws20_ViWKjUTOZmUn7xPQOmwSftb99-rgd3g4QZO0quHIDB5qiBoKmksts8qDbcMZbr_aKMFIOlzNUUcBwiOvmrGyzo.-zTh5sY7tmbe7Ow94EQT9A",
  drm: {
    licenseURL:
      "https://vsd02fy1.anycast.nagra.com/VSD02FY1/wvls/contentlicenseservice/v1/licenses",
    type: "Widevine", // "com.widevine.alpha"
  },
};

const HLS_STREAM = {
  //OTT VOD Encrypted HLS SSP-Encrypted content -Sunflower-60fps

  src: "https://d3bqrzf9w11pn3.cloudfront.net/basic_hls_bbb_encrypted/index.m3u8",
  type: "application/x-mpegURL",
  drm: {
    licenseURL:
      "https://vsd02fy1.anycast.nagra.com/VSD02FY1/fpls/contentlicenseservice/v1/licenses",
    certificateURL:
      "https://vsd02fy1.anycast.nagra.com/VSD02FY1/fpls/contentlicenseservice/v1/certificates",
    type: "Fairplay",
  },
  token:
    "eyJraWQiOiI4MTI0MjUiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiZDhkNzBmYmQtMmNkMi00OTcxLWI4MGMtNjYxNzIwMTE3NjViIl0sImNvbnRlbnRJZCI6ImU4YmJmNzQ4LWE0ZDgtNDc5MS1hNDcwLTEzOTlmZWE5MTQ2MCIsInN0b3JhYmxlIjp0cnVlLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwid2F0ZXJtYXJraW5nRW5hYmxlZCI6dHJ1ZSwiaW1hZ2VDb25zdHJhaW50IjpmYWxzZSwiaGRjcFR5cGUiOiJUWVBFXzAiLCJ1bmNvbXByZXNzZWREaWdpdGFsQ2FwcGluZ1Jlc29sdXRpb24iOiJOT19SRVNUUklDVElPTlMiLCJ1bnByb3RlY3RlZEFuYWxvZ091dHB1dCI6dHJ1ZSwiYW5hbG9nQ2FwcGluZ1Jlc29sdXRpb24iOiJOT19SRVNUUklDVElPTlMiLCJoZGNwIjp0cnVlLCJkZXZpY2VDYXBwaW5nUmVzb2x1dGlvbiI6Ik5PX1JFU1RSSUNUSU9OUyIsImRpZ2l0YWxPbmx5IjpmYWxzZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.X7kslNaBkbccfGboIDwMJ-ZXpsBUjtpxV6G575D_TkE",
};

let SOURCE_STREAM = isApple() ? HLS_STREAM : DASH_STREAM;

function EncryptedPlayback({ navigation }) {
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
  const [progressPosition, setProgressPosition] = useState("0");
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [source, setSource] = useState(SOURCE_STREAM);
  const [keyHints, setKeyHints] = useState(keyShortCuts);

  const appState = useRef(AppState.currentState)

  const rcuKeyHandler = (component, event: { eventType: string }) => {
    console.log("EncryptedPlayback Key event: ", event);
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
    console.log("Mounting Encryptedplayback")
    //setting plugin log level
    OTVSDK.setSDKLogLevel(OTVSDK_LOGLEVEL.DEBUG);
    const subscription = AppState.addEventListener('change', handleAppStateChange)
    if (!isHandheld() && !isMobileWeb()) {
      console.log("EncryptedPlayback.tsx :: useEffect: set TV Events");
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
      console.log("UnMounting Encryptedplayback")
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
    console.log("onError in EncryptedPlayback" + JSON.stringify(event));
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
        <Text style={localStyles.textStyle}>{message}</Text>
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

  buttonRowStyle: {
    flexDirection: "row",
    justifyContent: "space-between",
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

export default EncryptedPlayback;
