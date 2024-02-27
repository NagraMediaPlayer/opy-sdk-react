// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React from 'react';
import ActionButton from './common/ActionButton';
import assets from '../constants/assets';
import { Platform, Text, View } from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import videoStyles from '../assets/styles/videoStyles';
import { isHandheld, isMobileWeb } from '../utils/helper';

// types to be updated
type VideoControlsProps = {
  playing: boolean;
  pauseContent: () => void;
  playContent: () => void;
  position: any;
  duration: any;
  onSeekBack: () => void;
  onSeekForward: () => void;
  stopContent: () => void;
  toggleFullscreenButton: () => void;
  isFullscreenEnabled: boolean;
  focusedControl :any,
  setFocusedControl : any;
};
// control to handle play, pause, seek and stop
const VideoControls: React.FC<VideoControlsProps> = ({
  playing,
  pauseContent,
  playContent,
  position,
  duration,
  onSeekBack,
  onSeekForward,
  stopContent,
  toggleFullscreenButton,
  isFullscreenEnabled,
  focusedControl,
  setFocusedControl
}) => {
  const timeStr = new Date(1000 * position).toISOString().substr(11, 8);
  const totalTime = duration === Infinity ? '00:00' : new Date(1000 * duration).toISOString().substr(11, 8);
  return (
    <View style={styles.videoControl}>
      {playing ? (
        <ActionButton onPress={pauseContent} imgUrl={assets.pause} focusedControl={focusedControl} setFocusedControl={setFocusedControl} label={'play/pause'}/>
      ) : (
        <ActionButton onPress={playContent} imgUrl={assets.play} focusedControl={focusedControl} setFocusedControl={setFocusedControl} label={'play/pause'}/>
      )}
      <ActionButton imgUrl={assets.rewind} onPress={onSeekBack} focusedControl={focusedControl} setFocusedControl={setFocusedControl} label={'Seek Back'}/>
      <Text style={videoStyles.textStyleSmall}>
        {timeStr} / {totalTime}
      </Text>
      <ActionButton imgUrl={assets.forward} onPress={onSeekForward} focusedControl={focusedControl} setFocusedControl={setFocusedControl} label={'Seek Fwd'}/>
      <ActionButton imgUrl={assets.stop} onPress={stopContent} focusedControl={focusedControl} setFocusedControl={setFocusedControl} label={'Stop'} />
      {isHandheld && (
        <ActionButton
          focusedControl={focusedControl} 
          setFocusedControl={setFocusedControl}
          label = {"Full Screen"}
          onPress={toggleFullscreenButton}
          imgUrl={isFullscreenEnabled ? assets.collapse : assets.expand}
        />
      )}
    </View>
  );
};

export default VideoControls;

const styles = EStyleSheet.create({
  videoControl: {
    flexDirection: 'row',
    width: isMobileWeb() ? '100%' : '20%',
    justifyContent: 'space-evenly',
    '@media android': {
      width: Platform.isTV ? '30%' : '100%',
    },
    '@media ios': {
      width: Platform.isTV ? '20%' : '100%',
    },
  },
});
