
# react-native-otv-plugin

## With new code restructure changes

### Web

`$ cd otvplayer-<react-native-version>/` 'react-native-version' e.g. 0.72.4 | 0.67.4
`$ yarn Install`

### To build for dev

`$ yarn build-web-dev`

> dist folder is created in react-native-otvplayer/ folder.

## Getting started

`$ npm install react-native-otv-plugin --save`

### Mostly automatic installation
1. react-native link is an automatic way for installing native dependencies. Not required for Web platforms.

	`$ react-native link react-native-otv-plugin`

### Manual installation


#### iOS

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-otv-plugin` and add `RNOtvPlugin.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libRNOtvPlugin.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`)<

#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`
  - Add `import com.reactlibrary.RNOtvPluginPackage;` to the imports at the top of the file
  - Add `new RNOtvPluginPackage()` to the list returned by the `getPackages()` method
2. Append the following lines to `android/settings.gradle`:
  	```
  	include ':react-native-otv-plugin'
  	project(':react-native-otv-plugin').projectDir = new File(rootProject.projectDir, 	'../node_modules/react-native-otv-plugin/android')
  	```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
  	```
      compile project(':react-native-otv-plugin')
  	```

#### Windows
[Read it! :D](https://github.com/ReactWindows/react-native)

1. In Visual Studio add the `RNOtvPlugin.sln` in `node_modules/react-native-otv-plugin/windows/RNOtvPlugin.sln` folder to their solution, reference from their app.
2. Open up your `MainPage.cs` app
  - Add `using Otv.Plugin.RNOtvPlugin;` to the usings at the top of the file
  - Add `new RNOtvPluginPackage()` to the `List<IReactPackage>` returned by the `Packages` method


## Usage
```javascript
import RNOtvPlugin from 'react-native-otv-plugin';

// TODO: What to do with the module?
RNOtvPlugin;
```
