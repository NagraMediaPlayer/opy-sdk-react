// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
const getDeviceType = () => {
  let devType = 'desktop';

  if (/SMART/i.test(window.navigator.userAgent)) {
    devType = 'stb';
  }

  return devType;
};

const getDeviceManufacturer = () => {
  let mfr = 'TBD';

  if (/tizen/i.test(window.navigator.userAgent)) {
    mfr = 'Samsung';
  } else if (/web0s/i.test(window.navigator.userAgent)) {
    mfr = 'LG';
  } else if (/VIDAA/i.test(window.navigator.userAgent)) {
    mfr = 'Hisense';
  } else if (/vestel/i.test(window.navigator.userAgent)) {
    mfr = 'vestel';
  } else if (/windows/i.test(window.navigator.userAgent)) {
    mfr = 'Windows';
  } else if (/macintosh/i.test(window.navigator.userAgent)) {
    mfr = 'Macintosh';
  }

  return mfr;
};

const getDeviceModel = () => {
  let model = 'TBD';

  if (/Tizen/i.test(window.navigator.userAgent)) {
    model = 'tizen';
  } else if (/web0s/i.test(window.navigator.userAgent)) {
    model = 'webOS';
  } else if (/VIDAA/i.test(window.navigator.userAgent)) {
    model = 'VIDAA';
  } else if (/vestel/i.test(window.navigator.userAgent)) {
    model = 'vestel';
  } else if (/windows/i.test(window.navigator.userAgent)) {
    model = 'win';
  } else if (/macintosh/i.test(window.navigator.userAgent)) {
    model = 'mac';
  }

  return model;
};

let insightConfig = {
  operatorId: '9c703ed0309f',
  deviceId: '0A1B2C3D4E5',
  deviceType: getDeviceType(),
  deviceManufacturer: getDeviceManufacturer(),
  deviceModel: getDeviceModel(),
  appName: 'OpenTV Insight React refApp',
  appVersion: '1.x',
  //@ts-ignore
  osName: window.navigator.platform,
  osVersion: '8.1',
  //@ts-ignore
  screenWidth: window.screen.width,
  //@ts-ignore
  screenHeight: window.screen.height,
  screenDensity: 48,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  samplingInterval: 10,
  reportingInterval: 0.5,
  maxRetryInterval: 300,
  maxSamplingSize: 5,
  collectorURL: 'https://collector.insight-stats.com/api/v1',
  frameDropEnabled: true,
  minSessionLength: 20,
};

export default insightConfig;
