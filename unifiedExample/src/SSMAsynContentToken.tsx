// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  TextInput,
  AppState,
} from 'react-native';
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
} from '@nagra/react-otvplayer';
import {isAndroid, isApple, isHandheld, isIOS, isMobileWeb} from './Utils';
import TVEventHandler from './TVEventHandler';
import styles from './styles';

interface RefOTVPlayer {
  current: OTVPlayerRef;
}

const token = !isApple()
  ? [
      'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDIifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjI3NjUzNGNmLWE3YTgtNGQyOS1iZDY2LTRjNWQ4MmIyMzFjNiJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fZWxlcGhhbnRzX2RyZWFtIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoyLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.dc6BDhjx7ML676ePQJWo1I2M2cd7rRmHItXUQsw91Rs,eyJrY0lkcyI6WyIyNzY1MzRjZi1hN2E4LTRkMjktYmQ2Ni00YzVkODJiMjMxYzYiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..WK6rp-4982ktRUV6C9qYew.WlaXWAEUfI3yID9XILCOc-u7NRqIglsQaMac7lD2-cVVDZLGVRf80XooDbiq9m97ZxUrvo1UBnwKYSNnmgpzw9X4BxCI-P4dAoswsFwgLBjbzpXs4le4kBE3R-ZI_GdNqeqL3h3Lu3O7uYuXAkssY920vdyuIMNgh6XuGz3LFpE.F5_b_NX6e5C7OF-S2FJtrQ',
      'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiYW5kcm9pZDEwMDAifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbImIxM2U0NWQwLTAzMjQtNDZkZC04NGQ1LTNiMmQ2NzkyZWIzNCJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fYmlnX2J1Y2tfYnVubnkiLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwic2Vzc2lvbkNvbnRyb2wiOnsibWF4U2Vzc2lvbnMiOjEwMDAsInNlc3Npb25Db250cm9sRW5hYmxlZCI6dHJ1ZX0sImRlZmF1bHRVc2FnZVJ1bGVzIjp7Im1pbkxldmVsIjowLCJkaWdpdGFsT25seSI6ZmFsc2UsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.mfllZuvu2v8hBpz789v_GToXkgWT7K2qPusA7W7e1rY,eyJrY0lkcyI6WyJiMTNlNDVkMC0wMzI0LTQ2ZGQtODRkNS0zYjJkNjc5MmViMzQiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..ZlOOBbbwJp7m5-3IwWZfJQ.eHFQxiKkU0OH4T8hy3uXgrxQFY-ZOaAYVKs3aT7UZCcfHvs8ZAh4WSZsF3b3n0XA0m2fTpDNd9wdy6u8JVwC5hKEW3a23Pc6RU0C7zHUKmgG8di4vxpuyg5SlWrY4ijxGJTdEGgP_xON43vZfCqWUws-RkwXNg2-nZ0OiJqRnvw.EjIY4zLG4O_OeCXhVnx1qw',
    ]
  : [
      'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiZnBzM3Nlc3Npb24tMSJ9LCJjb250ZW50UmlnaHRzIjpbeyJjb250ZW50SWQiOiIyYTZmODViNS1jNDFmLTQ2MWYtOGZmMi1hYTNjMTlhNjI5Y2QiLCJzdG9yYWJsZSI6dHJ1ZSwic2Vzc2lvbkNvbnRyb2wiOnsibWF4U2Vzc2lvbnMiOjMsInNlc3Npb25Db250cm9sRW5hYmxlZCI6dHJ1ZX0sInVzYWdlUnVsZXNQcm9maWxlSWQiOiJUZXN0In1dfQ.OoyZOepcqejfMPV4nCotjoo7jyaJ1UjPvoMWTSapvIs',
      'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoic2FmYXJpMiJ9LCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJzZXNzaW9uQ29udHJvbCI6eyJtYXhTZXNzaW9ucyI6Miwic2Vzc2lvbkNvbnRyb2xFbmFibGVkIjp0cnVlfSwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5Ijp0cnVlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.Yz3itoLthexGELwGVigsQXAQUjf-TjJRuHHuTLYMFEg',
    ];

// Android Widevine test stream
const dashWidevineStream = [
  {
    src: 'https://replacemewithyourown.com/vod/demo_content/ed_elephants_dream_1080p/elephants_dream.mpd?SSM1000 Elephants Dream',
    type: 'application/dash+xml',
    drm: {
      licenseURL:
        'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
      ssmServerURL: 'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
      type: 'Widevine', // "com.widevine.alpha"
    },
    // Token will be set later
    token: null,
  },
  {
    src: 'https://replacemewithyourown.com/vod/demo_content/ed_big_buck_bunny_1080p/big_buck_bunny.mpd',
    type: 'application/dash+xml',
    drm: {
      licenseURL:
        'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
      ssmServerURL: 'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
      type: 'Widevine', // "com.widevine.alpha"
    },
    // Token will be set later
    token: null,
  },
];

// Apple Fairplay test stream
const hlsFairplayStream = [
  {
    src: 'https://replacemewithyourown.com/vod/hls6/scramble/elephants_dream_24fps_fmp4_fps_scramble/master-ssp.m3u8',
    type: 'application/x-mpegURL',
    drm: {
      certificateURL:
        'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
      licenseURL:
        'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
      ssmServerURL: 'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm/v1',
      type: 'Fairplay',
    },
    // Token will be set later
    token: null,
  },
  {
    src: 'https://replacemewithyourown.com/vod/hls6/scramble/bbb_sunflower_60fps_fmp4_fps_scramble/master-ssp.m3u8',
    type: 'application/x-mpegURL',
    drm: {
      certificateURL:
        'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
      licenseURL:
        'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
      ssmServerURL: 'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm/v1',
      type: 'Fairplay',
    },
    // Token will be set later
    token: null,
  },
];

const sourceList = isApple() ? hlsFairplayStream : dashWidevineStream;
let currentSourceListIndex: number = 0;

function SSMAsyncContentToken({navigation}) {
  let otvplayerInstance: RefOTVPlayer = React.useRef();
  let tvEventHandler: any;
  let currentPlaybackPos: number;
  let mediaTracks: OnTracksChangedParam;
  let selectedAudioTrackIndex: number;
  let selectedTextTrackIndex: number;
  let keyShortCuts: string;
  let updateTokenTimer: any;
  const SEEK_TIME: number = 10;
  const VOLUME_DELTA: number = 0.1;

  const [message, setMessage] = useState('');
  const [progressPosition, setProgressPosition] = useState(0);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [source, setSource] = useState(sourceList[0]);
  const [keyHints, setKeyHints] = useState(keyShortCuts);
  const [tokenTimeout, setTokenTimeout] = useState(2500);
  //const [initContentToken, setInitContentToken] = useState(false)

  const appState = useRef(AppState.currentState);

  const rcuKeyHandler = (component, event: {eventType: string}) => {
    console.log('BasicPlayback Key event: ', event);
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
    }
  };

  const createTokenUpdateTimer = () => {
    console.log('Set content token after ' + tokenTimeout + ' ms');
    updateTokenTimer = setTimeout(() => {
      setSource({
        ...sourceList[currentSourceListIndex],
        token: token[currentSourceListIndex],
      });
    }, tokenTimeout);
  };

  const stopTokenUpdateTimer = () => {
    if (updateTokenTimer) {
      clearTimeout(updateTokenTimer);
      updateTokenTimer = undefined;
    }
  };

  const zappingStream = () => {
    //clear previous timer
    stopTokenUpdateTimer();
    setSource(
      sourceList[(currentSourceListIndex = currentSourceListIndex ^ 1)],
    );
    createTokenUpdateTimer();
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
    //setting plugin log level
    OTVSDK.setSDKLogLevel(OTVSDK_LOGLEVEL.DEBUG);
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    createTokenUpdateTimer();
    if (!isHandheld() && !isMobileWeb()) {
      console.log('BasicPlayback.tsx :: useEffect: set TV Events');
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

  const onLoadStart = useCallback((event: OnLoadStartParam) => {
    setMessage('onLoadStart received');
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
    console.log('onError in SSMAsyncContentToken' + JSON.stringify(event));
    const CONTENT_TOKEN_TIMEOUT_ERROR = 5022;
    if (event?.code === CONTENT_TOKEN_TIMEOUT_ERROR) {
      setMessage('onError received with error code: ' + event.code);
    }
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
    <View style={{flex: 2}}>
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
          width: isHandheld() ? '100%' : '100vw',
          //@ts-ignore
          height: isHandheld() ? '100%' : isMobileWeb() ? '90vh' : '100vh',
        }}
      />
      {!isHandheld() && (
        <View style={styles.keyHintsViewStyle}>
          <Text style={styles.keyHintsTextStyle}>{keyHints}</Text>
        </View>
      )}

      <View style={localStyles.viewStyle}>
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
            data-testid="backButton"
            title="Back"
            onPress={() => {
              console.log('Back to HOME');
              navigation.navigate('Home');
            }}
          />
        </View>
        <View style={localStyles.buttonRowStyle}>
          <Text style={localStyles.displayText}>Set token after(ms): </Text>
          <TextInput
            style={localStyles.textBox}
            keyboardType="numeric"
            defaultValue={String(tokenTimeout)}
            onChangeText={(text) => setTokenTimeout(Number(text))}
          />
          <Button title="ZAP PLAYBACK" onPress={zappingStream} />
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
    color: 'orange',
    textAlign: 'center',
  },

  buttonRowStyle: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'stretch',
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
  displayText: {
    textAlignVertical: 'center',
    fontSize: 16,
    color: '#FFF',
    paddingLeft: 5,
  },
  textBox: {
    padding: 2,
    fontSize: 18,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#FFF',
    color: '#FFF',
    width: 70,
    textAlign: 'center',
    marginRight: 5,
  },
});

export default SSMAsyncContentToken;
