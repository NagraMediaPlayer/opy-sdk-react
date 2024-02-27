// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.

import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  TextInput,
  Switch,
  AppState,
  TouchableOpacity,
} from 'react-native';
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
import {isAndroid, isApple, isHandheld, isWeb, isMobileWeb} from './Utils';
import {Slider} from 'react-native-elements';

interface RefOTVPlayer {
  current: OTVPlayerRef;
}
let initialThumbnailProps = {
  display: false,
  positionInSeconds: 0,
  style: {
    top: 30,
    left: 30,
    width: 320,
    height: 180,
    borderWidth: 5,
    borderColor: '#FF0000',
  },
};
const SOURCE_STREAM = isApple()
  ? {
      src: 'https://replacemewithyourown.com/vod/hls4/clear/bbb_iframe_playlist/ts/index.m3u8',
      type: 'application/x-mpegURL',
    }
  : {
      src: 'https://replacemewithyourown.com/vod/dash/clear/DASHIFREF/dash.akamaized.net/akamai/bbb_30fps/bbb_with_4_tiles_thumbnails.mpd',
      type: 'application/dash+xml',
    };

let duration = 0;
let paused = false;

function Thumbnails({navigation}) {
  let otvplayerInstance: RefOTVPlayer = React.useRef();
  let tvEventHandler: any;
  let currentPlaybackPos: number;
  let mediaTracks: OnTracksChangedParam;
  let selectedAudioTrackIndex: number;
  let selectedTextTrackIndex: number;
  let keyShortCuts: string;
  const SEEK_TIME: number = 10;
  const VOLUME_DELTA: number = 0.1;

  let topRef = useRef<TextInput>();
  let leftRef = useRef<TextInput>();
  let widthRef = useRef<TextInput>();
  let heightRef = useRef<TextInput>();
  let borderColorRef = useRef<TextInput>();
  let borderWidthRef = useRef<TextInput>();
  let positionRef = useRef<TextInput>();

  const [message, setMessage] = useState('');
  const [progressPosition, setProgressPosition] = useState(0);
  const [muted, setMuted] = useState(true);
  const [sliderValue, setSliderValue] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [source, setSource] = useState(SOURCE_STREAM);
  const [keyHints, setKeyHints] = useState(keyShortCuts);
  const [thumbnailProps, setThumbnailProps] = useState(initialThumbnailProps);
  const appState = useRef(AppState.currentState);
  const updateThumbnailState = (props) => {
    setThumbnailProps({...thumbnailProps, ...props});
  };

  const rcuKeyHandler = (component, event: {eventType: string}) => {
    console.log('Thumbnails Key event: ', event);
    switch (event.eventType) {
      case 'exit':
        // @ts-ignore
        window.hbbTvApp.destroyApplication();
        break;
      case 'back':
        navigation.navigate('Home');
        break;
      case 'play':
        paused = false;
        otvplayerInstance.current.play();
        break;
      case 'pause':
        paused = true;
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
      case 'Show TN':
        setThumbnailProps((prevThumbnailState) => {
          return {
            ...prevThumbnailState,
            positionInSeconds: progressPosition,
            display: !prevThumbnailState.display,
          };
        });
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
      console.log('Thumbnails.tsx :: useEffect: set TV Events');
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

  const onVideoProgress: OnProgressEvent = useCallback(
    (data: OnProgressParam) => {
      currentPlaybackPos = data && data.currentPosition;
      setProgressPosition(parseFloat(currentPlaybackPos.toFixed(2)));
    },
    [],
  );

  const onLoad = useCallback((event: OnLoadParam) => {
    duration = event.duration;
    setMessage('onLoad received');
  }, []);

  const onPaused = useCallback(() => {
    setMessage('onPaused received');
  }, []);

  const onSeek = useCallback((event: OnSeekParam) => {
    let seekPos = event && event.seekPosition && event.seekPosition.toFixed(2);
    currentPlaybackPos = event && event.currentPosition;
    setMessage('onSeek position :: ' + seekPos);
    setProgressPosition(parseFloat(currentPlaybackPos.toFixed(2)));
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
    console.log('onError in Thumbnails' + JSON.stringify(event));
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

  const onThumbnailAvailable = useCallback(() => {
    console.log('onThumbnailAvailable in App :: Thumbnails are Available');
    setMessage('onThumbnailAvailable received :: Thumbnails are Available');
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
        thumbnail={thumbnailProps}
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
        onThumbnailAvailable={onThumbnailAvailable}
      />

      <View style={styles.keyHintsViewStyle}>
        <Text style={styles.keyHintsTextStyle}>{keyHints}</Text>
      </View>
      <View style={localStyles.viewStyle}>
        {(isAndroid() || isWeb()) && (
          <Slider
            minimumValue={0}
            maximumValue={1}
            value={sliderValue}
            onValueChange={(value) => {
              setThumbnailProps((prevThumbnailState) => {
                return {
                  ...prevThumbnailState,
                  positionInSeconds: value * duration,
                };
              });
            }}
            onSlidingStart={() => {
              if (!paused) {
                otvplayerInstance.current.pause();
              }
              setThumbnailProps((prevThumbnailState) => {
                return {...prevThumbnailState, display: true};
              });
            }}
            onSlidingComplete={(value) => {
              setThumbnailProps((prevThumbnailState) => {
                return {
                  ...prevThumbnailState,
                  positionInSeconds: value * duration,
                };
              });
              otvplayerInstance.current.seek(value * duration);
              if (!paused) {
                otvplayerInstance.current.play();
              }
              setTimeout(() => {
                setThumbnailProps((prevThumbnailState) => {
                  return {...prevThumbnailState, display: false};
                });
              }, 2000);
            }}
            thumbStyle={{height: 15, width: 15}}
            thumbTintColor={'#343434'}
            style={{width: isHandheld() ? '90%' : '20%'}}></Slider>
        )}

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
          <Button
            data-testid="thumbnailButton"
            title={thumbnailProps.display ? 'Hide TN' : 'Show TN'}
            onPress={() => rcuKeyHandler(null, {eventType: 'Show TN'})}
          />
        </View>
        <Text style={localStyles.textStyle}>{message}</Text>
        <Text data-testid="progressPosition" style={localStyles.textStyle}>
          pos :: {progressPosition}
        </Text>
      </View>
      <View
        style={[localStyles.viewStyle, {height: 500, top: 100, opacity: 0.5}]}>
        <View style={localStyles.rowContainer}>
          <Text style={localStyles.title}>Thumbnail Settings -</Text>
        </View>

        <View style={localStyles.rowContainer}>
          <Text style={localStyles.text}>Top :</Text>
          <TouchableOpacity
            style={localStyles.textBox}
            onPress={() => topRef.current.focus()}>
            <TextInput
              ref={topRef}
              style={{color: 'white'}}
              keyboardType="numeric"
              defaultValue={String(thumbnailProps.style.top)}
              onChangeText={(text) =>
                updateThumbnailState({
                  ...thumbnailProps,
                  style: {...thumbnailProps.style, top: Number(text)},
                })
              }
            />
          </TouchableOpacity>
          <Text style={localStyles.text}>Left :</Text>
          <TouchableOpacity
            style={localStyles.textBox}
            onPress={() => leftRef.current.focus()}>
            <TextInput
              ref={leftRef}
              style={{color: 'white'}}
              keyboardType="numeric"
              defaultValue={String(thumbnailProps.style.left)}
              onChangeText={(text) =>
                updateThumbnailState({
                  ...thumbnailProps,
                  style: {...thumbnailProps.style, left: Number(text)},
                })
              }
            />
          </TouchableOpacity>
        </View>

        <View style={localStyles.rowContainer}>
          <Text style={localStyles.text}>Width :</Text>
          <TouchableOpacity
            style={localStyles.textBox}
            onPress={() => widthRef.current.focus()}>
            <TextInput
              ref={widthRef}
              style={{color: 'white'}}
              keyboardType="numeric"
              defaultValue={String(thumbnailProps.style.width)}
              onChangeText={(text) =>
                updateThumbnailState({
                  ...thumbnailProps,
                  style: {...thumbnailProps.style, width: Number(text)},
                })
              }
            />
          </TouchableOpacity>
          <Text style={localStyles.text}>Height :</Text>
          <TouchableOpacity
            style={localStyles.textBox}
            onPress={() => heightRef.current.focus()}>
            <TextInput
              ref={heightRef}
              style={{color: 'white'}}
              keyboardType="numeric"
              defaultValue={String(thumbnailProps.style.height)}
              onChangeText={(text) =>
                updateThumbnailState({
                  ...thumbnailProps,
                  style: {...thumbnailProps.style, height: Number(text)},
                })
              }
            />
          </TouchableOpacity>
        </View>

        <View style={localStyles.rowContainer}>
          <Text style={localStyles.text}>Border Width :</Text>
          <TouchableOpacity
            style={localStyles.textBox}
            onPress={() => borderWidthRef.current.focus()}>
            <TextInput
              ref={borderWidthRef}
              style={{color: 'white'}}
              keyboardType="numeric"
              defaultValue={String(thumbnailProps.style.borderWidth)}
              onChangeText={(text) =>
                updateThumbnailState({
                  ...thumbnailProps,
                  style: {...thumbnailProps.style, borderWidth: Number(text)},
                })
              }
            />
          </TouchableOpacity>

          <Text style={localStyles.text}>Border Color :</Text>
          <TouchableOpacity
            style={localStyles.textBox}
            onPress={() => borderColorRef.current.focus()}>
            <TextInput
              ref={borderColorRef}
              style={{color: 'white'}}
              defaultValue={String(thumbnailProps.style.borderColor)}
              onChangeText={(text) =>
                updateThumbnailState({
                  ...thumbnailProps,
                  style: {...thumbnailProps.style, borderColor: text},
                })
              }
            />
          </TouchableOpacity>
        </View>

        <View style={localStyles.rowContainer}>
          <Text style={localStyles.text}>Position :</Text>
          <TouchableOpacity
            style={localStyles.textBox}
            onPress={() => positionRef.current.focus()}>
            <TextInput
              ref={positionRef}
              style={{color: 'white'}}
              keyboardType="numeric"
              defaultValue={String(thumbnailProps.positionInSeconds)}
              onChangeText={(text) =>
                updateThumbnailState({
                  ...thumbnailProps,
                  positionInSeconds: Number(text),
                })
              }
            />
          </TouchableOpacity>

          <Text style={localStyles.text}>Display :</Text>
          <Switch
            onValueChange={(value) =>
              updateThumbnailState({...thumbnailProps, display: value})
            }
            value={thumbnailProps.display}
          />
        </View>

        <Button
          title="Clear"
          onPress={() => updateThumbnailState({...initialThumbnailProps})}
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
  title: {
    fontSize: 20,
    color: '#FF0',
  },
  text: {
    fontSize: 18,
    color: '#FF0',
    width: '25%',
    paddingLeft: '5%',
  },
  textBox: {
    padding: 5,
    fontSize: 18,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#FFF',
    color: '#FFF',
    width: '25%',
  },
  rowContainer: {
    margin: 5,
    alignItems: 'center',
    flexDirection: 'row',
  },
});

export default Thumbnails;
