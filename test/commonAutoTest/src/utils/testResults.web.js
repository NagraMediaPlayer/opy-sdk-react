// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { getJunitXml } from "@nagra/kwuo";

let parseURLQueryParams = () => {
	let urlConfig = {};
	if (window && window.location) {
		const search = decodeURI(window.location.search.substring(1));
		urlConfig.url = window.location.pathname;

		// Strip any trailing slash
		const stripped =
			search.substr(-1) === "/"
				? search.substr(0, search.length - 1)
				: search;
		const vars = stripped.split("&");
		for (const v of vars) {
			const pair = v.split("=");
			urlConfig[pair[0]] = pair[1];
			if (pair[1] !== undefined) {
				if ("true" === pair[1].toLowerCase()) {
					urlConfig[pair[0]] = true;
				} else if ("false" === pair[1].toLowerCase()) {
					urlConfig[pair[0]] = false;
				}
			}
		}
	}

	return urlConfig;
};

export function postTestResults() {
	let testConfig = parseURLQueryParams();
	let xmlResults = getJunitXml(testConfig);
	if (testConfig) {
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
}

export function postLogs(logs, complete = true) {
	let testConfig = parseURLQueryParams();

	function onreadystatechange() {
		if (this.readyState !== XMLHttpRequest.DONE) {
			return;
		}
		console.log("status: " + this.status);
		console.log("response: " + this.responseText);
	}

	if (testConfig) {
		const url = testConfig.resultsServerAddress + "/logs";
		console.log("About to POST to " + url);

		const LIMIT = 750 * 1024;
		let remaining = logs.length;
		let currentIndex = 0;

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
	}
}
