// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://jestjs.io/"}
 */

jest.mock("../../../src/web/NMPWebPlayer", () => jest.fn());
jest.mock("../../../src/web/OTVSDKManager", () => jest.fn());

import { SSMStates } from "../../../src/web/common/interface";
import { SSM } from "../../../src/web/SSM";
import sinon from "../../../node_modules/sinon/pkg/sinon";
import { PluginErrorCode } from "../../../src/web/common/ErrorHandler";

let nonSsmSource = {
	name: "Big Buck Bunny [OTT VOD, Clear]",
	source: {
		src: "https://d3bqrzf9w11pn3.cloudfront.net/basic_dash_bbb_clear/bbb_public.mpd",
		type: "application/dash+xml",
	},
};

let playreadySsmSourceWithoutToken = {
	// enforcement
	name: "VOD Encrypted DASH - playready-ssm - 1000 sessions",
	source: {
		src: "https://replacemewithyourown.com/vod/demo_content/ed_elephants_dream_1080p/elephants_dream_mspr_only.mpd?SSM1000 Elephants Dream",
		type: "application/dash+xml",
		drm: {
			licenseURL:
				"https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses",
			ssmServerURL: "https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm",
			type: "Playready",
		},
	},
};

let playreadySsmSourceWithToken = {
	// enforcement
	name: "VOD Encrypted DASH - playready-ssm - 1000 sessions",
	source: {
		src: "https://replacemewithyourown.com/vod/demo_content/ed_elephants_dream_1080p/elephants_dream_mspr_only.mpd?SSM1000 Elephants Dream",
		type: "application/dash+xml",
		token:
			// 1000 concurrent sessions allowed
			"eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDEwMDAifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjI3NjUzNGNmLWE3YTgtNGQyOS1iZDY2LTRjNWQ4MmIyMzFjNiJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fZWxlcGhhbnRzX2RyZWFtIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoxMDAwLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.0FeOB-v1BV1x-83UiSdENE9KvXyhDTsnzlBULvpzEx4,eyJrY0lkcyI6WyIyNzY1MzRjZi1hN2E4LTRkMjktYmQ2Ni00YzVkODJiMjMxYzYiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..RCHnPaz4bZvIB06dpy1kSA.QPc3b263SoSdUH4kNjEKyXbQca4Qqus_2o9vLFBw3paifKSxpNlwTGnCHG8-cKhzuOeuY0CZJAk3RGkpu45hYNwFOBxwO-rRF_689W7hA0bUv66-Vp6PZWTHPL-y0AP3sQtrbWWED8rlyUxNiw1H71AkmFac5LG4fNjxW_nTwPo.C9Mm75b9uODSqignN2FG1Q",
		drm: {
			licenseURL:
				"https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses",
			ssmServerURL: "https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm",
			type: "Playready",
		},
	},
};

let playreadySsmSourceWithInvalidToken = {
	// enforcement
	name: "VOD Encrypted DASH - playready-ssm - 1000 sessions",
	source: {
		src: "https://replacemewithyourown.com/vod/demo_content/ed_elephants_dream_1080p/elephants_dream_mspr_only.mpd?SSM1000 Elephants Dream",
		type: "application/dash+xml",
		token: "invalid",
		drm: {
			licenseURL:
				"https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses",
			ssmServerURL: "https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm",
			type: "Playready",
		},
	},
};

let wideviceSourceWithToken = {
	name: " Tears-SSM-Widevine (1000 Sessions)",
	source: {
		src: "https://replacemewithyourown.com/vod/demo_content/ed_sintel_1080p/sintel.mpd?SSM1000 Sintel",
		type: "application/dash+xml",
		token: "eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDEwMDAifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjRkZDY3MGRmLWI4NDgtNDc2Yi1hODYyLTYzMjFjN2FlN2ZkNSJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fc2ludGVsXzRrIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoxMDAwLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.O6P_W5MDtppchgtDcjRf6lGtvndg8qYI0SvX5AsTSNw,eyJrY0lkcyI6WyI0ZGQ2NzBkZi1iODQ4LTQ3NmItYTg2Mi02MzIxYzdhZTdmZDUiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..FnAMFZvETeg0qSeT4dIkHg.vxvzTz9qm0i2dyz61E0f7Bx342m-jUF65YdmXbFPir27_bMdHgYOuMPDK8zG9rXivMBjMfJ0zhTuOAFgZS1hWWmPM_dGih8aO1LBxcNLF46oamrkhvlg7AweyNFi66jYt3Pg_X2zfoH-8hScHqtSNA3I4xy1pQhZHT5GdaQZj-c.Ml7dqvscUJKPJRDuwOuHXg",
		drm: {
			licenseURL:
				"https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses",
			ssmServerURL: "https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm",
			type: "Widevine",
		},
	},
};

// Define the ssmStateChangedCallback function
const ssmStateChangedCallback = jest.fn(
	(_state, _source, _sessionInfo, _error) => {
		return;
	}
);

async function waitInMS(xMs = 100) {
	await new Promise((resolve) => setTimeout(resolve, xMs));
}

// Validate SSM setup and teardown

describe("Validate SSM setup and teardown", () => {
	let ssm,
		setSource,
		requestSetup,
		clearSSMHeartbeatIntervalTimer,
		requestTeardown;
	let fakeHttpServer;

	beforeEach(() => {
		ssm = new SSM(ssmStateChangedCallback);
		setSource = jest.spyOn(ssm, "setSource");
		requestSetup = jest.spyOn(ssm, "_requestSetup");
		clearSSMHeartbeatIntervalTimer = jest.spyOn(
			ssm,
			"_clearSSMHeartbeatIntervalTimer"
		);
		requestTeardown = jest.spyOn(ssm, "_requestTeardown");

		fakeHttpServer = sinon.fakeServer.create();
		fakeHttpServer.configure({ respondImmediately: true });
		fakeHttpServer.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{ "heartbeat": 60, "sessionToken": "0987654321" }',
		]);
	});

	afterEach(() => {
		jest.resetAllMocks();
		sinon.reset();
	});

	function validateSetupRequested() {
		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).not.toBeNull();
		expect(requestSetup).toHaveBeenCalled();

		expect(ssmStateChangedCallback).toHaveBeenCalled();
		expect(ssmStateChangedCallback.mock.calls[0][0]).toEqual(
			SSMStates.SETUP_REQUESTED
		);
		expect(ssmStateChangedCallback.mock.calls[0][1].token).not.toBe(
			undefined
		);
		expect(ssmStateChangedCallback.mock.calls[0][2]).toBeNull();
		expect(ssmStateChangedCallback.mock.calls[0][3]).toBe(undefined);
		ssmStateChangedCallback.mockClear();
	}

	async function validateSessionOn() {
		await waitInMS();
		expect(ssmStateChangedCallback).toHaveBeenCalled();
		expect(ssmStateChangedCallback.mock.calls[0][0]).toEqual(
			SSMStates.SESSION_ON
		);
		expect(ssmStateChangedCallback.mock.calls[0][1].token).not.toBe(
			undefined
		);
		expect(ssmStateChangedCallback.mock.calls[0][2]).not.toBeNull();
		expect(ssmStateChangedCallback.mock.calls[0][3]).toBe(undefined);
		ssmStateChangedCallback.mockClear();
	}

	test("Validate SSM setup success", async () => {
		// Set SSM source with token
		ssm.setSource(playreadySsmSourceWithToken.source);
		validateSetupRequested();
		await validateSessionOn();
	});

	test("Validate SSM setup failure", async () => {
		// Set SSM source with invalid token
		fakeHttpServer.respondWith("POST", "*", [
			400,
			{ "Content-Type": "application/json" },
			'{ "error": "error detail" }',
		]);
		ssm.setSource(playreadySsmSourceWithInvalidToken.source);
		validateSetupRequested();
		await waitInMS();
		expect(ssmStateChangedCallback).toHaveBeenCalled();
		expect(ssmStateChangedCallback.mock.calls[0][0]).toEqual(
			SSMStates.ERROR
		);
		expect(ssmStateChangedCallback.mock.calls[0][1].token).not.toBe(
			undefined
		);
		expect(ssmStateChangedCallback.mock.calls[0][2]).toBeNull();
		expect(ssmStateChangedCallback.mock.calls[0][3]).not.toBe(undefined);
	});

	test("Validate SSM teardown success", async () => {
		// Set SSM source with token
		ssm.setSource(playreadySsmSourceWithToken.source);
		validateSetupRequested();
		await validateSessionOn();

		ssmStateChangedCallback.mockClear();
		// Set null source
		ssm.setSource(null);

		await waitInMS();

		expect(clearSSMHeartbeatIntervalTimer).toHaveBeenCalled();
		expect(requestTeardown).toHaveBeenCalled();

		expect(ssmStateChangedCallback.mock.calls.length).toEqual(2);
		expect(ssmStateChangedCallback.mock.calls[0][0]).toEqual(
			SSMStates.TEARDOWN_REQUESTED
		);
		expect(ssmStateChangedCallback.mock.calls[0][1]).toEqual(
			playreadySsmSourceWithToken.source
		);
		expect(ssmStateChangedCallback.mock.calls[0][2]).not.toBeNull();
		expect(ssmStateChangedCallback.mock.calls[0][3]).toBe(undefined);

		expect(ssmStateChangedCallback.mock.calls[1][0]).toEqual(
			SSMStates.SESSION_OFF
		);
		expect(ssmStateChangedCallback.mock.calls[1][1]).toEqual({});
		expect(ssmStateChangedCallback.mock.calls[1][2]).toBeNull();
		expect(ssmStateChangedCallback.mock.calls[1][3]).toBe(undefined);
	});

	test("Validate SSM teardown failure", async () => {
		// Set SSM source with token
		ssm.setSource(playreadySsmSourceWithToken.source);
		validateSetupRequested();
		await validateSessionOn();

		ssmStateChangedCallback.mockClear();
		// Set null source
		fakeHttpServer.respondWith("POST", "*", [
			400,
			{ "Content-Type": "application/json" },
			'{ "error": "error detail" }',
		]);

		ssm.setSource(null);

		await waitInMS();

		expect(clearSSMHeartbeatIntervalTimer).toHaveBeenCalled();
		expect(requestTeardown).toHaveBeenCalled();

		expect(ssmStateChangedCallback.mock.calls.length).toEqual(3);
		expect(ssmStateChangedCallback.mock.calls[0][0]).toEqual(
			SSMStates.TEARDOWN_REQUESTED
		);
		expect(ssmStateChangedCallback.mock.calls[0][1]).toEqual(
			playreadySsmSourceWithToken.source
		);
		expect(ssmStateChangedCallback.mock.calls[0][2]).not.toBeNull();
		expect(ssmStateChangedCallback.mock.calls[0][3]).toBe(undefined);

		expect(ssmStateChangedCallback.mock.calls[1][0]).toEqual(
			SSMStates.ERROR
		);
		expect(ssmStateChangedCallback.mock.calls[1][1]).toEqual(
			playreadySsmSourceWithToken.source
		);
		expect(ssmStateChangedCallback.mock.calls[1][2]).not.toBeNull();
		expect(ssmStateChangedCallback.mock.calls[1][3].errorCode).toBe(
			PluginErrorCode.SSM_TEARDOWN_FAILURE
		);

		expect(ssmStateChangedCallback.mock.calls[2][0]).toEqual(
			SSMStates.SESSION_OFF
		);
	});
});

// Validate SSM States when null source is set

describe("Validate SSM States when null source is set", () => {
	let ssm,
		setSource,
		clearTokenReFetchTimer,
		clearSSMHeartbeatIntervalTimer,
		requestTeardown;

	beforeEach(() => {
		ssm = new SSM(ssmStateChangedCallback);
		setSource = jest.spyOn(ssm, "setSource");
		clearTokenReFetchTimer = jest.spyOn(ssm, "_clearTokenReFetchTimer");
		clearSSMHeartbeatIntervalTimer = jest.spyOn(
			ssm,
			"_clearSSMHeartbeatIntervalTimer"
		);
		requestTeardown = jest.spyOn(ssm, "_requestTeardown");
	});

	afterEach(() => {
		ssmStateChangedCallback.mockClear();
		sinon.reset();
	});

	function validateSsmStateChangedCallback(ssmState) {
		expect(ssmStateChangedCallback).toHaveBeenCalled();
		expect(ssmStateChangedCallback.mock.calls[0][0]).toEqual(ssmState);
		expect(ssmStateChangedCallback.mock.calls[0][1]).toEqual({});
		expect(ssmStateChangedCallback.mock.calls[0][2]).toBeNull();
		expect(ssmStateChangedCallback.mock.calls[0][3]).toBe(undefined);
	}

	test("When SSMState is SESSION_OFF, null source is set", () => {
		expect(ssm._ssmState).toBe(SSMStates.SESSION_OFF);

		ssm.setSource(null);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).toBeNull();
		expect(ssm._ssmState).toBe(SSMStates.SESSION_OFF);
		expect(ssm._currentSource).toEqual({});
	});

	test("When SSMState is AWAITING_CONTENT_TOKEN, null source is set", async () => {
		ssm._ssmState = SSMStates.AWAITING_CONTENT_TOKEN;

		ssm.setSource(null);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).toBeNull();
		expect(clearTokenReFetchTimer).toHaveBeenCalled();

		validateSsmStateChangedCallback(SSMStates.SESSION_OFF);
	});

	test("When SSMState is SETUP_REQUESTED, null source is set", () => {
		ssm._ssmState = SSMStates.SETUP_REQUESTED;

		ssm.setSource(null);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._ssmState).toBe(SSMStates.SETUP_REQUESTED);
	});

	test("When SSMState is SESSION_ON, null source is set", async () => {
		ssm._ssmState = SSMStates.SESSION_ON;

		ssm.setSource(null);

		expect(setSource).toHaveBeenCalled();
		expect(clearSSMHeartbeatIntervalTimer).toHaveBeenCalled();
		expect(requestTeardown).toHaveBeenCalled();

		validateSsmStateChangedCallback(SSMStates.TEARDOWN_REQUESTED);
	});

	test("When SSMState is RENEWAL_REQUESTED, null source is set", () => {
		ssm._ssmState = SSMStates.RENEWAL_REQUESTED;

		ssm.setSource(null);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toEqual({});
		expect(ssm._ssmState).toBe(SSMStates.RENEWAL_REQUESTED);
	});

	test("When SSMState is TEARDOWN_REQUESTED, null source is set", () => {
		ssm._ssmState = SSMStates.TEARDOWN_REQUESTED;

		ssm.setSource(null);
		expect(ssm._newSource).toEqual({});
		expect(setSource).toHaveBeenCalled();
		expect(ssm._ssmState).toBe(SSMStates.TEARDOWN_REQUESTED);
	});

	test("When SSMState is ERROR, null source is set", async () => {
		ssm._ssmState = SSMStates.ERROR;

		ssm.setSource(null);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).toBeNull();

		validateSsmStateChangedCallback(SSMStates.SESSION_OFF);
	});
});

// Validate SSM States when non SSM source is set

describe("Validate SSM States when non SSM source is set", () => {
	let ssm,
		setSource,
		clearTokenReFetchTimer,
		clearSSMHeartbeatIntervalTimer,
		requestTeardown;

	beforeEach(() => {
		ssm = new SSM(ssmStateChangedCallback);
		setSource = jest.spyOn(ssm, "setSource");
		clearTokenReFetchTimer = jest.spyOn(ssm, "_clearTokenReFetchTimer");
		clearSSMHeartbeatIntervalTimer = jest.spyOn(
			ssm,
			"_clearSSMHeartbeatIntervalTimer"
		);
		requestTeardown = jest.spyOn(ssm, "_requestTeardown");
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	function validateSsmStateChangedCallback(ssmState) {
		expect(ssmStateChangedCallback).toHaveBeenCalled();
		expect(ssmStateChangedCallback.mock.calls[0][0]).toEqual(ssmState);
		expect(ssmStateChangedCallback.mock.calls[0][1].drm).toBe(undefined);
		expect(ssmStateChangedCallback.mock.calls[0][2]).toBeNull();
		expect(ssmStateChangedCallback.mock.calls[0][3]).toBe(undefined);
	}

	test("When SSMState is SESSION_OFF, non SSM source is set", () => {
		expect(ssm._ssmState).toBe(SSMStates.SESSION_OFF);

		ssm.setSource(nonSsmSource.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).toBeNull();
		expect(ssm._ssmState).toBe(SSMStates.SESSION_OFF);
		expect(ssm._currentSource.drm).toBe(undefined);
	});

	test("When SSMState is AWAITING_CONTENT_TOKEN, non SSM source is set", async () => {
		ssm._ssmState = SSMStates.AWAITING_CONTENT_TOKEN;

		ssm.setSource(nonSsmSource.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).toBeNull();
		expect(clearTokenReFetchTimer).toHaveBeenCalled();

		validateSsmStateChangedCallback(SSMStates.SESSION_OFF);
	});

	test("When SSMState is SETUP_REQUESTED, non SSM source is set", async () => {
		ssm._ssmState = SSMStates.SETUP_REQUESTED;

		ssm.setSource(nonSsmSource.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._ssmState).toBe(SSMStates.SETUP_REQUESTED);
	});

	test("When SSMState is SESSION_ON, non SSM source is set", async () => {
		ssm._ssmState = SSMStates.SESSION_ON;

		ssm.setSource(nonSsmSource.source);

		expect(setSource).toHaveBeenCalled();
		expect(clearSSMHeartbeatIntervalTimer).toHaveBeenCalled();
		expect(requestTeardown).toHaveBeenCalled();

		validateSsmStateChangedCallback(SSMStates.TEARDOWN_REQUESTED);
	});

	test("When SSMState is RENEWAL_REQUESTED, non SSM source is set", () => {
		ssm._ssmState = SSMStates.RENEWAL_REQUESTED;

		ssm.setSource(nonSsmSource.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toEqual(nonSsmSource.source);
		expect(ssm._ssmState).toBe(SSMStates.RENEWAL_REQUESTED);
		expect(ssm._currentSource.drm).toBe(undefined);
	});

	test("When SSMState is TEARDOWN_REQUESTED, non SSM source is set", () => {
		ssm._ssmState = SSMStates.TEARDOWN_REQUESTED;
		ssm.setSource(nonSsmSource.source);
		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toEqual(nonSsmSource.source);
		expect(ssm._ssmState).toBe(SSMStates.TEARDOWN_REQUESTED);
	});

	test("When SSMState is ERROR, non SSM source is set", async () => {
		ssm._ssmState = SSMStates.ERROR;

		ssm.setSource(nonSsmSource.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).toBeNull();

		validateSsmStateChangedCallback(SSMStates.SESSION_OFF);
	});
});

// Validate SSM States when SSM source is set without token

describe("Validate SSM States when SSM source is set without token", () => {
	let ssm,
		setSource,
		clearTokenReFetchTimer,
		waitForContentToken,
		clearSSMHeartbeatIntervalTimer,
		requestTeardown;

	beforeEach(() => {
		ssm = new SSM(ssmStateChangedCallback);
		setSource = jest.spyOn(ssm, "setSource");
		clearTokenReFetchTimer = jest.spyOn(ssm, "_clearTokenReFetchTimer");
		waitForContentToken = jest.spyOn(ssm, "_waitForContentToken");
		clearSSMHeartbeatIntervalTimer = jest.spyOn(
			ssm,
			"_clearSSMHeartbeatIntervalTimer"
		);
		requestTeardown = jest.spyOn(ssm, "_requestTeardown");
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	function validateSsmStateChangedCallback(ssmState) {
		expect(ssmStateChangedCallback).toHaveBeenCalled();
		expect(ssmStateChangedCallback.mock.calls[0][0]).toEqual(ssmState);
		expect(ssmStateChangedCallback.mock.calls[0][1].token).toBe(undefined);
		expect(ssmStateChangedCallback.mock.calls[0][2]).toBeNull();
		expect(ssmStateChangedCallback.mock.calls[0][3]).toBe(undefined);
	}

	test("When SSMState is SESSION_OFF, SSM source is set without token", async () => {
		expect(ssm._ssmState).toBe(SSMStates.SESSION_OFF);

		ssm.setSource(playreadySsmSourceWithoutToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).toBeNull();
		expect(clearTokenReFetchTimer).toHaveBeenCalled();
		expect(waitForContentToken).toHaveBeenCalled();

		validateSsmStateChangedCallback(SSMStates.AWAITING_CONTENT_TOKEN);
	});

	test("When SSMState is AWAITING_CONTENT_TOKEN, SSM source is set without token", async () => {
		ssm._ssmState = SSMStates.AWAITING_CONTENT_TOKEN;

		ssm.setSource(playreadySsmSourceWithoutToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).toBeNull();
		expect(clearTokenReFetchTimer).toHaveBeenCalled();
		expect(waitForContentToken).toHaveBeenCalled();

		validateSsmStateChangedCallback(SSMStates.AWAITING_CONTENT_TOKEN);
	});

	test("When SSMState is SETUP_REQUESTED, SSM source is set without token", () => {
		ssm._ssmState = SSMStates.SETUP_REQUESTED;

		ssm.setSource(playreadySsmSourceWithoutToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._ssmState).toEqual(SSMStates.SETUP_REQUESTED);
	});

	test("When SSMState is SESSION_ON, SSM source is set without token", async () => {
		ssm._ssmState = SSMStates.SESSION_ON;

		ssm.setSource(playreadySsmSourceWithoutToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toEqual(playreadySsmSourceWithoutToken.source);
		expect(clearSSMHeartbeatIntervalTimer).toHaveBeenCalled();
		expect(requestTeardown).toHaveBeenCalled();

		validateSsmStateChangedCallback(SSMStates.TEARDOWN_REQUESTED);
	});

	test("When SSMState is RENEWAL_REQUESTED, SSM source is set without token", async () => {
		ssm._ssmState = SSMStates.RENEWAL_REQUESTED;

		ssm.setSource(playreadySsmSourceWithoutToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toEqual(playreadySsmSourceWithoutToken.source);

		expect(ssm._ssmState).toEqual(SSMStates.RENEWAL_REQUESTED);
	});

	test("When SSMState is TEARDOWN_REQUESTED, SSM source is set without token", () => {
		ssm._ssmState = SSMStates.TEARDOWN_REQUESTED;

		ssm.setSource(playreadySsmSourceWithoutToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toEqual(playreadySsmSourceWithoutToken.source);
		expect(ssm._ssmState).toEqual(SSMStates.TEARDOWN_REQUESTED);
	});

	test("When SSMState is ERROR, SSM source is set without token", async () => {
		ssm._ssmState = SSMStates.ERROR;

		ssm.setSource(playreadySsmSourceWithoutToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).toBeNull();
		expect(waitForContentToken).toHaveBeenCalled();

		validateSsmStateChangedCallback(SSMStates.AWAITING_CONTENT_TOKEN);
	});
});

// Validate SSM States when same SSM source is set with updated token

describe("Validate SSM States when same SSM source is set with updated token", () => {
	test("When SSMState is AWAITING_CONTENT_TOKEN, same SSM source is set with updated token", async () => {
		let fakeHttpServer = sinon.fakeServer.create();
		fakeHttpServer.configure({ respondImmediately: true });
		fakeHttpServer.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{ "heartbeat": 60, "sessionToken": "0987654321" }',
		]);
		let ssm = new SSM(ssmStateChangedCallback);
		let setPlayer = jest.spyOn(ssm, "setPlayer");
		let setSource = jest.spyOn(ssm, "setSource");
		let clearTokenReFetchTimer = jest.spyOn(ssm, "_clearTokenReFetchTimer");
		let waitForContentToken = jest.spyOn(ssm, "_waitForContentToken");
		let requestSetup = jest.spyOn(ssm, "_requestSetup");
		ssm._ssmState = SSMStates.SESSION_OFF;

		ssm.setPlayer("Invalid Player");
		ssm.setSource(playreadySsmSourceWithoutToken.source);

		expect(setPlayer).toHaveBeenCalled();
		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).toBeNull();
		expect(waitForContentToken).toHaveBeenCalled();

		expect(ssmStateChangedCallback).toHaveBeenCalled();
		expect(ssmStateChangedCallback.mock.calls[0][0]).toEqual(
			SSMStates.AWAITING_CONTENT_TOKEN
		);
		expect(ssmStateChangedCallback.mock.calls[0][1].token).toBe(undefined);
		expect(ssmStateChangedCallback.mock.calls[0][2]).toBeNull();
		expect(ssmStateChangedCallback.mock.calls[0][3]).toBe(undefined);
		ssmStateChangedCallback.mockClear();

		ssm.setSource(playreadySsmSourceWithToken.source);

		await waitInMS();

		expect(clearTokenReFetchTimer).toHaveBeenCalled();
		expect(requestSetup).toHaveBeenCalled();
		expect(ssmStateChangedCallback.mock.calls.length).toEqual(2);
		expect(ssmStateChangedCallback.mock.calls[0][0]).toEqual(
			SSMStates.SETUP_REQUESTED
		);
		expect(ssmStateChangedCallback.mock.calls[0][1].token).not.toBe(
			undefined
		);
		expect(ssmStateChangedCallback.mock.calls[0][2]).toBeNull();
		expect(ssmStateChangedCallback.mock.calls[0][3]).toBe(undefined);
		expect(ssmStateChangedCallback.mock.calls[1][0]).toEqual(
			SSMStates.SESSION_ON
		);
		expect(ssmStateChangedCallback.mock.calls[1][1].token).not.toBe(
			undefined
		);
		expect(ssmStateChangedCallback.mock.calls[1][2]).not.toBeNull();
		expect(ssmStateChangedCallback.mock.calls[1][3]).toBe(undefined);
		ssmStateChangedCallback.mockClear();
		sinon.reset();
	});
});

//  Validate SSM States when SSM source is set with token

describe("Validate SSM States when SSM source is set with token", () => {
	let ssm,
		setSource,
		clearTokenReFetchTimer,
		requestSetup,
		clearSSMHeartbeatIntervalTimer,
		requestTeardown;
	let fakeHttpServer;
	beforeEach(() => {
		ssm = new SSM(ssmStateChangedCallback);
		setSource = jest.spyOn(ssm, "setSource");
		clearTokenReFetchTimer = jest.spyOn(ssm, "_clearTokenReFetchTimer");
		requestSetup = jest.spyOn(ssm, "_requestSetup");
		clearSSMHeartbeatIntervalTimer = jest.spyOn(
			ssm,
			"_clearSSMHeartbeatIntervalTimer"
		);
		requestTeardown = jest.spyOn(ssm, "_requestTeardown");

		fakeHttpServer = sinon.fakeServer.create();
		fakeHttpServer.configure({ respondImmediately: true });
		fakeHttpServer.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{ "heartbeat": 60, "sessionToken": "0987654321" }',
		]);
	});

	afterEach(() => {
		jest.resetAllMocks();
		sinon.reset();
	});

	function validateSsmStateChangedCallback(ssmState) {
		expect(ssmStateChangedCallback).toHaveBeenCalled();
		expect(ssmStateChangedCallback.mock.calls[0][0]).toEqual(ssmState);
		expect(ssmStateChangedCallback.mock.calls[0][1].token).not.toBe(
			undefined
		);
		expect(ssmStateChangedCallback.mock.calls[0][2]).toBeNull();
		expect(ssmStateChangedCallback.mock.calls[0][3]).toBe(undefined);
	}

	test("When SSMState is SESSION_OFF, SSM source is set with token", async () => {
		ssm._ssmState = SSMStates.SESSION_OFF;

		ssm.setSource(playreadySsmSourceWithToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).not.toBeNull();
		expect(requestSetup).toHaveBeenCalled();

		await waitInMS();

		validateSsmStateChangedCallback(SSMStates.SETUP_REQUESTED);
	});

	test("When SSMState is SESSION_OFF, SSM source is set with token, heartbeat is invalid", async () => {
		fakeHttpServer.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{ "heartbeat": "invalid", "sessionToken": "0987654321" }',
		]);
		ssm._ssmState = SSMStates.SESSION_OFF;

		ssm.setSource(playreadySsmSourceWithToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).not.toBeNull();
		expect(requestSetup).toHaveBeenCalled();

		await waitInMS();

		expect(ssmStateChangedCallback).toHaveBeenCalledTimes(2);
		expect(ssmStateChangedCallback.mock.calls[1][3].errorCode).toBe(
			PluginErrorCode.SSM_HEARTBEAT_SEND_MESSAGE_FAILURE
		);
	});

	test("When SSMState is SESSION_OFF, SSM source is set with token, setup failure (SSM_HEARTBEAT_SEND_MESSAGE_FAILURE)", async () => {
		fakeHttpServer.respondWith("POST", "*", [
			400,
			{ "Content-Type": "application/json" },
			'{ "errorCode": 20, "message": "SSM_HEARTBEAT_SEND_MESSAGE_FAILURE" }',
		]);
		ssm._ssmState = SSMStates.SESSION_OFF;

		ssm.setSource(playreadySsmSourceWithToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).not.toBeNull();
		expect(requestSetup).toHaveBeenCalled();

		await waitInMS();

		expect(ssmStateChangedCallback).toHaveBeenCalledTimes(2);
		expect(ssmStateChangedCallback.mock.calls[1][3].errorCode).toBe(
			PluginErrorCode.SSM_HEARTBEAT_SEND_MESSAGE_FAILURE
		);
	});

	test("When SSMState is SESSION_OFF, SSM source is set with token, setup failure (USER_REACHED_MAXIMUM_SESSIONS_LIMIT)", async () => {
		fakeHttpServer.respondWith("POST", "*", [
			400,
			{ "Content-Type": "application/json" },
			'{ "errorCode": 1007, "message": "USER_REACHED_MAXIMUM_SESSIONS_LIMIT" }',
		]);
		ssm._ssmState = SSMStates.SESSION_OFF;

		ssm.setSource(playreadySsmSourceWithToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).not.toBeNull();
		expect(requestSetup).toHaveBeenCalled();

		await waitInMS();

		expect(ssmStateChangedCallback).toHaveBeenCalledTimes(2);
		expect(ssmStateChangedCallback.mock.calls[1][3].errorCode).toBe(
			PluginErrorCode.USER_REACHED_MAXIMUM_SESSIONS_LIMIT
		);
	});

	test("When SSMState is AWAITING_CONTENT_TOKEN, SSM source is set with token", async () => {
		ssm._ssmState = SSMStates.AWAITING_CONTENT_TOKEN;

		ssm.setSource(playreadySsmSourceWithToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).not.toBeNull();
		expect(clearTokenReFetchTimer).toHaveBeenCalled();
		expect(requestSetup).toHaveBeenCalled();

		await waitInMS();

		validateSsmStateChangedCallback(SSMStates.SETUP_REQUESTED);
	});

	test("When SSMState is SETUP_REQUESTED, SSM source is set with token", () => {
		ssm._ssmState = SSMStates.SETUP_REQUESTED;

		ssm.setSource(playreadySsmSourceWithToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._ssmState).toEqual(SSMStates.SETUP_REQUESTED);
	});

	test("When SSMState is SESSION_ON, SSM source is set with token", async () => {
		ssm._currentSource = wideviceSourceWithToken.source;
		ssm._ssmState = SSMStates.SESSION_ON;

		ssm.setSource(playreadySsmSourceWithToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toEqual(playreadySsmSourceWithToken.source);
		expect(clearSSMHeartbeatIntervalTimer).toHaveBeenCalled();
		expect(requestTeardown).toHaveBeenCalled();

		await waitInMS();

		validateSsmStateChangedCallback(SSMStates.TEARDOWN_REQUESTED);
	});

	test("When SSMState is RENEWAL_REQUESTED, SSM source is set with token", async () => {
		ssm._ssmState = SSMStates.RENEWAL_REQUESTED;

		ssm.setSource(playreadySsmSourceWithToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).not.toBeNull();
		expect(ssm._currentSource).not.toEqual(
			playreadySsmSourceWithToken.source
		);
	});

	test("When SSMState is TEARDOWN_REQUESTED, SSM source is set with token", async () => {
		ssm._ssmState = SSMStates.TEARDOWN_REQUESTED;

		ssm.setSource(playreadySsmSourceWithToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._ssmState).toEqual(SSMStates.TEARDOWN_REQUESTED);
	});

	test("When SSMState is ERROR, SSM source is set with token", async () => {
		ssm._ssmState = SSMStates.ERROR;

		ssm.setSource(playreadySsmSourceWithToken.source);

		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).not.toBeNull();
		expect(requestSetup).toHaveBeenCalled();

		await waitInMS();

		validateSsmStateChangedCallback(SSMStates.SETUP_REQUESTED);
	});
});

// Validate renewWidevine and setLicenseCustomData APIs

describe("Validate renewWidevine and setLicenseCustomData APIs", () => {
	let ssm,
		setSource,
		setLicenseCustomData,
		startHeartbeatInterval,
		sendSSMHeartbeat,
		proactiveLicenseRequest,
		renewWidevine;
	let fakeHttpServer;

	beforeEach(() => {
		ssm = new SSM(ssmStateChangedCallback);
		setSource = jest.spyOn(ssm, "setSource");
		setLicenseCustomData = jest.spyOn(ssm, "setLicenseCustomData");
		startHeartbeatInterval = jest.spyOn(ssm, "_startHeartbeatInterval");
		sendSSMHeartbeat = jest.spyOn(ssm, "_sendSSMHeartbeat");
		proactiveLicenseRequest = jest.spyOn(ssm, "_proactiveLicenseRequest");
		renewWidevine = jest.spyOn(ssm, "renewWidevine");

		fakeHttpServer = sinon.fakeServer.create();
		fakeHttpServer.autoRespond = true;
		fakeHttpServer.autoRespondAfter = 10;
		fakeHttpServer.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{ "heartbeat": 0.07, "sessionToken": "0987654321", "license": "bXkgbGljZW5zZQ==" }',
		]);
	});

	afterEach(async () => {
		ssm.setSource(null);
		await waitInMS();
		jest.resetAllMocks();
		sinon.reset();
	});

	function validateAfterSettingSource() {
		expect(setSource).toHaveBeenCalled();
		expect(ssm._newSource).toBeNull();
		expect(ssm._contentToken).not.toBeNull();
		expect(ssm._ssmSession).toBeNull();
	}

	async function waitTwoEventsForDuration(maxWaitTime = 10000) {
		let waitMs = 0;
		while (waitMs < maxWaitTime) {
			await waitInMS(100);
			if (ssmStateChangedCallback.mock.calls.length > 1) break;
			waitMs += 100;
		}
		expect(ssmStateChangedCallback.mock.calls.length).toBeGreaterThan(1);
	}

	test("Validate renewWidevine API", async () => {
		ssm.setSource(wideviceSourceWithToken.source);

		validateAfterSettingSource();

		await waitInMS();

		expect(ssm._ssmState).toEqual(SSMStates.SESSION_ON);
		expect(ssm._currentSource).not.toEqual({});
		expect(ssm._ssmSession).not.toBeNull();
		ssmStateChangedCallback.mockClear();

		ssm.renewWidevine();

		await waitTwoEventsForDuration();

		expect(renewWidevine).toHaveBeenCalled();
		expect(ssmStateChangedCallback.mock.calls[0][0]).toEqual(
			SSMStates.RENEWAL_REQUESTED
		);
		expect(ssmStateChangedCallback.mock.calls[1][0]).toEqual(
			SSMStates.SESSION_ON
		);
	});

	test("Validate setLicenseCustomData API with enforcement mode", async () => {
		const renewFn = jest.fn();
		const mockToolkit = {
			drmController: {
				renewLicence: renewFn,
			},
		};
		const mockPlayer = {
			otvtoolkit: () => mockToolkit,
		};

		ssm.setPlayer(mockPlayer);
		ssm.setSource(playreadySsmSourceWithToken.source);

		validateAfterSettingSource();

		await waitInMS();

		expect(ssm._ssmState).toEqual(SSMStates.SESSION_ON);
		expect(ssm._currentSource).not.toEqual({});
		expect(ssm._ssmSession).not.toBeNull();
		ssmStateChangedCallback.mockClear();

		ssm.setLicenseCustomData({
			sessionToken: ssm._ssmSession.sessionToken,
		});

		expect(setLicenseCustomData).toHaveBeenCalled();
		expect(startHeartbeatInterval).toHaveBeenCalled();
		expect(ssm._ssmHeartbeatInterval).not.toBeNull();

		await waitInMS();

		expect(proactiveLicenseRequest).toHaveBeenCalled();
		expect(renewFn).toHaveBeenCalled();
	});

	test("Validate setLicenseCustomData API with heartbeat mode", async () => {
		ssm.setSource(playreadySsmSourceWithToken.source);

		validateAfterSettingSource();

		await waitInMS();

		expect(ssm._ssmState).toEqual(SSMStates.SESSION_ON);
		expect(ssm._currentSource).not.toEqual({});
		expect(ssm._ssmSession).not.toBeNull();
		ssmStateChangedCallback.mockClear();

		ssm.setLicenseCustomData("Dummy Session Token");
		expect(setLicenseCustomData).toHaveBeenCalled();
		expect(startHeartbeatInterval).toHaveBeenCalled();
		expect(ssm._ssmHeartbeatInterval).not.toBeNull();

		await waitTwoEventsForDuration();
		expect(sendSSMHeartbeat).toHaveBeenCalled();
		expect(ssmStateChangedCallback.mock.calls[0][0]).toEqual(
			SSMStates.RENEWAL_REQUESTED
		);
		expect(ssmStateChangedCallback.mock.calls[1][0]).toEqual(
			SSMStates.SESSION_ON
		);
	});

	test("Validate renewWidevine API with network failure", async () => {
		ssm.setSource(wideviceSourceWithToken.source);

		validateAfterSettingSource();

		await waitInMS();

		expect(ssm._ssmState).toEqual(SSMStates.SESSION_ON);
		expect(ssm._currentSource).not.toEqual({});
		expect(ssm._ssmSession).not.toBeNull();
		ssmStateChangedCallback.mockClear();

		fakeHttpServer.respondWith("POST", "*", [
			400,
			{ "Content-Type": "application/json" },
			'{ "heartbeat": 0.07, "sessionToken": "0987654321", "license": "bXkgbGljZW5zZQ==" }',
		]);

		ssm.renewWidevine();

		await waitTwoEventsForDuration();

		expect(renewWidevine).toHaveBeenCalled();
		expect(ssmStateChangedCallback.mock.calls[0][0]).toEqual(
			SSMStates.RENEWAL_REQUESTED
		);
		expect(ssmStateChangedCallback.mock.calls[1][0]).toEqual(
			SSMStates.ERROR
		);
		expect(ssmStateChangedCallback.mock.calls[1][3].errorCode).toBe(
			PluginErrorCode.SSM_HEARTBEAT_SEND_MESSAGE_FAILURE
		);
	});

	test("Validate setLicenseCustomData API with heartbeat mode for network failure", async () => {
		ssm.setSource(playreadySsmSourceWithToken.source);

		validateAfterSettingSource();

		await waitInMS();

		expect(ssm._ssmState).toEqual(SSMStates.SESSION_ON);
		expect(ssm._currentSource).not.toEqual({});
		expect(ssm._ssmSession).not.toBeNull();
		ssmStateChangedCallback.mockClear();

		fakeHttpServer.respondWith("POST", "*", [
			400,
			{ "Content-Type": "application/json" },
			'{ "heartbeat": 0.07, "sessionToken": "0987654321", "license": "bXkgbGljZW5zZQ==" }',
		]);

		ssm.setLicenseCustomData("Dummy Session Token");
		expect(setLicenseCustomData).toHaveBeenCalled();
		expect(startHeartbeatInterval).toHaveBeenCalled();
		expect(ssm._ssmHeartbeatInterval).not.toBeNull();

		await waitTwoEventsForDuration();
		expect(sendSSMHeartbeat).toHaveBeenCalled();
		expect(ssmStateChangedCallback.mock.calls[0][0]).toEqual(
			SSMStates.RENEWAL_REQUESTED
		);
		expect(ssmStateChangedCallback.mock.calls[1][0]).toEqual(
			SSMStates.ERROR
		);
		expect(ssmStateChangedCallback.mock.calls[1][3].errorCode).toBe(
			PluginErrorCode.SSM_HEARTBEAT_SEND_MESSAGE_FAILURE
		);
	});
});
