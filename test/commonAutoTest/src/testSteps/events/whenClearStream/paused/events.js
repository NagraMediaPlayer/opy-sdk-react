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
	pauseStream,
	resumeStream,
	getEventVerifier,
} from "../../../common";
import { createTextComponent } from "../../../../utils/textComponent";

export async function executeEventsTestsWhenPaused(
	otvPlayer,
	streamName,
	eventTestPriority
) {
	let eventVerifier = getEventVerifier();
	let expectedEventsAfterResume = [
		{ event: "onPlay", isExpected: true },
		{ event: "onPlaying", isExpected: true },
		{ event: "onProgress", isExpected: true },
		{ event: "onAudioTrackSelected", isExpected: false },
	];
	await describe(`Verify events triggered when ${streamName} is Paused`, async () => {
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
			`pause ${streamName} and sees the onPaused event then resume and see onPlay,onPlaying,onProgress but no onAudioTrackSelected`,
			`${eventTestPriority} @events @paused @onAudioTrackSelected`,
			async () => {
				await playMeGivenStream(otvPlayer, streamName);

				await pauseStream();
				expect(eventVerifier.didEventOccur("onPaused")).toBe(
					true,
					"onPaused received?"
				);
				eventVerifier.reset();
				await resumeStream();

				expectedEventsAfterResume.map((eventObj) => {
					expect(eventVerifier.didEventOccur(eventObj.event)).toBe(
						eventObj.isExpected,
						`${eventObj.event} should ${
							eventObj.isExpected ? "arrive" : "not arrive"
						}`
					);
				});
			}
		);
	});
}
