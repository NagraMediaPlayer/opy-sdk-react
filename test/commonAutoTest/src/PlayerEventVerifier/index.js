// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.

/**
 * PlayerEventVerifier implementation for react-native-web
 */

export default class PlayerEventVerifier {
	constructor() {
		this._eventLog = [];
	}

	onEnd = (event) => {
		this.logEventOccurrence("onEnd", event);
	};

	onLoadStart = (event) => {
		this.logEventOccurrence("onLoadStart", event);
	};

	onLoad = (event) => {
		this.logEventOccurrence("onLoad", event);
	};

	onLoadedData = (event) => {
		this.logEventOccurrence("onLoadedData", event);
	};

	onPlay = (event) => {
		this.logEventOccurrence("onPlay", event);
	};

	onPaused = (event) => {
		this.logEventOccurrence("onPaused", event);
	};

	onStopped = (event) => {
		this.logEventOccurrence("onStopped", event);
	};

	onSeek = (event) => {
		this.logEventOccurrence("onSeek", event);
	};

	onPlaying = (event) => {
		this.logEventOccurrence("onPlaying", event);
	};

	onTracksChanged = (event) => {
		this.logEventOccurrence("onTracksChanged", event);
	};

	onTextTrackSelected = (event) => {
		this.logEventOccurrence("onTextTrackSelected", event);
	};

	onAudioTrackSelected = (event) => {
		this.logEventOccurrence("onAudioTrackSelected", event);
	};

	onProgress = (event) => {
		this.logEventOccurrence("onProgress", event);
	};

	onThumbnailAvailable = (event) => {
		this.logEventOccurrence("onThumbnailAvailable", event);
	};

	onError = (event) => {
		this.logEventOccurrence("onError", event);
	};

	onBitratesAvailable = (event) => {
		this.logEventOccurrence("onBitratesAvailable", event);
	};

	onSelectedBitrateChanged = (event) => {
		this.logEventOccurrence("onSelectedBitrateChanged", event);
	};

	onDownloadResChanged = (event) => {
		this.logEventOccurrence("onDownloadResChanged", event);
	};

	onStatisticsUpdate = (event) => {
		this.logEventOccurrence("onStatisticsUpdate", event);
	};

	logEventOccurrence = (eventName, eventData) => {
		let timestamp = new Date();

		console.log(
			`${timestamp} Witnessed ${eventName} with payload ${JSON.stringify(
				eventData
			)}`
		);

		this._eventLog.push({
			eventName: eventName,
			timestamp: timestamp,
			eventData: eventData,
		});
	};

	didEventOccur = (eventName) => {
		let itHappened = false;
		this._eventLog.forEach((eventOccurrence) => {
			if (eventName === eventOccurrence.eventName) {
				itHappened = true;
			}
		});
		return itHappened;
	};

	_findFirstEventOccurrence = (eventName) => {
		let findFirstEventOccurrence;
		this._eventLog.forEach((eventOccurrence) => {
			if (eventName === eventOccurrence.eventName) {
				if (findFirstEventOccurrence) {
					// ignore subsequent we have one defined
				} else {
					findFirstEventOccurrence = eventOccurrence;
				}
			}
		});
		return findFirstEventOccurrence;
	};

	whatPayloadForFirstOfAnEvent = (eventName) => {
		let whatWasInThisEvent;

		const firstEventOccurrence = this._findFirstEventOccurrence(eventName);
		if (firstEventOccurrence) {
			whatWasInThisEvent = firstEventOccurrence.eventData;
		}
		return whatWasInThisEvent;
	};

	whatTimeForFirstOfAnEvent = (eventName) => {
		let timestamp;
		const firstEventOccurrence = this._findFirstEventOccurrence(eventName);
		if (firstEventOccurrence) {
			timestamp = firstEventOccurrence.timestamp;
		}
		return timestamp;
	};

	whatPayloadsForAllOfAnEvent = (eventName) => {
		let whatWasInThisEvent = [];
		this._eventLog.forEach((eventOccurrence) => {
			if (eventName === eventOccurrence.eventName) {
				whatWasInThisEvent.push(eventOccurrence.eventData);
			}
		});
		return whatWasInThisEvent;
	};

	whatPayloadForEvent = (eventName) => {
		let whatWasInThisEvent;
		this._eventLog.forEach((eventOccurrence) => {
			if (eventName === eventOccurrence.eventName) {
				whatWasInThisEvent = eventOccurrence.eventData;
			}
		});
		return whatWasInThisEvent;
	};

	/**
	 *
	 * @param {string} eventName Name of the two events we want to find
	 * @param {Integer} gapBetween How long there needs to be between them (ms)
	 */
	getTwoEventsArrivingWithGapBetween = (eventName, gapBetween) => {
		let returnValue = {};

		let thisEventsHistory = [];

		this._eventLog.forEach((eventOccurrence) => {
			if (eventName === eventOccurrence.eventName) {
				thisEventsHistory.push(eventOccurrence);
			}
		});

		let length = thisEventsHistory.length;

		// Best chance is with first and last
		if (length >= 2) {
			let timeDiff =
				thisEventsHistory[length - 1].timestamp -
				thisEventsHistory[0].timestamp;

			if (timeDiff >= gapBetween) {
				returnValue = {
					first: thisEventsHistory[0],
					last: thisEventsHistory[length - 1],
				};
			}
		}

		return returnValue;
	};

	didEventsArriveInOrder = (eventA, eventB) => {
		let itHappenedInOrder = false;

		let seenA = false;
		let seenB = false;
		const filteredList = this._eventLog.filter((eventOccurrence) => {
			if (!seenA && eventA === eventOccurrence.eventName) {
				seenA = true;
				return seenA;
			}
			if (!seenB && eventB === eventOccurrence.eventName) {
				seenB = true;
				return seenB;
			}
			return false;
		});

		if (
			filteredList.length === 2 &&
			filteredList[0].eventName === eventA &&
			filteredList[filteredList.length - 1].eventName === eventB
		) {
			itHappenedInOrder = true;
		} else {
			console.table(filteredList);
		}

		return itHappenedInOrder;
	};

	didEventsArriveAfterStop = () => {
		let eventsArrivedAfterStopped = false;

		let timestampForOnStopped = new Date();

		this._eventLog.forEach((eventOccurrence) => {
			if ("onStopped" === eventOccurrence.eventName) {
				timestampForOnStopped = eventOccurrence.timestamp;
			}
		});

		this._eventLog.forEach((eventOccurrence) => {
			if (eventOccurrence.timestamp > timestampForOnStopped) {
				eventsArrivedAfterStopped = true;
			}
		});

		return eventsArrivedAfterStopped;
	};

	reset = () => {
		let timestamp = new Date();

		console.log(`${timestamp} DISCARDING events seen up to now`);
		this._eventLog = [];
	};

	didEventOccurInTime = (interval, eventName) => {
		let statisticsList = [];

		this._eventLog.forEach((eventOccurrence) => {
			if (eventName === eventOccurrence.eventName) {
				statisticsList.push({
					eventName: eventOccurrence.eventName,
					timestamp: eventOccurrence.timestamp,
				});
			}
		});

		let length = statisticsList.length;
		let timeDiff =
			statisticsList[length - 1].timestamp -
			statisticsList[length - 2].timestamp;
		let timestampDiff = 0;
		if (timeDiff > 0) {
			timestampDiff = Math.round(timeDiff / 1000);
			if (timestampDiff === interval / 1000) {
				return true;
			}
		}
		return false;
	};
}
