// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import {
	describe,
	it,
	beforeEach,
	afterEach,
	beforeAll,
	afterAll,
} from "@nagra/kwuo";
import { renderComponent } from "../../utils/render";
import { updateOTVPlayerProps, playMeGivenStream } from "../common";
import { sleepInMs } from "../../utils/automationSupport";
import { createTextComponent } from "../../utils/textComponent";

export async function executeVolumeControlTests(otvPlayer, streamName) {
	await describe("Verify Volume and Muted Props", async () => {
		beforeAll(async () => {
			console.log(
				"Before ALL: due to a chicken/egg bug this can't be reached"
			);
		});

		beforeEach(async () => {});

		afterEach(async (thisTestDetails) => {
			let afterEachComponent = createTextComponent(thisTestDetails);

			await renderComponent(afterEachComponent);
		});

		afterAll(async () => {});

		await it(
			`plays ${streamName} in mute , then unmute , reduce volume 0.2 and mute`,
			`@medium_priority @props`,
			async () => {
				let resource = await playMeGivenStream(otvPlayer, streamName);

				// Let the content play for 10s and hear no audio
				await sleepInMs(10000);

				let updateProps = { ...resource.props, muted: false };
				console.log(`update Props ${JSON.stringify(updateProps)}`);
				await updateOTVPlayerProps(otvPlayer, updateProps);
				// playback for 10s and hear audio
				await sleepInMs(10000);

				// playback for 10s with reduced volume
				await updateOTVPlayerProps(otvPlayer, {
					...updateProps,
					volume: 0.2,
				});

				await sleepInMs(10000);

				// playback for 10s with no audio
				await updateOTVPlayerProps(otvPlayer, {
					...updateProps,
					muted: true,
				});

				await sleepInMs(10000);
			}
		);
	});
}
