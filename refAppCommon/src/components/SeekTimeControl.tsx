// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React from 'react';
import { View, Text } from 'react-native';
import ActionButton from '../components/common/ActionButton';
import assets from '../constants/assets';
import EStyleSheet from 'react-native-extended-stylesheet';
import videoStyles from '../assets/styles/videoStyles';

type SeekTimeControlProps = {
  seekTime: any;
  onDown: any;
  onUp: any;
  focusedControl :any,
  setFocusedControl : any;
};
const SeekTimeControl: React.FC<SeekTimeControlProps> = ({
  seekTime,
  onDown,
  onUp,
  focusedControl,
  setFocusedControl
}) => {
  return (
    <View
      style={styles.seekTimeControl}>
      <ActionButton onPress={onDown} imgUrl={assets.minus}  focusedControl={focusedControl} setFocusedControl={setFocusedControl} label={'Seek Time Down'} />
      <Text style={videoStyles.textStyleSmall}>
        {seekTime + ' seconds'}
      </Text>
      <ActionButton onPress={onUp} imgUrl={assets.plus}  focusedControl={focusedControl} label={'Seek Time Up'}/>
    </View>
  );
};
export default SeekTimeControl;
const styles = EStyleSheet.create({
  seekTimeControl: {
    flexDirection: 'row',
    width: '40%',
    justifyContent: 'space-around',
    '@media android': {
      width: '55%',
      paddingTop: 8,
      paddingBottom: 8,
    },
    '@media ios': {
      width: '55%',
      paddingTop: 8,
      paddingBottom: 8,
    },
  }
});
