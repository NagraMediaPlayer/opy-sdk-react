// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { View, Text, FlatList } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import videoStyles from '../assets/styles/videoStyles';
import ActionButton from './common/ActionButton';
import assets from '../constants/assets';
import TVEventHandler from '../TVEventHandler';

// types to be updated
type LoggingProps = {
  level: string;
};

let tvEventHandler = new TVEventHandler();
const Logging: React.FC<LoggingProps> = ({
  level,
}) => {
  const [logHistory, setLogHistory] = useState([] as any);
  let isMounted = useRef(false);

  const appWarn = console.warn;
  const appInfo = console.info;
  const appLog = console.log;

  const rcuKeyHandler = (_component: any, event: { eventType: any; }) => {
    console.log('Player Key event: ', event);
    switch (event.eventType) { //NOSONAR
      case 'Clear Logs':
        clearLogs();
        break;
      default:
        // do nothing
        break;
    }
  };

  const showConsoleWarn = (...args: any[]) => {
    if (isMounted.current) {
      let logMessage = `${Array.from(args)}`;
      setLogHistory((prevHistory: any) => [logMessage, ...prevHistory]);
    }
    appWarn(...args);
  }

  const showConsoleInfo = (...args: any[]) => {
    if (isMounted.current) {
      let logMessage = `${Array.from(args)}`;
      setLogHistory((prevHistory: any) => [logMessage, ...prevHistory]);
    }
    appInfo(...args);
  }

  const showConsoleLog = (...args: any[]) => {
    if (isMounted.current) {
      let logMessage = `${Array.from(args)}`;
      setLogHistory((prevHistory: any) => [logMessage, ...prevHistory]);
    }
    appLog(...args);
  }

  const clearLogs = () => setLogHistory([]);

  useEffect(() => {
    console.warn = showConsoleWarn;
    console.info = showConsoleInfo;
    console.log = showConsoleLog;
    tvEventHandler.enable(null, rcuKeyHandler);
    isMounted.current = true;
    return () => {
      tvEventHandler.disable();
      isMounted.current = false;
    };
  }, []);

  return (
    <View style={videoStyles.logsStyles}>
      <View style={{ flexDirection: 'row' }}>
        <Text style={[videoStyles.logTitle, { width: '90%' }]}>Log Level - {level}</Text>
        <View style={{ backgroundColor: 'green', alignItems: 'center', width: '10%', paddingTop: 8 }}>
          <ActionButton imgUrl={assets.clear} label = {'Clear logs'} onPress={clearLogs} />
        </View>
      </View>
      <FlatList
        data={logHistory}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <Text
            style={{ color: '#ffffff', paddingLeft: 10, paddingTop: 5 }}
            key={index}>
            {item}
          </Text>
        )}
      />
    </View >
  );
};


export default Logging;
