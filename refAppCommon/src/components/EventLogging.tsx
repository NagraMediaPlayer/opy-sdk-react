// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import {View, Text, FlatList} from 'react-native';
import React from 'react';
import videoStyles from '../assets/styles/videoStyles';

// types to be updated
type EventLoggingProps = {
  messageHistory: any;
  historySize: number;
};

const EventLogging : React.FC<EventLoggingProps> = ({
  messageHistory,
  historySize
}) => {
  return (
    <View style={videoStyles.logsStyles}>
      <Text style={videoStyles.logTitle}>Event Logging</Text>
        <FlatList
          data={messageHistory.slice(0, historySize)}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item, index}) => (
            <Text
              style={{color: '#ffffff', paddingLeft: 10, paddingTop: 10}}
              key={index}>
              {item}
            </Text>
          )}
        />
    </View>
  );
};

export default EventLogging;
