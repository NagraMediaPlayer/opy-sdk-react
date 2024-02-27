// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { Platform, Dimensions } from "react-native"
export const isAndroid = () => {
    return Platform.OS === 'android'
}

export const isIOS = () => {
    return Platform.OS === 'ios'
}

export const isTvOS = () => {
    return Platform.isTV && isIOS()
}

export const isWeb = () => {
    return Platform.OS === 'web'
}

export const isHandheld = () => {
    return isAndroid() || isIOS()
}

export const isAndroidTV = () => {
    return Platform.isTV && isAndroid()
}

export const isSmartTV = () => {
    return isWeb() && window.navigator.userAgent.toLowerCase().includes('smart');
}

export const isSafari = () => {
    return !isSmartTV() && isWeb() && ((window.navigator.userAgent.indexOf("Safari") !== -1) && (window.navigator.userAgent.indexOf("Chrome") === -1))
}

export const isChrome = () => {
    return isWeb() && (window.navigator.userAgent.indexOf("Chrome") !== -1)
}

export const isEdge = () => {
    return isWeb() && (window.navigator.userAgent.indexOf("Edg") !== -1)
}

export const isApple = () => {
    return isIOS() || isTvOS() || isSafari()
}

export const isHBBTV = () => {
    return isWeb() && window.navigator.userAgent.toLowerCase().includes("hbbtv");
}

export const isTizen = () => {
    return window.navigator.userAgent.toLowerCase().includes("tizen");
}

export const isWebOS = () => {
    // Yes it is a zer0
    return window.navigator.userAgent.toLowerCase().includes("web0s");
}

export const isTVKeyCapable = () => {
    return isHBBTV() && isTizen();
}

export const isVestel = () => {
    return window.navigator.userAgent.toLowerCase().includes("vestel");
}

export const isVIDAA = () => {
    return window.navigator.userAgent.toLowerCase().includes("vidaa");
}

export const isMobileWeb = () => {
    return Platform.OS === 'web' && (window.navigator.userAgent.toLowerCase().match('android') || window.navigator.userAgent.toLowerCase().match('iphone') || window.navigator.userAgent.toLowerCase().match('ipad'))
}

export const isLandscape = () => {
    const dim = Dimensions.get('screen');
    return dim.width >= dim.height;
};