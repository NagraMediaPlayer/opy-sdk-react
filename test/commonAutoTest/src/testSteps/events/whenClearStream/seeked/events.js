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
	seekInStream,
	getEventVerifier,
} from "../../../common";
import { createTextComponent } from "../../../../utils/textComponent";

export async function executeEventsTestsWhenSeeked(
	otvPlayer,
	streamName,
	eventTestPriority
) {
	let eventVerifier = getEventVerifier();
	await describe(`Verify events triggered when ${streamName} is Seeked`, async () => {
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
			`Seek forward ${streamName} and sees the onSeek event`,
			`${eventTestPriority} @events @seeked @onSeek`,
			async () => {
				await playMeGivenStream(otvPlayer, streamName);

				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"onProgress received?"
				);

				let progressPayload = await eventVerifier.whatPayloadForEvent(
					"onProgress"
				);
				expect(progressPayload).not.toBeUndefined("onProgressPayload?");

				if (progressPayload) {
					let currentPosition = progressPayload.currentPosition;

					await seekInStream(currentPosition + 60);
					expect(eventVerifier.didEventOccur("onSeek")).toBe(
						true,
						"onSeek received?"
					);
				}
			}
		);

		await it(
			`Seek backwards ${streamName} and sees the onSeek event`,
			`${eventTestPriority} @events @seeked @onSeek`,
			async () => {
				await playMeGivenStream(otvPlayer, streamName);

				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"onProgress received?"
				);

				let progressPayload = await eventVerifier.whatPayloadForEvent(
					"onProgress"
				);
				expect(progressPayload).not.toBeUndefined("onProgressPayload?");
				if (progressPayload) {
					let currentPosition = progressPayload.currentPosition;

					expect(currentPosition).not.toBeUndefined();

					await seekInStream(currentPosition + 60);
					let updatedProgressPayload =
						await eventVerifier.whatPayloadForEvent("onProgress");
					expect(updatedProgressPayload).not.toBeUndefined(
						"onProgress payload?"
					);
					let updatedPosition =
						updatedProgressPayload.currentPosition;

					expect(updatedPosition).not.toBeUndefined();

					eventVerifier.reset();

					await seekInStream(updatedPosition - 30);

					expect(eventVerifier.didEventOccur("onSeek")).toBe(
						true,
						"onSeek received?"
					);
				}
			}
		);
	});
}
