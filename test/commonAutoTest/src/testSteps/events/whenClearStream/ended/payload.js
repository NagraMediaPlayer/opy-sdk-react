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
import { isEmpty } from "../../../../utils/emptyEvent";

export async function executeEventPayloadTestsWhenEnded(
	otvPlayer,
	streamName,
	eventTestPriority
) {
	let eventVerifier = getEventVerifier();
	await describe(`Verify event data when ${streamName} is Ended`, async () => {
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
			`End of ${streamName} and sees the onEnd event`,
			`${eventTestPriority} @events @payload @ended @onEnd`,
			async () => {
				await playMeGivenStream(otvPlayer, streamName);

				expect(eventVerifier.didEventOccur("onProgress")).toBe(true);

				let progressPayload = await eventVerifier.whatPayloadForEvent(
					"onProgress"
				);
				expect(progressPayload).not.toBeUndefined();

				if (progressPayload) {
					await seekNearEnd(progressPayload.seekableDuration);
					let actualPayload =
						eventVerifier.whatPayloadForEvent("onEnd");

					expect(actualPayload).not.toBeUndefined();

					if (actualPayload) {
						expect(isEmpty(actualPayload)).toBe(true);
					}
				}
			}
		);
	});
}
