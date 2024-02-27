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
import { renderComponent } from "../../utils/render";
import {
	getEventVerifier,
	playMeGivenStream,
	stopStream,
	pauseStream,
	seekInStream,
	resumeStream,
} from "../common";
import { sleepInMs } from "../../utils/automationSupport";
import { createTextComponent } from "../../utils/textComponent";
import { pseudoRandomData } from "./randomData";

export async function executePlayZapTests(otvPlayer, streamName1, streamName2) {
	let eventVerifier = getEventVerifier();
	await describe("Execute play pause seek zap tests", async () => {
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
			`play pause seek zap ${streamName1} and ${streamName2}`,
			`@PlayPauseSeekZap @robustness`,
			async () => {
				let streamInfoArr = [streamName1, streamName2];

				let runtimeHrs = 1;
				let actionIndex = 0;
				let elapsedTimeInMs = 0;
				let testPass = true;
				let action = "";
				const startTime = Date.now();
				const totalInMs = parseFloat(runtimeHrs) * 60 * 60 * 1000;

				//play stream1
				await playMeGivenStream(otvPlayer, streamName1);

				while (elapsedTimeInMs < totalInMs) {
					let pseudoRndEvent = pseudoRandomData[actionIndex];
					action = pseudoRndEvent[0];
					let index = pseudoRndEvent[1];
					let period = pseudoRndEvent[2] * 1000;

					switch (action) {
						case "play":
							console.log(`Playing for ${period}s`);
							await sleepInMs(period);
							break;
						case "pause":
							console.log(`Pause for ${period}s`);
							await pauseStream();
							testPass = eventVerifier.didEventOccur("onPaused");
							await sleepInMs(period);
							await resumeStream();
							break;
						case "seek":
							let progressPayload =
								eventVerifier.whatPayloadForEvent("onProgress");

							if (progressPayload) {
								let seekableDuration =
									progressPayload.seekableDuration;
								if (index > seekableDuration - 20) {
									index = seekableDuration / 2;
								}
								console.log(`Seeking to position ${index}`);
								await seekInStream(index);
								testPass =
									eventVerifier.didEventOccur("onSeek");
							}
							await sleepInMs(period);
							break;
						case "zap":
							console.log(
								`Zapping to stream ${streamInfoArr[index]}`
							);
							await playMeGivenStream(
								otvPlayer,
								streamInfoArr[index]
							);
							testPass = eventVerifier.didEventOccur("onPlay");
							await sleepInMs(period);
							break;
					}
					if (!testPass) {
						break;
					}
					actionIndex = (actionIndex + 1) % pseudoRandomData.length;
					elapsedTimeInMs = Date.now() - startTime;
					console.log(`elapsedTimeInMs : ${elapsedTimeInMs}`);
				}
				expect(testPass).toBe(true, `failed for ${action}`);
				await stopStream();
			}
		);
	});
}
