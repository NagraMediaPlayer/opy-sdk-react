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
import { updateStatisticsProps, playMeGivenStream } from "../../../common";
import { createTextComponent } from "../../../../utils/textComponent";
import { isEmpty } from "../../../../utils/emptyEvent";
import { sleepInMs } from "../../../../utils/automationSupport";
import { getEventVerifier } from "../../../common";
import { isRunningInSafariBrowser } from "../../../../utils/platformVariations";
import { STATISTICS_TYPES } from "@nagra/react-otvplayer";

const SET_TAGS = // FIXME The stats feature is being reworked,
	// re-enable these tests when complete
	"@clear @played @events @high_priority @onStatisticsUpdate @under_development";

export async function executeStatisticsTests(otvPlayer) {
	let eventVerifier = getEventVerifier();
	await describe(`Verify statistics feature for a stream`, async () => {
		beforeAll(async () => {
			console.log(
				"Before ALL: due to a chicken/egg bug this can't be reached"
			);
		});

		beforeEach(async () => {});

		afterEach(async (thisTestDetails) => {
			let afterEachComponent = createTextComponent(thisTestDetails);

			eventVerifier.reset();
			await renderComponent(afterEachComponent);
		});

		afterAll(async () => {});

		await it(
			`Play a stream and confirm Statistics are enabled`,
			`${SET_TAGS}`,
			async () => {
				let resource = await playMeGivenStream(
					otvPlayer,
					isRunningInSafariBrowser()
						? "HLS Clear Statistics"
						: "VOD Clear Statistics"
				);
				await sleepInMs(10000);
				expect(eventVerifier.didEventOccur("onStatisticsUpdate")).toBe(
					true
				);

				let actualPayload =
					eventVerifier.whatPayloadForEvent("onStatisticsUpdate");
				expect(!isEmpty(actualPayload)).toBe(true);

				resource.expectedOutput.statistics.map((property) => {
					expect(actualPayload.hasOwnProperty(property)).toBe(
						true,
						`${property}`
					);
				});
			}
		);

		await it(
			"Play a stream and confirm statistics update interval",
			`${SET_TAGS} @nonWebos`,
			async () => {
				// TODO: This case is not stable on LG 2021 TV. should be investigated.
				let statConfig = {};
				let resource = await playMeGivenStream(
					otvPlayer,
					isRunningInSafariBrowser()
						? "HLS Zap Stream"
						: "VOD Zap Stream"
				);

				await sleepInMs(10000);

				let updateInterval = 2000;
				statConfig.statisticsConfig = {
					statisticsUpdateInterval: updateInterval,
				};
				let updateProps = { ...resource.props, ...statConfig };
				console.log(`updated Props ${JSON.stringify(updateProps)}`);

				await sleepInMs(10000);

				await updateStatisticsProps(
					otvPlayer,
					updateProps,
					isRunningInSafariBrowser()
						? "HLS Clear Statistics"
						: "VOD Clear Statistics"
				);

				await sleepInMs(10000);

				expect(
					eventVerifier.didEventOccurInTime(
						updateInterval,
						"onStatisticsUpdate"
					)
				).toBe(true);
			}
		);

		await it(
			"Play a stream and confirm statistics type- Rendering",
			`${SET_TAGS}`,
			async () => {
				let statConfig = {};
				let resource = await playMeGivenStream(
					otvPlayer,
					isRunningInSafariBrowser()
						? "HLS VOD Clear"
						: "VOD Encrypted"
				);

				await sleepInMs(5000);

				expect(eventVerifier.didEventOccur("onStatisticsUpdate")).toBe(
					true
				);

				let actualPayload =
					eventVerifier.whatPayloadForEvent("onStatisticsUpdate");
				console.log("sumer actual payload: ", actualPayload);
				expect(!isEmpty(actualPayload)).toBe(true);

				statConfig.statisticsConfig = {
					statisticsTypes: STATISTICS_TYPES.RENDERING,
				};
				let updateProps = { ...resource.props, ...statConfig };
				console.log(`updated Props ${JSON.stringify(updateProps)}`);

				await sleepInMs(5000);

				let newSource = await updateStatisticsProps(
					otvPlayer,
					updateProps,
					isRunningInSafariBrowser()
						? "HLS Clear Statistics"
						: "VOD Clear Statistics"
				);

				await sleepInMs(5000);

				actualPayload =
					eventVerifier.whatPayloadForEvent("onStatisticsUpdate");
				console.log("sumer actual payload1 RENDERING: ", actualPayload);
				expect(!isEmpty(actualPayload)).toBe(true);

				newSource.expectedOutput.statisticsRendering.map((property) => {
					expect(actualPayload.hasOwnProperty(property)).toBe(true);
				});
			}
		);

		await it(
			"Play a stream and confirm statistics type- NETWORK",
			`${SET_TAGS}`,
			async () => {
				let statConfig = {};
				let resource = await playMeGivenStream(
					otvPlayer,
					isRunningInSafariBrowser()
						? "HLS VOD Clear"
						: "VOD Encrypted"
				);

				await sleepInMs(5000);

				expect(eventVerifier.didEventOccur("onStatisticsUpdate")).toBe(
					true
				);

				let actualPayload =
					eventVerifier.whatPayloadForEvent("onStatisticsUpdate");
				console.log("sumer actual payload: ", actualPayload);
				expect(!isEmpty(actualPayload)).toBe(true);

				statConfig.statisticsConfig = {
					statisticsTypes: STATISTICS_TYPES.NETWORK,
				};
				let updateProps = { ...resource.props, ...statConfig };
				console.log(`updated Props ${JSON.stringify(updateProps)}`);

				await sleepInMs(5000);

				let newSource = await updateStatisticsProps(
					otvPlayer,
					updateProps,
					isRunningInSafariBrowser()
						? "HLS Clear Statistics"
						: "VOD Clear Statistics"
				);

				await sleepInMs(5000);

				actualPayload =
					eventVerifier.whatPayloadForEvent("onStatisticsUpdate");
				console.log("sumer actual payload1 NETWORK: ", actualPayload);
				expect(!isEmpty(actualPayload)).toBe(true);

				newSource.expectedOutput.StatisticsNetwork.map((property) => {
					expect(actualPayload.hasOwnProperty(property)).toBe(true);
				});
			}
		);

		await it(
			"Play a stream and confirm statistics type- PLAYBACK",
			`${SET_TAGS}`,
			async () => {
				let statConfig = {};
				let resource = await playMeGivenStream(
					otvPlayer,
					isRunningInSafariBrowser()
						? "HLS VOD Clear"
						: "VOD Encrypted"
				);

				await sleepInMs(5000);

				expect(eventVerifier.didEventOccur("onStatisticsUpdate")).toBe(
					true
				);

				let actualPayload =
					eventVerifier.whatPayloadForEvent("onStatisticsUpdate");
				console.log("sumer actual payload: ", actualPayload);
				expect(!isEmpty(actualPayload)).toBe(true);

				statConfig.statisticsConfig = {
					statisticsTypes: STATISTICS_TYPES.PLAYBACK,
				};
				let updateProps = { ...resource.props, ...statConfig };
				console.log(`updated Props ${JSON.stringify(updateProps)}`);

				await sleepInMs(5000);

				let newSource = await updateStatisticsProps(
					otvPlayer,
					updateProps,
					isRunningInSafariBrowser()
						? "HLS Clear Statistics"
						: "VOD Clear Statistics"
				);

				await sleepInMs(5000);

				actualPayload =
					eventVerifier.whatPayloadForEvent("onStatisticsUpdate");
				console.log("sumer actual payload1 PLAYBACK: ", actualPayload);
				expect(!isEmpty(actualPayload)).toBe(true);

				newSource.expectedOutput.statisticsPlayback.map((property) => {
					expect(actualPayload.hasOwnProperty(property)).toBe(true);
				});
			}
		);
	});
}
