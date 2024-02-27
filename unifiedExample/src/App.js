// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React from 'react';
import Menu from './Menu';
import {LogBox} from 'react-native';
LogBox.ignoreLogs(['EventEmitter.removeListener']);

class App extends React.Component {
	render() {
		return <Menu />;
	}
}

export default App;
