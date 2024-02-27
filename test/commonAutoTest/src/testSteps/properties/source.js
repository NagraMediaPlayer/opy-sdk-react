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
	sleepInMs,
	waitAndCheckProgress,
	playThisStream,
} from "../common";
import { createTextComponent } from "../../utils/textComponent";
import { getStream } from "../../res/media";
import { isRunningInSafariBrowser } from "../../utils/platformVariations";

const encryptedStreamName = isRunningInSafariBrowser() ? "HLS VOD Encrypted" : "VOD Encrypted";
const clearStreamName = isRunningInSafariBrowser() ? "HLS VOD Clear" : "VOD Clear";
const preferredAudioStreamName = "Multi Track Content";

const SET_TAGS = "@high_priority @props";
//TODO: should be moved after supported by WEB
const TAGS_NOWEB =
	"@nonBrowser @nonTizen @nonWebos @nonHisense @nonVestel @nonSafari";

const TAGS_WEBONLY = "@nonApple @nonAndroid @nonSafari";

const getPreferredAudioSource = (stream, audioLanguage) => {
    let sourceObject = {
        src: stream.url,
        type: stream.mimeType,
        token: stream.token,
        preferredAudioLanguage: audioLanguage,
        drm: {
            ssmServerURL: stream.ssmServerURL,
            certificateURL: stream.certificateURL,
            licenseURL: stream.licenseURL,
            type: stream.drm,
        },
    };
    return sourceObject;
}

export async function executeSourcePropertiesTests(otvPlayer) {
	let eventVerifier = getEventVerifier();

	await describe("Verify Source Props", async () => {
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
			`plays a clear stream when drm is undefined`,
			`${SET_TAGS}`,
			async () => {
				let stream = getStream(clearStreamName);
				let sourceObject = {
					src: stream.url,
					type: stream.mimeType,
				};
				await playThisStream(
					sourceObject,
					otvPlayer,
					stream.props,
					5000
				);
				let progressed = await waitAndCheckProgress(4, 2);
				expect(progressed).toBe(true, "Are we progressing?");
			}
		);

		await it(
			`plays a clear stream when license url is empty`,
			`${SET_TAGS}`,
			async () => {
				let stream = getStream(clearStreamName);
				let sourceObject = {
					src: stream.url,
					type: stream.mimeType,
					drm: {
						licenseURL: "",
					},
				};
				await playThisStream(
					sourceObject,
					otvPlayer,
					stream.props,
					5000
				);
				let progressed = await waitAndCheckProgress(4, 2);
				expect(progressed).toBe(true, "Are we progressing?");
			}
		);

		await it(
			`plays an encrypted stream without token, then content token error is thrown`,
			`${SET_TAGS} ${TAGS_NOWEB}`,
			async () => {
				let stream = getStream(encryptedStreamName);
				let sourceObject = {
					src: stream.url,
					type: stream.mimeType,
					drm: {
						certificateURL: stream.certificateURL,
						licenseURL: stream.licenseURL,
						type: stream.drm,
					},
				};
				await playThisStream(
					sourceObject,
					otvPlayer,
					stream.props,
					10000
				);

				//Verify content token error (5022) is thrown.
				const CONTENT_TOKEN_ERROR = 5022;
				expect(eventVerifier.didEventOccur("onError")).toBe(
					true,
					"onError arrived?"
				);
				let actualPayload =
					eventVerifier.whatPayloadForFirstOfAnEvent("onError");
				expect(actualPayload).not.toBeUndefined();
				if (actualPayload) {
					expect(actualPayload.code).toBe(CONTENT_TOKEN_ERROR);
				}
			}
		);

		await it(
			`plays an encrypted stream without token, then set token after set source 2 seconds`,
			`${SET_TAGS} @nonSafari`,
			async () => {
				let stream = getStream(encryptedStreamName);
				let sourceObject = {
					src: stream.url,
					type: stream.mimeType,
					drm: {
						certificateURL: stream.certificateURL,
						licenseURL: stream.licenseURL,
						type: stream.drm,
					},
				};

				await playThisStream(
					sourceObject,
					otvPlayer,
					stream.props,
					1000
				);

				sourceObject = {
					src: stream.url,
					type: stream.mimeType,
					token: stream.token,
					drm: {
						certificateURL: stream.certificateURL,
						licenseURL: stream.licenseURL,
						type: stream.drm,
					},
				};

				const updateTokenTimer = setTimeout(() => {
					playThisStream(sourceObject, otvPlayer, stream.props, 100);
				}, 2000);

				await sleepInMs(5000);
				//Verify player is playing.
				let progressed = await waitAndCheckProgress(6, 2);
				expect(progressed).toBe(true, "Are we progressing?");

                clearInterval(updateTokenTimer);
            }
        )

        await it(`plays a clear multiple audio stream when the property of preferred audio language is valid`,
            `${SET_TAGS} ${TAGS_WEBONLY} @preferred_audio`,
            async () => {
                let stream = getStream(preferredAudioStreamName);
                let sourceObject = getPreferredAudioSource(stream, "cy");
                await playThisStream(sourceObject, otvPlayer, stream.props, 5000);

                expect(
                    eventVerifier.didEventOccur("onTracksChanged")
                ).toBe(true, "Receive onAudioTrackSelected event?");
                let audioTracks = eventVerifier.whatPayloadForEvent("onTracksChanged").audioTracks;

                expect(
                    eventVerifier.didEventOccur("onAudioTrackSelected")
                ).toBe(true, "Receive onAudioTrackSelected event?");
                let defaultAudioTrackIndex = eventVerifier.whatPayloadForEvent("onAudioTrackSelected").index;

                expect(
                    audioTracks.length > defaultAudioTrackIndex
                ).toBe(true, "Audio track count is great than index number?");

                expect(
                    audioTracks[defaultAudioTrackIndex].language
                ).toBe("cy", "The default audio language is welsh?");

            }
        )

        await it(`plays a clear multiple audio stream when the property of preferred audio language is empty`,
            `${SET_TAGS} ${TAGS_WEBONLY} @preferred_audio`,
            async () => {
                let stream = getStream(preferredAudioStreamName);
                let sourceObject = getPreferredAudioSource(stream, "");
                await playThisStream(sourceObject, otvPlayer, stream.props, 5000);

                expect(
                    eventVerifier.didEventOccur("onTracksChanged")
                ).toBe(true, "Receive onAudioTrackSelected event?");
                let audioTracks = eventVerifier.whatPayloadForEvent("onTracksChanged").audioTracks;

                expect(
                    eventVerifier.didEventOccur("onAudioTrackSelected")
                ).toBe(true, "Receive onAudioTrackSelected event?");
                let defaultAudioTrackIndex = eventVerifier.whatPayloadForEvent("onAudioTrackSelected").index;

                expect(
                    audioTracks.length > defaultAudioTrackIndex
                ).toBe(true, "Audio track count is great than index number?");

                expect(
                    audioTracks[defaultAudioTrackIndex].language
                ).toBe("nar", "The default audio language is nar?");

            }
        )

        await it(`plays a clear multiple audio stream when the property of preferred audio language is wrong`,
            `${SET_TAGS} ${TAGS_WEBONLY} @preferred_audio`,
            async () => {
                let stream = getStream(preferredAudioStreamName);
                let sourceObject = getPreferredAudioSource(stream, "invalidLanguage");
                await playThisStream(sourceObject, otvPlayer, stream.props, 5000);

                expect(eventVerifier.didEventOccur("onError")).toBe(false, "onError arrived?");

                expect(
                    eventVerifier.didEventOccur("onTracksChanged")
                ).toBe(true, "Receive onAudioTrackSelected event?");
                let audioTracks = eventVerifier.whatPayloadForEvent("onTracksChanged").audioTracks;

                expect(
                    eventVerifier.didEventOccur("onAudioTrackSelected")
                ).toBe(true, "Receive onAudioTrackSelected event?");
                let defaultAudioTrackIndex = eventVerifier.whatPayloadForEvent("onAudioTrackSelected").index;

                expect(
                    audioTracks.length > defaultAudioTrackIndex
                ).toBe(true, "Audio track count is great than index number?");

                expect(
                    audioTracks[defaultAudioTrackIndex].language
                ).toBe("nar", "The default audio language is nar?");

            }
        )

    })
};
