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
import {
	getEventVerifier,
	playMeGivenStream,
	sleepInMs,
	selectAudioTrack,
	selectTextTrack,
} from "../common";
import { isRunningInSafariBrowser } from "../../utils/platformVariations";
import { createTextComponent } from "../../utils/textComponent";
import { renderComponent } from "../../utils/render";

export async function executeTrackSelectionTests(otvPlayer, streamName) {
	let eventVerifier = getEventVerifier();
	let verifyTracks = (receivedTracks, expectedTracks) => {
		expect(receivedTracks.length).toEqual(
			expectedTracks.length,
			"tracks expected to match"
		);

		for (
			let receivedTrkIdx = 0;
			receivedTrkIdx < receivedTracks.length;
			receivedTrkIdx++
		) {
			let found = false;
			for (
				let expectedIndex = 0;
				!found && expectedIndex < expectedTracks.length;
				expectedIndex++
			) {
				found =
					JSON.stringify(expectedTracks[expectedIndex]) ===
					JSON.stringify(receivedTracks[receivedTrkIdx]);
			}
			expect(found).toBe(
				true,
				`Expecting for index ${receivedTrkIdx} ${JSON.stringify(
					receivedTracks[receivedTrkIdx]
				)}`
			);
		}
	};

	await describe(`play multitrack ${streamName}, change tracks and see onAudioTrackSelected, onTextTrackSelected events`, async () => {
		beforeAll(async () => {
			console.log(
				"Before ALL: due to a chicken/egg bug this can't be reached"
			);
		});

		beforeEach(async () => {
			eventVerifier.reset();
		});

		afterEach(async (thisTestDetails) => {
			let afterEachComponent = createTextComponent(thisTestDetails);

			await renderComponent(afterEachComponent);
		});

		afterAll(async () => {});

		await it(
			`play ${streamName} : Audio tracks and verify events`,
			`@high_priority @nonSafari @trackSelection @events @nonApple`,
			// Test unstable on iOS
			async () => {
				let resource = await playMeGivenStream(otvPlayer, streamName);
				await sleepInMs(5000);

				resource.expectedOutput.eventsExpected.map((eventObj) => {
					expect(eventVerifier.didEventOccur(eventObj.event)).toBe(
						true
					);

					if (eventObj.event === "onTracksChanged") {
						verifyTracks(
							eventVerifier.whatPayloadForEvent("onTracksChanged")
								.audioTracks,
							eventObj.payload.audioTracks
						);
					}
				});

				let defaultAudioTrack = eventVerifier.whatPayloadForEvent(
					"onAudioTrackSelected"
				).index;

				eventVerifier.reset();

				await selectAudioTrack(1 - defaultAudioTrack);

				expect(
					eventVerifier.didEventOccur("onAudioTrackSelected")
				).toBe(true);
				expect(
					eventVerifier.whatPayloadForEvent("onAudioTrackSelected")
				).toEqual({ index: 1 - defaultAudioTrack });

				eventVerifier.reset();

				if (!isRunningInSafariBrowser()) {
					// HLS stream only has 2 audio tracks
					// and they are in a non-deterministic order
					await selectAudioTrack(2);

					expect(
						eventVerifier.didEventOccur("onAudioTrackSelected")
					).toBe(true);
					expect(
						eventVerifier.whatPayloadForEvent(
							"onAudioTrackSelected"
						)
					).toEqual({ index: 2 });
					eventVerifier.reset();
				}
			}
		);

		// Text track selection avoided on Browser until later version of Shaka
		// where text tracks are reported correctly.
		await it(
			`play ${streamName} : Text tracks and verify events`,
			`@high_priority @nonSafari @trackSelection @events @nonApple @under_development`,
			// Test unstable on iOS
			async () => {
				let resource = await playMeGivenStream(otvPlayer, streamName);
				await sleepInMs(5000);

				resource.expectedOutput.eventsExpected.map((eventObj) => {
					expect(eventVerifier.didEventOccur(eventObj.event)).toBe(
						true
					);

					if (eventObj.event === "onTracksChanged") {
						verifyTracks(
							eventVerifier.whatPayloadForEvent("onTracksChanged")
								.textTracks,
							eventObj.payload.textTracks
						);
					}
				});

				eventVerifier.reset();

				await selectTextTrack(0);

				expect(eventVerifier.didEventOccur("onTextTrackSelected")).toBe(
					true,
					"onTextTrackSelected event occurred"
				);
				expect(
					eventVerifier.whatPayloadForEvent("onTextTrackSelected")
				).toEqual({ index: 0 }, "Text track index is 0");

				eventVerifier.reset();
				await selectTextTrack(-1);
				expect(eventVerifier.didEventOccur("onTextTrackSelected")).toBe(
					true,
					"onTextTrackSelected event occurred"
				);
				expect(
					eventVerifier.whatPayloadForEvent("onTextTrackSelected")
				).toEqual({ index: -1 }, "Text track index is -1");

				eventVerifier.reset();
				await selectTextTrack(1);

				expect(eventVerifier.didEventOccur("onTextTrackSelected")).toBe(
					true,
					"onTextTrackSelected event occurred"
				);
				expect(
					eventVerifier.whatPayloadForEvent("onTextTrackSelected")
				).toEqual({ index: 1 }, "Text track index is 1");
			}
		);
	});
}
