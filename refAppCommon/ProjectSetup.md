> Note: This is the set of steps used to create refAppCommon, extracted from [the README](./README.md). This document may no longer be required, and so it will be removed if that is confirmed.

**TODO:**

1. Setup and run on tvOS/iOS
2. Setup for Android Handheld devices. The current setup uses the TV OS version of react native

# Prerequisites for setup

Following are some of the pre-requisites for this setup, and the versions setup was done with.

1. node : 14.17.1
2. yarn: 1.22.10
3. npx: 6.12.0

# Setup of code template

The setup of code template involves setting RN codebase which will allow to build and run code on [React Native](https://reactnative.dev/) supported native platforms, adding dependencies for [React Native Web](https://necolas.github.io/react-native-web/) to allow building and running code on Web based platforms, and finally adding RN OTVPlayer module so that App can use and demonstrate RN Player capabilities on all the platforms

## Step 1: Bring up React Native (with TypeScript) template

```bash
$ npx react-native init refAppCommon --template react-native-template-typescript@6.5.13
```

## Step 2: Replace react native with react native tvOS

In **package.json** replace the react native package with react native tvos package. This is done to build and test on Android TV and Apple TV devices

replace
`"react-native": "0.63.4"`
with
`"react-native": "npm:react-native-tvos@0.63.4-0"`

remove _node_modules_ and _yarn.lock_ files and run

```bash
$ yarn install
```

## Step 3: Sync up Android project on Android Studio

Open _refAppCommon/android_ in Android studio and let it sync (and Android Studio check and complete it's dependencies)

## Step 4: Run the App on Android TV / Emulator

At this point React Native App is ready _only_ for Android (TV) platforms.
Run the following command on the console to test on Android

```bash
$ yarn Android
```

**NOTE:** Please make sure the Android TV or Emulator are shown as devices and connected before running the command above.

## Step 5: Add dependency packages for web platform

For the same project code to run on web platforms, we need to add React Native Web and Webpack dependencies. Run the following command to do so.

```bash
$ yarn add react-dom@16.13.1 react-native-web@0.14.13
$ yarn add --dev webpack@5.28.0 webpack-cli@4.9.1 webpack-dev-server@3.11.2
$ yarn add --dev html-webpack-plugin@5.3.1 ts-loader@9.2.2
```

## Step 6: Add web specific bootstrap, entry, and build configuration files

For the App to run on web platform, it needs the following files as an entry & bootstrap code, and configuration files. Create a folder named _web_ under _refAppCommon/_

### HTML file

To run RN code on web platform, an entry HTML file is required. Add an _index.html_ file to _refAppCommon/web/_ folder

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>RNWP</title>
    <link href="main.css" rel="stylesheet" />
  </head>
  <body>
    <object
      id="appmgr"
      type="application/oipfApplicationManager"
      style="position: absolute; left: 0px; top: 0px; width: 0px; height: 0px;"
    ></object>
    <object
      id="vdo"
      type="video/broadcast"
      width="0"
      height="0"
      style="position: fixed; left: 0px; top: 0px; outline: transparent; -ant-user-input: disabled; -ant-highlight-colour: transparent;"
    ></object>
    <div
      style="width: 100%;height: auto; position: fixed; left: 0px; top: 0px; outline: transparent; -ant-user-input: disabled; -ant-highlight-colour: transparent;"
    >
      <video
        class="video-js vjs-default-skin vjs-16-9"
        id="videoPlayer"
        controls
        crossorigin="anonymous"
      ></video>
      <div
        id="root"
        style="position: absolute; top: 0; left: 0; width: 100%;height: auto;"
      ></div>
    </div>
  </body>
</html>
```

### _Webpack_ configuration file

To bundle and launch RN Web App on web platform add a file _webpack.config.js_ to _refAppCommon/web/_. This configuration points to the entry JS file to be used for web and configurations to be used for building and hot-reloading for web platform

```
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const rootDir = path.join(__dirname, '..');
const webpackEnv = process.env.NODE_ENV || 'development';
const webTsConfigFile = path.join(__dirname, 'tsconfigweb.json');
module.exports = {
  mode: webpackEnv,
  entry: {
    app: path.join(rootDir, './index.web.ts'),
  },
  output: {
    path: path.resolve(rootDir, 'dist'),
    filename: 'app-[hash].bundle.js',
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(tsx|ts|jsx|js|mjs)$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
        options: { configFile: webTsConfigFile }
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, './index.html'),
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
  resolve: {
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.tsx',
      '.ts',
      '.web.jsx',
      '.web.js',
      '.jsx',
      '.js',
    ], // read files in fillowing order
    alias: Object.assign({
      'react-native$': 'react-native-web',
    }),
  },
};
```

### _TypeScript_ configuration file

To allow App to be implemented in TypeScript, a TS configuration file _tsconfigweb.json_ is added under _refAppCommon/web/_ folder

```
{
  "compilerOptions": {
    "target": "es5",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "sourceMap": true,
    "jsx": "react"
  },
  "exclude": ["node_modules", "babel.config.js", "metro.config.js", "jest.config.js"],
  "include": ["../"]
}
```

### The JS entry file index.web.js

The entry file for the web platform needs to be added so that the RN Web way of App registry can be done and the code can be hooked in the DOM (root) defined in the html file. Add a file _index.web.js_ under _refAppCommon/_ folder

```
// @ts-ignore
import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import App from './App';
AppRegistry.registerComponent(appName, () => App);
AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: document.getElementById('root'),
});
```

### Update package.json scripts for web

To build and run on web platform add the following to the _refAppCommon/package.json_ script section

```
    "web": "cd web && webpack serve",
    "web-prod": "cd web && webpack --mode production --progress",
```

### Replace the App.tsx

To be able to run a very simple code of both Android and Web platforms, replace the existing _refAppCommon/App.tsx_ with the following code.

**NOTE:** The default App.tsx provided with RN template may not be runnable on Web platform as it may have some code/components/modules not valid for the Web world.

```
import React from 'react';
import { View, Text } from "react-native";

function App() {
    return (
        <View style={{flex: 1, backgroundColor: "lightblue", alignItems: 'center'}}>
            <Text>
                Hello React Native!!!
            </Text>
        </View>
    );
};

export default App;
```

## Build and Run on Web and Android

At this point the project is ready with configurations, and code to be run on Android and Web. Use the following commands on separate consoles to test it

### To run code on Web browser

```bash
$ yarn web
```

After the App bundling is successfully done for web, launch http://localhost:8080 on a Web Browser

### To run code on Android platforms

```bash
$ yarn android
```

## Add RN OTVPlayer

Please use the [OTVPlayer README](../react-native-otvplayer/README.md) to add RN OTVPlayer and example code.
