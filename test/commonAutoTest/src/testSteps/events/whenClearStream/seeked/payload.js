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

const SET_TAGS = "@seeked @events @payload";

export async function executeEventPayloadTestsWhenSeeked(
	otvPlayer,
	streamName,
	eventTestPriority
) {
	let eventVerifier = getEventVerifier();
	await describe(`Verify event data when ${streamName} is Seeked`, async () => {
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
			`Seek forward ${streamName} and sees the onSeek event payload`,
			`${eventTestPriority} ${SET_TAGS} onSeek`,
			async () => {
				await playMeGivenStream(otvPlayer, streamName);

				expect(eventVerifier.didEventOccur("onProgress")).toBe(true);
				let progressPayload = await eventVerifier.whatPayloadForEvent(
					"onProgress"
				);

				expect(progressPayload).not.toBeUndefined();
				if (progressPayload) {
					let currentPosition = progressPayload.currentPosition;

					let seekPosition = currentPosition + 60;
					await seekInStream(seekPosition);

					let actualPayload =
						eventVerifier.whatPayloadForEvent("onSeek");

					actualPayload.currentPosition =
						actualPayload.currentPosition;
					actualPayload.seekPosition = actualPayload.seekPosition;

					let expectedObject = {
						currentPosition: seekPosition,
						seekPosition: seekPosition,
					};

					expect(actualPayload.currentPosition).toEqualWithTolerance(
						expectedObject.currentPosition,
						2.5
					);
					expect(actualPayload.seekPosition).toEqualWithTolerance(
						expectedObject.seekPosition,
						2.5
					);
				}
			}
		);
	});
}
