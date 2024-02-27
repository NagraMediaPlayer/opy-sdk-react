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
	getEventVerifier,
	playMeGivenStream,
	stopStream,
} from "../../../common";
import { createTextComponent } from "../../../../utils/textComponent";

export async function executeEventsTestsWhenStopped(
	otvPlayer,
	streamName,
	eventTestPriority
) {
	let eventVerifier = getEventVerifier();
	await describe(`Verify events triggered when ${streamName} is Stopped`, async () => {
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
			`stop ${streamName} and sees the onStopped event`,
			`${eventTestPriority} @events @stopped @onStopped`,
			async () => {
				await playMeGivenStream(otvPlayer, streamName);

				await stopStream();

				expect(eventVerifier.didEventOccur("onStopped")).toBe(
					true,
					"onStopped observed?"
				);
			}
		);

		// // TODO: check why _onTracksChanged and _onAudioTrackSelected are received after onStopped on iOS platform.
		// await it("stop a clear stream and see any events received after onStopped", async () => {
		// 	await playMeAClearStream(otvPlayer);
		// 	eventVerifier.reset();
		// 	await stopStream();

		// 	expect(eventVerifier.didEventsArriveAfterStop()).toBe(false);
		// });
	});
}
