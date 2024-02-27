// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
let appPKG = require("@nagra/react-otvplayer/package.json");

import { executeVolumeControlTests } from "./mute_volume.test";
import { executeAutoPlayTests } from "./autoplay";
import { executeSourcePropertiesTests } from "./source";
import { executeLicenseRequestCallbackTests } from "./licenseCallback";

import {
	isRunningOnAndroid,
	isRunningOniOS,
} from "../../utils/platformVariations";

export async function executePropertyTestsForContent(otvPlayer, streamName) {
	if (isRunningOnAndroid() || isRunningOniOS()) {
		await executeVolumeControlTests(otvPlayer, streamName);
	}
	await executeAutoPlayTests(otvPlayer, streamName);
	await executeSourcePropertiesTests(otvPlayer);
	await executeLicenseRequestCallbackTests(otvPlayer);
}
