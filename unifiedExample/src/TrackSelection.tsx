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
import {isApple, isHandheld, isMobileWeb} from './Utils';

interface RefOTVPlayer {
  current: OTVPlayerRef;
}

const audioEncodeType = {
  0: 'AAC',
  1: 'AC-3',
  2: 'DTS',
  3: 'MPEG',
  1000: 'Unknown',
};

const textEncodeType = {
  0: 'Bitmap',
  1: 'EIA-608',
  2: 'EIA-708',
  3: 'ID3',
  4: 'SMPTE',
  5: 'SRT',
  6: 'WEBVTT',
  1000: 'Unknown',
};

const SOURCE_STREAM = isApple()
  ? {
      src: 'https://vod-dash-ww-rd-live.akamaized.net/testcard/2/manifests/avc-full.m3u8',
      type: 'application/x-mpegURL',
    }
  : {
      src: 'https://rdmedia.bbc.co.uk/testcard/vod/manifests/avc-full.mpd',
      type: 'application/dash+xml',
    };

let mediaTracks: OnTracksChangedParam;

function TrackSelection({navigation}) {
  let otvplayerInstance: RefOTVPlayer = React.useRef();
  let tvEventHandler: any;
  let currentPlaybackPos: number;
  let keyShortCuts: string;
  const SEEK_TIME: number = 10;
  const VOLUME_DELTA: number = 0.1;

  const [message, setMessage] = useState('');
  const [progressPosition, setProgressPosition] = useState('0');
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.03);
  const [source, setSource] = useState(SOURCE_STREAM);
  const [keyHints, setKeyHints] = useState(keyShortCuts);
  const [audioTracks, setAudioTracks] = useState([]);
  const [textTracks, setTextTracks] = useState([]);
  const [selectedAudioTrackIndex, setSelectedAudioTrackIndex] = useState(0);
  const [selectedTextTrackIndex, setSelectedTextTrackIndex] = useState(-1);

  const appState = useRef(AppState.currentState);
  const rcuKeyHandler = (component, event: {eventType: string}) => {
    console.log('TrackSelection Key event: ', event);
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
      case 'audioTrk':
        if (
          selectedAudioTrackIndex <
          (mediaTracks && mediaTracks.audioTracks.length - 1)
        ) {
          setSelectedAudioTrackIndex(selectedAudioTrackIndex + 1);
        } else {
          setSelectedAudioTrackIndex(0);
        }
        break;
      case 'textTrk':
        if (
          selectedTextTrackIndex <
          (mediaTracks && mediaTracks.textTracks.length - 1)
        ) {
          setSelectedTextTrackIndex(selectedTextTrackIndex + 1);
        } else if (selectedTextTrackIndex === undefined) {
          setSelectedTextTrackIndex(0);
        } else {
          setSelectedTextTrackIndex(-1);
        }
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
    //setting plugin log level
    OTVSDK.setSDKLogLevel(OTVSDK_LOGLEVEL.DEBUG);
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    if (!isHandheld() && !isMobileWeb()) {
      console.log('TrackSelection.tsx :: useEffect: set TV Events');
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

  useEffect(() => {
    console.log('selectedAudioTrackIndex : ' + selectedAudioTrackIndex);
    otvplayerInstance.current.selectAudioTrack(selectedAudioTrackIndex);
  }, [selectedAudioTrackIndex]);

  useEffect(() => {
    console.log('selectedTextTrackIndex : ' + selectedTextTrackIndex);
    otvplayerInstance.current.selectTextTrack(selectedTextTrackIndex);
  }, [selectedTextTrackIndex]);

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
    setAudioTracks(tracks.audioTracks);
    setTextTracks(tracks.textTracks);
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
    console.log('onError in TrackSelection' + JSON.stringify(event));
    setMessage('onError received with error code: ' + event.code);
  }, []);

  const onAudioTrackSelected = useCallback(
    (event: OnAudioTrackSelectedParam) => {
      setSelectedAudioTrackIndex(event.index);
    },
    [],
  );

  const onTextTrackSelected = useCallback((event: OnTextTrackSelectedParam) => {
    setSelectedTextTrackIndex(event.index);
  }, []);

  const onLoadStart = useCallback((event: OnLoadStartParam) => {
    setMessage('onLoadStart received');
  }, []);

  const audioTrackLabel = (trackList, selectedIndex) => {
    let label = 'none';

    if (trackList.length > 0) {
      label = trackList[selectedIndex].title;
      label += ` ${trackList[selectedIndex].channelCount} channels`;
      label += ` [${audioEncodeType[trackList[selectedIndex].encodeType]}]`;
      if (
        trackList[selectedIndex].characteristics &&
        trackList[selectedIndex].characteristics.length > 0
      ) {
        label += ` [${trackList[selectedIndex].characteristics.join(', ')}]`;
      }
    }
    return label;
  };

  const textTrackLabel = (trackList, selectedIndex) => {
    let label = 'none';

    if (trackList.length > 0) {
      label = trackList[selectedIndex].title;
      label += ` [${textEncodeType[trackList[selectedIndex].encodeType]}]`;
      if (
        trackList[selectedIndex].characteristics &&
        trackList[selectedIndex].characteristics.length > 0
      ) {
        label += ` [${trackList[selectedIndex].characteristics.join(', ')}]`;
      }
    }
    return label;
  };

  return (
    <View style={{flex: 1}}>
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
            data-testid="backButton"
            title="Back"
            onPress={() => navigation.navigate('Home')}
          />
        </View>
        <View style={{flexDirection: 'row'}}>
          <Button
            title={'Change Audio'}
            color="red"
            onPress={() => rcuKeyHandler(null, {eventType: 'audioTrk'})}
          />
          <Button
            title={'Change Text'}
            color="blue"
            onPress={() => rcuKeyHandler(null, {eventType: 'textTrk'})}
          />
        </View>
        <Text style={localStyles.textStyle}>
          Audio Track: {audioTrackLabel(audioTracks, selectedAudioTrackIndex)}
        </Text>
        <Text style={localStyles.textStyle}>
          Text Track:{' '}
          {selectedTextTrackIndex >= 0
            ? textTrackLabel(textTracks, selectedTextTrackIndex)
            : 'none'}
        </Text>
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

  smallerTextStyle: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
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

export default TrackSelection;
