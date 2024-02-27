// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import {View, Text, FlatList} from 'react-native';
import React from 'react';
import videoStyles from '../assets/styles/videoStyles';
import KEY_HINTS from '../constants/KeyHints';
import commonStyles from '../assets/styles/commonStyles';

const KeyHints = () => {
   // @ts-ignore
   const renderItem = ({item}): ReactElement<any, any> => (
    <View style={{flexDirection: 'row',marginLeft: '10%', justifyContent: 'space-between', width: '80%', alignItems: 'center', height: 40}}>
    <Text style = {commonStyles.whiteBoldText}>{item.deviceKey}</Text>
    <Text style = {{color: 'white'}}>{item.action}</Text>
    </View>
  );
  const itemSeparator = () => {
    return (
      <View
        style={{
          height: 1,
          width: "100%",
          backgroundColor: "grey",
        }}
      />
    );
  }
  return (
    <View style={videoStyles.logsStyles}>
      <Text style={videoStyles.logTitle}>Key Hints</Text>
      <FlatList
        data={KEY_HINTS}
        renderItem={renderItem}
        keyExtractor={(_item, index) => index.toString()}
        ItemSeparatorComponent={itemSeparator}
      />     
    </View>
  );
};

export default KeyHints;
