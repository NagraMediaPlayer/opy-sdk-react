// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
export async function sleepInMs(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function testsCompleted() {
	if (window.location.origin.indexOf("localhost") === -1) {
		await sleepInMs(120000);

		window.history.go(-1);
	}
	return false;
}
