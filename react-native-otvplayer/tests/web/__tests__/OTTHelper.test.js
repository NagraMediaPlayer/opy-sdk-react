// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://jestjs.io/"}
 */

jest.mock("../../../src/web/NMPWebPlayer", () => jest.fn);
jest.mock("../../../src/web/OTVSDKManager", () => {
	return {
		OTVSDKManager: jest.fn().mockImplementation(() => {
			return {};
		}),
	};
});
import { OTTHelper } from "../../../src/web/OTTHelper";
import { PlatformTypes } from "../../../src/web/common/interface";

beforeEach(() => {});

afterEach(() => {
	jest.clearAllMocks();
});

describe(" Test OTTHelper ", () => {
	test(" Test method initialiseSDKPlayer ", () => {
		const successCB = jest.fn();
		const failCB = jest.fn();
		const player = OTTHelper.initialiseSDKPlayer(
			"rootElement",
			successCB,
			failCB,
			jest.fn(),
			jest.fn(),
			false
		);
		expect(player).toBeTruthy();
	});
	test(" Test method initialiseSDKPlayer for Safari ", () => {
		jest.spyOn(OTTHelper, "isCurrentPlatform").mockImplementation(
			() => true
		);
		const successCB = jest.fn();
		const failCB = jest.fn();
		const player = OTTHelper.initialiseSDKPlayer(
			"rootElement",
			successCB,
			failCB,
			jest.fn(),
			jest.fn(),
			false
		);
		expect(player).toBeTruthy();
	});

	test(" Test method getCertificate ", () => {
		const sendCB = jest.fn();
		const responseArray = new Uint8Array([0, 1]);
		const xhrMockClass = {
			open: () => jest.fn(),
			send: () => sendCB,
			setRequestHeader: jest.fn(),
			abort: jest.fn(),
			status: 200,
			response: responseArray,
		};
		window.XMLHttpRequest = jest
			.fn()
			.mockImplementation(() => xhrMockClass);
		let certificatePromise = OTTHelper.getCertificate();
		xhrMockClass.onload();
		return expect(certificatePromise).resolves.toStrictEqual(responseArray);
	});
	test(" Test method isCurrentPlatform ", () => {
		const value = window.navigator.userAgent;
		window.navigator.userAgent = "hbbtv";
		expect(OTTHelper.isCurrentPlatform(PlatformTypes.HBBTV)).toBe(true);
		window.navigator.userAgent = "smart";
		expect(OTTHelper.isCurrentPlatform(PlatformTypes.SMARTTV)).toBe(true);
		window.navigator.userAgent = "Safari";
		expect(OTTHelper.isCurrentPlatform(PlatformTypes.PC_SAFARI)).toBe(true);
		window.navigator.userAgent = value;
	});

	test(" Test method getNetworkStats ", () => {
		const adaptiveStreaming = {
			availableBitrates: [1024, 2048],
			selectedBitrate: 1024,
		};
		const contentServer = {
			url: "http://test/",
		};

		const networkUsage = {
			bytesDownloaded: 20480,
			downloadBitrate: 1024,
			downloadBitrateAverage: 2048,
		};
		const networkStatistics = {
			getAdaptiveStreaming: () => adaptiveStreaming,
			getContentServer: () => contentServer,
			getNetworkUsage: () => networkUsage,
		};
		const networkEvent = OTTHelper.getNetworkStats(networkStatistics, true);
		expect(networkEvent.adaptiveStreaming.selectedBitrate).toBe(1024);
		expect(networkEvent.contentServer.url).toBe("http://test/");
		expect(networkEvent.networkUsage.bytesDownloaded).toBe(20480);
		expect(networkEvent.networkUsage.downloadBitrateAverage).toBe(2048);
	});
	test(" Test method getRenderingStats ", () => {
		const renderingStatistics = {
			getFramesPerSecondNominal: () => 33,
			getFramesPerSecond: () => 30,
			getFrameDrops: () => 2,
			getFrameDropsPerSecond: () => 1,
		};
		const renderingEvent = OTTHelper.getRenderingStats(
			renderingStatistics,
			true
		);
		expect(renderingEvent.framesPerSecondNominal).toBe(33);
		expect(renderingEvent.framesPerSecond).toBe(30);
		expect(renderingEvent.frameDropsPerSecond).toBe(1);
	});
	test(" Test method getPlaybackStats ", () => {
		const playbackStatistics = {
			getStreamBitrate: () => 1024,
			getResolution: () => {
				return { width: 1024, height: 768 };
			},
		};
		const playbackEvent = OTTHelper.getPlaybackStats(
			playbackStatistics,
			true
		);
		expect(playbackEvent.streamBitrate).toBe(1024);
		expect(playbackEvent.selectedResolution.width).toBe(1024);
		expect(playbackEvent.selectedResolution.height).toBe(768);
	});
});
