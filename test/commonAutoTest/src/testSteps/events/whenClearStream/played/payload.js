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
	getEventVerifier,
	updateOTVPlayerProps,
} from "../../../common";

import { createTextComponent } from "../../../../utils/textComponent";
import { isEmpty } from "../../../../utils/emptyEvent";
import { sleepInMs } from "../../../../utils/automationSupport";

const SET_TAGS = "@played @events @payload";
const TAGS_NOiOS = "@nonApple";

export async function executeEventPayloadTestsWhenPlayed(
	otvPlayer,
	streamName,
	eventTestPriority
) {
	let eventVerifier = getEventVerifier();
	let eventsPayload = [
		{ event: "onLoadStart", payload: "" },
		{ event: "onPlay", payload: "" },
		{ event: "onPlaying", payload: "" },
		{ event: "onAudioTrackSelected", payload: "" },
		{ event: "onTracksChanged", payload: "" },
	];
	await describe(`Verify event payload when ${streamName} is Played`, async () => {
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
			`plays ${streamName} and sees the event payload`,
			`${eventTestPriority} ${SET_TAGS}`,
			async () => {
				let expectedSource = await playMeGivenStream(
					otvPlayer,
					streamName
				);

				await sleepInMs(6000);

				eventsPayload.map((eventObj) => {
					expect(eventVerifier.didEventOccur(eventObj.event)).toBe(
						true,
						`${eventObj.event} occurred?`
					);

					eventObj.payload = eventVerifier.whatPayloadForEvent(
						eventObj.event
					);
					console.log(
						`${eventObj.event} with payload ${JSON.stringify(
							eventObj.payload
						)} `
					);
					switch (eventObj.event) {
						case "onLoadStart":
							expect(eventObj.payload).toEqual({
								src: expectedSource.src,
								type: expectedSource.type,
							});
							break;
						case "onPlay":
						case "onPlaying":
							expect(isEmpty(eventObj.payload)).toBe(
								true,
								"empty payload?"
							);
							break;
						case "onAudioTrackSelected":
							expect(eventObj.payload).toEqual({ index: 0 });
							break;
						case "onTracksChanged":
							expect(eventObj.payload).toEqual({
								...expectedSource.expectedOutput.tracks,
							});
							break;
					}
				});
			}
		);

		await it(
			`plays ${streamName} and sees the onProgress event payload`,
			`${eventTestPriority} ${SET_TAGS} @onProgress`,
			async () => {
				let res = await playMeGivenStream(otvPlayer, streamName);

				await sleepInMs(2000);

				expect(eventVerifier.didEventOccur("onProgress")).toBe(true);

				let actualPayload =
					eventVerifier.whatPayloadForEvent("onProgress");

				expect(actualPayload).not.toBeUndefined();
				if (actualPayload) {
					expect(Object.keys(actualPayload).length).toBe(4);

					expect(actualPayload.currentPosition).toBeGreaterThan(0);
					expect(actualPayload.playableDuration).toBeGreaterThan(0);
					if (!streamName.includes("LIVE")) {
						expect(
							actualPayload.seekableDuration
						).toEqualWithTolerance(res.expectedOutput.duration, 2);
					}
					expect(actualPayload.currentTime).toBeGreaterThan(0);
				}
			}
		);

		await it(
			`plays ${streamName} and sees subsequent onProgress events payload progressing`,
			`${eventTestPriority} ${SET_TAGS} @onProgress`,
			async () => {
				await playMeGivenStream(otvPlayer, streamName);

				await sleepInMs(2000);

				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"onProgress occurred?"
				);

				await sleepInMs(2500);

				let twoEvents =
					eventVerifier.getTwoEventsArrivingWithGapBetween(
						"onProgress",
						2000
					);

				expect(twoEvents.first).not.toBeUndefined("first payload?");
				expect(twoEvents.last).not.toBeUndefined("last payload?");

				if (twoEvents.first) {
					if (!streamName.includes("LIVE")) {
						expect(
							twoEvents.first.eventData.currentPosition
						).toBeLessThan(
							twoEvents.last.eventData.currentPosition,
							"current position moving?"
						);
					}
					expect(twoEvents.first.eventData.currentTime).toBeLessThan(
						twoEvents.last.eventData.currentTime,
						"current time moving?"
					);
				}
			}
		);

		await it(
			`plays ${streamName} and sees the onBitratesAvailable event payload`,
			`${eventTestPriority} ${SET_TAGS} ${TAGS_NOiOS} @onBitratesAvailable @nonSafari`,
			async () => {
				let res = await playMeGivenStream(otvPlayer, streamName);

				await sleepInMs(1000);
				expect(eventVerifier.didEventOccur("onBitratesAvailable")).toBe(
					true
				);

				let actualPayload = eventVerifier.whatPayloadForEvent(
					"onBitratesAvailable"
				);

				const expectedBitratesArray =
					res.expectedOutput.availableBitrates;
				let i = 0;

				expect(actualPayload).not.toBeUndefined();
				if (actualPayload) {
					expectedBitratesArray.forEach((bitrate) => {
						console.log(
							`actualPayload[i] : ${actualPayload.bitrates[i]} bitrate ${bitrate}`
						);
						expect(actualPayload.bitrates[i]).toEqual(bitrate);
						i++;
					});
				}
			}
		);

		/**
		 * Setting the SDK to uncapped first
		 * Wait for 2 sec
		 * Set the maxbitrate value on it.
		 * Check whether the currentPlaying bitrate is less than or equal to capped bitrate value.
		 */
		await it(
			`plays ${streamName}, set a cap and sees the onSelectedBitrateChanged event payload`,
			`@medium_priority ${SET_TAGS} @capping @onSelectedBitrateChanged @nonSafari`,
			async () => {
				// part1: Cap to the bitrate and check whether capping is applied
				//setting NULL
				let resource = await playMeGivenStream(otvPlayer, streamName);

				eventVerifier.reset();
				const TARGET_BITRATE =
					resource.expectedOutput.availableBitrates[0];
				let updateProps = {
					...resource.props,
					maxBitrate: TARGET_BITRATE,
				};

				await updateOTVPlayerProps(otvPlayer, updateProps);

				// Wait a considerable time for the player engine to settle
				// down on a variant that is within the cap.
				let expectationsMet = false;
				let countdown = 60;
				let actualPayload;
				while (!expectationsMet && countdown >= 0) {
					await sleepInMs(1000);
					if (
						eventVerifier.didEventOccur("onSelectedBitrateChanged")
					) {
						actualPayload = eventVerifier.whatPayloadForEvent(
							"onSelectedBitrateChanged"
						);
						expectationsMet =
							actualPayload &&
							actualPayload.bitrate <= TARGET_BITRATE;
					}
					console.log(
						`Expectations${
							expectationsMet ? "" : " NOT YET"
						} met (${countdown--})`
					);
				}

				expect(expectationsMet).toBe(true, "expectations met?");
				if (actualPayload) {
					expect(actualPayload.bitrate).toBeLessOrEqualTo(
						TARGET_BITRATE
					);
				}

				eventVerifier.reset();

				// Part 2: uncap the bitrate and check whether the bitrate got changed from the previous one.

				//Setting undefined
				let newProps = {
					...updateProps,
					maxBitrate:
						resource.expectedOutput.availableBitrates[
							resource.expectedOutput.availableBitrates.length - 1
						],
				};
				await updateOTVPlayerProps(otvPlayer, newProps);
				let secondExpectationsMet = false;
				let secondCountDown = 60;
				let uncappedPayload;
				while (!secondExpectationsMet && secondCountDown >= 0) {
					await sleepInMs(1000);
					if (
						eventVerifier.didEventOccur("onSelectedBitrateChanged")
					) {
						uncappedPayload = eventVerifier.whatPayloadForEvent(
							"onSelectedBitrateChanged"
						);
						console.log(
							"uncappedpayload:" + uncappedPayload.bitrate
						);
						secondExpectationsMet =
							uncappedPayload &&
							uncappedPayload.bitrate > actualPayload.bitrate;
					}
					console.log(
						`Expectations${
							secondExpectationsMet ? "" : " NOT YET"
						} met (${secondCountDown--})`
					);
				}

				expect(secondExpectationsMet).toBe(true);
				if (uncappedPayload) {
					expect(uncappedPayload.bitrate).toBeGreaterThan(
						actualPayload.bitrate
					);
				}
			}
		);

		await it(
			`plays ${streamName}, set a res cap and sees the onDownloadResChanged event payload`,
			`@medium_priority ${SET_TAGS} @capping @onDownloadResChanged @nonSafari`,
			async () => {
				let resource = await playMeGivenStream(otvPlayer, streamName);
				// Set cap to lowest resolution available
				const TARGET_WIDTH = 10;
				const TARGET_HEIGHT = 10;
				let TARGET_RESOLUTION = {
					width: TARGET_WIDTH,
					height: TARGET_HEIGHT,
				};

				eventVerifier.reset();
				let updateProps = {
					...resource.props,
					maxResolution: TARGET_RESOLUTION,
				};

				await updateOTVPlayerProps(otvPlayer, updateProps);
				// Wait a considerable time for the player engine to settle
				// down on a variant that is within the cap.
				let expectationsMet = false;
				let countdown = 60;
				let actualPayload;
				while (!expectationsMet && countdown >= 0) {
					await sleepInMs(1000);
					if (eventVerifier.didEventOccur("onDownloadResChanged")) {
						actualPayload = eventVerifier.whatPayloadForEvent(
							"onDownloadResChanged"
						);
						expectationsMet = true;
					}
					console.log(
						`Expectations${
							expectationsMet ? "" : " NOT YET"
						} met (${countdown--})`
					);
				}

				expect(expectationsMet).toBe(true);

				if (actualPayload) {
					expect(Object.keys(actualPayload).length).toEqual(2);
					expect(actualPayload.width).toBeGreaterOrEqualTo(
						TARGET_WIDTH
					);
					expect(actualPayload.height).toBeGreaterOrEqualTo(
						TARGET_HEIGHT
					);
				}

				eventVerifier.reset();

				//Part 2 : Uncap the resolution and check whether the resultant resolution is higher than the previous one.
				let newProps = {
					...updateProps,
					maxResolution: { width: Infinity, height: Infinity },
				};
				await updateOTVPlayerProps(otvPlayer, newProps);

				let secondExpectationsMet = false;
				let secondCountDown = 60;
				let uncappedPayload;
				while (!secondExpectationsMet && secondCountDown >= 0) {
					await sleepInMs(1000);
					if (eventVerifier.didEventOccur("onDownloadResChanged")) {
						uncappedPayload = eventVerifier.whatPayloadForEvent(
							"onDownloadResChanged"
						);
						secondExpectationsMet =
							uncappedPayload &&
							uncappedPayload.width > actualPayload.width &&
							uncappedPayload.height > actualPayload.height;
					}
					console.log(
						`Expectations${
							secondExpectationsMet ? "" : " NOT YET"
						} met (${secondCountDown--})`
					);
				}

				expect(secondExpectationsMet).toBe(true);

				if (uncappedPayload) {
					expect(Object.keys(uncappedPayload).length).toEqual(2);
					expect(uncappedPayload.width).toBeGreaterThan(
						actualPayload.width
					);
					expect(uncappedPayload.height).toBeGreaterThan(
						actualPayload.height
					);
				}
			}
		);
	});
}
