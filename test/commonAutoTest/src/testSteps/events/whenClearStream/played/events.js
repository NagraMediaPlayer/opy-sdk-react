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
import { playMeGivenStream, playMeGivenStreamWithProps, updateOTVPlayerProps, getEventVerifier } from "../../../common";
import { createTextComponent } from "../../../../utils/textComponent";
import { sleepInMs } from "../../../../utils/automationSupport";
import { isRunningInSafariBrowser } from "../../../../utils/platformVariations";

const SET_TAGS = "@played @events";

export async function executeEventsTestsWhenPlayed(otvPlayer, streamName, eventTestPriority) {
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
	await describe(`Verify events triggered when ${streamName} is Played`, async () => {
		beforeAll(async () => {
			console.log(
				"Before ALL: due to a chicken/egg bug this can't be reached"
			);
		});

		beforeEach(async () => { });

		afterEach(async (thisTestDetails) => {
			let afterEachComponent = createTextComponent(thisTestDetails);

			eventVerifier.reset();
			await renderComponent(afterEachComponent);
		});

		afterAll(async () => { });

		// This is because on Safari we have seen an issue where
		// the first playback test will fail because the plugin is
		// still initialising.
		// For some reason with Browser 5.17.0 or later (Frankie)
		// we get a `loadStart` before `ready` which should be
		// impossible!
		await it(
			"spins up the player without caring about the result",
			`@high_priority @medium_priority ${SET_TAGS} @nonApple @nonAndroid @nonChrome @nonHisense @nonVestel @nonTizen`,
			async () => {
				await playMeGivenStream(otvPlayer, streamName);
				await sleepInMs(8000);

				// Deliberately no expects
			}
		);

		await it(
			`plays ${streamName} and sees the ${events} events`,
			`${eventTestPriority} ${SET_TAGS}`,
			async () => {
				await playMeGivenStream(otvPlayer, streamName);
				await sleepInMs(8000);

				events.map(event => {
					if (isRunningInSafariBrowser() && (event.includes("onDownloadResChanged"))) {
						console.log("Event not expected " + event);
					} else {
						console.log("Event expected " + event);
						expect(eventVerifier.didEventOccur(event)).toBe(true, `${event} occurred?`);
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

		await it(
			`plays ${streamName} and sees the onError for autoPlay props`,
			`${eventTestPriority} ${SET_TAGS} @error @safari @nonApple @nonAndroid @nonChrome @nonHisense @nonVestel @nonTizen @nonWebos @under_development `,
			async () => {
				let updateProps = { autoplay: true, muted: false, volume: 0.7 };
				console.log(`updated props ${JSON.stringify(updateProps)}`);
				eventVerifier.reset();
				let resource = await playMeGivenStreamWithProps(otvPlayer, streamName, updateProps);
				let isErrorOccurred = false;
				let actualPayload = undefined;
				let isMediaDataLoaded = false;
				let maxWaitTimeinSec = 10;
				do {
					sleepInMs(1000);
					isMediaDataLoaded = eventVerifier.didEventOccur("onLoadedData");
				}
				while (!isMediaDataLoaded && --maxWaitTimeinSec);

				if (isMediaDataLoaded) {
					isErrorOccurred = eventVerifier.didEventOccur("onError");
					expect(isErrorOccurred).toBe(true, "Expected autoPlay to fail");
					actualPayload = eventVerifier.whatPayloadForFirstOfAnEvent("onError");
					expect(actualPayload).not.toBeUndefined();
					if (actualPayload) {
						expect(actualPayload.code).toBe(7026);
						expect(actualPayload.nativeError.details.errorCode).toBe(26);
					}
				}
				updateProps = { ...resource.props, autoplay: true, muted: true, volume: 0.0 };
				console.log(`Revert the updated props ${JSON.stringify(updateProps)}`);
				await playMeGivenStreamWithProps(otvPlayer, streamName, updateProps);
			}
		);
	});
}
