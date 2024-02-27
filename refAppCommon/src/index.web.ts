// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
// @ts-ignore
import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import App from './App';
AppRegistry.registerComponent(appName, () => App);
AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: document.getElementById('root'),
});
