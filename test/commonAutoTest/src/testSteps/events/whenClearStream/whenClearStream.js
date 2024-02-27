// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
let appPKG = require("@nagra/react-otvplayer/package.json");
import { executeEventsTestsWhenPlayed } from "./played/events";
import { executeEventPayloadTestsWhenPlayed } from "./played/payload";
import { executeEventSequenceTestsWhenPlayed } from "./played/sequence";

import { executeEventsTestsWhenPaused } from "./paused/events";
import { executeEventPayloadTestsWhenPaused } from "./paused/payload";
import { executeEventSequenceTestsWhenPaused } from "./paused/sequence";

import { executeEventsTestsWhenSeeked } from "./seeked/events";
import { executeEventPayloadTestsWhenSeeked } from "./seeked/payload";

import { executeEventsTestsWhenEnded } from "./ended/events";
import { executeEventPayloadTestsWhenEnded } from "./ended/payload";
import { executeEventsTestsWhenStopped } from "./stopped/events";

import {
	isRunningOnAndroid,
	isRunningOniOS,
	isRunningOntvOS,
} from "../../../utils/platformVariations";

export async function executeEventsTestsForContent(
	otvPlayer,
	streamName,
	eventTestPriority = "@high_priority"
) {
	console.info(`Kickoff for test of version ${appPKG.version}`);

	///////// PLAY
	await executeEventsTestsWhenPlayed(
		otvPlayer,
		streamName,
		eventTestPriority
	);
	await executeEventPayloadTestsWhenPlayed(
		otvPlayer,
		streamName,
		eventTestPriority
	);
	await executeEventSequenceTestsWhenPlayed(
		otvPlayer,
		streamName,
		eventTestPriority
	);

	///////// PAUSE
	if (!isRunningOnAndroid() && !isRunningOniOS() && !isRunningOntvOS()) {
		await executeEventsTestsWhenPaused(
			otvPlayer,
			streamName,
			eventTestPriority
		);
	}
	await executeEventPayloadTestsWhenPaused(
		otvPlayer,
		streamName,
		eventTestPriority
	);
	if (!isRunningOnAndroid() && !isRunningOniOS() && !isRunningOntvOS()) {
		// TODO onPlay is not seen on Handheld after resume from paused
		await executeEventSequenceTestsWhenPaused(
			otvPlayer,
			streamName,
			eventTestPriority
		);
	}

	if (!streamName.includes("LIVE")) {
		///////// SEEK
		await executeEventsTestsWhenSeeked(
			otvPlayer,
			streamName,
			eventTestPriority
		);
		await executeEventPayloadTestsWhenSeeked(
			otvPlayer,
			streamName,
			eventTestPriority
		);

		///////// END
		await executeEventsTestsWhenEnded(
			otvPlayer,
			streamName,
			eventTestPriority
		);
		await executeEventPayloadTestsWhenEnded(
			otvPlayer,
			streamName,
			eventTestPriority
		);
	}
	// STOP
	await executeEventsTestsWhenStopped(
		otvPlayer,
		streamName,
		eventTestPriority
	);

	console.info(`End test of version ${appPKG.version}`);
}
