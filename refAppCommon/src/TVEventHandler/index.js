// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import {TVEventHandlerCore} from 'react-native';

// Put specifically to handle version upgrade to 0.67.4 as
// TV Support for Android/iOS (react-native-tvos) is not available in this version.
let TVEventHandlerdummy;
if (!TVEventHandlerCore) {
	TVEventHandlerdummy = () => {
		return {
			enable: (component, callback) => {},
			disable: () => {},
		};
	};
}
let TVEventHandler = TVEventHandlerCore
	? TVEventHandlerCore
	: TVEventHandlerdummy;

export default TVEventHandler;
