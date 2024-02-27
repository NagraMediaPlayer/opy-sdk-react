// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
export async function testsCompleted() {
	// do nothing
}

export async function sleepInMs(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
