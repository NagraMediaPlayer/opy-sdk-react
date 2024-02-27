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
	seekNearEnd,
	getEventVerifier,
	playMeGivenStream,
} from "../../../common";
import { createTextComponent } from "../../../../utils/textComponent";

export async function executeEventsTestsWhenEnded(
	otvPlayer,
	streamName,
	eventTestPriority
) {
	let eventVerifier = getEventVerifier();
	await describe(`Verify events triggered when ${streamName} is Ended`, async () => {
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
			`Seek forward ${streamName}, let play to end and sees the onEnd event`,
			`${eventTestPriority} @events @ended @onEnd`,
			async () => {
				await playMeGivenStream(otvPlayer, streamName);

				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"progress?"
				);

				let progressPayload = await eventVerifier.whatPayloadForEvent(
					"onProgress"
				);
				expect(progressPayload).not.toBeUndefined("progress payload");

				if (progressPayload) {
					await seekNearEnd(progressPayload.seekableDuration);
					expect(eventVerifier.didEventOccur("onEnd")).toBe(
						true,
						"ended?"
					);
				}
			}
		);
	});
}
