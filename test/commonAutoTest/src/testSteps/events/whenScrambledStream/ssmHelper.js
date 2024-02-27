// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { sleepInMs } from "../../common";

const ERR_NO_TOKENS = 1;

const killStreams = {
	"dash-widevine-kill-stream": {
		manifest:
			"https://replacemewithyourown.com/demo/content/ed_big_buck_bunny_1080p/big_buck_bunny_wv_only.mpd",
		mimeType: "application/dash+xml",
		tokenPool: "autotest-kill-tokens-dash-uex3",
		killServer:
			"https://tenantname-op.anycast.nagra.com/TENANTNAME/ssm/v1/sessions/killAccountSessions",
	},
	"hls-fps-heartbeat-kill-stream": {
		manifest:
			"https://replacemewithyourown.com/vod/hls6/scramble/elephants_dream_24fps_fmp4_fps_scramble/master-ssp.m3u8",
		mimeType: "application/x-mpegURL",
		tokenPool: "autotest-kill-tokens-hls-uex3",
		killServer:
			"https://tenantname-op.anycast.nagra.com/TENANTNAME/ssm/v1/sessions/killAccountSessions",
	},
};

const MAX_TOKEN_RETRIES = 3;
const TOKEN_RETRY_PERIOD = 30000;

const TokenPoolServer = "https://replacemewithyourown.com/resource-pool/";

async function requestTokenDetails(pool) {
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (this.readyState !== XMLHttpRequest.DONE) {
			return;
		}
		console.log("status: " + this.status);
		console.log("response: " + this.responseText);
	};
	const url = TokenPoolServer + pool;
	console.log("About to GET " + url);
	xhr.open("GET", url, true);
	xhr.setRequestHeader("Content-Type", "application/json");
	return new Promise(function (resolve, reject) {
		xhr.send();

		xhr.onload = function (e) {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let response = xhr.responseText;
					let ret = JSON.parse(response);
					resolve(ret);
				} else {
					console.error(
						" error status text from server:" + xhr.statusText
					);
				}
			}
		}; //end of xhr.onload
		xhr.onerror = function (e) {
			console.error("error status text from server:" + xhr.statusText);
			reject(xhr.statusText);
		}; //end of xhr.onerror
	});
}

async function getTokenDetails(pool) {
	let retryCount = MAX_TOKEN_RETRIES;
	while (true) {
		try {
			return await requestTokenDetails(pool);
		} catch (e) {
			if (e === ERR_NO_TOKENS && retryCount) {
				console.log(
					"No Token available right now. Wait a while and try again"
				);
				await sleepInMs(TOKEN_RETRY_PERIOD);
				retryCount--;
			} else {
				console.error("failed to get token details: " + e);
			}
		}
	}
}

export async function releaseToken(pool, account) {
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (this.readyState !== XMLHttpRequest.DONE) {
			return;
		}
		console.log("status: " + this.status);
		console.log("response: " + this.responseText);
	};
	const poolUrl = TokenPoolServer + pool + "/" + account;
	const data = "{}";
	console.log("About to DELETE token at " + poolUrl);
	xhr.open("DELETE", poolUrl, true);
	xhr.setRequestHeader("Content-Type", "application/json");
	return new Promise(function (resolve, reject) {
		xhr.send(data);

		xhr.onload = function (e) {
			if (xhr.readyState === 4) {
				console.info(
					`ssmHelper: ${xhr.status} status code with ${xhr.statusText} from server`
				);
				resolve(true);
			}
		};

		xhr.onerror = function (e) {
			console.error("error status text from server:" + xhr.statusText);
			reject(false);
		};
	});
}

export async function killSession(server, token, accountId) {
	const data = `{"accountId":"${accountId}"}`;

	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (this.readyState !== XMLHttpRequest.DONE) {
			return;
		}
		console.log("status: " + this.status);
		console.log("response: " + this.responseText);
	};
	const url = server;
	console.log("About to send accountId data: " + data);
	xhr.open("PUT", url, true);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("nv-authorizations", token);
	xhr.send(data);
}

export async function getKillStream(streamName) {
	if (!killStreams[streamName]) {
		return null;
	}

	console.log(
		"attempting to get token from pool: " +
			TokenPoolServer +
			killStreams[streamName].tokenPool
	);
	let tokenDetails = await getTokenDetails(killStreams[streamName].tokenPool);

	let stringToken = JSON.parse(tokenDetails.resource);

	let streamDetails = {
		accountId: stringToken.accountId,
		killToken: stringToken.killToken,
		contentToken: stringToken.contentToken,
		killServer: killStreams[streamName].killServer,
		killPool: killStreams[streamName].tokenPool,
		manifest: killStreams[streamName].manifest,
		mimeType: killStreams[streamName].mimeType,
	};
	return streamDetails;
}
