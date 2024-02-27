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
    name: 'Planet Earth Encrypted in callback mode',
    source: {
      src: 'https://replacemewithyourown.com/vod/dash/scramble/planetearth-jungle_25fps_5mbps_4hr/planetearth-jungle_1.mpd',
      type: 'application/dash+xml',
      // In callback mode , App fetches license , so token should not be passed in source and license url is not passed in drm object
      drm: {
        type: 'Playready',
      },
    },
    license: {
      token:
        'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMGMyOGYyNzEtMGI1Zi00MWRiLTk1NTItODJiMDBmYzYzZDZlIl0sImNvbnRlbnRJZCI6InBsYW5ldGVhcnRoLWp1bmdsZSIsInN0b3JhYmxlIjp0cnVlLCJlbmNyeXB0aW9uTWV0aG9kIjoiUkFXX0FFU18xMjhfQ1RSX0NFTkMiLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.csMCk4sGTntUGzJL-MkscgBWUz3tj8Vsr5EXJ4o38_U,eyJrY0lkcyI6WyIwYzI4ZjI3MS0wYjVmLTQxZGItOTU1Mi04MmIwMGZjNjNkNmUiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..bLg-oHUm9H2vnaIRFYXWwg.9-iWXMN8btmgN0vzzNwLfkuguAsqa_c_K3_RSIkK-uFgpfDmazyZiufUBFERMR1-Jy2uqC_b_Zlot-l0v62vgp7fvPDqLIOoQEDwHBJ0lZvxK3DgyAWf6kV1RAJSDzvcR9zKOPNyRQ25r5I03vRTbU0BfbGkwV0M_nkQsYrtMwY.VCZhDtRypyPQWASFa_aXTA',
      licenseURL:
        'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
    },
    callbackMode: true,
  },
  {
    name: 'Elephants Dream Encrypted in non-callback mode',
    source: {
      src: 'https://replacemewithyourown.com/demo/content/ed_elephants_dream_1080p/elephants_dream.mpd',
      type: 'application/dash+xml',
      // In non-callback mode, plugin fetches license , so token should be passed in source and  license url should be passed in drm object
      drm: {
        type: 'Playready',
        licenseURL:
          'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
      },
      token:
        'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMjc2NTM0Y2YtYTdhOC00ZDI5LWJkNjYtNGM1ZDgyYjIzMWM2Il0sImNvbnRlbnRJZCI6ImRhc2gtZGVtb19lbGVwaGFudHNfZHJlYW0iLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5IjpmYWxzZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.WGB21Muz3OtFT_iUgAdhIwGphSrte434MdzqJwdiTNQ,eyJrY0lkcyI6WyIyNzY1MzRjZi1hN2E4LTRkMjktYmQ2Ni00YzVkODJiMjMxYzYiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..LFvTs9vsg-EIEZyvtYZ3Rw.Qm5BoCqwRrlLNP7VIpNmTavwSJvLIFk_0g3R8mP_QFskEAQhW0Je9u-cFQKUzthIqoE3E7lHiqeLuAZcTtyD1v1XOQTjsHcXk1itRIUpaHY85Fkdmq8qX3GvUzgI13dogAJoD2yKA_v0oLEpfTS-HgLSAScaTUPz2JVON-c1XK4.satV1gwbeyKOR_7rEg9G3g',
    },
    callbackMode: false,
  },
  {
    name: 'Sintel Clear in callback mode',
    source: {
      src: 'https://d3bqrzf9w11pn3.cloudfront.net/sintel/sintel.mpd',
      type: 'application/dash+xml',
    },
    callbackMode: true,
  },
  {
    // enforcement
    name: 'VOD Encrypted DASH - playready-ssm - 1000 sessions in non-callback mode',
    source: {
      src: 'https://replacemewithyourown.com/vod/demo_content/ed_elephants_dream_1080p/elephants_dream_mspr_only.mpd?SSM1000 Elephants Dream',
      // In non-callback mode, plugin fetches license , so token should be passed in source and  license url should be passed in drm object
      token:
        // 1000 concurrent sessions allowed
        'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDEwMDAifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjI3NjUzNGNmLWE3YTgtNGQyOS1iZDY2LTRjNWQ4MmIyMzFjNiJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fZWxlcGhhbnRzX2RyZWFtIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoxMDAwLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.0FeOB-v1BV1x-83UiSdENE9KvXyhDTsnzlBULvpzEx4,eyJrY0lkcyI6WyIyNzY1MzRjZi1hN2E4LTRkMjktYmQ2Ni00YzVkODJiMjMxYzYiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..RCHnPaz4bZvIB06dpy1kSA.QPc3b263SoSdUH4kNjEKyXbQca4Qqus_2o9vLFBw3paifKSxpNlwTGnCHG8-cKhzuOeuY0CZJAk3RGkpu45hYNwFOBxwO-rRF_689W7hA0bUv66-Vp6PZWTHPL-y0AP3sQtrbWWED8rlyUxNiw1H71AkmFac5LG4fNjxW_nTwPo.C9Mm75b9uODSqignN2FG1Q',
      type: 'application/dash+xml',
      drm: {
        licenseURL:
          'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
        ssmServerURL: 'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
        type: 'Playready',
      },
    },
    callbackMode: false,
  },
];

const END_INDEX = SOURCE_STREAMS.length - 1;
const START_INDEX = 0;

function CallBackModePlayReady({navigation}) {
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
    console.log('CallBackMode Key event: ', event);
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
    console.log('CallBackMode.tsx :: useEffect: set TV Events');
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

  const getPlayReadyLicense: OnLicenseRequest = (
    keySystem,
    shakaSource,
    requestPayload,
    messageType,
  ) => {
    const {licenseURL, token} = content.license;
    let headers = {
      Accept: 'application/octet-stream',
      'Content-Type': 'application/octet-stream',
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
            reject('Invalid PlayReady License:' + err);
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
    console.log('onError in CallBackModePlayReady' + JSON.stringify(event));
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
        {...(content.callbackMode
          ? {onLicenseRequest: getPlayReadyLicense}
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
          DRM Type :: PlayReady
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

export default CallBackModePlayReady;
