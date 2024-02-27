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
import { OTVSDK } from "@nagra/react-otvplayer";

const encryptedStreamName = isRunningInSafariBrowser()
	? "HLS VOD Encrypted"
	: "VOD Encrypted";
const multiSessionStreamName = "DASH Encrypted - CallbackMode MultiSession";
const clearStreamName = isRunningInSafariBrowser()
	? "HLS VOD Clear"
	: "VOD Clear";
const anotherEncryptedStream = isRunningInSafariBrowser()
	? "HLS VOD Long Play"
	: "VOD Long Play";

const ssmEncryptedStream = isRunningInSafariBrowser()
	? "HLS SSM Encrypted VOD"
	: "SSM Encrypted VOD";

const SET_TAGS = "@high_priority @licenseCallback";
//TODO: should be moved after supported by IOS and Android
const TAGS_WEBONLY = "@nonApple @nonAndroid";

const playGivenStreamWithLicenseCB = async (
	otvPlayer,
	streamName,
	licenseCB
) => {
	let stream = getStream(streamName);
	let sourceObject = getSource(stream);
	let newProperty;
	if (licenseCB) {
		newProperty = { ...stream.props, onLicenseRequest: licenseCB };
	} else {
		newProperty = stream.props;
	}
	await playThisStream(sourceObject, otvPlayer, newProperty, 7500);
};

const getSource = (stream) => {
	let sourceObject = {
		src: stream.url,
		type: stream.mimeType,
		token: stream.token,
		drm: {
			ssmServerURL: stream.ssmServerURL,
			certificateURL: stream.certificateURL,
			licenseURL: stream.licenseURL,
			type: stream.drm,
		},
	};
	return sourceObject;
};

const getLicenseServerUrl = (keySystem, streamUrl) => {
	let stream = getStreamWithUrl(streamUrl);
	if (
		keySystem.startsWith("com.widevine.alpha") ||
		keySystem.startsWith("com.microsoft.playready") ||
		keySystem.startsWith("com.apple.fps")
	) {
		return stream.licenseURL;
	} else {
		console.log("key system is unknown :" + keySystem);
	}
	return "";
};

const getStreamWithUrl = (streamUrl) => {
	let stream = getStream(encryptedStreamName);
	if (stream.url === streamUrl) {
		return stream;
	} else {
		return getStream(anotherEncryptedStream);
	}
};

const getCertificateServerUrl = (keySystem, streamUrl) => {
	let stream = getStreamWithUrl(streamUrl);
	if (
		keySystem.startsWith("com.widevine.alpha") ||
		keySystem.startsWith("com.microsoft.playready")
	) {
		return stream.licenseURL; // same url for request license and certificate
	} else if (keySystem.startsWith("com.apple.fps")) {
		return stream.certificateURL;
	} else {
		console.log("key system is unknown :" + keySystem);
	}
	return "";
};

const getFairPlayCertificate = (certificateURL) => {
	return new Promise(function resolver(resolve, reject) {
		let xhr = new XMLHttpRequest();
		xhr.open("GET", certificateURL, true);
		xhr.responseType = "arraybuffer";

		xhr.onload = function onload() {
			if (xhr.status === 200) {
				resolve(new Uint8Array(xhr.response));
			} else {
				reject(
					"Failed to receive Fireplay certificate, HTTP status:" +
						xhr.status
				);
			}
		};

		xhr.onerror = function onerror() {
			reject("Fireplay Error on certificate request");
		};
		xhr.send();
	});
};

const isFairPlay = (keySystem) => {
	return keySystem.startsWith("com.apple.fps");
};

const isCertificateRequest = (messageType) => {
	return messageType === "certificate-request";
};

const parseFPSPayload = (responseText) => {
	let json = JSON.parse(responseText);
	let raw = window.atob(json.CkcMessage);
	let arr = new Uint8Array(new ArrayBuffer(raw.length));
	for (let i = 0; i < raw.length; i++) {
		arr[i] = raw.charCodeAt(i);
	}
	return arr;
};
let licenseCbCount = 0;
const getLicense = (keySystem, streamSource, requestPayload, messageType) => {
	console.log("key system: " + keySystem);
	let reqUrl = "";

	const d = new Date();
	if (isCertificateRequest(messageType)) {
		licenseCbCount = 0;
		console.log(
			"CertificateCb Time: ",
			+d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds()
		);
		reqUrl = getCertificateServerUrl(keySystem, streamSource.src);
		if (isFairPlay(keySystem)) {
			return getFairPlayCertificate(reqUrl);
		}
	} else {
		reqUrl = getLicenseServerUrl(keySystem, streamSource.src);
		++licenseCbCount;
		console.log(
			"LicenseCb Time: ",
			+d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds()
		);
		console.log(
			`OTVSDK.multiSession: ${OTVSDK.multiSession} LicenseCb Count: ${licenseCbCount})`
		);
	}

	let headers = {
		Accept: "application/octet-stream",
		"Content-Type": "application/octet-stream",
		"nv-authorizations": streamSource.token,
	};
	// prettier-ignore
	console.log("license url = ", reqUrl)
	return new Promise(function resolver(resolve, reject) {
		//NOSONAR
		let xhr = new XMLHttpRequest();
		xhr.open("POST", reqUrl, true);
		xhr.responseType = isFairPlay(keySystem) ? "text" : "arraybuffer";
		for (let key in headers) {
			if (headers.hasOwnProperty(key)) {
				xhr.setRequestHeader(key, headers[key]);
			}
		}

		xhr.onload = function onload() {
			if (xhr.status === 200) {
				try {
					if (isFairPlay(keySystem)) {
						resolve(parseFPSPayload(xhr.responseText));
					} else {
						resolve(new Uint8Array(xhr.response));
					}
				} catch (err) {
					reject("Invalid License:" + err);
				}
			} else {
				reject("Failed to receive license, HTTP status:" + xhr.status);
			}
		};

		xhr.onerror = function onerror(err) {
			reject("Error on license request");
		};
		xhr.send(requestPayload);
	});
};

export async function executePlayerSDKConfigTests(otvPlayer) {
	await describe("Verify MultiSession", async () => {
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
			`Player SDK Multi Session Configuration tests`,
			`@medium_priority ${TAGS_WEBONLY} @nonSafari @nonNALM1666`,
			async () => {
				OTVSDK.multiSession = true;
				licenseCbCount = 0;
				await playGivenStreamWithLicenseCB(
					otvPlayer,
					multiSessionStreamName,
					getLicense
				);
				await sleepInMs(3000);
				expect(OTVSDK.multiSession).toBe(true);
				expect(licenseCbCount).toBeGreaterOrEqualTo(1);
			}
		);
	});
}

export async function executeLicenseRequestCallbackTests(otvPlayer) {
	let eventVerifier = getEventVerifier();

	await describe("Verify License request Callback", async () => {
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
			`Play an Encrypted stream using license request callback with multiSession`,
			`@medium_priority @licenseCallback ${TAGS_WEBONLY} @nonSafari @nonNALM1666`,
			async () => {
				OTVSDK.multiSession = true;
				licenseCbCount = 0;
				await playGivenStreamWithLicenseCB(
					otvPlayer,
					multiSessionStreamName,
					getLicense
				);

				//Wait for minimum 16 Minutes for the stream key rotation
				let countdown = 16 * 60;
				const maxLicenseCallbacks = 16;
				while (countdown >= 0) {
					await sleepInMs(1000);
					console.log(
						`Callback count so far ${licenseCbCount} vs target ${maxLicenseCallbacks} (Waiting for ${countdown--}sec more)`
					);
				}
				expect(licenseCbCount).toBeGreaterOrEqualTo(
					maxLicenseCallbacks
				);
			}
		);

		await it(
			`Play an Encrypted stream using license callback without multiSession`,
			`${SET_TAGS} ${TAGS_WEBONLY} @nonSafari @nonNALM1666`,
			async () => {
				OTVSDK.multiSession = false;
				licenseCbCount = 0;
				await playGivenStreamWithLicenseCB(
					otvPlayer,
					multiSessionStreamName,
					getLicense
				);

				let expectationsMet = false;
				let countdown = 60;
				const maxLicenseCallbacks = 2;
				while (!expectationsMet && countdown >= 0) {
					await sleepInMs(1000);
					if (licenseCbCount > maxLicenseCallbacks) {
						expectationsMet = true;
					}
					console.log(
						`Expectations${
							expectationsMet ? "" : " NOT YET"
						} met.  Callback count so far ${licenseCbCount} vs target ${maxLicenseCallbacks} (Waiting for ${countdown--}sec more)`
					);
				}
				expect(licenseCbCount).toBeGreaterOrEqualTo(1);
				expect(licenseCbCount).toBeLessOrEqualTo(maxLicenseCallbacks);
			}
		);

		await it(
			`Play an encrypted stream with license request callback property.`,
			`${SET_TAGS} ${TAGS_WEBONLY}`,
			async () => {
				await playGivenStreamWithLicenseCB(
					otvPlayer,
					encryptedStreamName,
					getLicense
				);
				let progressed = await waitAndCheckProgress(6, 3);
				expect(progressed).toBe(true, "Are we progressing?");
			}
		);

		await it(
			`Play an encrypted stream without license request callback property.`,
			`${SET_TAGS}`,
			async () => {
				await playGivenStreamWithLicenseCB(
					otvPlayer,
					encryptedStreamName
				);
				let progressed = await waitAndCheckProgress(6, 3);
				expect(progressed).toBe(true, "Are we progressing?");
			}
		);

		await it(
			`Play a clear stream with license request callback property.`,
			`${SET_TAGS} ${TAGS_WEBONLY}`,
			async () => {
				await playGivenStreamWithLicenseCB(
					otvPlayer,
					clearStreamName,
					getLicense
				);
				let progressed = await waitAndCheckProgress(6, 3);
				expect(progressed).toBe(true, "Are we progressing?");
			}
		);

		await it(
			`Play an encrypted stream without license request callback(non-callback mode), then play it with callack property(callback mode), then no error should be fired.`,
			`${SET_TAGS} ${TAGS_WEBONLY}`,
			async () => {
				// without callback
				await playGivenStreamWithLicenseCB(
					otvPlayer,
					encryptedStreamName
				);
				let progressed = await waitAndCheckProgress(6, 3);
				expect(progressed).toBe(true, "Are we progressing?");
				// with callback
				await playGivenStreamWithLicenseCB(
					otvPlayer,
					anotherEncryptedStream,
					getLicense
				);
				// No error should be thrown as we are enabling mixed mode
				expect(eventVerifier.didEventOccur("onError")).toBe(
					false,
					"error arrived?"
				);
				progressed = await waitAndCheckProgress(6, 3);
				expect(progressed).toBe(true, "Are we progressing?");
			}
		);

		await it(
			`Play an encrypted stream with license request callback(callback mode), then play it without callack property(non-callback mode), then no error should be fired.`,
			`${SET_TAGS} ${TAGS_WEBONLY}`,
			async () => {
				// with callback
				await playGivenStreamWithLicenseCB(
					otvPlayer,
					encryptedStreamName,
					getLicense
				);
				let progressed = await waitAndCheckProgress(6, 3);
				expect(progressed).toBe(true, "Are we progressing?");
				// without callback
				await playGivenStreamWithLicenseCB(
					otvPlayer,
					anotherEncryptedStream
				);
				// No error should be fired as we enabled mixed mode.
				expect(eventVerifier.didEventOccur("onError")).toBe(
					false,
					"error arrived?"
				);
				progressed = await waitAndCheckProgress(6, 3);
				expect(progressed).toBe(true, "Are we progressing?");
			}
		);

		await it(
			`Play an encrypted stream with license request callback(callback mode), then zap to another encrypted stream(callback mode).`,
			`${SET_TAGS} ${TAGS_WEBONLY}`,
			async () => {
				// with callback
				await playGivenStreamWithLicenseCB(
					otvPlayer,
					encryptedStreamName,
					getLicense
				);
				let progressed = await waitAndCheckProgress(6, 3);
				expect(progressed).toBe(true, "Are we progressing?");
				// with callback
				await playGivenStreamWithLicenseCB(
					otvPlayer,
					anotherEncryptedStream,
					getLicense
				);
				// No error should be fired as we enabled mixed mode.
				expect(eventVerifier.didEventOccur("onError")).toBe(
					false,
					"error arrived?"
				);
				progressed = await waitAndCheckProgress(6, 3);
				expect(progressed).toBe(true, "Are we progressing?");
			}
		);

		await it(
			`Play SSM stream without license request callback(non-callback mode), then play it with callack property(callback mode), then no error should be fired.`,
			`${SET_TAGS} ${TAGS_WEBONLY}`,
			async () => {
				// without callback
				await playGivenStreamWithLicenseCB(
					otvPlayer,
					ssmEncryptedStream
				);
				let progressed = await waitAndCheckProgress(10, 2);
				expect(progressed).toBe(true, "Are we progressing?");
				// with callback
				await playGivenStreamWithLicenseCB(
					otvPlayer,
					anotherEncryptedStream,
					getLicense
				);
				// No error should be thrown as we are enabling mixed mode
				expect(eventVerifier.didEventOccur("onError")).toBe(
					false,
					"error arrived?"
				);
				progressed = await waitAndCheckProgress(6, 3);
				expect(progressed).toBe(true, "Are we progressing?");
			}
		);
	});
}
