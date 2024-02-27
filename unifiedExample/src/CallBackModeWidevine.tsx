// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.

import React, {useEffect, useState, useRef, useCallback} from 'react';
import {View, Text, Button, StyleSheet, AppState} from 'react-native';
import TVEventHandler from './TVEventHandler';
import {isHandheld, isMobileWeb} from './Utils';
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
    name: 'Big Buck Bunny in callback mode',
    source: {
      src: 'https://d3bqrzf9w11pn3.cloudfront.net/basic_dash_bbb_encrypted/bbb_public.mpd',
      type: 'application/dash+xml',
      // In callback mode , App fetches license , so token should not be passed in source and license url is not passed in drm object
      drm: {
        type: 'Widevine', // "com.widevine.alpha"
      },
    },
    license: {
      token:
        'eyJraWQiOiI4MTI0MjUiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkdXJhdGlvbiI6NzIwMCwiZGVmYXVsdEtjSWRzIjpbIjAyMDgxMTNlLWU2ZTgtNDI0Mi04NjdjLWQ5NjNmNWQ3ODkyMyJdLCJjb250ZW50SWQiOiI0NjgyZjFkNi05ODIwLTQwNmEtOWJhMC03YzAzZGJjZjE5NmMiLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsIndhdGVybWFya2luZ0VuYWJsZWQiOnRydWUsImltYWdlQ29uc3RyYWludCI6dHJ1ZSwiaGRjcFR5cGUiOiJUWVBFXzEiLCJ1bmNvbXByZXNzZWREaWdpdGFsQ2FwcGluZ1Jlc29sdXRpb24iOiJOT19SRVNUUklDVElPTlMiLCJ1bnByb3RlY3RlZEFuYWxvZ091dHB1dCI6dHJ1ZSwiYW5hbG9nQ2FwcGluZ1Jlc29sdXRpb24iOiJOT19SRVNUUklDVElPTlMiLCJoZGNwIjp0cnVlLCJkZXZpY2VDYXBwaW5nUmVzb2x1dGlvbiI6Ik5PX1JFU1RSSUNUSU9OUyIsImRpZ2l0YWxPbmx5IjpmYWxzZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.fZpotjTjiddueE_nPVcON0FnJwBO4FecTcYIoMmocnw,eyJrY0lkcyI6WyIwMjA4MTEzZS1lNmU4LTQyNDItODY3Yy1kOTYzZjVkNzg5MjMiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjgxMjQyNSJ9..ntJUOAc-g8sXrGLjZhx-MQ.nHnm-aciNeCz6kwUZEjOQgg-1PsLN1Uc8eYihUv_OUK8EaBoFH7JcdIyB9igEFfR9Cufau_5H-EvTdrmws20_ViWKjUTOZmUn7xPQOmwSftb99-rgd3g4QZO0quHIDB5qiBoKmksts8qDbcMZbr_aKMFIOlzNUUcBwiOvmrGyzo.-zTh5sY7tmbe7Ow94EQT9A',
      licenseURL:
        'https://vsd02fy1.anycast.nagra.com/VSD02FY1/wvls/contentlicenseservice/v1/licenses',
      certificateURL:
        'https://vsd02fy1.anycast.nagra.com/VSD02FY1/wvls/contentlicenseservice/v1/licenses',
    },
    callbackMode: true,
  },
  {
    name: ' Tears of Steel Encrypted in non-callback mode',
    source: {
      src: 'https://replacemewithyourown.com/demo/content/ed_tears_of_steel_1080p/tears_of_steel.mpd',
      type: 'application/dash+xml',
      // In non-callback mode, plugin fetches license , so token should be passed in source and  license url should be passed in drm object
      drm: {
        type: 'Widevine',
        licenseURL:
          'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
        certificateURL:
          'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
      },
      token:
        'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiODNkZmVjYzQtOTVjYy00Y2E1LWE3NzMtNjI4OGU0MjgyMTg3Il0sImNvbnRlbnRJZCI6ImRhc2gtZGVtb190ZWFyc19vZl9zdGVlbCIsInN0b3JhYmxlIjp0cnVlLCJlbmNyeXB0aW9uTWV0aG9kIjoiUkFXX0FFU18xMjhfQ1RSX0NFTkMiLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.Kt70g3o7RLTY0U1rVczJBdBHBNjYENDEavZWMCAfmq0,eyJrY0lkcyI6WyI4M2RmZWNjNC05NWNjLTRjYTUtYTc3My02Mjg4ZTQyODIxODciXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..78fa4ccT45hA8f_sf8PNyw.7oq9gfOfabFuZVuuCPfO8PMHeFvgHlcvLZqz7pYk2J2mISUyfz2m3JZG4LFrvK1gPFotIlJ6ImVtUu2_dlYrp3OIZGLNw5Yv1Pupw1xjXyippOUuNy7cyVe5xNfrdN3Th9Tfl6qCDYT3J5mqDlHof1K5w3MRyQ0kP3dJ38o8G6Q.7oToQZb5X6RZcS2qA6AbJQ',
    },
    callbackMode: false,
  },
  {
    name: 'Sintel Clear in Callback mode',
    source: {
      src: 'https://d3bqrzf9w11pn3.cloudfront.net/sintel/sintel.mpd',
      type: 'application/dash+xml',
    },
    callbackMode: true,
  },
  {
    name: 'Tears-SSM-Widevine (1000 Sessions) in non-callback mode',
    source: {
      src: 'https://replacemewithyourown.com/vod/demo_content/ed_sintel_1080p/sintel.mpd?SSM1000 Sintel',
      type: 'application/dash+xml',
      // In non-callback mode, plugin fetches license , so token should be passed in source and  license url should be passed in drm object
      token:
        'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDEwMDAifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjRkZDY3MGRmLWI4NDgtNDc2Yi1hODYyLTYzMjFjN2FlN2ZkNSJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fc2ludGVsXzRrIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoxMDAwLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.O6P_W5MDtppchgtDcjRf6lGtvndg8qYI0SvX5AsTSNw,eyJrY0lkcyI6WyI0ZGQ2NzBkZi1iODQ4LTQ3NmItYTg2Mi02MzIxYzdhZTdmZDUiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..FnAMFZvETeg0qSeT4dIkHg.vxvzTz9qm0i2dyz61E0f7Bx342m-jUF65YdmXbFPir27_bMdHgYOuMPDK8zG9rXivMBjMfJ0zhTuOAFgZS1hWWmPM_dGih8aO1LBxcNLF46oamrkhvlg7AweyNFi66jYt3Pg_X2zfoH-8hScHqtSNA3I4xy1pQhZHT5GdaQZj-c.Ml7dqvscUJKPJRDuwOuHXg',
      drm: {
        licenseURL:
          'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
        ssmServerURL: 'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
        type: 'Widevine', // "com.widevine.alpha"
      },
    },
    callbackMode: false,
  },
];

const END_INDEX = SOURCE_STREAMS.length - 1;
const START_INDEX = 0;

function CallBackModeWidevine({navigation}) {
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
    console.log('CallBackModeWidevine Key event: ', event);
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

    if (!isHandheld() && !isMobileWeb()) {
      console.log('CallBackModeWidevine.tsx :: useEffect: set TV Events');
      tvEventHandler = new TVEventHandler();
      tvEventHandler.enable(null, rcuKeyHandler);
      keyShortCuts = tvEventHandler.getKeyShortCuts();
      setKeyHints(keyShortCuts);
    }

    //setting plugin log level
    OTVSDK.setSDKLogLevel(OTVSDK_LOGLEVEL.DEBUG);
    return () => {
      if (!isHandheld()) {
        tvEventHandler.disable();
      }
      subscription.remove();
    };
  }, []);

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
    console.log('onError in CallBackModeWidevine' + JSON.stringify(event));
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
          ? {onLicenseRequest: getWidevineLicense}
          : {})}
      />

      {!isHandheld() && (
        <View style={styles.keyHintsViewStyle}>
          <Text style={styles.keyHintsTextStyle}>{keyHints}</Text>
        </View>
      )}

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

export default CallBackModeWidevine;
