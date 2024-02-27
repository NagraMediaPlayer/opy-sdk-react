// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import config from "./config";

export async function getTestTagConfig() {
	let theConfig = { incl: [], excl: [] };

	if (config.tags) {
		console.log(`Got this config: ${config.tags}`);
		let splitMajorGroups = config.tags.replace(/\"/g, "").split("and not");
		let positiveSet = splitMajorGroups[0]
			.replace(/\(/g, "")
			.replace(/\)/g, "")
			.replace(/ and /g, " ")
			.replace(/  /g, " ")
			.trim();
		let negativeSet = splitMajorGroups[1]
			? splitMajorGroups[1]
					.replace(/\(/g, "")
					.replace(/\)/g, "")
					.replace(/ or /g, " ")
					.replace(/  /g, " ")
					.trim()
			: "";

		let positiveList = positiveSet.split(" ");
		let negativeList = negativeSet.split(" ");

		theConfig.incl = positiveList;
		theConfig.excl = negativeList;
	}
	return theConfig;
}

export async function getZapConfig() {
	if (config.zapCount) {
		return config.zapCount;
	} else {
		return 10;
	}
}
