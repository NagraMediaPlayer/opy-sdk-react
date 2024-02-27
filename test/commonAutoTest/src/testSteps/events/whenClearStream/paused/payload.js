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
	getEventVerifier,
} from "../../../common";
import { createTextComponent } from "../../../../utils/textComponent";
import { isEmpty } from "../../../../utils/emptyEvent";

export async function executeEventPayloadTestsWhenPaused(
	otvPlayer,
	streamName,
	eventTestPriority
) {
	let eventVerifier = getEventVerifier();
	await describe(`Verify event data when ${streamName} is Paused`, async () => {
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
			`pause ${streamName} and sees the onPaused event payload`,
			`${eventTestPriority} @events @payload @paused @onPaused`,
			async () => {
				await playMeGivenStream(otvPlayer, streamName);

				await pauseStream();

				expect(eventVerifier.didEventOccur("onPaused")).toBe(
					true,
					"onPaused received?"
				);

				let actualPayload =
					eventVerifier.whatPayloadForEvent("onPaused");
				expect(isEmpty(actualPayload)).toBe(true, "payload empty?");
			}
		);
	});
}
