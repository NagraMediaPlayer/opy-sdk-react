// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import {Image, TouchableHighlight, Platform} from 'react-native';
import React from 'react';
import EStyleSheet from 'react-native-extended-stylesheet';

type ActionButtonProps = {
  onPress: () => void;
  imgUrl: any;
  customStyle?: object;
  tvPreferredFocus?: boolean;
  label:any;
  focusedControl:any;
  setFocusedControl : (label: any) => void;
};

const ActionButton: React.FC<ActionButtonProps> = ({ onPress, imgUrl, customStyle = {}, focusedControl,setFocusedControl, label, tvPreferredFocus = false }) => {
  const handlePress = () => {
    onPress();
    if (Platform.OS === "web"){
      setFocusedControl(label);
    }
  }
  return (
    <TouchableHighlight
      onPress={handlePress} activeOpacity={0.5} underlayColor="#eb6c3a" /*hasTVPreferredFocus = {tvPreferredFocus}*/>
      <Image source={imgUrl} resizeMode="contain" style={[styles.img, customStyle,focusedControl===label ? styles.focusedControl : null, ]} />
    </TouchableHighlight>
  );
};

export default ActionButton;

const styles = EStyleSheet.create({
  img: {
    width: 25,
    height: 25,
  },
  '@media ios': {
    width: 15,
    height: 15,
  },
  '@media android': {
    width: 15,
    height: 15,
  },
  focusedControl: {
    borderColor: 'black',
    borderWidth: 2,
  },
});
