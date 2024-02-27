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
import { playMeGivenStream, getEventVerifier } from "../../../common";
import { createTextComponent } from "../../../../utils/textComponent";

const SET_TAGS = "@played @events @sequence";

let eventOrder = [
	{ firstEvent: "onLoadStart", secondEvent: "onLoad" },
	{ firstEvent: "onLoad", secondEvent: "onPlay" },
	{ firstEvent: "onTracksChanged", secondEvent: "onPlay" },
	{ firstEvent: "onTracksChanged", secondEvent: "onPlaying" },
	{ firstEvent: "onAudioTrackSelected", secondEvent: "onProgress" },
	{ firstEvent: "onBitratesAvailable", secondEvent: "onPlay" },
];

export async function executeEventSequenceTestsWhenPlayed(
	otvPlayer,
	streamName,
	eventTestPriority
) {
	let eventVerifier = getEventVerifier();
	await describe(`sequence of events triggered when ${streamName} is Played`, async () => {
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
			"sees the following events in order",
			`${eventTestPriority} ${SET_TAGS}`,
			async () => {
				await playMeGivenStream(otvPlayer, streamName);

				eventOrder.map((sequence) => {
					expect(
						eventVerifier.didEventsArriveInOrder(
							sequence.firstEvent,
							sequence.secondEvent
						)
					).toBe(
						true,
						`${sequence.firstEvent},${sequence.secondEvent} in this order?`
					);
				});
			}
		);
	});
}
