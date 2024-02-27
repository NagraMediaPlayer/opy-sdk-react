// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import {
	showTestsResults,
	recordExceptionFailure,
	setTestExecutionTagConfig,
} from "@nagra/kwuo";
import { renderComponent } from "./utils/render";
import { Platform } from "react-native";

import { createTextComponent } from "./utils/textComponent";
import { testsCompleted } from "./utils/automationSupport";
import { postTestResults, postLogs } from "./utils/testResults";
import { captureConsoleLogs } from "./utils/logging";
import { getTestTagConfig } from "./utils/tagging";

import { isRunningInSafariBrowser } from "./utils/platformVariations";

// The test suites
import { executeNonPlaybackTests } from "./testSteps/miscellaneous/misc.test";
import { executeEventsTestsForContent } from "./testSteps/events/whenClearStream/whenClearStream";
import { executeEventsTestsWhenPlayedOnIosSimulator } from "./testSteps/events/whenClearStream/played/simulatorEvents.js";

import { executeThumbnailsTests } from "./testSteps/events/whenClearStream/played/thumbnails.test";
import { executeSSMTests } from "./testSteps/events/whenScrambledStream/ssm.test";
import { executeStatisticsTests } from "./testSteps/events/whenClearStream/played/statistics.test";
import { executePropertyTestsForContent } from "./testSteps/properties/propertiesTest";
import { executeTrackSelectionTests } from "./testSteps/events/trackSelection.test";
import { executeLongPlayTests } from "./testSteps/robustness/longPlay.test";
import { executePlayZapTests } from "./testSteps/robustness/playPauseSeekZap.test";
import { executePlayerSDKConfigTests } from "./testSteps/properties/licenseCallback";
// end of the tests suites

let endedComponent = createTextComponent("Auto-test is Complete");
let otvPlayer;

(async () => {
	captureConsoleLogs();

	// Register the tags for this test execution as requested by
	// the test automation config injected parameters.
	let theConfiguredTags = await getTestTagConfig();
	console.info(
		`Executing tests with the following test tag config:\n${JSON.stringify(
			theConfiguredTags
		)}`
	);

	if (
		Platform.OS === "web" &&
		window &&
		window.navigator &&
		window.navigator.userAgent
	) {
		console.info(
			`Executing tests with the following userAgent string:\n${window.navigator.userAgent}`
		);
	}

	await setTestExecutionTagConfig(theConfiguredTags);

	// Call each of the test suites in turn

	try {
		await executeNonPlaybackTests(otvPlayer);

		/*
		 ** Call executePlayerSDKConfigTests to make sure that the multiSession
		 ** configuration is getting applied in the OTVPlayer singleton object
		 **  which is being created here in the CAT launch using below playback test.
		 */
		await executePlayerSDKConfigTests(otvPlayer);

		await executeEventsTestsForContent(
			otvPlayer,
			isRunningInSafariBrowser() ? "HLS LIVE Clear" : "LIVE Clear"
		);
		await executeEventsTestsForContent(
			otvPlayer,
			isRunningInSafariBrowser() ? "HLS VOD Encrypted" : "VOD Encrypted"
		);

		await executePropertyTestsForContent(
			otvPlayer,
			isRunningInSafariBrowser() ? "HLS VOD Encrypted" : "VOD Encrypted"
		);

		await executeEventsTestsWhenPlayedOnIosSimulator(
			otvPlayer,
			"VOD Clear"
		);

		// Feature specific tests
		await executeThumbnailsTests(
			otvPlayer,
			isRunningInSafariBrowser()
				? "HLS ThumbNail Content"
				: "ThumbNail Content"
		);
		await executeStatisticsTests(otvPlayer);

		// SSM & VOD Clear event tests are at medium priority to ensure minimum
		// only executed on code commit
		let eventTestPriority = "@medium_priority";
		await executeEventsTestsForContent(
			otvPlayer,
			isRunningInSafariBrowser() ? "HLS VOD Clear" : "VOD Clear",
			eventTestPriority
		);
		await executeSSMTests(otvPlayer, eventTestPriority);

		await executeTrackSelectionTests(
			otvPlayer,
			isRunningInSafariBrowser()
				? "HLS Multi Track Content"
				: "Multi Track Content"
		);

		// Robustness tests
		await executeLongPlayTests(
			otvPlayer,
			isRunningInSafariBrowser() ? "HLS VOD Long Play" : "VOD Long Play",
			"@vod"
		);
		await executeLongPlayTests(
			otvPlayer,
			isRunningInSafariBrowser() ? "HLS LIVE Clear" : "LIVE Clear",
			"@live"
		);
		await executePlayZapTests(
			otvPlayer,
			isRunningInSafariBrowser() ? "HLS VOD Encrypted" : "VOD Encrypted",
			isRunningInSafariBrowser() ? "HLS VOD Long Play" : "VOD Long Play"
		);
	} catch (overallException) {
		recordExceptionFailure(overallException);
	}

	// When done, mark it so
	await renderComponent(endedComponent);

	// Collate and publish the logs and results
	showTestsResults();

	postLogs(console.everything);
	postTestResults();

	await testsCompleted();
})();
