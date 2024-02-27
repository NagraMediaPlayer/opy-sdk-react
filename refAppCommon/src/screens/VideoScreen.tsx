// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React from 'react';
import Video from '../components/Video';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { isHandheld, isMobileWeb } from '../utils/helper';

const VideoScreen = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView>
        {(isHandheld || isMobileWeb()) ? (
          <ScrollView
            nestedScrollEnabled={true}
            style={{ width: '100%', height: '100%' }}>
            <Video />
          </ScrollView>
        ) : (
          <Video />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default VideoScreen;
