// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import {Platform} from 'react-native';

const isSmartTv =
	Platform.OS === 'web'
		? window.navigator.userAgent.toLowerCase().includes('smart')
		: '';

const tvRemoteHints = [
	{deviceKey: 'Back', action: 'Back'},
	{deviceKey: '>', action: 'Channel Up'},
	{deviceKey: '<', action: 'Channel Down'},
	{deviceKey: '>', action: 'Move Up'},
	{deviceKey: '<', action: 'Move Down'},
	{deviceKey: 'Left Arrow', action: 'Move left'},
	{deviceKey: 'Right Arrow', action: 'Move right'},
	{deviceKey: 'Ok', action: 'Select'},
	{deviceKey: 'Rewind', action: 'Seek Back'},
	{deviceKey: 'Fast Forward', action: 'Seek Forward'},
	{deviceKey: '\u25B6', action: 'Play'},
	{deviceKey: '\u23F8', action: 'Pause'},
	{deviceKey: 'Stop', action: 'Stop'},
	{deviceKey: 'INFO', action: 'cycleInfo'},
	{deviceKey: 'Volume +', action: 'Vol Up'},
	{deviceKey: 'Volume -', action: 'Vol Down'},
	{deviceKey: 'Mute', action: 'Mute/Unmute'},
	{deviceKey: 'Red', action: 'Audio Track'},
	{deviceKey: 'Green', action: 'Clear Logs'},
	{deviceKey: 'Yellow', action: 'Log Level'},
	{deviceKey: 'STTL', action: 'Text Track'},
	{deviceKey: '1', action: 'Vol Up'},
	{deviceKey: '2', action: 'Vol Down'},
	{deviceKey: '3', action: 'Mute/Unmute'},
	{deviceKey: '4', action: 'Change Bitrate'},
	{deviceKey: '5', action: 'Change Resolution'},
	{deviceKey: '6', action: 'Stop'},
	{deviceKey: '7', action: 'Show TN'},
	{deviceKey: '8', action: 'Show Events Log'},
	{deviceKey: '0', action: 'Reset Perf Data'},
	{deviceKey: '9', action: 'Show Key Hints'},
];

const webKeyHints = [
	{deviceKey: 'x', action: 'Exit'},
	{deviceKey: 'Backspace', action: 'Back'},
	{deviceKey: '>', action: 'Move Up'},
	{deviceKey: '<', action: 'Move Down'},
	{deviceKey: 'Left Arrow', action: 'Move left'},
	{deviceKey: 'Right Arrow', action: 'Move right'},
	{deviceKey: 'Enter', action: 'Select'},
	{deviceKey: 'p', action: 'Play'},
	{deviceKey: 'Space', action: 'Pause'},
	{deviceKey: '1', action: 'Vol Up'},
	{deviceKey: '2', action: 'Vol Down'},
	{deviceKey: '3', action: 'Mute/Unmute'},
	{deviceKey: 'a', action: 'Audio Track'},
	{deviceKey: 'b', action: 'Change Bitrate'},
	{deviceKey: 'c', action: 'Clear Logs'},
	{deviceKey: 'd', action: 'Change Resolution'},
	{deviceKey: 'e', action: 'Show Events'},
	{deviceKey: 'i', action: 'Cycle Info'},
	{deviceKey: 'k', action: 'Show key Hints'},
	{deviceKey: 'l', action: 'Show Log Level'},
	{deviceKey: 'm', action: 'Mute/Unmute'},
	{deviceKey: 'r', action: 'Reset Perf Data'},
	{deviceKey: 's', action: 'Stop'},
	{deviceKey: 't', action: 'Text Track'},
];

const KEY_HINTS = isSmartTv ? tvRemoteHints : webKeyHints;

export default KEY_HINTS;
