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
import { renderComponent } from "../../../utils/render";
import { getZapConfig } from "../../../utils/tagging";
import { getKillStream, killSession, releaseToken } from "./ssmHelper";
import {
	getEventVerifier,
	playMeGivenStream,
	playMeGivenKillStream,
	sleepInMs,
	resumeStream,
	stopStream,
	waitAndCheckProgress,
	playThisStream,
} from "../../common";
import { createTextComponent } from "../../../utils/textComponent";
import {
	isRunningInSafariBrowser,
	isRunningOnTVKeyCapable,
	isRunningOniOS,
	isRunningOntvOS,
} from "../../../utils/platformVariations";
import { executeEventsTestsForContent } from "../whenClearStream/whenClearStream";
import { getStream } from "../../../res/media";

const SET_TAGS = "@ssm @scrambled @played @events";
const THREE_MINS_IN_SEC = 3 * 60;
const THREE_PLUS_MINS_IN_SEC = THREE_MINS_IN_SEC + 10;

const getRelevantSSMStream = (alternative) => {
	let stream;

	if (isRunningOnTVKeyCapable()) {
		stream = "TVKEY SSM Encrypted VOD";
	} else if (isRunningInSafariBrowser()) {
		stream = "HLS SSM Encrypted VOD";
	} else {
		stream = "SSM Encrypted VOD";
	}

	if (alternative) {
		stream += " alternative";
	}

	return stream;
};

const getRelevantKillSessionStream = () => {
	let stream;
	if (isRunningInSafariBrowser() || isRunningOniOS() || isRunningOntvOS()) {
		stream = "SSM HLS Killable";
	} else {
		stream = "SSM DASH Killable";
	}

	return stream;
};

const playGivenStreamWithoutToken = async (otvPlayer, streamName) => {
	let stream = getStream(streamName);
	let sourceObject = getSource(stream, null);
	await playThisStream(sourceObject, otvPlayer, stream.props, 1000);
};

const getSource = (stream, token) => {
	let sourceObject = {
		src: stream.url,
		type: stream.mimeType,
		token: token,
		drm: {
			ssmServerURL: stream.ssmServerURL,
			certificateURL: stream.certificateURL,
			licenseURL: stream.licenseURL,
			type: stream.drm,
		},
	};
	return sourceObject;
};

export async function executeSSMTests(otvPlayer, eventTestPriority) {
	let eventVerifier = getEventVerifier();

	await executeEventsTestsForContent(
		otvPlayer,
		`${isRunningInSafariBrowser() ? "HLS " : ""}SSM Encrypted VOD`,
		eventTestPriority
	);

	await describe("Verify SSM behaviour", async () => {
		beforeAll(async () => {
			console.log(
				"Before ALL: due to a chicken/egg bug this can't be reached"
			);
		});

		beforeEach(async () => {});

		afterEach(async (thisTestDetails) => {
			await stopStream();
			let afterEachComponent = createTextComponent(thisTestDetails);

			eventVerifier.reset();
			await renderComponent(afterEachComponent);
		});

		afterAll(async () => {});

		await it(
			"plays a SSM stream, kills session and throws teardown error",
			`@medium_priority ${SET_TAGS} @teardown @error`,
			async () => {
				let killableStreamLabel = getRelevantKillSessionStream();

				let killStreamSpecifics = await getKillStream(
					killableStreamLabel === "SSM DASH Killable"
						? "dash-widevine-kill-stream"
						: "hls-fps-heartbeat-kill-stream"
				);

				console.log(
					`current stream: ${JSON.stringify(killStreamSpecifics)}`
				);

				await playMeGivenKillStream(
					otvPlayer,
					killableStreamLabel,
					killStreamSpecifics
				);

				await sleepInMs(5000);
				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"initial onProgress?"
				);

				eventVerifier.reset();

				await killSession(
					killStreamSpecifics.killServer,
					killStreamSpecifics.killToken,
					killStreamSpecifics.accountId
				);

				await sleepInMs(10000);

				// Zap to clear stream
				await playMeGivenStream(
					otvPlayer,
					`${isRunningInSafariBrowser() ? "HLS " : ""}VOD Clear`
				);
				await sleepInMs(5000);

				expect(eventVerifier.didEventOccur("onError")).toBe(
					true,
					"Error occurred?"
				);

				// There may be multiple errors - look for the SSM specific one
				let listOfPayloads =
					eventVerifier.whatPayloadsForAllOfAnEvent("onError");
				let expectationMet = false;
				const expectedErrorCode = 6002;

				for (
					let i = 0;
					!expectationMet && i < listOfPayloads.length;
					i++
				) {
					expectationMet =
						listOfPayloads[i].code === expectedErrorCode;
				}

				expect(expectationMet).toBe(
					true,
					`Saw specific error code ${expectedErrorCode} amongst the set?`
				);

				await releaseToken(
					killStreamSpecifics.killPool,
					killStreamSpecifics.accountId
				);
			}
		);

		await it(
			"plays a SSM stream, kills session and throws heartbeat error",
			// This test has issues on Android
			`@medium_priority ${SET_TAGS} @heartbeat @error @nonAndroid`,
			async () => {
				let killableStreamLabel = getRelevantKillSessionStream();

				let killStreamSpecifics = await getKillStream(
					killableStreamLabel === "SSM DASH Killable"
						? "dash-widevine-kill-stream"
						: "hls-fps-heartbeat-kill-stream"
				);

				console.log(
					`current stream: ${JSON.stringify(killStreamSpecifics)}`
				);

				await playMeGivenKillStream(
					otvPlayer,
					killableStreamLabel,
					killStreamSpecifics
				);

				await sleepInMs(5000);
				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"initial onProgress?"
				);

				eventVerifier.reset();

				await killSession(
					killStreamSpecifics.killServer,
					killStreamSpecifics.killToken,
					killStreamSpecifics.accountId
				);

				await waitAndCheckProgress(THREE_PLUS_MINS_IN_SEC, 15);

				expect(eventVerifier.didEventOccur("onError")).toBe(
					true,
					"Error occurred?"
				);

				// There may be multiple errors - look for the SSM specific one
				let listOfPayloads =
					eventVerifier.whatPayloadsForAllOfAnEvent("onError");
				let expectationMet = false;
				const expectedErrorCode = 6003;

				for (
					let i = 0;
					!expectationMet && i < listOfPayloads.length;
					i++
				) {
					expectationMet =
						listOfPayloads[i].code === expectedErrorCode;
				}

				expect(expectationMet).toBe(
					true,
					`Saw specific error code ${expectedErrorCode} amongst the set?`
				);

				await releaseToken(
					killStreamSpecifics.killPool,
					killStreamSpecifics.accountId
				);
			}
		);

		await it(
			"reports SSM setup error for bad SSM server URL",
			`@high_priority ${SET_TAGS} @error`,
			async () => {
				await playMeGivenStream(
					otvPlayer,
					isRunningInSafariBrowser()
						? "HLS SSM Big Buck Bunny FPS Encrypted BAD"
						: "SSM Encrypted BAD"
				);

				expect(eventVerifier.didEventOccur("onError")).toBe(true);
				let onError =
					eventVerifier.whatPayloadForFirstOfAnEvent("onError");
				expect(onError).not.toBeUndefined("onError undefined?");

				if (onError) {
					expect(onError.code).toBe(6001, "Setup failure?");
				}
			}
		);

		await it(
			"continues to play a nonPR SSM stream through session renewal",
			`@medium_priority ${SET_TAGS} @renewal`,
			async () => {
				await playMeGivenStream(otvPlayer, getRelevantSSMStream());

				console.info(`Going to wait for ${THREE_PLUS_MINS_IN_SEC}sec`);

				let progressed = await waitAndCheckProgress(
					THREE_PLUS_MINS_IN_SEC,
					15
				);
				expect(progressed).toBe(true, "Are we progressing?");

				let onProgress =
					eventVerifier.whatPayloadForEvent("onProgress");
				expect(onProgress).not.toBeUndefined();
				if (onProgress) {
					expect(onProgress.currentPosition).toBeGreaterThan(
						THREE_MINS_IN_SEC
					);
				}
				expect(eventVerifier.didEventOccur("onError")).toBe(
					false,
					"error occurred?"
				);
			}
		);

		await it(
			"continues to play a PR SSM stream through session renewal",
			`@medium_priority ${SET_TAGS} @renewal @playready`,
			async () => {
				await playMeGivenStream(otvPlayer, "SSM PR Encrypted VOD");

				console.info(`Going to wait for ${THREE_PLUS_MINS_IN_SEC}sec`);
				let progressed = await waitAndCheckProgress(
					THREE_PLUS_MINS_IN_SEC,
					15
				);
				expect(progressed).toBe(true);
				let onProgress =
					eventVerifier.whatPayloadForEvent("onProgress");
				expect(onProgress).not.toBeUndefined();
				if (onProgress) {
					expect(onProgress.currentPosition).toBeGreaterThan(
						THREE_MINS_IN_SEC
					);
				}
				expect(eventVerifier.didEventOccur("onError")).toBe(
					false,
					"error occurred?"
				);
			}
		);

		await it(
			"plays a SSM stream, stop, re-play successfully",
			`@medium_priority ${SET_TAGS} @zap @stopped`,
			async () => {
				await playMeGivenStream(otvPlayer, getRelevantSSMStream());
				await sleepInMs(5000);
				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"Did onProgress arrive?"
				);

				await stopStream();

				eventVerifier.reset();

				// Resume - not zap to same stream
				await resumeStream();
				await sleepInMs(5000);
				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"Did onProgress arrive?"
				);
			}
		);

		// TODO Safari ignores this as it can intermittently fail
		await it(
			"plays a SSM stream, replace element, re-play successfully",
			`@medium_priority ${SET_TAGS} @zap @replaced`,
			async () => {
				await playMeGivenStream(otvPlayer, getRelevantSSMStream());
				await sleepInMs(5000);
				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"Did onProgress arrive?"
				);

				const details = "This is a temp component to replace Player";
				let tempComponent = createTextComponent(details);
				await renderComponent(tempComponent);

				eventVerifier.reset();

				// Play again
				await playMeGivenStream(otvPlayer, getRelevantSSMStream());
				await sleepInMs(5000);
				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"Did onProgress arrive?"
				);
			}
		);

		await it(
			"plays a SSM stream, zaps to a clear stream, and plays it successfully",
			`@high_priority ${SET_TAGS} @zap`,
			async () => {
				await playMeGivenStream(otvPlayer, getRelevantSSMStream());
				await sleepInMs(5000);
				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"Did onProgress arrive?"
				);

				eventVerifier.reset();

				// Zap to clear stream
				await playMeGivenStream(otvPlayer, "VOD Clear");
				await sleepInMs(5000); // Allow extra time for the stream to start playing after zapping
				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"Did onProgress arrive?"
				);
			}
		);

		await it(
			"plays a SSM stream, zaps to a SSP stream, and plays it successfully",
			`@high_priority ${SET_TAGS} @zap`,
			async () => {
				await playMeGivenStream(otvPlayer, getRelevantSSMStream());
				await sleepInMs(5000);
				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"Did onProgress arrive?"
				);

				eventVerifier.reset();

				// Zap to SSP stream
				let destinationStream = `${
					isRunningInSafariBrowser() ? "HLS " : ""
				}VOD Encrypted`;
				await playMeGivenStream(otvPlayer, destinationStream);
				await sleepInMs(5000); // Allow extra time for the stream to start playing after zapping
				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"Did onProgress arrive?"
				);
			}
		);

		await it(
			"can measure SSM zap performance",
			`@medium_priority ${SET_TAGS} @performance @zap @nonSafari @nonAndroid @nonApple`,
			async () => {
				const listOfStreamsToZapThrough = [
					"SSM Encrypted VOD",
					"SSM Encrypted VOD Sintel",
					"SSM Encrypted VOD alternative",
				];
				const numberOfZaps = await getZapConfig();
				console.info(`Zapping ${numberOfZaps} times`);
				let zapTimingResults = [];

				for (let i = 0; i < numberOfZaps; i++) {
					const streamToZapTo =
						listOfStreamsToZapThrough[
							i % listOfStreamsToZapThrough.length
						];
					console.log(`Zapping to ${streamToZapTo}`);

					const zapStartTime = new Date().getTime();
					eventVerifier.reset();
					await playMeGivenStream(otvPlayer, streamToZapTo);
					await sleepInMs(10000);

					const zapEndTime =
						eventVerifier.whatTimeForFirstOfAnEvent("onPlaying");

					if (zapEndTime) {
						const zapTime = zapEndTime - zapStartTime;
						console.log(`Zap time: ${zapTime}`);
						zapTimingResults.push(zapTime);
					} else {
						// don't count these results, but continue
						console.log(`Zap not measured`);
					}
				}

				console.log(
					`All ${zapTimingResults.length} results: ${JSON.stringify(
						zapTimingResults
					)}`
				);
				const meanZapTime =
					zapTimingResults.reduce(
						(accum, current) => accum + current,
						0
					) / zapTimingResults.length;
				const targetZapTime = 4000;
				expect(meanZapTime).toBeLessThan(
					targetZapTime,
					"4sec zap target met?"
				);
			}
		);

		await it(
			"plays a SSM stream, zaps to another SSM stream, and plays through renewal",
			`@medium_priority ${SET_TAGS} @zap @renewal @nonSafari @nonAndroid @nonApple`,
			async () => {
				await playMeGivenStream(otvPlayer, getRelevantSSMStream(false));
				await sleepInMs(5000);
				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"Did onProgress arrive?"
				);

				eventVerifier.reset();

				// Zap to another SSM stream
				await playMeGivenStream(otvPlayer, getRelevantSSMStream(true));

				console.info(`Going to wait for ${THREE_PLUS_MINS_IN_SEC}sec`);
				let progressed = await waitAndCheckProgress(
					THREE_PLUS_MINS_IN_SEC,
					15
				);
				expect(progressed).toBe(true);
				let onProgress =
					eventVerifier.whatPayloadForEvent("onProgress");
				expect(onProgress).not.toBeUndefined();
				if (onProgress) {
					expect(onProgress.currentPosition).toBeGreaterThan(
						THREE_MINS_IN_SEC
					);
				}
				expect(eventVerifier.didEventOccur("onError")).toBe(
					false,
					"error occurred?"
				);
			}
		);

		await it(
			"plays a TVKey SSM stream, zaps to a clear stream, returns to the TVKey SSM stream and plays it successfully",
			`@medium_priority ${SET_TAGS} @payload @zap @nonApple @nonAndroid @nonBrowser @nonTizen @nonWebos @nonHisense @nonVestel`,
			async () => {
				await playMeGivenStream(otvPlayer, "TVKEY SSM Encrypted VOD");

				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"Did onProgress arrive?"
				);
				let onProgress =
					eventVerifier.whatPayloadForEvent("onProgress");
				expect(onProgress).not.toBeUndefined("onProgress");
				if (onProgress) {
					// 0.0 cannot be used. currentPosition is 0.125 without playing,
					// so let's add a buffer
					expect(onProgress.currentPosition).toBeGreaterThan(0.2);
				}
				eventVerifier.reset();

				// Zap to clear stream
				await playMeGivenStream(otvPlayer, "VOD Clear");
				await sleepInMs(5000); // Allow extra time for the stream to start playing after zapping

				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"Did onProgress arrive?"
				);
				onProgress = eventVerifier.whatPayloadForEvent("onProgress");
				expect(onProgress).not.toBeUndefined();
				if (onProgress) {
					expect(onProgress.currentPosition).toBeGreaterThan(0.2);
				}
				eventVerifier.reset();

				// Zap back to SSM stream
				await playMeGivenStream(otvPlayer, "TVKEY SSM Encrypted VOD");
				await sleepInMs(5000); // Allow extra time for the stream to start playing after zapping

				expect(eventVerifier.didEventOccur("onProgress")).toBe(
					true,
					"Did onProgress arrive?"
				);
				onProgress = eventVerifier.whatPayloadForEvent("onProgress");
				expect(onProgress).not.toBeUndefined();
				if (onProgress) {
					expect(onProgress.currentPosition).toBeGreaterThan(0.2);
				}
			}
		);

		await it(
			"plays a SSM stream, content token is set after source is set 2 seconds",
			`@high_priority ${SET_TAGS} @async_token @nonSafari`,
			async () => {
				const testStreamName = getRelevantSSMStream();
				await playGivenStreamWithoutToken(otvPlayer, testStreamName);

				let ssmStream = getStream(testStreamName);
				let sourceObj = getSource(ssmStream, ssmStream.token);
				const updateTokenTimer = setTimeout(() => {
					playThisStream(sourceObj, otvPlayer, ssmStream.props, 100);
				}, 2000);

				await sleepInMs(10000);

				//Verify player is playing.
				let progressed = await waitAndCheckProgress(6, 2);
				expect(progressed).toBe(true, "Are we progressing?");

				clearInterval(updateTokenTimer);
			}
		);

		await it(
			"plays a SSM stream, content token is set with empty token, SSM setup error should be thrown",
			`@high_priority ${SET_TAGS} @async_token`,
			async () => {
				const testStreamName = getRelevantSSMStream();
				let ssmStream = getStream(testStreamName);
				let sourceObj = getSource(ssmStream, "");
				await playThisStream(
					sourceObj,
					otvPlayer,
					ssmStream.props,
					1000
				);

				//wait enough time for SSM setup error.
				await sleepInMs(8000);

				const SSM_SETUP_ERROR = 6001;
				expect(eventVerifier.didEventOccur("onError")).toBe(
					true,
					"error expected"
				);

				let actualPayload =
					eventVerifier.whatPayloadForFirstOfAnEvent("onError");
				expect(actualPayload).not.toBeUndefined();

				if (actualPayload) {
					expect(actualPayload.code).toBe(SSM_SETUP_ERROR);
				}
			}
		);

		await it(
			"plays a SSM stream when content token is not set, then content token error should be thrown after 5 seconds",
			`@high_priority ${SET_TAGS} @async_token @nonSafari`,
			async () => {
				await playGivenStreamWithoutToken(
					otvPlayer,
					getRelevantSSMStream()
				);

				//wait enough time for content token error.
				await sleepInMs(10000);

				//Verify content token error (5022) is thrown.
				const CONTENT_TOKEN_ERROR = 5022;
				expect(eventVerifier.didEventOccur("onError")).toBe(true);

				let actualPayload =
					eventVerifier.whatPayloadForFirstOfAnEvent("onError");
				expect(actualPayload).not.toBeUndefined();

				if (actualPayload) {
					expect(actualPayload.code).toBe(CONTENT_TOKEN_ERROR);
				}
			}
		);

		await it(
			"plays a SSM stream when content token is not set, Stop playback after error fired, then Zaps to same stream and token is set after 2 seconds",
			`@high_priority ${SET_TAGS} @async_token @zap @nonSafari`,
			async () => {
				const testStreamName = getRelevantSSMStream();
				await playGivenStreamWithoutToken(otvPlayer, testStreamName);

				//wait enough time for content token error.
				await sleepInMs(10000);

				//Verify content token error (5022) is thrown.
				const CONTENT_TOKEN_ERROR = 5022;
				expect(eventVerifier.didEventOccur("onError")).toBe(true);
				let actualPayload =
					eventVerifier.whatPayloadForFirstOfAnEvent("onError");
				expect(actualPayload).not.toBeUndefined();
				if (actualPayload) {
					expect(actualPayload.code).toBe(CONTENT_TOKEN_ERROR);
				}
				// stop playback after getting content token error
				await stopStream();
				//reset eventVerifier
				eventVerifier.reset();
				//Zap to same stream with play method as the source uri is not changed.
				await resumeStream(1000);

				//set the content token after 2 seconds
				let ssmStream = getStream(testStreamName);
				let sourceObj = getSource(ssmStream, ssmStream.token);
				const updateTokenTimer = setTimeout(() => {
					playThisStream(sourceObj, otvPlayer, ssmStream.props, 100);
				}, 2000);

				await sleepInMs(10000);
				//Verify player is playing.
				let progressed = await waitAndCheckProgress(6, 2);
				expect(progressed).toBe(true, "Are we progressing?");
			}
		);

		await it(
			"plays a SSM stream without token, then quickly zap to another encrypted stream with content token and play it successfully",
			`@high_priority ${SET_TAGS} @async_token`,
			async () => {
				await playGivenStreamWithoutToken(
					otvPlayer,
					getRelevantSSMStream()
				);
				await sleepInMs(1000);

				// Zap back to Encrypted stream
				await playMeGivenStream(
					otvPlayer,
					isRunningInSafariBrowser()
						? "HLS VOD Encrypted"
						: "VOD Encrypted"
				);
				await sleepInMs(5000); // Allow extra time for the stream to start playing after zapping
				//Verify player is playing
				let progressed = await waitAndCheckProgress(6, 2);
				expect(progressed).toBe(true, "Are we progressing?");
			}
		);
	});
}
