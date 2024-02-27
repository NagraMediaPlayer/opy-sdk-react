# unifiedExample

This is a Reference App to demonstrate some of the features of React Native OTVPlayer plugin. It can be built and run on multiple platforms (Web/Android/AndroidTV/iOS/tvOS/SmartTV).

> If you are looking for the steps used to initially set up the common ref app, they have been moved to [ProjectSetup.md](./ProjectSetup.md)

## Building the app with an Artifactory-hosted React Native plugin

The following commands will build the common ref app for each platform. You will be prompted to select the plugin version to use.

> **TODO:** Confirm these commands work for **iOS**, **tvOS** and **web**, correcting them as necessary.

### Android

> create a local.properties file inside the android folder and set the 'sdk.dir' path. For windows it is 'sdk.dir=C\:\\ExternalTools\\android_sdk_r24' and for mac it is 'sdk.dir=/Users/[USER]/Library/Android/sdk'

```bash
bash -x buildScripts/buildRNOTVPlayerApp.sh unifiedExample <RN_Version> android
# or
./buildScripts/buildRNOTVPlayerApp.sh unifiedExample <RN_Version> android
e.g.- ./buildScripts/buildRNOTVPlayerApp.sh unifiedExample 0.63.4 android
```

### iOS

```bash
bash -x buildRNOTVPlayerApp.sh unifiedExample <RN_Version> ios
# or
.//buildRNOTVPlayerApp.sh unifiedExample <RN_Version> ios
```

### tvOS

```bash
bash -x buildRNOTVPlayerApp.sh unifiedExample <RN_Version> tvos
# or
./buildRNOTVPlayerApp.sh unifiedExample <RN_Version> tvos
```

### Web

> **Note:** This does not appear to work locally

```bash
bash -x buildRNOTVPlayerApp.sh unifiedExample <RN_Version> web
# or
./buildRNOTVPlayerApp.sh unifiedExample <RN_Version> web
```

## Building unifiedExample using a locally built React Native plugin

### Android

This will allow you to build the app using Android Studio on Mac

1. First build the app using an Artifactory hosted plugin as shown above (This is a ~~hack~~ workaround that resolves some necessary dependencies we will need later)
2. Build the React Native plugin for Android (as described in the main [README's](../README.md) Quick Start Guide)
3. Collate the plugins
   ```bash
   $ ./buildScripts/buildReactOtvplayer.sh collate <RN_Version>
   ```
4. Update the `react-native-otvplayer` dependency in [example-<RN_Version>/package.json](e.g.- example-0.63.4/package.json), pointing to the locally-built plugin
   ```json
   "@nagra/react-otvplayer": "file:../../react-native-otvplayer/dist/<RN_Version>",
   ```
5. Navigate to `unifiedExample/example-<RN_Version>`
6. Fetch the dependencies (if buildscript for building unifiedExample is not executed else skip this step and jump to step 3)

   ```bash
   $ yarn install
   ```

7. If your are building unifiedExample with `react-native-version 0.67.4` then follow the below step
   (patch the react-native/index.js file to remove the contstraints related to Picker added in later RN versions.)

```bash
   $ cd node_modules/react-native
   $ patch < ../../patch/react_native_index.js.patch
```

then navigate to `unifiedExample/example-<RN_Version>`,

8. Start android app:

```bash
$ yarn android
```

```bash
$ yarn android-launch
```

Alternatively Select the "app" target in Android Studio and run it. The common ref app should be deployed to your device and start running.

### Web

```bash
$ yarn web
```

To generate build folder with production mode

```bash
$ yarn web-prod
```

### iOS (TODO)

1. Placeholder text

### tvOS (TODO)

1. Placeholder text
