// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * TVEventHandler implementation for react-native-web
 */
import { findNodeHandle } from "react-native";

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
			{ keyCode: 88, kbEquiv: "x", eventType: "exit" },
			{ keyCode: 413, kbEquiv: "[stop]", eventType: "exit" },
			{ keyCode: 461, kbEquiv: "(back)", eventType: "back" },
			// Zap
			{ keyCode: 427, kbEquiv: ">", eventType: "channelUp" },
			{ keyCode: 190, kbEquiv: ">", eventType: "channelUp" },

			{ keyCode: 428, kbEquiv: "<", eventType: "channelDown" },
			{ keyCode: 188, kbEquiv: "<", eventType: "channelDown" },

			{ keyCode: 37, kbEquiv: "ArrowLeft", eventType: "Seek Back" },
			{ keyCode: 39, kbEquiv: "ArrowRight", eventType: "Seek Fwd" },
			// Currently redundant
			// {keyCode: 38,  kbEquiv: "ArrowUp",    eventType: "up"},
			// {keyCode: 40,  kbEquiv: "ArrowDown",  eventType: "down"},

			// Play/Pause
			{ keyCode: 415, kbEquiv: "\u25B6", eventType: "play" },
			{ keyCode: 80, kbEquiv: "p", eventType: "play" },
			{ keyCode: 19, kbEquiv: "\u23F8", eventType: "pause" },
			{ keyCode: 32, kbEquiv: "(space)", eventType: "pause" },

			// Volume
			{ keyCode: 187, kbEquiv: "+", eventType: "Vol Up" },
			{ keyCode: 447, kbEquiv: "1", eventType: "Vol Up" },
			{ keyCode: 189, kbEquiv: "-", eventType: "Vol Down" },
			{ keyCode: 448, kbEquiv: "2", eventType: "Vol Down" },
			{ keyCode: 77, kbEquiv: "m", eventType: "(un)Mute" },
			{ keyCode: 51, kbEquiv: "3", eventType: "(un)Mute" },

			// audio tracks
			{ keyCode: 65, kbEquiv: "a", eventType: "audioTrk" },
			{ keyCode: 403, kbEquiv: "(red)", eventType: "audioTrk" },

			// text tracks
			{ keyCode: 84, kbEquiv: "t", eventType: "textTrk" },
			{ keyCode: 406, kbEquiv: "(blue)", eventType: "textTrk" },
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
			console.log("WARNING: Key not mapped");
			return;
		}

		// Call user callback with component and mapped event
		this.userCallback(this.that, this.event);
	}

	getKeyShortCuts() {
		let returnValue = "";
		let previous;
		for (let i = 0; i < this._keyMappingTable.length; i++) {
			let current = this._keyMappingTable[i];

			let thisString = `${current.kbEquiv}:`;
			thisString += `${current.eventType}`;

			if (previous && previous.kbEquiv === current.kbEquiv) {
				// Avoid duplicate entries
				continue;
			}
			returnValue += `  ${thisString}`;

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
		if (typeof callback !== "function") {
			console.log(
				"ERROR: Invalid params passed to TVEventHandler enable()"
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
			this.thatsNode.addEventListener("keydown", this.eventDataMapper);
		} else {
			this.thatsNode = null;
			addEventListener("keydown", this.eventDataMapper);
		}
	}

	/**
	 * Disable keydown events
	 */
	disable() {
		if (this.thatsNode) {
			this.thatsNode.removeEventListener("keydown", this.eventDataMapper);
		} else {
			removeEventListener("keydown", this.eventDataMapper);
		}

		this.userCallback = null;
		this.that = null;
		this.thatsNode = null;
		this.eventDataMapper = null;
	}
}
