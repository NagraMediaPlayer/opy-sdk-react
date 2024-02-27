# React plugin for otv player SDK

## Directory tree (outline)

<!-- markdownlint-disable MD024 MD040 -->

```
[root]
├── [buildScripts]                      # Directory for all CI and developer's scripts
├── [dependencies]                      # Directory for all dependencies common to both ref app and plugin
├── README.md                           # This file
├── [react-native-otvplayer]            # Workspace for the plugin
│   ├──src
│   │ ├──android                        # The plugin android native code
│   │ └──web                            # The Browser/SmartTV web plugin
│   ├──otvplayer-0.72.4
│   │ ├──ios
│   │ │  ├──Podfile                     # The Pod file for ios
│   │ │  └──[ReactOtvplayer.xcodeproj]  # The plugin Xcode project with source code
│   │ ├──android
│   │ │  ├──gradle
│   │ │  ├──gradle.properties
│   │ │  ├──build.gradle
│   │ │  └──settings.gradle
│   │ └── package.json
│   ├──otvplayer-0.67.4
│   │ ├──ios
│   │ │  ├──Podfile                     # The Pod file for ios
│   │ │  └──[ReactOtvplayer.xcodeproj]  # The plugin Xcode project with source code
│   │ ├──android
│   │ │  ├──gradle
│   │ │  ├──gradle.properties
│   │ │  ├──build.gradle
│   │ │  └──settings.gradle
│   │ └── package.json
├── [refAppCommon]                      # React native App for android ,ios and web
│   ├──src
│   │ ├──android                        # The refAppCommon android code
│   │ └──web                            # The Browser/SmartTV web index.html
│   ├──app-0.72.4
│   │ ├──ios
│   │ │  ├──Podfile                     # The Pod file for ios
│   │ │  └──[refAppCommon.xcodeproj]    # The refAppCommon Xcode project with source code
│   │ ├──android                        # The gradle build files for android
│   │ │  ├──gradle
│   │ │  ├──gradle.properties
│   │ │  ├──build.gradle
│   │ │  └──settings.gradle
│   │ ├──web                            # The Browser/SmartTV web index.html
│   │ └── package.json                  # package.json
│   ├──app-0.67.4
│   │  ├──ios
│   │  │  ├──Podfile                    # The Pod file for ios
│   │  │  └──[refAppCommon.xcodeproj]   # The refAppCommon Xcode project with source code
│   │  ├──android                       # The gradle build files for android
│   │  │  ├──gradle
│   │  │  ├──gradle.properties
│   │  │  ├──build.gradle
│   │  │  └──settings.gradle
│   │  ├──web                           # The Browser/SmartTV web index.html
│   │  │  ├──tsconfig.json
│   │  │  └──webpack.config.js
│   │  └── package.json                 # package.json
└── [unifiedExample]                    # React native UnifiedExample App for android, ios and web

```

## Development environment

For Android, iOS and tvOS platforms follow the [React Native getting started guide](https://archive.reactnative.dev/docs/getting-started), following the React Native CLI Quickstart (not Expo CLI Quickstart).
For Web/HBBTV follow the [React Native Web getting started guide](https://necolas.github.io/react-native-web/docs/installation/), following the React App CLI Quickstart (not Expo CLI Quickstart).

### Prerequisites

We are assuming package managers Homebrew or Chocolatey are available on your system.

To install executing the following in this order:

> Note: you should close and open a new command line window after each installation.

For a Mac

1. Xcode (From App store)
1. Xcode command line tools

   `xcode-select --install`

   - If you need to update xcode be sure to do this afterwards.
     It often breaks.
     You can use Xcode to install the CLI as well.

1. [Homebrew](https://brew.sh) (click link and follow instructions)

   > Note: Homebrew installs to a new location for machines with `Apple Silicon` instead of Intel.
   > Any older packages that require brew in the old location will break.

   - If at any time you see the following error during installation or when updating or upgrading, it means you need to reinstall the xcode CLI (see above)

     `Error: python@3.8: the bottle needs the Apple Command Line Tools to be installed.`

1. [nvm](https://github.com/nvm-sh/nvm) click link and follow readme for instructions

1. watchman (`brew install watchman`)

   If this does not work or you experience issues with watchman, uninstall (`brew uninstall watchman`) and redo manually;
   (common issue is that brew install fails to make the directory)

   ```bash
   $ unzip watchman-*-linux.zip
   sudo mkdir -p /usr/local/{bin,lib} /usr/local/var/run/watchman
   sudo cp bin/* /usr/local/bin
   sudo cp lib/* /usr/local/lib
   sudo chmod 755 /usr/local/bin/watchman
   sudo chmod 2777 /usr/local/var/run/watchman
   ```

1. Yarn
   Using `nvm` you can change the version Yarn should install for.

1. Startup Xcode and install anything it asks you to.
   Make default project and build to simulator to get at least one simulator installed and setup.

1. Install cocoapods
   `sudo gem install cocoapods`

1. Install JDK (This is not for React, but for Android and Gradle)
   ```bash
   $ brew tap AdoptOpenJDK/openjdk
   $ brew install --cask adoptopenjdk8 (or whatever version you want
   ```
   (Note - Apple Silicon can run old versions of JDK for x86 using Rosetta. Could be issues though.)

### Special Instructions for the new Apple M1 silicon

#### Cocoapods for Apple M1

Cocoapods does not yet like running with the new Apple chip, so we need to run the `pod install` as follows;

`arch -x86_64 pod install`

If this fails, run the following to install some additional x86_64 packages, and then try again:

```bash
sudo arch -x86_64 gem install ffi
sudo arch -x86_64 gem install sassc
sudo arch -x86_64 gem install redcarpet
```

#### useful things

##### Homebrew

if you get the Brew shallow version warnings/errors you must follow the onscreen instructions to fix Brew first.

```bash
$ git -C /usr/local/Homebrew/Library/Taps/homebrew/homebrew-core fetch --unshallow
$ git -C /usr/local/Homebrew/Library/Taps/homebrew/homebrew-cask fetch --unshallow
```

Then you should be able to `brew update` and/or `brew upgrade`

```bash
$ brew list - get list of installed items
$ brew install x [-v n.n.n]
$ brew uninstall x
```

##### NVM

We use the contents of the [`.nvmrc`](.nvmrc) file in this workspace to designate to NVM the currently utilised version of Node.js.

- `nvm list` - show all versions of Node that nvm recognises
- `nvm install x.y.z`
- `nvm use x.y.z`
- `nvm alias default x.y.z` - default version to use.
  Packages installed via Brew might ignore this.

> Note: There may be more versions of Node installed via Brew than NVM uses

> Note: Yarn might use a default version that it was installed with when being run via Jenkins.
> If it is, uninstall, set the version of Node you need, then reinstall Yarn
> `nvm exec npm install yarn -g` will install Yarn "globally" in the context of our chosen version of Node as per the `.nvmrc` file.
> This will mean the relevant version of yarn is available by running `nvm exec yarn`.

##### Cocoapods

- `sudo gem install cocoapods` will install the latest version of CocoaPods.

- `Podfile.lock` contains the version of CocoaPods at the end

### For Windows

- [yarn](https://yarnpkg.com/)
  - (Windows) `choco install yarn`

### Android steps

- In `/react-native-otvplayer/otvplayer-<RN_Version>/android/` , `/refAppCommon/app-<RN_Version>/android/` , `/unifiedExample/example-<RN_Version>/android/`, create a `local.properties` file which contains the Android SDK installation path, e.g.

```
sdk.dir=C\:\\ExternalTools\\android_sdk_r24
```

## Quick start guide

1. Ensure you have the latest dependencies: (e.g. the native SDKs), they have been pre-fetched and are included in this deliverable.

2. Build Plugin (in root of work space)

   > If you just want to use plugin built by CI, goto **step 4**

   - iOS \
     `./buildScripts/buildReactOtvplayer.sh ios <RN_Version>`
   - e.g. - `./buildScripts/buildReactOtvplayer.sh ios 0.63.4`
   - tvOS \
     `./buildScripts/buildReactOtvplayer.sh tvos <RN_Version>`
   - \*nix/Android \
    `./buildScripts/buildReactOtvplayer.sh android <RN_Version>`
   - Web \
      `./buildScripts/buildReactOtvplayer.sh web <RN_Version>`

3. Build reference application for debugging

   For Android, IOS, tvOS and web platform (in \refAppCommon/app-< RN_Version >)- (e.g.- \refAppCommon/app-0.63.4).

   1. If you want to use plugin built locally from **step 3**, you need to modify `package.json` like :

      ```json
      "dependencies": {
         ...
         "@nagra/react-otvplayer": "^0.2.0-beta"

      }
      ```

      Change to

      ```json
      "dependencies": {
         ...
         "@nagra/react-otvplayer": "file:../../react-native-otvplayer/dist/<RN_Version>"
      }
      ```

   2. Download required NPM dependencies \
      `yarn install`
   3. Download required Pod dependencies: \
      Go to into the ios directory, \
      enter `pod install`
   4. Build and run the refAppCommon & refAppCommon-tvOS in Debug mode (in the refAppCommon/app-< RN version > folder) \
      _Note that use of a simulator requires that a scheme supports it_

      - iOS \
        the command to build is \
        `yarn react-native run-ios [--simulator "simulator"] [--scheme "scheme"]` \

      - to run a default scheme with a single connected device \
        `yarn react-native run-ios` \
      - to run a named build scheme \
        `yarn react-native run-ios --scheme "refAppCommon-tvOS"` \
      - to run with a simulator\
        `yarn react-native run-ios --simulator "iPhone 11"` \
      - to run a simulator on a required scheme \
        `yarn react-native run-ios --simulator "Apple TV" --scheme "refAppCommon-tvOS"` \
      - to run on a device \
        `yarn react-native run-ios --device [name of device if more than 1]` \
        or \
        `yarn react-native run-ios --uuid XXXXXXXX`
      - Android \
        `yarn react-native run-android ` or \
        `yarn react-native run-android --deviceId XXXXXXXX`
        > Note: Windows Terminal / Powershell must be run in administrator mode or the build may fail with the confusing message "Android project not found. Are you sure this is a React Native project?"

   5. Build and run the refAppCommon for web in Debug mode (in the refAppCommon/app-< RN version > folder) \
      _Note that use of a simulator requires that a scheme supports it_

      1. Selecting dev or production mode of RN OTVPlayer plugin

         1. Using webpack

         - In webpack.config.js file of an application, use DefinePlugin and declare constant as `OTVPLAYER_PROD` and set the value as either true or false.
         - If `OTVPLAYER_PROD` value is true, then it uses production build and it doesn't contain logs.
         - If `OTVPLAYER_PROD` value is false, then it uses debug build and it contains logs.
         - If `OTVPLAYER_PROD` value is undefined, then it uses production build.

         Example:

         ```sh
         new webpack.DefinePlugin({
         OTVPLAYER_PROD: true,
         })
         ```

         2. Using react-scripts

         - At the root folder, create `.env` file.
         - In `.env` file of an application, create custom environment variables beginning with `REACT_APP` and declare a constant as `REACT_APP_OTVPLAYER_PROD` and set the value as either `true` or `false`.
         - In order to consume `REACT_APP_OTVPLAYER_PROD` value, we need to have it defined in the environment. This can be done using two ways: either in your shell or in a `.env` file.
         - If `REACT_APP_OTVPLAYER_PROD` value is `true`, then it uses production build and it doesn't contain logs.
         - If `REACT_APP_OTVPLAYER_PROD` value is `false`, then it uses debug build and it contains logs.
         - If `REACT_APP_OTVPLAYER_PROD` value is `undefined`, then it uses production build.

         Example:

         ```sh
         REACT_APP_OTVPLAYER_PROD: true
         ```

      2. The command to build is

      - Production Mode: \
        `yarn build-prod`
      - Development Mode: \
        `yarn build-dev`

      3. The command to run \
         `yarn web`

4. Build release version and generate the package (ipa for iOS, apk for Android and zip for Web/HBBTV): <u>Under \<root\> of work space</u>
   - iOS \
      `sh buildScripts/buildRNOTVPlayerApp.sh refAppCommon <RN_Version> ios`
   - e.g. - `sh buildScripts/buildRNOTVPlayerApp.sh refAppCommon 0.63.4 ios`
   - tvOS \
      `sh buildScripts/buildRNOTVPlayerApp.sh refAppCommon <RN_Version> tvos`
   - Android \
     `sh buildScripts/buildRNOTVPlayerApp.sh refAppCommon <RN_Version> android`
   - Web/HBBTV \
      `sh buildScripts/buildRNOTVPlayerApp.sh refAppCommon <RN_Version> web`

## Android development

### Checking refapp react code

Run `yarn android` from `/refAppCommon/app-<RN_Version>/android/`.
As long as the node server is still running, any changes to the javascript should be visible when navigating back to the changed page.

### Checking native plugin code

1. Generate a new plugin with `.\gradlew.bat build` from `/react-native-otvplayer/otvplayer-<RN_Version>/android/`
2. Reinstall the plugin generated above with `yarn install --force` from `/refappCommon/app-<RN_Version>`.
3. Run the refapp with `yarn android` from `/refappCommon/app-<RN_Version>`.
