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
    name: 'Doctors encrypted in callback mode',
    source: {
      type: 'application/x-mpegURL',
      // In callback mode , App fetches license , so token should not be passed in source and license url is not passed in drm object
      drm: {
        type: 'Fairplay',
      },
      src: 'https://replacemewithyourown.com/vod/hls5/scramble/doctors_smpte-tt-id3-png_subtitles_fairplay/index-ssp.m3u8',
    },
    license: {
      licenseURL:
        'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
      certificateURL:
        'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
      token:
        'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.ch1hZliH8J4qVeGcgGJFUFJqc4DxJ4iP_xGczf9yqHA',
    },
    callbackMode: true,
  },
  {
    name: 'Tears of Steel in non-callback mode',
    source: {
      src: 'https://replacemewithyourown.com/vod/hls5/scramble/TOS_1080p_24fps_ts_encrypted_fairplay/master-ssp.m3u8',
      type: 'application/x-mpegURL',
      // In non-callback mode, plugin fetches license , so token should be passed in source and  license url should be passed in drm object
      drm: {
        type: 'Fairplay',
        licenseURL:
          'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
        certificateURL:
          'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
      },
      token:
        'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.ch1hZliH8J4qVeGcgGJFUFJqc4DxJ4iP_xGczf9yqHA',
    },
    callbackMode: false,
  },
  {
    name: 'Bip Bop clear in callback mode',
    source: {
      src: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8',
      type: 'application/x-mpegURL',
    },
    callbackMode: true,
  },
  {
    name: 'Big Buck Bunny SSM 1000 sessions in non-callback mode',
    source: {
      src: 'https://replacemewithyourown.com/vod/hls6/scramble/bbb_sunflower_60fps_fmp4_fps_scramble/master-ssp.m3u8',
      // In non-callback mode, plugin fetches license , so token should be passed in source and  license url should be passed in drm object
      token:
        'eyJraWQiOiI2MTgyMzgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaW9zMTAwMCJ9LCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJzZXNzaW9uQ29udHJvbCI6eyJtYXhTZXNzaW9ucyI6MTAwMCwic2Vzc2lvbkNvbnRyb2xFbmFibGVkIjp0cnVlfSwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5Ijp0cnVlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.uHSVqlgaK_vKfL2wyuHcddGE1IcCzHLEaJ-YlK2gf2s',
      type: 'application/x-mpegURL',
      drm: {
        licenseURL:
          'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
        certificateURL:
          'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
        ssmServerURL: 'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
        type: 'Fairplay',
      },
    },
    callbackMode: false,
  },
];

const END_INDEX = SOURCE_STREAMS.length - 1;
const START_INDEX = 0;

function CallBackModeFairPlay({navigation}) {
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
    console.log('CallBackModeFairPlay Key event: ', event);
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
    console.log('CallBackModeFairPlay.tsx :: useEffect: set TV Events');
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

  const getFairPlayCertificate = (certificateURL: string) => {
    return new Promise(function resolver(resolve, reject) {
      let xhr = new XMLHttpRequest();
      xhr.open('GET', certificateURL, true);
      xhr.responseType = 'arraybuffer';

      xhr.onload = function onload() {
        if (xhr.status === 200) {
          resolve(new Uint8Array(xhr.response));
        } else {
          reject(
            'CallBackModeFairPlay.tsx :: Failed to receive certificate, HTTP status:' +
              xhr.status,
          );
        }
      };

      xhr.onerror = function onerror() {
        reject('CallBackModeFairPlay.tsx :: Error on certificate request');
      };
      xhr.send();
    });
  };

  const getFairplayLicense: OnLicenseRequest = (
    keySystem,
    shakaSource,
    requestPayload,
    messageType,
  ) => {
    const {licenseURL, token, certificateURL} = content.license;
    if (messageType === 'certificate-request') {
      return getFairPlayCertificate(certificateURL);
    } else {
      let headers = {
        Accept: 'application/octet-stream',
        'Content-Type': 'application/octet-stream',
      };
      return new Promise(function resolver(resolve, reject) {
        //NOSONAR

        let xhr = new XMLHttpRequest();
        xhr.open('POST', licenseURL, true);
        xhr.responseType = 'text';
        for (let key in headers) {
          if (headers.hasOwnProperty(key)) {
            xhr.setRequestHeader(key, headers[key]);
          }
        }

        xhr.onload = function onload() {
          if (xhr.status === 200) {
            try {
              let json = JSON.parse(xhr.responseText);
              let raw = window.atob(json.CkcMessage);
              let arr = new Uint8Array(new ArrayBuffer(raw.length));
              for (let i = 0; i < raw.length; i++) {
                arr[i] = raw.charCodeAt(i);
              }
              resolve(arr);
            } catch (err) {
              reject('Invalid Fairplay License:' + err);
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
    }
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
    console.log('onError in CallBackModeFairPlay' + JSON.stringify(event));
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
        {...(content.callbackMode
          ? {onLicenseRequest: getFairplayLicense}
          : {})}
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
          DRM Type :: Fairplay
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

export default CallBackModeFairPlay;
