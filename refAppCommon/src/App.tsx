// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.

import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import VideoScreen from './screens/VideoScreen';
import EStyleSheet from 'react-native-extended-stylesheet';
EStyleSheet.build();

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="video" component={VideoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
