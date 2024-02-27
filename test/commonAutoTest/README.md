# Common Test Automation Framework

This folder contains all that is needed to perform automated testing of our React Native OTVPlayer plugin.

## Introduction

It can be run locally to verify your code changes before commit and will run as part of CI on successfully built code commits.

It is a **COMMON** test framework because it is designed to run the same tests across all our supported platforms, with minimal variation only when absolutely required for specific platform compatibility:

1. Browser
1. Smart TV (including HbbTV)
1. iOS Handheld
1. Android Handheld
1. tvOS
1. Android TV

Furthermore, it is **COMMON** test framework as it is intended to be reused across all our React Native Plugin products.

It executes tests against the **Plugin**'s APIs and not actually against a reference application's UI, therefore zero consideration is made for how it appears to human observer so no interaction with it is expected or required. Hence no screenshots are included here.

> When the application that carry's the test framework is launched, it simply executes the prescribed tests in the order specified and summarises the results when finished.

It aims to verify **consistency** and **parity** of functional behaviour across the platforms.

## Prerequisites for setup

Following are some of the pre-requisites for this setup, and the versions with which initial preparation was done.

1. Node.js v16.16.0
2. Yarn 1.22.10

<details><summary>Click to expand notes on NVM</summary>
CI makes use of (and is highly recommended for local dev/test environments) the Node Version Manager tool (NVM) whereby multple versions of Node.js are installed on a machine and can be easily switched between.

A `.nvmrc` file allows the intended Node.js version for that folder's contents to be clearly indicated to commands run within it.

The [`.nvmrc`](.nvmrc) file locally here indicates a Node.js version which in turn has `yarn` installed "gloablly" within its scope of operation, hence all commands below can be prefixed with `nvm exec` in order to set the environment to execute the command in the intended environment.

For example:

```bash
$ nvm exec yarn install
...
$ nvm exec yarn test:android
```

</details>

## Building and running on different platforms

Navigate to `test/commonAutoTest/commonAutoTest-<RN_Version>`

1. First build the app using an Artifactory hosted plugin from **_Step 1_**
   If you want to use plugin built locally, you need to modify package.JSON like :
2. Update the `react-native-otvplayer` dependency in [commonAutoTest-< RN_Version >/package.json](commonAutoTest-0.67.4/package.json), pointing to the locally-built plugin

   ```json
   "@nagra/react-otvplayer": "file:../../../react-native-otvplayer/dist/<RN_Version>",
   ```

### Step 1: Install dependencies

```bash
$ yarn install
```

### Build and Run on Web and Android

At this point the project is ready with configurations and code to be run. Use the following commands on separate consoles to test it:

#### Web browser

```bash
$ yarn test:web
```

After the App bundling is successfully completed for web, launch http://localhost:8085 in the Web Browser you wish to test.

#### Android

If you are running on mac devices then use first command

1. command allows you to expose a port on your Android device to a port on your computer.
   (It is going to expose tcp port 8081 on the phone via port 8081 on your computer.)

```bash
$ adb reverse tcp:8081 tcp:8081
```

2. Start android test app:

```bash
$ yarn test:android
$ yarn test:android-launch
```

#### iOS & tvOS

Navigate to `ios` folder and install pod dependencies.

```bash
$ cd ios && pod install
```

we can launch & run test app with refAppCommon.xcworkspace, if you want to execute ci scipt then follow below steps.
Again navigate back to `commonAutoTest-<RN_Version>` folder and use below script.

1. Start ios test app with ci script:

```bash
$ bash ../automationScripts/runTests.apple.sh --ios -f any -n 1
```

2. Start ios simulator test app with ci script:

```bash
$ bash ../automationScripts/runTests.apple.sh --iossimulator -f any -n 1
```

3. Start tvos test app with ci script:

```bash
$ bash ../automationScripts/runTests.apple.sh --tvos -f any -n 1
```

4. Start tvos simulator test app with ci script:

```bash
$ bash ../automationScripts/runTests.apple.sh --tvossimulator -f any -n 1
```

This builds a lightweight app that carries the ability to load the test framework via Metro bundling hosted on your machine.

> This in turn launches the _Metro_ bundler. If it is necessary to restart that piece use:
>
> ```bash
> $ yarn start:metro
> ```

## Maintenance/Writing new tests

See [this page](HOWTO.md).

## Tagging tests

See [this page](testTagging.md).
