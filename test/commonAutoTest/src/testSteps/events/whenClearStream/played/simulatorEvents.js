// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import {
	describe,
	it,
	expect,
	beforeEach,
	afterEach,
	beforeAll,
	afterAll,
} from "@nagra/kwuo";
import { renderComponent } from "../../../../utils/render";
import {
	playMeGivenStream,
	stopStream,
	updateOTVPlayerProps,
	getEventVerifier,
} from "../../../common";
import { createTextComponent } from "../../../../utils/textComponent";
import { sleepInMs } from "../../../../utils/automationSupport";
import { isRunningInSafariBrowser } from "../../../../utils/platformVariations";

const SET_TAGS = "@played @events @ios_simulator";

export async function executeEventsTestsWhenPlayedOnIosSimulator(
	otvPlayer,
	streamName,
	eventTestPriority
) {
	let eventVerifier = getEventVerifier();
	let events = [
		"onLoadStart",
		"onLoad",
		"onPlay",
		"onTracksChanged",
		"onPlaying",
		"onProgress",
		"onBitratesAvailable",
		"onAudioTrackSelected",
		"onDownloadResChanged",
		"onStatisticsUpdate",
	];
	await describe(`Verify events triggered when ${streamName} is Played on Simulator`, async () => {
		let beforeAllComponent = createTextComponent(
			"Auto-test: About to start on Simulator tests"
		);
		await renderComponent(beforeAllComponent);

		beforeAll(async () => {
			console.log(
				"Before ALL: due to a chicken/egg bug this can't be reached"
			);
		});

		beforeEach(async () => {});

		afterEach(async (thisTestDetails) => {
			await stopStream();
			let afterEachComponent = createTextComponent(thisTestDetails);

			eventVerifier.reset();
			await renderComponent(afterEachComponent);
		});

		afterAll(async () => {});

		await it(
			`plays ${streamName} and sees the ${events} events`,
			`${eventTestPriority} ${SET_TAGS}`,
			async () => {
				await playMeGivenStream(otvPlayer, streamName);
				await sleepInMs(8000);

				events.map((event) => {
					if (
						isRunningInSafariBrowser() &&
						event.includes("onDownloadResChanged")
					) {
						console.log("Event not expected " + event);
					} else {
						console.log("Event expected " + event);
						expect(eventVerifier.didEventOccur(event)).toBe(
							true,
							`${event} occurred?`
						);
					}
				});
			}
		);

		await it(
			`plays ${streamName} and sees the onSelectedBitrateChanged event`,
			`${eventTestPriority} ${SET_TAGS} @onSelectedBitrateChanged @nonSafari`,
			async () => {
				//Setting infinity
				let resource = await playMeGivenStream(otvPlayer, streamName);

				let updateProps = { ...resource.props, maxBitrate: -1 };

				console.log(`updated props ${JSON.stringify(updateProps)}`);

				await sleepInMs(2000);
				await updateOTVPlayerProps(otvPlayer, updateProps);

				await sleepInMs(5000);

				expect(
					eventVerifier.didEventOccur("onSelectedBitrateChanged")
				).toBe(true, "onSelectedBitrateChanged occurred");
			}
		);
	});
}
