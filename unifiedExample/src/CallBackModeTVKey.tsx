// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.

import React, {useEffect, useState, useRef, useCallback} from 'react';
import {View, Text, Button, StyleSheet, AppState} from 'react-native';
import TVEventHandler from './TVEventHandler';
import OTVPlayer, {OTVSDK, OTVSDK_LOGLEVEL} from '@nagra/react-otvplayer';
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
  OnLicenseRequest,
} from '@nagra/react-otvplayer';
import styles from './styles';

interface RefOTVPlayer {
  current: OTVPlayerRef;
}

const SOURCE_STREAMS = [
  {
    source: {
      src: 'https://replacemewithyourown.com/vod/dash/scramble/bbb_prm_cenc_mpd/dash/connect-manifest-prm-pssh.mpd',
      type: 'application/dash+xml',
      // In callback mode , App fetches license , so token should not be passed in source and license url is not passed in drm object
      drm: {
        type: 'TVKey', // "com.tvkey.drm"
      },
    },
    license: {
      token:
        'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJjb250ZW50SWQiOiIwZjExZjk1MC1kOTdlLTExZWItYjhiYy0wMjQyYWMxMzAwMDMiLCJzdG9yYWJsZSI6dHJ1ZSwidXNhZ2VSdWxlc1Byb2ZpbGVJZCI6IlRlc3QifV19.4_gvbWWbj0eVLLQ8KFKXPyFjvTVhqEcM58d9AZvOP3Y',
      licenseURL:
        'https://tenantname.anycast.nagra.com/TENANTNAME/tkls/contentlicenseservice/v1/licenses',
    },
    callbackMode: true,
  },
  {
    source: {
      src: 'https://replacemewithyourown.com/secureplayer/live-pmxo/Content/dash_7_cenc_ssp/Live/Channel(Channel4)/manifest.mpd',
      type: 'application/dash+xml',
      // In non-callback mode, plugin fetches license , so token should be passed in source and  license url should be passed in drm object
      drm: {
        type: 'TVKey', // "com.tvkey.drm"
        licenseURL:
          'https://tenantname.anycast.nagra.com/TENANTNAME/tkls/contentlicenseservice/v1/licenses',
      },
      token:
        'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJjb250ZW50SWQiOiJjaGFubmVsNF9kYXNoX3VleDNYajBpIiwic3RvcmFibGUiOnRydWUsInVzYWdlUnVsZXNQcm9maWxlSWQiOiJUZXN0In1dfQ.leKoqXBnmwwnM0qT73S4UQbosxzve4lNbpaE8t7DBj4',
    },
    callbackMode: false,
  },
  {
    source: {
      src: 'https://d3bqrzf9w11pn3.cloudfront.net/sintel/sintel.mpd',
      type: 'application/dash+xml',
    },
    callbackMode: true,
  },
];

const END_INDEX = SOURCE_STREAMS.length - 1;
const START_INDEX = 0;

function CallBackModeTVKey({navigation}) {
  let otvplayerInstance: RefOTVPlayer = React.useRef();
  let tvEventHandler: any;
  let currentPlaybackPos: number;
  let mediaTracks: OnTracksChangedParam;
  let selectedAudioTrackIndex: number;
  let selectedTextTrackIndex: number;
  let keyShortCuts: string;
  const SEEK_TIME: number = 10;
  const VOLUME_DELTA: number = 0.1;

  const [message, setMessage] = useState('');
  const contentIndex = useRef(0);
  const [progressPosition, setProgressPosition] = useState(0);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [content, setContent] = useState(SOURCE_STREAMS[contentIndex.current]);
  const [keyHints, setKeyHints] = useState(keyShortCuts);

  const appState = useRef(AppState.currentState);

  const rcuKeyHandler = (component, event: {eventType: string}) => {
    console.log('CallBackMode TVKey Key event: ', event);
    switch (event.eventType) {
      case 'exit':
        // @ts-ignore
        window.hbbTvApp.destroyApplication();
        break;
      case 'back':
        navigation.navigate('Home');
        break;
      case 'play':
        otvplayerInstance.current.play();
        break;
      case 'pause':
        otvplayerInstance.current.pause();
        break;
      case 'Seek Back':
        otvplayerInstance.current.seek(currentPlaybackPos - SEEK_TIME);
        break;
      case 'Seek Fwd':
        otvplayerInstance.current.seek(currentPlaybackPos + SEEK_TIME);
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
      case '(un)Mute':
        setMuted((prevMuteStatus) => !prevMuteStatus);
        break;
      case 'channelUp':
        contentIndex.current =
          contentIndex.current === END_INDEX
            ? START_INDEX
            : ++contentIndex.current;
        setContent(SOURCE_STREAMS[contentIndex.current]);
        break;
      case 'channelDown':
        contentIndex.current =
          contentIndex.current === START_INDEX
            ? END_INDEX
            : --contentIndex.current;
        setContent(SOURCE_STREAMS[contentIndex.current]);
        break;
    }
  };

  const handleAppStateChange = (nextAppState: string) => {
    console.log('Appstate ' + nextAppState);
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
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
  };

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    console.log('CallBackModeTVKey.tsx :: useEffect: set TV Events');
    tvEventHandler = new TVEventHandler();
    tvEventHandler.enable(null, rcuKeyHandler);
    keyShortCuts = tvEventHandler.getKeyShortCuts();
    setKeyHints(keyShortCuts);

    //setting plugin log level
    OTVSDK.setSDKLogLevel(OTVSDK_LOGLEVEL.DEBUG);
    return () => {
      tvEventHandler.disable();
      subscription.remove();
    };
  }, []);

  const getTVKeyLicense: OnLicenseRequest = (
    keySystem,
    shakaSource,
    requestPayload,
    messageType,
  ) => {
    const {licenseURL, token} = content.license;
    let headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    // prettier-ignore
    console.log("license url = ", licenseURL)
    return new Promise(function resolver(resolve, reject) {
      //NOSONAR

      let xhr = new XMLHttpRequest();
      xhr.open('POST', licenseURL, true);
      xhr.responseType = 'arraybuffer';
      for (let key in headers) {
        if (headers.hasOwnProperty(key)) {
          xhr.setRequestHeader(key, headers[key]);
        }
      }

      xhr.onload = function onload() {
        if (xhr.status === 200) {
          try {
            resolve(new Uint8Array(xhr.response));
          } catch (err) {
            reject('Invalid TVKey License:' + err);
          }
        } else {
          reject('Failed to receive license, HTTP status:' + xhr.status);
        }
      };

      xhr.onerror = function onerror(err) {
        reject('Error on license request');
      };
      const tokenKey = 'nv-authorizations';
      xhr.setRequestHeader(tokenKey, token);
      xhr.send(requestPayload);
    });
  };

  const onVideoProgress: OnProgressEvent = useCallback(
    (data: OnProgressParam) => {
      currentPlaybackPos = data && data.currentPosition;
      setProgressPosition(currentPlaybackPos.toFixed(2));
    },
    [],
  );

  const onLoad = useCallback((event: OnLoadParam) => {
    setMessage('onLoad received');
  }, []);

  const onPaused = useCallback(() => {
    setMessage('onPaused received');
  }, []);

  const onSeek = useCallback((event: OnSeekParam) => {
    let seekPos = event && event.seekPosition && event.seekPosition.toFixed(2);
    currentPlaybackPos = event && event.currentPosition;
    setMessage('onSeek position :: ' + seekPos);
    setProgressPosition(currentPlaybackPos.toFixed(2));
  }, []);

  const onStopped = useCallback(() => {
    console.log('onStopped in Stop');
    setMessage('onStopped received');
  }, []);

  const onPlaying = useCallback(() => {
    setMessage('onPlaying received');
  }, []);

  const onPlay = useCallback(() => {
    setMessage('onPlay received');
  }, []);

  const onWaiting = useCallback(() => {
    setMessage('onWaiting received');
  }, []);

  const onTracksChanged = useCallback((tracks: OnTracksChangedParam) => {
    mediaTracks = tracks;
    setMessage(
      'onTracksChanged :: audioTracks:{' +
        tracks.audioTracks.length +
        '} & textTracks:{' +
        (tracks.textTracks ? tracks.textTracks.length : 0) +
        '}',
    );
  }, []);

  const onEnd = useCallback(() => {
    setMessage('onEnd received');
  }, []);

  const onError = useCallback((event: OnErrorParam) => {
    console.log('onError in CallBackModeTVKey' + JSON.stringify(event));
    setMessage('onError received with error code: ' + event.code);
  }, []);

  const onAudioTrackSelected = useCallback(
    (event: OnAudioTrackSelectedParam) => {
      selectedAudioTrackIndex = event.index;
      setMessage(
        'onAudioTrackSelected received :: audioLanguage :: ' +
          mediaTracks.audioTracks[selectedAudioTrackIndex].language,
      );
    },
    [],
  );

  const onTextTrackSelected = useCallback((event: OnTextTrackSelectedParam) => {
    selectedTextTrackIndex = event.index;
    setMessage(
      'onTextTrackSelected received :: textLanguage :: ' +
        (event.index !== -1
          ? mediaTracks.textTracks[selectedTextTrackIndex].language
          : 'text track disabled'),
    );
  }, []);

  return (
    <View style={{flex: 1}}>
      <OTVPlayer
        ref={otvplayerInstance}
        source={content.source}
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
          width: '100vw',
          //@ts-ignore
          height: '100vh',
        }}
        {...(content.callbackMode ? {onLicenseRequest: getTVKeyLicense} : {})}
      />

      <View style={styles.keyHintsViewStyle}>
        <Text style={styles.keyHintsTextStyle}>{keyHints}</Text>
      </View>
      <View style={localStyles.viewStyle}>
        <Text style={localStyles.textStyle}>{message}</Text>
        <Text data-testid="progressPosition" style={localStyles.textStyle}>
          pos :: {progressPosition}
        </Text>
        <Text data-testid="drmType" style={localStyles.textStyle}>
          DRM Type :: TVKey
        </Text>
        <View style={localStyles.buttonRowStyle}>
          <Button
            data-testid="playButton"
            title="Play"
            onPress={() => rcuKeyHandler(null, {eventType: 'play'})}
          />
          <Button
            data-testid="pauseButton"
            title="Pause"
            onPress={() => rcuKeyHandler(null, {eventType: 'pause'})}
          />
          <Button
            data-testid="muteButton"
            title={muted ? '\u{1F507}' : '\u{1F508}'}
            onPress={() => rcuKeyHandler(null, {eventType: '(un)Mute'})}
          />
          <Button
            data-testid="channelUp"
            title="Channel up"
            onPress={() => rcuKeyHandler(null, {eventType: 'channelUp'})}
          />
          <Button
            data-testid="channelDown"
            title="Channel Down"
            onPress={() => rcuKeyHandler(null, {eventType: 'channelDown'})}
          />
        </View>
        <Button
          data-testid="backButton"
          title="Back"
          onPress={() => navigation.navigate('Home')}
        />
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  textStyle: {
    fontSize: 30,
    color: 'orange',
    textAlign: 'center',
  },

  buttonRowStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 5,
    borderColor: 'gray',
    borderWidth: 2,
  },

  viewStyle: {
    alignItems: 'center',
    height: 80,
    backgroundColor: 'black',
    opacity: 0.7,
    top: 0,
    left: 0,
    width: '100%',
    position: 'absolute',
  },
});

export default CallBackModeTVKey;
