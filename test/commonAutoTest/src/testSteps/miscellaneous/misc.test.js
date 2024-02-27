// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
let testPackage = require("@nagra/react-otvplayer/package.json");
import { OTVSDK, OTVSDK_LOGLEVEL } from "@nagra/react-otvplayer";
import {
	describe,
	it,
	expect,
	beforeEach,
	afterEach,
	beforeAll,
	afterAll,
} from "@nagra/kwuo";
import { renderComponent } from "../../utils/render";
import { createTextComponent } from "../../utils/textComponent";
import { isRunningOnAndroid } from "../../utils/platformVariations";

const SET_TAGS = "@high_priority @misc";

export async function executeNonPlaybackTests(otvPlayer) {
	let details = "Auto-test: About to start non playback tests.\n";
	details += "On Web we concluded this was not necessary, however Android ";
	details += "Medium priority tests are scuppered without it.";
	let beforeAllComponent = createTextComponent(details);
	await renderComponent(beforeAllComponent);

	console.info(`Kickoff for test of version ${testPackage.version}`);

	await describe("Miscellaneous non-playback tests", async () => {
		beforeAll(async () => {
			console.log(
				"Before ALL: due to a chicken/egg bug this can't be reached"
			);
		});

		beforeEach(async () => {});

		afterEach(async (thisTestDetails) => {
			let afterEachComponent = createTextComponent(thisTestDetails);

			await renderComponent(afterEachComponent);
		});

		afterAll(async () => {});

		await it(
			"verifies the plugin version can be obtained",
			`${SET_TAGS} @versionAPI`,
			async () => {
				let reportedVersion = await OTVSDK.getVersion();
				expect(reportedVersion.otvPlayerVersion).toBe(
					testPackage.version
				);
			}
		);

		await it(
			"verifies the native player SDK version can be obtained",
			`${SET_TAGS} @versionAPI`,
			async () => {
				let reportedVersion = await OTVSDK.getVersion();

				expect(reportedVersion.sdkVersion).not.toBeEmpty();

				let versionNumberParts = reportedVersion.sdkVersion.split(".");
				if (isRunningOnAndroid()) {
					expect(versionNumberParts.length).toBe(5); // Includes variant suffix, e.g. noprmProduction
				} else {
					expect(versionNumberParts.length).toBe(4);
				}

				const exampleVersion = "5.13.0.1661847823";
				expect(versionNumberParts[3].length).toBe(
					exampleVersion.split(".")[3].length
				);
			}
		);
	});

	console.info(`End test of version ${testPackage.version}`);
}
