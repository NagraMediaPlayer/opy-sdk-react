// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
export function isEmpty(value) {
	console.info(`Expected "${JSON.stringify(value)}" toBe Empty`);

	return Object.keys(value).length === 0;
}
