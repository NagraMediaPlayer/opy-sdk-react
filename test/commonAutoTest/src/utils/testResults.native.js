// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { getJunitXml } from "@nagra/kwuo";
import config from "./config";

export function postTestResults() {
	let testConfig = {
		resultsServerAddress: config.resultsService,
		deviceId: config.platform,
	};

	let xmlResults = getJunitXml(testConfig);

	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (this.readyState !== XMLHttpRequest.DONE) {
			return;
		}
		console.log("status: " + this.status);
		console.log("response: " + this.responseText);
	};
	const url = testConfig.resultsServerAddress + "/xmlTestResults";
	console.log("About to POST to " + url);
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-Type", "application/xml");
	xhr.setRequestHeader("x-result", JSON.stringify({ complete: true }));
	xhr.send(xmlResults);
}

export function postLogs(logs, complete = true) {
	let testConfig = {
		resultsServerAddress: config.resultsService,
		deviceId: config.platform,
	};

	function onreadystatechange() {
		if (this.readyState !== XMLHttpRequest.DONE) {
			return;
		}
		console.log("status: " + this.status);
		console.log("response: " + this.responseText);
	}
	const url = testConfig.resultsServerAddress + "/logs";
	console.log("About to POST to " + url);

	const LIMIT = 750 * 1024;
	let remaining = logs.length;
	let currentIndex = 0;

	try {
		while (remaining > 0) {
			let thisChunkLength = Math.min(remaining, LIMIT);
			let actuallyComplete = complete && remaining <= LIMIT;

			let xhr = new XMLHttpRequest();
			xhr.onreadystatechange = onreadystatechange;
			xhr.open("POST", url, true);
			xhr.setRequestHeader("Content-Type", "text/plain");
			xhr.setRequestHeader(
				"x-result",
				JSON.stringify({ complete: actuallyComplete })
			);
			xhr.send(
				logs.substring(currentIndex, currentIndex + thisChunkLength)
			);

			remaining -= thisChunkLength;
			currentIndex += thisChunkLength;
		}
	} catch (logsException) {
		// Best effort for logs, but must report the results.
	}
}
