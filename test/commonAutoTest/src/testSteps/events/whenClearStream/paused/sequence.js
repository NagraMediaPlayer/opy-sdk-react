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

const SET_TAGS = "@paused @events @sequence";

export async function executeEventSequenceTestsWhenPaused(
	otvPlayer,
	streamName,
	eventTestPriority
) {
	let eventVerifier = getEventVerifier();
	await describe(`sequence of events triggered when ${streamName} is paused and resumed`, async () => {
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
			`play, pause and resume ${streamName} sees onPlay before onPlaying`,
			`${eventTestPriority} ${SET_TAGS} @onPlay @onPlaying`,
			async () => {
				await playMeGivenStream(otvPlayer, streamName);

				eventVerifier.reset();

				await pauseStream();
				await resumeStream();

				expect(
					eventVerifier.didEventsArriveInOrder("onPlay", "onPlaying")
				).toBe(true);
			}
		);
	});
}
