// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import BasicPlayback from "./BasicPlayback";
import EncryptedPlayback from "./EncryptedPlayback";
import TrackSelection from "./TrackSelection";
import ResolutionAndBitRateCapping from "./ResolutionAndBitRateCapping";
import Startover from "./Startover";
import Stop from "./Stop";
import TVKCloud from "./TVKCloud";
import TVKUEX3 from "./TVKUEX3";
import Statistics from "./Statistics";
import Insight from "./Insight";
import SSMWidevine from "./SSMWidevine";
import SSMPlayReady from "./SSMPlayReady";
import SSMFairPlay from "./SSMFairPlay";
import SSMTVKey from "./SSMTVKey";
import PreferredAudioLanguage from "./PreferredAudioLanguage";
import { View, Button, Text, TouchableOpacity, Platform } from "react-native";
import React, { useEffect, useReducer } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TVEventHandler from "./TVEventHandler";
import ExampleButton from "./ExampleButton";
import Thumbnails from "./Thumbnails";
import CallBackModeFairPlay from "./CallBackModeFairPlay";
import CallBackModePlayReady from "./CallBackModePlayReady";
import CallBackModeTVKey from "./CallBackModeTVKey";
import CallBackModeWidevine from "./CallBackModeWidevine";
import SSMAsyncContentToken from "./SSMAsynContentToken";
import CallBackModeMultiSession from "./CallBackModeMultiSession";
import { isAndroid, isAndroidTV, isApple, isChrome, isEdge, isHandheld, isSmartTV, isTVKeyCapable, isIOS, isSafari, isWeb } from "./Utils";

const initialState = {
  list: [],
  current: "",
};

function myReducer(state, action) {
  let newState = state;
  switch (action.type) {
    case "append":
      newState = { ...state, list: [...state.list, action.payload] };
      break;

    case "increment":
      newState = {
        ...state,
        current: state.list[state.list.indexOf(state.current) + action.payload],
      };
      break;

    case "setCurrent":
      newState = { ...state, current: action.payload };
      break;

    case "navigate":
      action.payload.navigate(state.current);
      break;

    default:
      break;
  }
  return newState;
}

const Stack = createNativeStackNavigator();
function HomeScreen({ navigation }) {
  let tvEventHandler: any;

  const [state, dispatch] = useReducer(myReducer, initialState);

  const onRegistration = (label: string) => {
    dispatch({ type: "append", payload: label });
  };

  const setFocusedIndex = (label: string) => {
    dispatch({ type: "setCurrent", payload: label });
  };

  const doMove = (delta: number) => {
    dispatch({ type: "increment", payload: delta });
  };

  const doEnter = () => {
    dispatch({ type: "navigate", payload: navigation });
  };

  const rcuKeyHandler = (component, event: { eventType: string }) => {
    console.log(`Menu received key "${event.eventType}"`);
    switch (event.eventType) {
      case "back":
        window.history.go(-1);
        break;

      case "ok":
        doEnter();
        break;

      case "up":
        doMove(-1);
        break;

      case "down":
        doMove(+1);
        break;

      default:
        console.log(`Unhandled key "${event.eventType}"`);
    }
  };
  useEffect(() => {
    if (!isAndroid() && !isIOS()) {
      tvEventHandler = new TVEventHandler();
      tvEventHandler.enable(null, rcuKeyHandler);

      return () => {
        tvEventHandler.disable();
      };
    }
  }, []);

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text>React OTVPlayer Example Code mini apps</Text>
      <Text>Currently focused on {state.current}</Text>

      <ExampleButton
        navigation={navigation}
        buttonText="Basic Playback"
        focusLabel={state.current}
        setFocusLabel={setFocusedIndex}
        registrationCallback={onRegistration}
      />

      <ExampleButton
        navigation={navigation}
        buttonText="Encrypted Playback"
        focusLabel={state.current}
        setFocusLabel={setFocusedIndex}
        registrationCallback={onRegistration}
      />

      <ExampleButton
        navigation={navigation}
        buttonText="Startover"
        focusLabel={state.current}
        setFocusLabel={setFocusedIndex}
        registrationCallback={onRegistration}
      />

      <ExampleButton
        navigation={navigation}
        buttonText="Track Selection"
        focusLabel={state.current}
        setFocusLabel={setFocusedIndex}
        registrationCallback={onRegistration}
      />
      {isTVKeyCapable() && (
        <ExampleButton
          navigation={navigation}
          buttonText="TVKCloud"
          focusLabel={state.current}
          setFocusLabel={setFocusedIndex}
          registrationCallback={onRegistration}
        />)}
      {isTVKeyCapable() && (
        <ExampleButton
          navigation={navigation}
          buttonText="TVKUEX"
          focusLabel={state.current}
          setFocusLabel={setFocusedIndex}
          registrationCallback={onRegistration}
        />)}

      <ExampleButton
        navigation={navigation}
        buttonText="Stop"
        focusLabel={state.current}
        setFocusLabel={setFocusedIndex}
        registrationCallback={onRegistration}
      />

      {!isSafari() && <ExampleButton
        navigation={navigation}
        buttonText="Resolution And BitRate Capping"
        focusLabel={state.current}
        setFocusLabel={setFocusedIndex}
        registrationCallback={onRegistration}
      />}
      {(isAndroid() || isAndroidTV() || (isWeb() && !isSafari())) && (
        <ExampleButton
          navigation={navigation}
          buttonText="SSM Widevine"
          focusLabel={state.current}
          setFocusLabel={setFocusedIndex}
          registrationCallback={onRegistration}
        />)}

      {isApple() && (
        <ExampleButton
          navigation={navigation}
          buttonText="SSM FairPlay"
          focusLabel={state.current}
          setFocusLabel={setFocusedIndex}
          registrationCallback={onRegistration}
        />)}
      {(isEdge() || isSmartTV() || isAndroidTV()) && (
        <ExampleButton
          navigation={navigation}
          buttonText="SSM PlayReady"
          focusLabel={state.current}
          setFocusLabel={setFocusedIndex}
          registrationCallback={onRegistration}
        />)}

      {isTVKeyCapable() && (
        <ExampleButton
          navigation={navigation}
          buttonText="SSM TVKey"
          focusLabel={state.current}
          setFocusLabel={setFocusedIndex}
          registrationCallback={onRegistration}
        />)}

      <ExampleButton
        navigation={navigation}
        buttonText="Statistics"
        focusLabel={state.current}
        setFocusLabel={setFocusedIndex}
        registrationCallback={onRegistration}
      />

      <ExampleButton
        navigation={navigation}
        buttonText="Insight"
        focusLabel={state.current}
        setFocusLabel={setFocusedIndex}
        registrationCallback={onRegistration}
      />
      <ExampleButton
        navigation={navigation}
        buttonText="Thumbnails"
        focusLabel={state.current}
        setFocusLabel={setFocusedIndex}
        registrationCallback={onRegistration}
      />
      {isSafari() && (<ExampleButton
        navigation={navigation}
        buttonText="CallbackModeFairPlay"
        focusLabel={state.current}
        setFocusLabel={setFocusedIndex}
        registrationCallback={onRegistration}
      />)}
      {isTVKeyCapable() && (<ExampleButton
        navigation={navigation}
        buttonText="CallbackModeTVKey"
        focusLabel={state.current}
        setFocusLabel={setFocusedIndex}
        registrationCallback={onRegistration}
      />)}
      {(isEdge() || isSmartTV()) && (<ExampleButton
        navigation={navigation}
        buttonText="CallbackModePlayReady"
        focusLabel={state.current}
        setFocusLabel={setFocusedIndex}
        registrationCallback={onRegistration}
      />)}
      {isWeb() && !isSafari() && (
        <ExampleButton
          navigation={navigation}
          buttonText="CallbackModeWidevine"
          focusLabel={state.current}
          setFocusLabel={setFocusedIndex}
          registrationCallback={onRegistration}
        />
      )}
      {(isHandheld() || isChrome() || isEdge() || isSmartTV()) && (<ExampleButton
        navigation={navigation}
        buttonText="SSMAsyncContentToken"
        focusLabel={state.current}
        setFocusLabel={setFocusedIndex}
        registrationCallback={onRegistration}
      />)}
      {isWeb() && !isSafari() && (<ExampleButton
        navigation={navigation}
        buttonText="CallbackMode MultiSession"
        focusLabel={state.current}
        setFocusLabel={setFocusedIndex}
        registrationCallback={onRegistration}
      />)}
      {isWeb() && !isSafari() && (<ExampleButton
        navigation={navigation}
        buttonText="PreferredAudioLanguage"
        focusLabel={state.current}
        setFocusLabel={setFocusedIndex}
        registrationCallback={onRegistration}
      />)}
      <Button title="Back" onPress={() => window.history.go(-1)} />
    </View>
  );
}

function Menu() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Basic Playback"
          component={BasicPlayback}
          options={{ title: "Basic Playback" }}
        />
        <Stack.Screen
          name="Track Selection"
          component={TrackSelection}
          options={{ title: "Track Selection" }}
        />
        <Stack.Screen
          name="Statistics"
          component={Statistics}
          options={{ title: "Statistics" }}
        />
        <Stack.Screen
          name="Insight"
          component={Insight}
          options={{ title: "Insight" }}
        />
        <Stack.Screen
          name="SSM PlayReady"
          component={SSMPlayReady}
          options={{ title: "SSM PlayReady" }}
        />
        <Stack.Screen
          name="TVKUEX"
          component={TVKUEX3}
          options={{ title: "TVKUEX" }}
        />
        <Stack.Screen
          name="TVKCloud"
          component={TVKCloud}
          options={{ title: "TVKCloud" }}
        />
        <Stack.Screen
          name="Stop"
          component={Stop}
          options={{ title: "Stop" }}
        />
        <Stack.Screen
          name="Startover"
          component={Startover}
          options={{ title: "Startover" }}
        />
        <Stack.Screen
          name="Resolution And BitRate Capping"
          component={ResolutionAndBitRateCapping}
          options={{ title: "Resolution And BitRate Capping" }}
        />
        <Stack.Screen
          name="SSM Widevine"
          component={SSMWidevine}
          options={{ title: "SSM Widevine" }}
        />
        <Stack.Screen
          name="SSM FairPlay"
          component={SSMFairPlay}
          options={{ title: "SSM FairPlay" }}
        />
        <Stack.Screen
          name="SSM TVKey"
          component={SSMTVKey}
          options={{ title: "SSM TVKey" }}
        />
        <Stack.Screen
          name="Encrypted Playback"
          component={EncryptedPlayback}
          options={{ title: "Encrypted Playback" }}
        />
        <Stack.Screen
          name="Thumbnails"
          component={Thumbnails}
          options={{ title: "Thumbnails" }}
        />
        <Stack.Screen
          name="CallbackModeFairPlay"
          component={CallBackModeFairPlay}
          options={{ title: "CallbackModeFairPlay" }}
        />
        <Stack.Screen
          name="CallbackModeTVKey"
          component={CallBackModeTVKey}
          options={{ title: "CallbackModeTVKey" }}
        />
        <Stack.Screen
          name="CallbackModePlayReady"
          component={CallBackModePlayReady}
          options={{ title: "CallbackModePlayReady" }}
        />
        <Stack.Screen
          name="CallbackModeWidevine"
          component={CallBackModeWidevine}
          options={{ title: "CallbackModeWidevine" }}
        />
        <Stack.Screen
          name="SSMAsyncContentToken"
          component={SSMAsyncContentToken}
          options={{ title: "SSMAsyncContentToken" }} />
        <Stack.Screen
          name="CallbackMode MultiSession"
          component={CallBackModeMultiSession}
          options={{ title: "CallbackMode MultiSession" }} />
        <Stack.Screen
          name="PreferredAudioLanguage"
          component={PreferredAudioLanguage}
          options={{ title: "Preferred Audio Language" }} />

      </Stack.Navigator>
    </NavigationContainer >
  );
}

export default Menu;
