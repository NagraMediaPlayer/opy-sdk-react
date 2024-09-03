// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://jestjs.io/"}
 */

jest.mock("../../../src/web/NMPWebPlayer", () => jest.fn());
jest.mock("../../../src/web/ThumbnailHelper");
jest.mock("../../../src/web/OTVSDKManager", () => jest.fn());

import { DRMStates, OTTPlayerStates } from "../../../src/web/common/interface";
import { PluginErrorCode } from "../../../src/web/common/ErrorHandler";
import { OTTHelper } from "../../../src/web/OTTHelper";
import { OTT, OTTResetTypes } from "../../../src/web/OTT";
import { Logger } from "../../../src/Logger";
jest.mock("../../../src/Logger");

const mockSetSource = jest.fn();
const setMaxResolutionFn = jest.fn();
const setMaxBandwidthFn = jest.fn();
const configureFn = jest.fn();
const mockResolution = {
	width: 1024,
	height: 768,
};
const bitRates = { availableBitrates: [1024, 10240] };
const mockToolkit = {
	setMaxResolution: setMaxResolutionFn,
	setMaxBandwidth: setMaxBandwidthFn,
	errorReporting: {
		setErrorListener: jest.fn(),
	},
	networkStatistics: {
		getAdaptiveStreaming: () => bitRates,
		addNetworkListener: jest.fn(),
		removeNetworkListener: jest.fn(),
	},
	playbackStatistics: {
		reset: jest.fn(),
		removePlaybackListener: jest.fn(),
		getResolution: () => mockResolution,
	},
	renderingStatistics: {},
	configure: configureFn,
};

const playerPlayFn = jest.fn();
const playerPauseFn = jest.fn();
const mockSeekable = { length: 1, start: () => 0, end: () => 1000 };
const playerCurrentTimeFn = jest.fn(() => 50);
const resetFn = jest.fn();
const onFn = jest.fn();
const offFn = jest.fn();
const addRemoteTextTrackFn = jest.fn();
const bufferedEndFn = jest.fn(() => 100);
const volumeFn = jest.fn();
const textTracks = {
	length: 2,
	tracks_: [
		{ mode: "showing", language: "eng", label: "eng" },
		{ mode: "disabled", language: "french", label: "french" },
	],
	on: jest.fn(),
	off: jest.fn(),
	0: { mode: "showing", language: "eng", label: "eng" },
	1: { mode: "disabled", language: "french", label: "french" },
};

const rawAudioTracks = [
	{
		enabled: true,
		kind: "main",
		language: "en",
		label: "en (main)",
		audioCodec: "mp4a.40.2",
		audioChannelConfig: "2",
	},
	{
		enabled: false,
		kind: "main",
		language: "en",
		label: "en (alternate)",
		audioCodec: "mp4a.40.2",
		audioChannelConfig: "6",
	},
	{
		enabled: false,
		kind: "main-desc",
		language: "en",
		label: "en (alternate)",
		audioCodec: "mp4a.40.2",
		audioChannelConfig: "2",
	},
	{
		enabled: false,
		kind: "main-desc",
		language: "en",
		label: "en (alternate)",
		audioCodec: "mp4a.40.2",
		audioChannelConfig: "6",
	},

	// deutsch
	{
		enabled: false,
		kind: "translation",
		language: "de",
		label: "de (dub)",
		audioCodec: "mp4a.40.2",
		audioChannelConfig: "2",
	},
	{
		enabled: false,
		kind: "translation",
		language: "de",
		label: "de (dub,alternate)",
		audioCodec: "mp4a.40.2",
		audioChannelConfig: "6",
	},
	{
		enabled: false,
		kind: "descriptions",
		language: "de",
		label: "de (dub,alternate)",
		audioCodec: "mp4a.40.2",
		audioChannelConfig: "2",
	},
	{
		enabled: false,
		kind: "descriptions",
		language: "de",
		label: "de (dub,alternate)",
		audioCodec: "mp4a.40.2",
		audioChannelConfig: "6",
	},

	// Francais
	{
		enabled: false,
		kind: "translation",
		language: "fr",
		label: "fr (dub)",
		audioCodec: "mp4a.40.2",
		audioChannelConfig: "2",
	},
	{
		enabled: false,
		kind: "translation",
		language: "fr",
		label: "fr (dub,alternate)",
		audioCodec: "mp4a.40.2",
		audioChannelConfig: "6",
	},
	{
		enabled: false,
		kind: "descriptions",
		language: "fr",
		label: "fr (dub,alternate)",
		audioCodec: "mp4a.40.2",
		audioChannelConfig: "2",
	},
	{
		enabled: false,
		kind: "descriptions",
		language: "fr",
		label: "fr (dub,alternate)",
		audioCodec: "mp4a.40.2",
		audioChannelConfig: "6",
	},
];

const audioTracks = {
	length: 12,
	tracks_: rawAudioTracks,
	on: jest.fn(),
	off: jest.fn(),
	0: rawAudioTracks[0],
	1: rawAudioTracks[1],
	2: rawAudioTracks[2],
	3: rawAudioTracks[3],
	4: rawAudioTracks[4],
	5: rawAudioTracks[5],
	6: rawAudioTracks[6],
	7: rawAudioTracks[7],
	8: rawAudioTracks[8],
	9: rawAudioTracks[9],
	10: rawAudioTracks[10],
	11: rawAudioTracks[11],
};
const mutedFn = jest.fn();
const addEventListenerFn = jest.fn();
const mockShaka = {
	removeEventListener: jest.fn(),
	addEventListener: addEventListenerFn,
	unload: jest.fn(),
};
const mockPlayer = {
	src: mockSetSource,
	reset: resetFn,
	otvtoolkit: () => mockToolkit,
	muted: mutedFn,
	volume: volumeFn,
	duration: () => 3600,
	videoHeight: () => 1080,
	videoWidth: () => 1920,
	tech_: { shaka_: mockShaka },
	on: onFn,
	off: offFn,
	one: jest.fn(),
	play: playerPlayFn,
	pause: playerPauseFn,
	seekable: () => mockSeekable,
	currentTime: playerCurrentTimeFn,
	addRemoteTextTrack: addRemoteTextTrackFn,
	textTracks: () => textTracks,
	audioTracks: () => audioTracks,
	bufferedEnd: bufferedEndFn,
	currentSrc: () => "testSource",
	currentType: () => "dash",
};

const properties = {
	autoplay: true,
	muted: false,
	maxResolution: {
		width: Infinity,
		height: Infinity,
	},
};

const onLoadCB = jest.fn();
const onPlayCB = jest.fn();
const onPlayingCB = jest.fn();
const onPausedCB = jest.fn();
const onStoppedCB = jest.fn();
const onWaitingCB = jest.fn();
const triggerErrorCB = jest.fn();
const triggerHttpErrorCB = jest.fn();
const mockErrorHandler = {
	triggerError: triggerErrorCB,
	triggerHttpError: triggerHttpErrorCB,
	set onErrorEvent(onErrorCallback) {
		this._onError = onErrorCallback;
	},
	set onHttpErrorEvent(onHttpErrorCallback) {
		this._onHttpError = onHttpErrorCallback;
	},
};
const onStatisticsUpdateCB = jest.fn();
const onProgressCB = jest.fn();
const onLoadStartCB = jest.fn();
const onLoadedDataCB = jest.fn();
const onEndCB = jest.fn();
const onBitratesAvailableCB = jest.fn();
const onDownloadResChangedCB = jest.fn();
const onSelectedBitrateChangedCB = jest.fn();
const onTracksChangedCB = jest.fn();
const onAudioTrackSelectedCB = jest.fn();
const onTextTrackSelectedCB = jest.fn();
const onSeekCB = jest.fn();

const params = {
	source: null,
	onLoad: onLoadCB,
	onPlay: onPlayCB,
	onPlaying: onPlayingCB,
	onPaused: onPausedCB,
	onStopped: onStoppedCB,
	onWaiting: onWaitingCB,
	errorHandler: mockErrorHandler,
	onStatisticsUpdate: onStatisticsUpdateCB,
	onProgress: onProgressCB,
	onLoadStart: onLoadStartCB,
	onLoadedData: onLoadedDataCB,
	onEnd: onEndCB,
	onBitratesAvailable: onBitratesAvailableCB,
	onDownloadResChanged: onDownloadResChangedCB,
	onSelectedBitrateChanged: onSelectedBitrateChangedCB,
	onTracksChanged: onTracksChangedCB,
	onAudioTrackSelected: onAudioTrackSelectedCB,
	onTextTrackSelected: onTextTrackSelectedCB,
	onSeek: onSeekCB,
};

const BBB_NON_SSM_WV_WITH_TOKEN = {
	src: "https://d3bqrzf9w11pn3.cloudfront.net/basic_dash_bbb_encrypted/bbb_public_android.mpd",
	type: "application/dash+xml",
	token: "eyJraWQiOiI4MTI0MjUiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkdXJhdGlvbiI6NzIwMCwiZGVmYXVsdEtjSWRzIjpbIjAyMDgxMTNlLWU2ZTgtNDI0Mi04NjdjLWQ5NjNmNWQ3ODkyMyJdLCJjb250ZW50SWQiOiI0NjgyZjFkNi05ODIwLTQwNmEtOWJhMC03YzAzZGJjZjE5NmMiLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsIndhdGVybWFya2luZ0VuYWJsZWQiOnRydWUsImltYWdlQ29uc3RyYWludCI6dHJ1ZSwiaGRjcFR5cGUiOiJUWVBFXzEiLCJ1bmNvbXByZXNzZWREaWdpdGFsQ2FwcGluZ1Jlc29sdXRpb24iOiJOT19SRVNUUklDVElPTlMiLCJ1bnByb3RlY3RlZEFuYWxvZ091dHB1dCI6dHJ1ZSwiYW5hbG9nQ2FwcGluZ1Jlc29sdXRpb24iOiJOT19SRVNUUklDVElPTlMiLCJoZGNwIjp0cnVlLCJkZXZpY2VDYXBwaW5nUmVzb2x1dGlvbiI6Ik5PX1JFU1RSSUNUSU9OUyIsImRpZ2l0YWxPbmx5IjpmYWxzZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.fZpotjTjiddueE_nPVcON0FnJwBO4FecTcYIoMmocnw,eyJrY0lkcyI6WyIwMjA4MTEzZS1lNmU4LTQyNDItODY3Yy1kOTYzZjVkNzg5MjMiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjgxMjQyNSJ9..ntJUOAc-g8sXrGLjZhx-MQ.nHnm-aciNeCz6kwUZEjOQgg-1PsLN1Uc8eYihUv_OUK8EaBoFH7JcdIyB9igEFfR9Cufau_5H-EvTdrmws20_ViWKjUTOZmUn7xPQOmwSftb99-rgd3g4QZO0quHIDB5qiBoKmksts8qDbcMZbr_aKMFIOlzNUUcBwiOvmrGyzo.-zTh5sY7tmbe7Ow94EQT9A",
	preferredAudioLanguage: "en",
	drm: {
		licenseURL:
			"https://vsd02fy1.anycast.nagra.com/VSD02FY1/wvls/contentlicenseservice/v1/licenses",
		type: "Widevine",
	},
};

let ott;
let initialiseSDKPlayerFn;
let updateStateFn;

beforeEach(() => {
	Logger.mockImplementation(() => {
		return {
			log: jest.fn(),
		};
	});
	initialiseSDKPlayerFn = jest
		.spyOn(OTTHelper, "initialiseSDKPlayer")
		.mockImplementation(() => mockPlayer);
	ott = new OTT(params, properties);
	updateStateFn = jest.spyOn(ott, "_updateState");
});

afterEach(() => {
	jest.clearAllMocks();
});

describe(" Test state machine ", () => {
	test("State: INITIALISING", () => {
		expect(ott._playerState).toEqual(OTTPlayerStates.INITIALISING);
		expect(initialiseSDKPlayerFn).toHaveBeenCalled();
		expect(ott._drm).toBeTruthy();
	});
	test("State: INITIALISED", () => {
		const setDRMPlayerFn = jest.spyOn(ott._drm, "setPlayer");
		ott.initialiseSDKPlayerSuccessCallback();
		expect(setDRMPlayerFn).toHaveBeenCalledWith(mockPlayer);
		expect(ott._playerState).toEqual(OTTPlayerStates.INITIALISED);
	});
	test("State: PLAY_REQUESTED and SOURCE_SET", () => {
		const setDRMSourceFn = jest.spyOn(ott._drm, "setSource");
		ott.initialiseSDKPlayerSuccessCallback();
		ott.source = BBB_NON_SSM_WV_WITH_TOKEN;
		expect(updateStateFn).toHaveBeenCalledWith(
			OTTPlayerStates.PLAY_REQUESTED
		);
		expect(updateStateFn).toHaveBeenCalledWith(OTTPlayerStates.SOURCE_SET);
		expect(ott._playerState).toEqual(OTTPlayerStates.SOURCE_SET);
		expect(setDRMSourceFn).toHaveBeenCalledWith(BBB_NON_SSM_WV_WITH_TOKEN);
	});
	test("State: LOADED", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onLoad();
		expect(ott._playerState).toEqual(OTTPlayerStates.LOADED);
		expect(onLoadCB).toHaveBeenCalled();
	});
	test("State: PLAY", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onPlay();
		expect(ott._playerState).toEqual(OTTPlayerStates.PLAY);
		expect(onPlayCB).toHaveBeenCalled();
	});
	test("State: PLAYING", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onPlaying();
		expect(ott._playerState).toEqual(OTTPlayerStates.PLAYING);
		expect(onPlayingCB).toHaveBeenCalled();
	});
	test("State: PAUSED", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onPaused();
		expect(ott._playerState).toEqual(OTTPlayerStates.PAUSED);
		expect(onPausedCB).toHaveBeenCalled();
	});
	test("State: STOPPED", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.reset(OTTResetTypes.RESET_FOR_STOP);
		expect(ott._playerState).toEqual(OTTPlayerStates.STOPPED);
		expect(onStoppedCB).toHaveBeenCalled();
	});
	test("State: WAITING", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onWaiting();
		expect(ott._playerState).toEqual(OTTPlayerStates.WAITING);
		expect(onWaitingCB).toHaveBeenCalled();
	});
	test("State: ERROR", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott._sdkError(2, 1, 1001, "error");
		expect(ott._playerState).toEqual(OTTPlayerStates.ERROR);
		expect(triggerErrorCB).toHaveBeenCalled();
	});

	test("State: ERROR (recoverable)", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott._sdkError(1, 1, 1001, "error");
		expect(ott._playerState).toEqual(OTTPlayerStates.ERROR);
		expect(triggerErrorCB).not.toHaveBeenCalled();
	});

	test("State: Http ERROR", () => {
		const url = "https://test.com";
		const message = "help me please";

		ott.initialiseSDKPlayerSuccessCallback();
		ott.onPlaying();
		ott._sdkHttpError(404, message, { data: [url, 1, true, "someOtherStuff"], });
		expect(ott._playerState).toEqual(OTTPlayerStates.PLAYING);
		expect(triggerHttpErrorCB).toHaveBeenCalledWith(
			expect.objectContaining({
				message,
				url,
				statusCode: 404,
				platform: expect.objectContaining({ name: "Web" }),
			}));
	});

	test("State: PLAYING -> PLAY_REQUESTED", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onPlaying();
		expect(ott._playerState).toEqual(OTTPlayerStates.PLAYING);
		ott.source = BBB_NON_SSM_WV_WITH_TOKEN;
		expect(updateStateFn).toHaveBeenCalledWith(
			OTTPlayerStates.PLAY_REQUESTED
		);
	});

	test("State: WAITING -> PLAY_REQUESTED", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onWaiting();
		expect(ott._playerState).toEqual(OTTPlayerStates.WAITING);
		ott.source = BBB_NON_SSM_WV_WITH_TOKEN;
		expect(updateStateFn).toHaveBeenCalledWith(
			OTTPlayerStates.PLAY_REQUESTED
		);
	});
	test("State: STOPPED -> PLAY_REQUESTED", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.reset(OTTResetTypes.RESET_OTT_AND_SDK_FOR_APP_REQUEST);
		expect(ott._playerState).toEqual(OTTPlayerStates.STOPPED);
		ott.source = BBB_NON_SSM_WV_WITH_TOKEN;
		expect(updateStateFn).toHaveBeenCalledWith(
			OTTPlayerStates.PLAY_REQUESTED
		);
	});
	test("State: ERROR -> PLAY_REQUESTED", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott._sdkError(2, 1, 1001, "error");
		expect(ott._playerState).toEqual(OTTPlayerStates.ERROR);
		ott.source = BBB_NON_SSM_WV_WITH_TOKEN;
		expect(updateStateFn).toHaveBeenCalledWith(
			OTTPlayerStates.PLAY_REQUESTED
		);
	});
	test("State: WAITING -> PAUSED", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onWaiting();
		expect(ott._playerState).toEqual(OTTPlayerStates.WAITING);
		ott.onPaused();
		expect(ott._playerState).toEqual(OTTPlayerStates.PAUSED);
	});
	test("State: LOADED -> PAUSED", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onLoad();
		expect(ott._playerState).toEqual(OTTPlayerStates.LOADED);
		ott.onPaused();
		expect(ott._playerState).toEqual(OTTPlayerStates.PAUSED);
	});
	test("State: PLAYING -> PAUSED", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onPlaying();
		expect(ott._playerState).toEqual(OTTPlayerStates.PLAYING);
		ott.onPaused();
		expect(ott._playerState).toEqual(OTTPlayerStates.PAUSED);
	});
	test("State: SOURCE_SET -> STOPPED", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.source = BBB_NON_SSM_WV_WITH_TOKEN;
		expect(ott._playerState).toEqual(OTTPlayerStates.SOURCE_SET);
		ott.reset(OTTResetTypes.RESET_OTT_AND_SDK_FOR_APP_REQUEST);
		expect(ott._playerState).toEqual(OTTPlayerStates.STOPPED);
	});
	test("State: WAITING -> STOPPED", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onWaiting();
		expect(ott._playerState).toEqual(OTTPlayerStates.WAITING);
		ott.reset(OTTResetTypes.RESET_OTT_AND_SDK_FOR_APP_REQUEST);
		expect(ott._playerState).toEqual(OTTPlayerStates.STOPPED);
	});
	test("State: PLAYING -> STOPPED", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onPlaying();
		expect(ott._playerState).toEqual(OTTPlayerStates.PLAYING);
		ott.reset(OTTResetTypes.RESET_OTT_AND_SDK_FOR_APP_REQUEST);
		expect(ott._playerState).toEqual(OTTPlayerStates.STOPPED);
	});
	test("State: PAUSED -> STOPPED", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onPaused();
		expect(ott._playerState).toEqual(OTTPlayerStates.PAUSED);
		ott.reset(OTTResetTypes.RESET_OTT_AND_SDK_FOR_APP_REQUEST);
		expect(ott._playerState).toEqual(OTTPlayerStates.STOPPED);
	});
	test("State: ERROR -> STOPPED", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott._sdkError(2, 1, 1001, "error");
		expect(ott._playerState).toEqual(OTTPlayerStates.ERROR);
		ott.reset(OTTResetTypes.RESET_OTT_AND_SDK_FOR_APP_REQUEST);
		expect(ott._playerState).toEqual(OTTPlayerStates.STOPPED);
	});
});

describe(" Test Player Api methods", () => {
	test("method: play()", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		// call play when state is INITIALISED
		ott.play();
		expect(playerPlayFn).not.toHaveBeenCalled();
		// call play when state is LOADED
		ott.onLoad();
		ott.play();
		expect(playerPlayFn).toHaveBeenCalled();
	});
	test("method: pause()", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		// call play when state is INITIALISED
		ott.pause();
		expect(playerPauseFn).not.toHaveBeenCalled();
		// call play when state is PLAYING
		ott.onPlaying();
		ott.pause();
		expect(playerPauseFn).toHaveBeenCalled();
	});
	test("method: seek()", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onPlaying();
		ott.seek(100);
		expect(playerCurrentTimeFn).toHaveBeenCalled();
		// Test with wrong params.
		ott.seek("test");
		expect(triggerErrorCB).toHaveBeenCalled();
		expect(triggerErrorCB.mock.calls[0][1].errorCode).toBe(
			PluginErrorCode.SEEK_ERROR
		);
	});
	test("method: reset()", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onPlaying();
		ott.reset(OTTResetTypes.RESET_FOR_STOP);
		expect(ott._playerState).toEqual(OTTPlayerStates.STOPPED);
		expect(resetFn).toHaveBeenCalled();
	});
	test("method: reset() before native player is initialized.", () => {
		ott._playerState = OTTPlayerStates.INITIALISING;
		ott.reset(OTTResetTypes.RESET_FOR_UNMOUNT_OR_TYPE_CHANGE);
		expect(ott._playerState).toEqual(OTTPlayerStates.INITIALISING);
		expect(resetFn).not.toHaveBeenCalled();
	});
	test("method: setup()", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.setup();
		expect(onFn).toHaveBeenCalled();
	});
	test("method: addTextTracks()", () => {
		const textTracks = [{ language: "eng", url: "http://test/test" }];
		ott.initialiseSDKPlayerSuccessCallback();
		ott.addTextTracks(textTracks);
		expect(addRemoteTextTrackFn).toHaveBeenCalled();
		expect(addRemoteTextTrackFn.mock.calls[0][0].language).toBe("eng");
		expect(addRemoteTextTrackFn.mock.calls[0][0].src).toBe(
			"http://test/test"
		);
		expect(addRemoteTextTrackFn.mock.calls[0][1]).toBe(false);
	});
	test("method: isSrcTypeSupported()", () => {
		expect(ott.isSrcTypeSupported("application/dash+xml")).toBe(true);
		expect(ott.isSrcTypeSupported("application/mp3")).toBe(false);
	});
	test("method: selectTextTrack()", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.selectTextTrack(1);
		expect(textTracks[0].mode).toBe("disabled");
		expect(textTracks[1].mode).toBe("showing");
	});

	test("method: selectAudioTrack()", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.selectAudioTrack(1);
		expect(audioTracks[0].enabled).toBe(false);
		expect(audioTracks[1].enabled).toBe(true);

		// Care needed here to reinstate after so no knock-on effects on later tests
		ott.selectAudioTrack(0);
	});

	test("method: dispatchStatisticsEvent()", () => {
		const networkStats = jest
			.spyOn(OTTHelper, "getNetworkStats")
			.mockImplementation(jest.fn());
		const renderingStats = jest
			.spyOn(OTTHelper, "getRenderingStats")
			.mockImplementation(jest.fn());
		const playbackStats = jest
			.spyOn(OTTHelper, "getPlaybackStats")
			.mockImplementation(jest.fn());

		ott.initialiseSDKPlayerSuccessCallback();
		ott.statisticsTypes = -1; //all
		ott.onLoadedData();
		ott.dispatchStatisticsEvent();
		expect(onStatisticsUpdateCB).toHaveBeenCalled();
		expect(renderingStats).toHaveBeenCalledWith(
			mockToolkit.renderingStatistics,
			true
		);
		expect(networkStats).toHaveBeenCalledWith(
			mockToolkit.networkStatistics,
			true
		);
		expect(playbackStats).toHaveBeenCalledWith(
			mockToolkit.playbackStatistics,
			true
		);
	});
	test("method: dispatchProgressEvent()", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onPlaying();
		ott.dispatchProgressEvent();
		expect(onProgressCB).toHaveBeenCalled();
	});
	test("method: connectPlayerNode()", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		const elementId = "elementId";
		const getElementByIdFn = jest.spyOn(document, "getElementById");

		ott.connectPlayerNode(elementId);
		expect(getElementByIdFn).toHaveBeenCalledWith(elementId);
	});
	test("method: _handleDownloadFailed()", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		const code = 1001;
		const message = "message";
		const myEvent = {
			error: {
				code: code,
				message: message,
				data: ["server url", 0, 0, 0, 1],
			},
			httpResponseCode: 404,
		};
		ott._handleDownloadFailed(myEvent);
		expect(triggerErrorCB).toHaveBeenCalled();
		expect(triggerErrorCB.mock.calls[0][1].errorCode).toBe(code);
		expect(triggerErrorCB.mock.calls[0][1].errorMessage).toBe(message);
	});
});

describe(" Test Player Properties ", () => {
	test("Property: source", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.source = BBB_NON_SSM_WV_WITH_TOKEN;
		expect(mockSetSource).toHaveBeenCalled();
		expect(mockSetSource.mock.calls[0][0].src).toBe(
			BBB_NON_SSM_WV_WITH_TOKEN.src
		);
		expect(mockSetSource.mock.calls[0][0].type).toBe(
			BBB_NON_SSM_WV_WITH_TOKEN.type
		);
		expect(mockSetSource.mock.calls[0][0].token).toBe(
			BBB_NON_SSM_WV_WITH_TOKEN.token
		);
	});
	test("Property token", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		const setDRMSourceFn = jest.spyOn(ott._drm, "setSource");
		let sourceStream = BBB_NON_SSM_WV_WITH_TOKEN;
		sourceStream.token = null;
		ott.source = sourceStream;
		expect(ott._sourceSet.token).toBe(null);
		const token = "myTokenValue";
		ott.token = token;
		expect(ott._sourceSet.token).toBe(token);
		expect(setDRMSourceFn).toHaveBeenCalled();
		expect(setDRMSourceFn.mock.calls[0][0].token).toBe(token);
	});
	test("Property: preferredAudioLanguage", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.preferredAudioLanguage = "fr";
		expect(ott.preferredAudioLanguage).toBe("fr");
	});
	test("Property: autoplay", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.autoplay = true;
		expect(ott._autoPlay).toBe(true);
	});
	test("Property: volume", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.volume = 0.5;
		expect(ott._volume).toBe(0.5);
		expect(volumeFn).toHaveBeenCalledWith(0.5);
	});
	test("Property: muted", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.muted = true;
		expect(ott._muted).toBe(true);
		expect(mutedFn).toHaveBeenCalledWith(true);
	});
	test("Property: maxResolution", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		const maxRes = {
			width: 1024,
			height: 768,
		};
		ott.maxResolution = maxRes;
		expect(ott._maxResolution).toBe(maxRes);
		expect(setMaxResolutionFn).toHaveBeenCalledWith(1024, 768);
	});
	test("Property: _getCurrentResolution", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		expect(ott._getCurrentResolution).toBe(mockResolution);
	});
	test("Property: progressInterval", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.progressInterval = 100;
		expect(ott._progressInterval).toBe(100 * 1000);
	});
	test("Property: statisticsUpdateInterval", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.statisticsUpdateInterval = 1000;
		expect(ott._statisticsInterval).toBe(1000);
	});
	test("Property: maxBitrate", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.maxBitrate = 2000;
		expect(setMaxBandwidthFn).toHaveBeenCalledWith(2000);
		ott.maxBitrate = null;
		expect(setMaxBandwidthFn).toHaveBeenCalledWith(Infinity);
	});
	test("Property: onLicenseRequest resolve", () => {
		const responseLicense = "license response";
		let myOnLicenseRequest = jest.fn(() =>
			Promise.resolve(responseLicense)
		);
		const keySystem = "widevine";
		const source = BBB_NON_SSM_WV_WITH_TOKEN;
		const requestPayload = {
			byteLength: OTT.CERTIFICATE_PAYLOAD_LENGTH + 100,
		};
		const requestType = "license-request";
		ott.initialiseSDKPlayerSuccessCallback();
		ott.source = source;
		ott.onLicenseRequest = myOnLicenseRequest;

		expect.assertions(1);
		return expect(
			ott.licenseRetrievalCallback(
				keySystem,
				source,
				requestPayload,
				requestType
			)
		).resolves.toBe(responseLicense);
	});
	test("Property: onLicenseRequest reject", () => {
		const rejectError = "license request error";
		let myOnLicenseRequest = jest.fn(() => Promise.reject(rejectError));
		const keySystem = "widevine";
		const source = BBB_NON_SSM_WV_WITH_TOKEN;
		const requestPayload = {
			byteLength: OTT.CERTIFICATE_PAYLOAD_LENGTH + 100,
		};
		const requestType = "license-request";
		ott.initialiseSDKPlayerSuccessCallback();
		ott.source = source;
		ott.onLicenseRequest = myOnLicenseRequest;

		expect.assertions(1);
		return expect(
			ott.licenseRetrievalCallback(
				keySystem,
				source,
				requestPayload,
				requestType
			)
		).rejects.toBe(rejectError);
	});
	test("Property: onLicenseRequest null", () => {
		const keySystem = "widevine";
		const source = BBB_NON_SSM_WV_WITH_TOKEN;
		const requestPayload = {
			byteLength: OTT.CERTIFICATE_PAYLOAD_LENGTH + 100,
		};
		const requestType = "license-request";
		ott.initialiseSDKPlayerSuccessCallback();
		const responseLicense = "license response";
		const drmDicenseRetriever = jest
			.spyOn(ott._drm, "licenseRetriever")
			.mockImplementation(() => responseLicense);

		ott.onLicenseRequest = null;
		expect(
			ott.licenseRetrievalCallback(
				keySystem,
				source,
				requestPayload,
				requestType
			)
		).toBe(responseLicense);
		expect(drmDicenseRetriever).toHaveBeenCalledWith(
			keySystem,
			source,
			requestPayload,
			requestType
		);
	});

	test("Property: onLicenseRequest fairplay certificate request resolve", () => {
		const certificate = "certificate response";
		let myRequest = jest.fn(() => Promise.resolve(certificate));
		ott.initialiseSDKPlayerSuccessCallback();
		ott.source = BBB_NON_SSM_WV_WITH_TOKEN;
		ott.onLicenseRequest = myRequest;
		expect.assertions(1);
		return expect(ott._certificateRetrievalCallback()).resolves.toBe(
			certificate
		);
	});

	test("Property: onLicenseRequest null for fairplay certificate request", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.source = BBB_NON_SSM_WV_WITH_TOKEN;
		const certificate = "certificate response";
		const drmCertificateRetriever = jest
			.spyOn(ott._drm, "certificateRetriever")
			.mockImplementation(() => certificate);
		ott.onLicenseRequest = null;
		expect.assertions(1);
		return expect(ott._certificateRetrievalCallback()).toBe(certificate);
	});
});

describe(" Test Player Events ", () => {
	test("Event: _onReady", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott._onReady();
		expect(addEventListenerFn).toHaveBeenCalled();
	});
	test("Event: onLoadStart", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onLoadStart();
		expect(onLoadStartCB).toHaveBeenCalled();
	});
	test("Event: onLoadedData", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onLoadedData();
		expect(onLoadedDataCB).toHaveBeenCalled();
	});
	test("Event: onEnd", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onEnd();
		expect(onEndCB).toHaveBeenCalled();
	});
	test("Event: onBitratesAvailable", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onBitratesAvailable();
		expect(onBitratesAvailableCB).toHaveBeenCalled();
	});
	test("Event: onDownloadResChanged", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onDownloadResChanged(1024, 768);
		expect(onDownloadResChangedCB).toHaveBeenCalled();
	});
	test("Event: onSelectedBitrateChanged", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onSelectedBitrateChanged(1024);
		expect(onSelectedBitrateChangedCB).toHaveBeenCalled();
		expect(onSelectedBitrateChangedCB.mock.calls[0][0].bitrate).toBe(1024);
	});
	test("Event: onTracksChanged", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onTracksChanged();
		expect(onTracksChangedCB).toHaveBeenCalled();
	});

	// Care needed with consequences of earlier test
	test("Event: onAudioTrackSelected", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onAudioTrackSelected();
		expect(onAudioTrackSelectedCB).toHaveBeenCalled();
		expect(onAudioTrackSelectedCB.mock.calls[0][0].index).toBe(0);
	});

	test("audioTracks contents", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onTracksChanged();
		expect(onTracksChangedCB).toHaveBeenCalled();

		const expectedTracks = {
			audioTracks: [
				{
					characteristics: [],
					encodeType: 0,
					language: "en",
					title: "en (main)",
					channelCount: 2,
				},
				{
					characteristics: [],
					encodeType: 0,
					language: "en",
					title: "en (alternate)",
					channelCount: 6,
				},
				{
					characteristics: ["public.accessibility.describes-video"],
					encodeType: 0,
					language: "en",
					title: "en (alternate)",
					channelCount: 2,
				},
				{
					characteristics: ["public.accessibility.describes-video"],
					encodeType: 0,
					language: "en",
					title: "en (alternate)",
					channelCount: 6,
				},

				// deutsch
				{
					characteristics: [],
					encodeType: 0,
					language: "de",
					title: "de (dub)",
					channelCount: 2,
				},
				{
					characteristics: [],
					encodeType: 0,
					language: "de",
					title: "de (dub,alternate)",
					channelCount: 6,
				},
				{
					characteristics: ["public.accessibility.describes-video"],
					encodeType: 0,
					language: "de",
					title: "de (dub,alternate)",
					channelCount: 2,
				},
				{
					characteristics: ["public.accessibility.describes-video"],
					encodeType: 0,
					language: "de",
					title: "de (dub,alternate)",
					channelCount: 6,
				},

				// french
				{
					characteristics: [],
					encodeType: 0,
					language: "fr",
					title: "fr (dub)",
					channelCount: 2,
				},
				{
					characteristics: [],
					encodeType: 0,
					language: "fr",
					title: "fr (dub,alternate)",
					channelCount: 6,
				},
				{
					characteristics: ["public.accessibility.describes-video"],
					encodeType: 0,
					language: "fr",
					title: "fr (dub,alternate)",
					channelCount: 2,
				},
				{
					characteristics: ["public.accessibility.describes-video"],
					encodeType: 0,
					language: "fr",
					title: "fr (dub,alternate)",
					channelCount: 6,
				},
			],
			textTracks: [
				{
					characteristics: [],
					encodeType: 1000,
					language: "eng",
					title: "eng",
				},
				{
					characteristics: [],
					encodeType: 1000,
					language: "french",
					title: "french",
				},
			],
		};

		expect(onTracksChangedCB.mock.calls[0][0]).toStrictEqual(
			expectedTracks
		);
	});

	test("Event: onTextTrackSelected", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onTextTrackSelected();
		expect(onTextTrackSelectedCB).toHaveBeenCalled();
		expect(onTextTrackSelectedCB.mock.calls[0][0].index).toBe(0);
	});
	test("Event: onSeek", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onSeek();
		expect(onSeekCB).toHaveBeenCalled();
	});
	test("Event: onDrmStateChanged", () => {
		ott.initialiseSDKPlayerSuccessCallback();
		const errorObj = { message: "error" };
		ott.onDrmStateChanged(
			DRMStates.ERROR,
			BBB_NON_SSM_WV_WITH_TOKEN,
			errorObj
		);
		expect(triggerErrorCB).toHaveBeenCalled();
		expect(triggerErrorCB.mock.calls[0][1]).toBe(errorObj);
	});
});

describe(" Test Set Player Event properties ", () => {
	test("Set Event property: onAudioTrackSelected", () => {
		const onAudioTrackSelectedCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onAudioTrackSelectedEvent = onAudioTrackSelectedCallBack;
		ott.onAudioTrackSelected();
		expect(onAudioTrackSelectedCallBack).toHaveBeenCalled();
	});
	test("Set Event property: onBitratesAvailable", () => {
		const onBitratesAvailableCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onBitratesAvailableEvent = onBitratesAvailableCallBack;
		ott.onBitratesAvailable();
		expect(onBitratesAvailableCallBack).toHaveBeenCalled();
	});
	test("Set Event property: onDownloadResChanged", () => {
		const onDownloadResChangedCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onDownloadResChangedEvent = onDownloadResChangedCallBack;
		ott.onDownloadResChanged(1024, 768);
		expect(onDownloadResChangedCallBack).toHaveBeenCalled();
	});
	test("Set Event property: onLoad", () => {
		const onLoadCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onLoadEvent = onLoadCallBack;
		ott.onLoad();
		expect(onLoadCallBack).toHaveBeenCalled();
	});
	test("Set Event property: onLoadStart", () => {
		const onLoadStartCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onLoadStartEvent = onLoadStartCallBack;
		ott.onLoadStart();
		expect(onLoadStartCallBack).toHaveBeenCalled();
	});
	test("Set Event property: onPaused", () => {
		const onPausedCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onPausedEvent = onPausedCallBack;
		ott.onPaused();
		expect(onPausedCallBack).toHaveBeenCalled();
	});
	test("Set Event property: onProgress", () => {
		const onProgressCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onProgressEvent = onProgressCallBack;
		ott.onPlaying();
		ott.dispatchProgressEvent();
		expect(onProgressCallBack).toHaveBeenCalled();
	});
	test("Set Event property: onSeek", () => {
		const onSeekCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onSeekEvent = onSeekCallBack;
		ott.onSeek();
		expect(onSeekCallBack).toHaveBeenCalled();
	});
	test("Set Event property: onSelectedBitrateChanged", () => {
		const onSelectedBitrateChangedCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onSelectedBitrateChangedEvent = onSelectedBitrateChangedCallBack;
		ott.onSelectedBitrateChanged(1024);
		expect(onSelectedBitrateChangedCallBack).toHaveBeenCalled();
	});
	test("Set Event property: onEnd", () => {
		const onEndCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onEndEvent = onEndCallBack;
		ott.onEnd();
		expect(onEndCallBack).toHaveBeenCalled();
	});
	test("Set Event property: onError", () => {
		const onErrorCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onErrorEvent = onErrorCallBack;
		expect(mockErrorHandler._onError).toBe(onErrorCallBack);
	});
	test("Set Event property: onHttpError", () => {
		const onHttpErrorCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onHttpErrorEvent = onHttpErrorCallBack;
		expect(mockErrorHandler._onHttpError).toBe(onHttpErrorCallBack);
	});
	test("Set Event property: onPlaying", () => {
		const onPlayingCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onPlayingEvent = onPlayingCallBack;
		ott.onPlaying();
		expect(onPlayingCallBack).toHaveBeenCalled();
	});
	test("Set Event property: onPlay", () => {
		const onPlayCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onPlayEvent = onPlayCallBack;
		ott.onPlay();
		expect(onPlayCallBack).toHaveBeenCalled();
	});
	test("Set Event property: onStatisticsUpdate", () => {
		const onStatisticsUpdateCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onStatisticsUpdateEvent = onStatisticsUpdateCallBack;
		ott.statisticsTypes = -1; //all
		ott.onLoadedData();
		ott.dispatchStatisticsEvent();
		expect(onStatisticsUpdateCallBack).toHaveBeenCalled();
	});
	test("Set Event property: onStopped", () => {
		const onStoppedCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onStoppedEvent = onStoppedCallBack;
		ott.onStopped();
		expect(onStoppedCallBack).toHaveBeenCalled();
	});
	test("Set Event property: onTextTrackSelected", () => {
		const onTextTrackSelectedCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onTextTrackSelectedEvent = onTextTrackSelectedCallBack;
		ott.onTextTrackSelected();
		expect(onTextTrackSelectedCallBack).toHaveBeenCalled();
	});
	test("Set Event property: onThumbnailAvailable", () => {
		const onThumbnailAvailableCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onThumbnailAvailableEvent = onThumbnailAvailableCallBack;
		expect(ott._onThumbnailAvailable).toBe(onThumbnailAvailableCallBack);
	});
	test("Set Event property: onTracksChanged", () => {
		const onTracksChangedCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onTracksChangedEvent = onTracksChangedCallBack;
		ott.onTracksChanged();
		expect(onTracksChangedCallBack).toHaveBeenCalled();
	});
	test("Set Event property: onWaiting", () => {
		const onWaitingCallBack = jest.fn();
		ott.initialiseSDKPlayerSuccessCallback();
		ott.onWaitingEvent = onWaitingCallBack;
		ott.onWaiting();
		expect(onWaitingCallBack).toHaveBeenCalled();
	});
});
