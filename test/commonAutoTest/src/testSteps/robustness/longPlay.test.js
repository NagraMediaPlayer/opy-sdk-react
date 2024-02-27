// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import {
	it,
	expect,
	afterAll,
	describe,
	afterEach,
	beforeAll,
	beforeEach,
} from "@nagra/kwuo";
import { renderComponent } from "../../utils/render";
import {
	getEventVerifier,
	playMeGivenStream,
	stopStream,
	waitAndCheckTime,
} from "../common";
import { sleepInMs } from "../../utils/automationSupport";
import { createTextComponent } from "../../utils/textComponent";
import { STATISTICS_TYPES } from "@nagra/react-otvplayer";

export async function executeLongPlayTests(otvPlayer, streamName, streamType) {
	let eventVerifier = getEventVerifier();
	await describe("Execute long play tests", async () => {
		beforeAll(async () => {
			console.log(
				"Before ALL: due to a chicken/egg bug this can't be reached"
			);
		});

		beforeEach(async () => {});

		afterEach(async (thisTestDetails) => {
			let afterEachComponent = createTextComponent(thisTestDetails);

			await renderComponent(afterEachComponent);
		});

		afterAll(async () => {});

		await it(
			`Long playback of ${streamName} for 4 hrs, checking playback every 30s`,
			`@long_play @robustness ${streamType}`,
			async () => {
				const fpsThreshold = 20;
				let runtimeHrs = 4;
				let elapsedTimeInMs = 0;
				const totalInMs = parseFloat(runtimeHrs) * 60 * 60 * 1000;
				const startTime = Date.now();

				let statConfig = {};

				statConfig.statisticsConfig = {
					statisticsTypes: STATISTICS_TYPES.RENDERING,
				};

				await playMeGivenStream(otvPlayer, streamName, statConfig);

				while (elapsedTimeInMs < totalInMs) {
					// todo set up averaging of fps due to buffering etc?
					//let actualPayload = eventVerifier.whatPayloadForEvent("onStatisticsUpdate");
					//expect(actualPayload.framesPerSecond).toBeGreaterThan(fpsThreshold);
					// check still playing
					let playing = await waitAndCheckTime(4, 2);
					expect(playing).toBe(true, "Are we playing?");
					if (!playing) {
						break;
					}
					await sleepInMs(30 * 1000);
					elapsedTimeInMs = Date.now() - startTime;
				}
				await stopStream();
			}
		);
	});
}
