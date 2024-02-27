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
} from '@nagra/react-otvplayer';
import styles from './styles';
import {isAndroid, isHandheld, isMobileWeb} from './Utils';

interface RefOTVPlayer {
  current: OTVPlayerRef;
}
const sourceList = [
  {
    name: ' Tears-SSM-Widevine (1000 Sessions)',
    source: {
      src: 'https://replacemewithyourown.com/vod/demo_content/ed_sintel_1080p/sintel.mpd?SSM1000 Sintel',
      type: 'application/dash+xml',
      token:
        'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDEwMDAifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjRkZDY3MGRmLWI4NDgtNDc2Yi1hODYyLTYzMjFjN2FlN2ZkNSJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fc2ludGVsXzRrIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoxMDAwLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.O6P_W5MDtppchgtDcjRf6lGtvndg8qYI0SvX5AsTSNw,eyJrY0lkcyI6WyI0ZGQ2NzBkZi1iODQ4LTQ3NmItYTg2Mi02MzIxYzdhZTdmZDUiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..FnAMFZvETeg0qSeT4dIkHg.vxvzTz9qm0i2dyz61E0f7Bx342m-jUF65YdmXbFPir27_bMdHgYOuMPDK8zG9rXivMBjMfJ0zhTuOAFgZS1hWWmPM_dGih8aO1LBxcNLF46oamrkhvlg7AweyNFi66jYt3Pg_X2zfoH-8hScHqtSNA3I4xy1pQhZHT5GdaQZj-c.Ml7dqvscUJKPJRDuwOuHXg',
      drm: {
        licenseURL:
          'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
        ssmServerURL: 'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
        type: 'Widevine', // "com.widevine.alpha"
      },
    },
  },
  // OTT VOD, Clear
  {
    name: 'Big Buck Bunny [OTT VOD, Clear]',
    source: {
      src: 'https://d3bqrzf9w11pn3.cloudfront.net/basic_dash_bbb_clear/bbb_public.mpd',
      type: 'application/dash+xml',
    },
  },
  // OTT VOD Widevine - SSM
  {
    name: 'DASH - Elephants Dream-SSM-Widevine (2 Sessions)',
    source: {
      src: 'https://replacemewithyourown.com/vod/demo_content/ed_elephants_dream_1080p/elephants_dream.mpd?SSM1000 Elephants Dream',
      type: 'application/dash+xml',
      token:
        'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDIifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjI3NjUzNGNmLWE3YTgtNGQyOS1iZDY2LTRjNWQ4MmIyMzFjNiJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fZWxlcGhhbnRzX2RyZWFtIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoyLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.dc6BDhjx7ML676ePQJWo1I2M2cd7rRmHItXUQsw91Rs,eyJrY0lkcyI6WyIyNzY1MzRjZi1hN2E4LTRkMjktYmQ2Ni00YzVkODJiMjMxYzYiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..WK6rp-4982ktRUV6C9qYew.WlaXWAEUfI3yID9XILCOc-u7NRqIglsQaMac7lD2-cVVDZLGVRf80XooDbiq9m97ZxUrvo1UBnwKYSNnmgpzw9X4BxCI-P4dAoswsFwgLBjbzpXs4le4kBE3R-ZI_GdNqeqL3h3Lu3O7uYuXAkssY920vdyuIMNgh6XuGz3LFpE.F5_b_NX6e5C7OF-S2FJtrQ',
      drm: {
        licenseURL:
          'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
        ssmServerURL: 'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
        type: 'Widevine', // "com.widevine.alpha"
      },
    },
  },
];

let sourceIndex = 0;
function SSMWidevine({navigation}) {
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
  const [message, setMessage] = useState('');
  const [progressPosition, setProgressPosition] = useState('0');
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [source, setSource] = useState(sourceList[0].source);
  const [keyHints, setKeyHints] = useState(keyShortCuts);

  const appState = useRef(AppState.currentState);

  const rcuKeyHandler = (component, event: {eventType: string}) => {
    console.log('SSMWidevine Key event: ', event);
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
        if (currentSourceListIndex === sourceList.length - 1) {
          currentSourceListIndex = 0;
        } else {
          currentSourceListIndex++;
        }
        setSource({...sourceList[currentSourceListIndex].source});
        break;
      case 'channelDown':
        if (currentSourceListIndex === 0) {
          currentSourceListIndex = sourceList.length - 1;
        } else {
          currentSourceListIndex--;
        }
        setSource({...sourceList[currentSourceListIndex].source});
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
    if (!isHandheld() && !isMobileWeb()) {
      console.log('SSMWidevine.tsx :: useEffect: set TV Events');

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
    console.log('onError in SSMWidevine' + JSON.stringify(event));
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

  const onLoadStart = useCallback((event: OnLoadStartParam) => {
    setMessage('onLoadStart received');
  }, []);

  return (
    <View style={{flex: 1}}>
      <OTVPlayer
        ref={otvplayerInstance}
        source={source}
        progressUpdateInterval={1}
        autoplay={true}
        muted={muted}
        volume={volume}
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
      <View style={styles.keyHintsViewStyle}>
        <Text style={styles.keyHintsTextStyle}>{keyHints}</Text>
      </View>
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
            data-testid="zapButton"
            title="Zap"
            onPress={() =>
              setSource({...sourceList[(sourceIndex = sourceIndex ^ 1)].source})
            }
          />
          <Button
            data-testid="backButton"
            title="Back"
            onPress={() => navigation.navigate('Home')}
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
    height: 125,
    backgroundColor: 'black',
    opacity: 0.6,
    top: 0,
    left: 0,
    width: '100%',
    position: 'absolute',
  },
});

export default SSMWidevine;
