// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React from 'react';
import { View, Text, Platform } from 'react-native';
import ActionButton from './common/ActionButton';
import assets from '../constants/assets';
import EStyleSheet from 'react-native-extended-stylesheet';
import videoStyles from '../assets/styles/videoStyles';
import { isMobileWeb } from '../utils/helper';

type VolumeControlProps = {
  onDown: any;
  volume: any;
  onUp: any;
  muteContent: any;
  muted: boolean;
  focusedControl :any,
  setFocusedControl : any;
};
const VolumeControl: React.FC<VolumeControlProps> = ({
  onDown,
  volume,
  onUp,
  muteContent,
  muted,
  focusedControl,
  setFocusedControl,
}) => {
  const getVolumePercent = () => {
    return (100 * volume).toFixed(0);
  }
  return (
    <View
      style={styles.volumeControl}>
      <ActionButton
        onPress={muteContent}
        imgUrl={muted ? assets.unmute : assets.mute}
        focusedControl = {focusedControl}
        setFocusedControl={setFocusedControl}
        label = {'(un)Mute'}
      />
      <ActionButton onPress={onDown} imgUrl={assets.minus} focusedControl = {focusedControl} setFocusedControl={setFocusedControl} label = {'Vol Down'}/>
      <Text style={videoStyles.textStyleSmall}>
        {getVolumePercent() + '%'}
      </Text>
      <ActionButton onPress={onUp} imgUrl={assets.plus} focusedControl = {focusedControl} setFocusedControl={setFocusedControl} label = {'Vol Up'}/>
    </View>
  );
};
export default VolumeControl;
const styles = EStyleSheet.create({
  volumeControl: {
    flexDirection: 'row',
    width: isMobileWeb() ? '100%' : '20%',
    justifyContent: 'space-evenly',
    '@media android': {
      width: Platform.isTV ? '20%' : '90%',
      paddingTop: 8,
      paddingBottom: 8,
    },
    '@media ios': {
      width: Platform.isTV ? '20%' : '90%',
      paddingTop: 8,
      paddingBottom: 8,
    },
  }
});
