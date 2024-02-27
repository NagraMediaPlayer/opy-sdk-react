// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/* eslint-disable react-native/no-inline-styles */
import { View, Text, Platform } from 'react-native';
import React, { useState } from 'react';
import EStyleSheet, { absoluteFill } from 'react-native-extended-stylesheet';
import { OTVSDK } from '@nagra/react-otvplayer';
import ActionButton from './ActionButton';
import assets from '../../constants/assets';

const Header = ({toggleInfo, infoEnabled, focusedControl,setFocusedControl, infoLabel}) => {
  let version = OTVSDK.getVersion();
  const handlePress = () => {
    toggleInfo();
    if(Platform.OS === "web"){
      setFocusedControl('Info')
    }
  }
  return (
    <View style={[styles.headerStyle, { flexDirection: 'row', zIndex: 99999 }]}>
      <Text style={styles.titleStyle}>
        OTVPlayer React Native Reference Application
      </Text>
      <ActionButton onPress={handlePress} imgUrl={assets.info} customStyle={{ marginTop: 7, marginRight: 5 }} tvPreferredFocus={true} focusedControl = {focusedControl} label = {infoLabel} />
      {
        infoEnabled && <View style={styles.infoPopup}>
          <Text style={styles.infoText}>{version !== null ? `PLUGIN VERSION v${version.otvPlayerVersion}` : null}</Text>
          <Text style={styles.infoText}>{version !== null ? `SDK VERSION v${version.sdkVersion}` : null}</Text>
        </View>
      }
    </View>
  );
};

export default Header;

const styles = EStyleSheet.create({
  headerStyle: {
    backgroundColor: '#003265',
    fontSize: '1.5rem',
    height: 40,
    paddingLeft: 10,
    paddingRight: 10,
    width: '100%',
    '@media ios': {
      fontSize: '0.7rem',
    },
    '@media android': {
      fontSize: '0.7rem',
    },
  },
  titleStyle: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ffffff',
    alignSelf: 'center',
    flex: 3,
  },
  infoPopup: {
    zIndex: 9999,
    width: 180,
    height: 150,
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    right: 15,
    backgroundColor: 'grey',
    top: 32,
    borderRadius: 5,
  },
  infoText: {
    color: 'white',
    padding: 10,
  }
});
