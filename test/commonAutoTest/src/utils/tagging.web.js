// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
const parseURLQueryParams = () => {
	var urlConfig = {};
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

export async function getTestTagConfig() {
	let theConfig = { incl: [], excl: [] };

	const urlArgs = parseURLQueryParams();

	if (urlArgs.tags) {
		const splitMajorGroups = urlArgs.tags
			.replace(/\"/g, "")
			.replace(/%40/g, "@")
			.split("and not");

		const positiveSet = splitMajorGroups[0]
			.replace(/\(/g, "")
			.replace(/\)/g, "")
			.replace(/ and /g, " ")
			.replace(/  /g, " ")
			.trim();

		const negativeSet = splitMajorGroups[1]
			? splitMajorGroups[1]
					.replace(/\(/g, "")
					.replace(/\)/g, "")
					.replace(/ or /g, " ")
					.replace(/  /g, " ")
					.trim()
			: "";

		const positiveList = positiveSet.split(" ");
		const negativeList = negativeSet.split(" ");

		theConfig.incl = positiveList;
		theConfig.excl = negativeList;
	}

	return theConfig;
}

export async function getZapConfig() {
	const urlArgs = parseURLQueryParams();

	if (urlArgs.zapCount) {
		return urlArgs.zapCount;
	} else {
		return 10;
	}
}
