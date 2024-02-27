// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/* global document, setTimeout */
/* eslint-env node */
"use strict";
const path = require("path");
const modules = path.join(process.cwd(), "/node_modules");
const { Given, When, Then } = require(`${modules}/cucumber`);
const { assert } = require(`${modules}/chai`);
const sleepInMs = require("../support/util").sleepInMs;

const BROWSER_NAME = require("../support/config").browser;
const PLATFORM_NAME = require("../support/config").platform;
const testResultsServerAddress =
	require("../support/localhostAddr").resultsService;
const expiryInHours = require("../support/localhostAddr").expiry;
const waitForTestResults = require("../../resultsService").waitForTestResults;

const THIRTY = 30;
const FIVE = 5;
const SIX = 6;
const TEN = 10;
const MS_IN_SEC = 1000;
const TEN_SECS = TEN * MS_IN_SEC;
const SIXTY_SECS = SIX * TEN_SECS;
const timeoutMins = Math.round(expiryInHours * SIX * TEN);
const cucumberTimeoutMS = Math.round((timeoutMins + FIVE) * SIXTY_SECS);

Given(/^the version under test$/, async function () {
	// Do nothing
});

async function expectFieldHasText(world, fieldName, expectedText, timeoutMins) {
	const browserGetField = function (fieldName) {
		let returnValue;
		let elList = document.getElementsByTagName(fieldName);

		for (element of elList) {
			if (element.innerText !== "") {
				returnValue = element.innerText;
				break;
			}
		}

		return returnValue;
	};

	let actualText;
	let result = false;
	let count = 0;
	let timeoutExpired = false;

	const sleepPeriodMs = THIRTY * MS_IN_SEC;
	const maxIterations =
		Math.round((timeoutMins * SIXTY_SECS) / sleepPeriodMs) || 1;

	console.log(
		`About to wait for '${expectedText}' for up to ${timeoutMins}min`
	);
	do {
		await sleepInMs(sleepPeriodMs);
		actualText = await world.executeScript(browserGetField, fieldName);
		result = expectedText === actualText;

		console.log(
			`Waited for ${
				(count * sleepPeriodMs) / MS_IN_SEC
			} seconds ${actualText}`
		);
		timeoutExpired = ++count > maxIterations;
	} while (!result && !timeoutExpired);

	return actualText;
}

When(
	/^we execute the tests$/,
	{ timeout: cucumberTimeoutMS },
	async function () {
		console.info(`This step will wait for ${cucumberTimeoutMS}ms`);
		let actualResult = await expectFieldHasText(
			this.driver,
			"div",
			"Auto-test is Complete",
			timeoutMins
		);

		assert.ok(result, `Expecting <div> "${actualResult}" to be not empty`);
	}
);

Then(/^we get an xml file of the result$/, async function () {
	await waitForTestResults(testResultsServerAddress, BROWSER_NAME);
});
