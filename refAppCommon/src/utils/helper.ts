// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { Platform, Dimensions } from 'react-native';

/**
 * Returns true for handheld devices
 */
export const isHandheld = Platform.OS !== 'web' && !Platform.isTV;

/**
 * Returns true of the screen is in landscape mode
 */
export const isLandscape = () => {
  const dim = Dimensions.get('screen');
  return dim.width >= dim.height;
};

export const isSmartTV = () => {
  return Platform.OS === 'web' && window.navigator.userAgent.toLowerCase().includes('smart');
}

export const isMobileWeb = () => {
  return Platform.OS === 'web' && (window.navigator.userAgent.toLowerCase().match('android') || window.navigator.userAgent.toLowerCase().match('iphone') || window.navigator.userAgent.toLowerCase().match('ipad'))
}

export const isSafari = () => {
  return !isSmartTV() && Platform.OS === 'web' && ((window.navigator.userAgent.indexOf("Safari") !== -1) && (window.navigator.userAgent.indexOf("Chrome") === -1))
}