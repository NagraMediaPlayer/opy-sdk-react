// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { expect } from "@nagra/kwuo";

import React from "react";
import OTVPlayer from "@nagra/react-otvplayer";
import { renderComponent } from "../../utils/render";
import { getStream } from "../../res/media";
import PlayerEventVerifier from "../../PlayerEventVerifier";

let otvplayerRef = null;
let eventVerifier = new PlayerEventVerifier();
let sourceObject = null;

export function sleepInMs(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getEventVerifier() {
	return eventVerifier;
}

export async function waitAndCheckTime(totalWaitTimeSec, checkEverySoManySec) {
	let success = true;

	let lastProgressCheck = 0;
	let waitTimeSoFar = 0;

	do {
		await sleepInMs(1000 * checkEverySoManySec);
		waitTimeSoFar += checkEverySoManySec;

		let onProgress = eventVerifier.whatPayloadForEvent("onProgress");
		expect(onProgress).not.toBeUndefined();
		if (onProgress) {
			if (onProgress.currentTime > lastProgressCheck) {
				console.info(`Still playing after ${waitTimeSoFar}sec`);
				lastProgressCheck = onProgress.currentTime;
			} else {
				return false;
			}
		} else {
			return false;
		}
	} while (waitTimeSoFar <= totalWaitTimeSec);

	return success;
}

export async function waitAndCheckProgress(
	totalWaitTimeSec,
	checkEverySoManySec
) {
	let success = true;

	let lastProgressCheck = 0;
	let waitTimeSoFar = 0;

	do {
		await sleepInMs(1000 * checkEverySoManySec);
		waitTimeSoFar += checkEverySoManySec;

		let onProgress = eventVerifier.whatPayloadForEvent("onProgress");
		if (onProgress) {
			if (onProgress.currentPosition > lastProgressCheck) {
				console.info(`Still progressing after ${waitTimeSoFar}sec`);
				lastProgressCheck = onProgress.currentPosition;
			} else {
				return false;
			}
		} else {
			return false;
		}
	} while (waitTimeSoFar <= totalWaitTimeSec);

	return success;
}

export async function playThisStream(
	sourceObject,
	otvPlayer,
	updatedProps,
	timeoutMs = 7500
) {
	let progressInterval = 1; //1 second.
	let props = {
		source: sourceObject,
		progressUpdateInterval: progressInterval,
		onEnd: eventVerifier.onEnd,
		onSeek: eventVerifier.onSeek,
		onPaused: eventVerifier.onPaused,
		onStopped: eventVerifier.onStopped,
		onPlay: eventVerifier.onPlay,
		onLoadStart: eventVerifier.onLoadStart,
		onLoad: eventVerifier.onLoad,
		onLoadedData: eventVerifier.onLoadedData,
		onTracksChanged: eventVerifier.onTracksChanged,
		onPlaying: eventVerifier.onPlaying,
		onProgress: eventVerifier.onProgress,
		onAudioTrackSelected: eventVerifier.onAudioTrackSelected,
		onTextTrackSelected: eventVerifier.onTextTrackSelected,
		onThumbnailAvailable: eventVerifier.onThumbnailAvailable,
		onBitratesAvailable: eventVerifier.onBitratesAvailable,
		onDownloadResChanged: eventVerifier.onDownloadResChanged,
		onSelectedBitrateChanged: eventVerifier.onSelectedBitrateChanged,
		onError: eventVerifier.onError,
		onHttpError: eventVerifier.onHttpError,
		onStatisticsUpdate: eventVerifier.onStatisticsUpdate,
		ref: (ref1) => (otvplayerRef = ref1),
		style: { width: "100%", height: "100%" },
	};

	if (updatedProps) {
		if (undefined !== updatedProps.autoplay) {
			props.autoplay = updatedProps.autoplay;
		}
		if (undefined !== updatedProps.muted) {
			props.muted = updatedProps.muted;
		}
		if (undefined !== updatedProps.volume) {
			props.volume = updatedProps.volume;
		}

		if (updatedProps.maxBitrate) {
			props.maxBitrate = updatedProps.maxBitrate;
		}

		if (updatedProps.maxResolution) {
			props.maxResolution = updatedProps.maxResolution;
		}

		if (updatedProps.thumbnail) {
			props.thumbnail = updatedProps.thumbnail;
		}

		if (updatedProps.statisticsConfig) {
			props.statisticsConfig = updatedProps.statisticsConfig;
		}

		if (updatedProps.onLicenseRequest) {
			props.onLicenseRequest = updatedProps.onLicenseRequest;
		}
	}
	otvPlayer = React.createElement(OTVPlayer, props);

	await sleepInMs(1000); // Temporary workaround for allowing root view to mount before calling render
	await renderComponent(otvPlayer);

	await sleepInMs(timeoutMs);
}

export async function playMeGivenStream(otvPlayer, streamName) {
	let stream = getStream(streamName);

	sourceObject = {
		src: stream.url,
		type: stream.mimeType,
		token: stream.token,
		drm: {
			ssmServerURL: stream.ssmServerURL,
			certificateURL: stream.certificateURL,
			licenseURL: stream.licenseURL,
			type: stream.drm,
		},
	};

	await playThisStream(sourceObject, otvPlayer, stream.props);

	return {
		src: stream.url,
		type: stream.mimeType,
		props: stream.props,
		expectedOutput: stream.expectedOutput,
	};
}

export async function playMeGivenStreamWithProps(
	otvPlayer,
	streamName,
	playerProps
) {
	let stream = getStream(streamName);
	sourceObject = {
		src: stream.url,
		type: stream.mimeType,
		token: stream.token,
		drm: {
			ssmServerURL: stream.ssmServerURL,
			certificateURL: stream.certificateURL,
			licenseURL: stream.licenseURL,
			type: stream.drm,
		},
	};
	let UpdatedPlayerProps = stream.props;
	if (playerProps) {
		for (const key in playerProps) {
			if (playerProps.hasOwnProperty(key)) {
				UpdatedPlayerProps[key] = playerProps[key];
			}
		}
	}
	await playThisStream(sourceObject, otvPlayer, UpdatedPlayerProps);
	return {
		src: stream.url,
		type: stream.mimeType,
		props: UpdatedPlayerProps,
		expectedOutput: stream.expectedOutput,
	};
}

export async function playMeGivenKillStream(otvPlayer, streamName, killStream) {
	let stream = getStream(streamName);

	sourceObject = {
		src: stream.url,
		type: stream.mimeType,
		token: killStream.contentToken,
		drm: {
			ssmServerURL: stream.ssmServerURL,
			certificateURL: stream.certificateURL,
			licenseURL: stream.licenseURL,
			type: stream.drm,
		},
	};

	await playThisStream(sourceObject, otvPlayer, stream.props);

	return {
		src: stream.url,
		type: stream.mimeType,
		props: stream.props,
		expectedOutput: stream.expectedOutput,
	};
}

export async function updateStatisticsProps(
	otvPlayer,
	updatedProps,
	streamName
) {
	let stream = getStream(streamName);

	sourceObject = {
		src: stream.url,
		type: stream.mimeType,
		token: stream.token,
		drm: {
			ssmServerURL: stream.ssmServerURL,
			certificateURL: stream.certificateURL,
			licenseURL: stream.licenseURL,
			type: stream.drm,
		},
	};
	await playThisStream(sourceObject, otvPlayer, updatedProps);

	return {
		src: stream.url,
		type: stream.mimeType,
		props: stream.props,
		expectedOutput: stream.expectedOutput,
	};
}

export async function updateOTVPlayerProps(otvPlayer, updatedProps) {
	await playThisStream(sourceObject, otvPlayer, updatedProps);

	return updatedProps;
}

export async function pauseStream() {
	console.log("Calling PAUSE method");
	await otvplayerRef.pause();
	await sleepInMs(500);
}

export async function pauseStreamFor(ms) {
	console.log("Calling PAUSE method");
	await otvplayerRef.pause();
	await sleepInMs(ms);
}

export async function resumeStream(ms = 2500) {
	console.log("Calling PLAY method");
	await otvplayerRef.play();
	await sleepInMs(ms);
}

export async function stopStream(ms = 2500) {
	console.log("Calling STOP method");
	if (otvplayerRef) {
		otvplayerRef.stop();
	} else {
		console.info("STOP could not be executed");
	}
	await sleepInMs(ms);
}

export async function seekInStream(to) {
	console.log("Calling SEEK method");
	await otvplayerRef.seek(to);
	await sleepInMs(15000);
}

export async function seekNearEnd(length) {
	console.log("Calling SEEK method");
	await otvplayerRef.seek(length - 5);
	await sleepInMs(15000);
}

export async function selectAudioTrack(track) {
	console.log("Calling selectAudioTrack method");
	await otvplayerRef.selectAudioTrack(track);
	await sleepInMs(4000);
}

export async function selectTextTrack(track) {
	console.log("Calling selectTextTrack method");
	await otvplayerRef.selectTextTrack(track);
	await sleepInMs(4000);
}
