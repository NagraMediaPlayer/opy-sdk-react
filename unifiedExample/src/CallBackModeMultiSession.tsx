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
import {isHandheld, isMobileWeb} from './Utils';

interface RefOTVPlayer {
  current: OTVPlayerRef;
}

const SOURCE_STREAMS = [
  {
    source: {
      src: 'https://replacemewithyourown.com/secureplayer/shaka/live/scramble/bbc1hd-kr/manifest.mpd',
      type: 'application/dash+xml',
      drm: {
        type: 'Widevine', // "com.widevine.alpha"
      },
    },
    license: {
      token:
        'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJjb250ZW50SWQiOiJzaGFrYS11ZXgzLWRhc2gtdGtyLTEiLCJzdG9yYWJsZSI6dHJ1ZSwidXNhZ2VSdWxlc1Byb2ZpbGVJZCI6IlRlc3QifV19.zmSpcH0E4-RIdvmXM3i-SzSEZszGfXOiWSkP1pY4iws',
      licenseURL:
        'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
      certificateURL:
        'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
    },
  },
  {
    source: {
      src: 'https://replacemewithyourown.com/vod/dash/scramble/vos-live2vod/vos-live-2-vod-kr/master.mpd',
      type: 'application/dash+xml',
      drm: {
        type: 'Widevine',
      },
    },
    license: {
      token:
        'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJjb250ZW50SWQiOiJkYXNoLWtyLWxpdmUtMi12b2QiLCJzdG9yYWJsZSI6dHJ1ZSwidXNhZ2VSdWxlc1Byb2ZpbGVJZCI6IlRlc3QifV19.7G5u_WYh5oM_dcE4wPzpIU9M63tZ3-7qsZMDQXgU_ks',
      licenseURL:
        'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
      certificateURL:
        'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
    },
  },
];

function CallBackModeMultiSession({navigation}) {
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
    console.log('CallBackModeMultiSession Key event: ', event);
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
          contentIndex.current === 1 ? 0 : ++contentIndex.current;
        setContent(SOURCE_STREAMS[contentIndex.current]);
        break;
      case 'channelDown':
        contentIndex.current =
          contentIndex.current === 0 ? 1 : --contentIndex.current;
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

  const isMounted = useRef(false);
  if (isMounted.current === false) {
    OTVSDK.multiSession = true;
    console.log(
      'CallBackModeMultiSession.tsx :: OTVSDK MultiSession is: ' +
        JSON.stringify(OTVSDK.multiSession),
    );
    isMounted.current = true;
  }

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    console.log('CallBackModeMultiSession.tsx :: useEffect: set TV Events');
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

  let licenseFetchCount = 0;
  const getWidevineLicense: OnLicenseRequest = (
    keySystem,
    shakaSource,
    requestPayload,
    messageType,
  ) => {
    const {licenseURL, token, certificateURL} = content.license;
    let headers = {
      Accept: 'application/octet-stream',
      'Content-Type': 'application/octet-stream',
    };

    // prettier-ignore
    console.log("license url = ", licenseURL)
    const d = new Date();
    console.log(
      'license fetch Time = ',
      +d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds(),
    );
    console.log('license fetch Count = ', ++licenseFetchCount);
    let reqUrl =
      messageType === 'certificate-request' ? certificateURL : licenseURL;
    return new Promise(function resolver(resolve, reject) {
      //NOSONAR

      let xhr = new XMLHttpRequest();
      xhr.open('POST', reqUrl, true);
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
            reject('Invalid widevine License:' + err);
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
    console.log('onError in CallBackModeMultiSession' + JSON.stringify(event));
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
          width: isHandheld() ? '100%' : '100vw',
          //@ts-ignore
          height: isHandheld() ? '100%' : isMobileWeb() ? '90vh' : '100vh',
        }}
        onLicenseRequest={getWidevineLicense}
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
          DRM Type :: Widevine
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

export default CallBackModeMultiSession;
