// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * TVEventHandler implementation for react-native-web
 */
import {findNodeHandle} from 'react-native';

export default class TVEventHandler {
	constructor() {
		this.userCallback = null; // callback into App Compnent
		this.that = null; // RN App component's 'this'. Will be passed as comp parm
		this.thatsNode = null; // HTML node of component

		// Used to save and pass the eventType as a string
		// NOTE: Mapping currntly hardcoded to NET's RCU
		this.event = {
			eventType: null,
		};

		this._keyMappingTable = [
			// Key me out of here
			{keyCode: 88, kbEquiv: 'x', eventType: 'exit'},
			{keyCode: 461, kbEquiv: '(back)', eventType: 'back'},
			{keyCode: 8, kbEquiv: '(back)', eventType: 'back'},
			{keyCode: 10009, kbEquiv: '(back)', eventType: 'back'},

			// Zap
			{keyCode: 427, kbEquiv: '>', eventType: 'channelUp'},
			{keyCode: 190, kbEquiv: '>', eventType: 'channelUp'},
			{keyCode: 33, kbEquiv: '>', eventType: 'channelUp'},
			{keyCode: 428, kbEquiv: '<', eventType: 'channelDown'},
			{keyCode: 188, kbEquiv: '<', eventType: 'channelDown'},
			{keyCode: 34, kbEquiv: '<', eventType: 'channelDown'},

			//Navigation
			{keyCode: 13, kbEquiv: 'Enter', eventType: 'enter'},
			{keyCode: 37, kbEquiv: 'ArrowLeft', eventType: 'left'},
			{keyCode: 38, kbEquiv: 'ArrowUp', eventType: 'up'},
			{keyCode: 39, kbEquiv: 'ArrowRight', eventType: 'right'},
			{keyCode: 40, kbEquiv: 'ArrowDown', eventType: 'down'},
			{keyCode: 412, kbEquiv: 'REW', eventType: 'Seek Back'},
			{keyCode: 417, kbEquiv: 'FFWD', eventType: 'Seek Fwd'},

			// Play
			{keyCode: 415, kbEquiv: '\u25B6', eventType: 'play'},
			{keyCode: 80, kbEquiv: 'p', eventType: 'play'},

			//Pause
			{keyCode: 19, kbEquiv: '\u23F8', eventType: 'pause'},
			{keyCode: 32, kbEquiv: '(space)', eventType: 'pause'},

			// Volume
			{keyCode: 187, kbEquiv: '+', eventType: 'Vol Up'},
			{keyCode: 447, kbEquiv: '1', eventType: 'Vol Up'},
			{keyCode: 49, kbEquiv: '1', eventType: 'Vol Up'},
			{keyCode: 189, kbEquiv: '-', eventType: 'Vol Down'},
			{keyCode: 448, kbEquiv: '2', eventType: 'Vol Down'},
			{keyCode: 50, kbEquiv: '2', eventType: 'Vol Down'},
			{keyCode: 449, kbEquiv: '(mute)', eventType: '(un)Mute'},
			{keyCode: 77, kbEquiv: 'm', eventType: '(un)Mute'},
			{keyCode: 51, kbEquiv: '3', eventType: '(un)Mute'},

			// audio tracks
			{keyCode: 65, kbEquiv: 'a', eventType: 'audioTrk'},
			{keyCode: 403, kbEquiv: '(red)', eventType: 'audioTrk'},

			// text tracks
			{keyCode: 84, kbEquiv: 't', eventType: 'textTrk'},
			{keyCode: 460, kbEquiv: 'STTL', eventType: 'textTrk'},
			{keyCode: 406, kbEquiv: '(blue)', eventType: 'textTrk'},

			// debug Log levels
			{keyCode: 405, kbEquiv: '(yellow)', eventType: 'LogLevel'},
			{keyCode: 76, kbEquiv: 'l', eventType: 'LogLevel'},

			// bitrate
			{keyCode: 66, kbEquiv: 'b', eventType: 'bitrate'},
			{keyCode: 52, kbEquiv: '4', eventType: 'bitrate'},

			// resolution
			{keyCode: 68, kbEquiv: 'd', eventType: 'resolution'},
			{keyCode: 53, kbEquiv: '5', eventType: 'resolution'},

			{keyCode: 67, kbEquiv: 'c', eventType: 'Clear Logs'},
			{keyCode: 404, kbEquiv: '(green)', eventType: 'Clear Logs'},

			{keyCode: 82, kbEquiv: 'r', eventType: 'Reset Perf Data'},
			{keyCode: 48, kbEquiv: '0', eventType: 'Reset Perf Data'},

			// stop
			{keyCode: 83, kbEquiv: 's', eventType: 'Stop'},
			{keyCode: 54, kbEquiv: '6', eventType: 'Stop'},
			{keyCode: 413, kbEquiv: '[stop]', eventType: 'Stop'},

			// thumbnail
			{keyCode: 55, kbEquiv: '7', eventType: 'Show TN'},

			// info
			{keyCode: 457, kbEquiv: 'INFO', eventType: 'cycleInfo'},
			{keyCode: 73, kbEquiv: 'i', eventType: 'cycleInfo'},
			{keyCode: 57, kbEquiv: '9', eventType: 'keyHints'},
			{keyCode: 75, kbEquiv: 'k', eventType: 'keyHints'},
			{keyCode: 56, kbEquiv: '8', eventType: 'events'},
			{keyCode: 69, kbEquiv: 'e', eventType: 'events'},
		];
	}

	/**
	 * Local function to receive "keypress" event
	 * registered for the specific component.
	 * This is reuqired to map native HTML event onto the generic event
	 * TVEventHandler as expected by App component
	 *
	 * @param {native} event
	 */
	_mapDataAndCall(event) {
		let found = false;
		for (let i = 0; !found && i < this._keyMappingTable.length; i++) {
			if (this._keyMappingTable[i].keyCode === event.keyCode) {
				this.event.eventType = this._keyMappingTable[i].eventType;
				found = true;
			}
		}

		if (!found) {
			console.log(`WARNING: Key ${event.keyCode} not mapped`);
			return;
		}

		// Call user callback with component and mapped event
		this.userCallback(this.that, this.event);
	}

	getKeyShortCuts() {
		let returnValue = '';
		let previous;
		for (let i = 0, count = 0; i < this._keyMappingTable.length; i++) {
			let current = this._keyMappingTable[i];

			let thisString = `${current.kbEquiv}  :`;
			thisString += `  ${current.eventType}`;
			if (previous && previous.kbEquiv === current.kbEquiv) {
				// Avoid duplicate entries
				continue;
			}
			returnValue += `  ${thisString}\n`;
			count++;

			previous = current;
		}

		return returnValue;
	}

	/**
	 *
	 * @param {object on which event occured} this
	 * @param {user function to call on a key event} callback
	 */
	enable(that, callback) {
		// sanity check
		if (typeof callback !== 'function') {
			console.log(
				'ERROR: Invalid params passed to TVEventHandler enable()',
			);
			return;
		}

		this.userCallback = callback;
		this.that = that;
		this.eventDataMapper = this._mapDataAndCall.bind(this);

		if (that) {
			// Find the HTML element
			this.thatsNode = findNodeHandle(that);
			// Add an event listener to a local function
			this.thatsNode.addEventListener('keydown', this.eventDataMapper);
		} else {
			this.thatsNode = null;
			addEventListener('keydown', this.eventDataMapper);
		}
	}

	/**
	 * Disable keydown events
	 */
	disable() {
		if (this.thatsNode) {
			this.thatsNode.removeEventListener('keydown', this.eventDataMapper);
		} else {
			removeEventListener('keydown', this.eventDataMapper);
		}

		this.userCallback = null;
		this.that = null;
		this.thatsNode = null;
		this.eventDataMapper = null;
	}
}
