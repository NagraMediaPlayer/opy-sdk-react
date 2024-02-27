// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
"use strict";

const path = require("path");
const modules = path.join(process.cwd(), "/node_modules");
const moduleTestRootPath = path.resolve(__dirname + "/../../../");
console.log(moduleTestRootPath);

const localhostAddr = require("../support/localhostAddr").address;
const resultsService = require("../support/localhostAddr").resultsService;
const tags = require("../support/localhostAddr").tags;
const BROWSER_NAME = require("../support/config").browser;
const PLATFORM_NAME = require("../support/config").platform;

const { After, Before, AfterAll, Status } = require(`${modules}/cucumber`);
const logger = require("../support/logger").getLogger();
const createBrowserDriver =
	require("../support/webdriverUtil").createBrowserDriver;

// Need longer timeout to cope with firefox's installing components to play DRM content
const asyncScriptTimeoutInMs = 120000;

var driver = null;

const loadTestPage = async (world, tag) => {
	let path = process.cwd();
	let currentPath = path.substring(path.lastIndexOf("/") + 1);
	currentPath += "/web";

	const testPage = {
		default: currentPath,
	};

	driver = world.driver;
	let testTargetURL = `${localhostAddr}`;
	if (!localhostAddr.includes("localhost")) {
		testTargetURL += `${testPage[tag]}`;
	}

	testTargetURL += `?resultsServerAddress=${resultsService}`;
	testTargetURL += `&deviceId=${PLATFORM_NAME}_${BROWSER_NAME}`;
	testTargetURL += `&tags=${tags}`;

	try {
		logger.debug(`loadTestPage - ${testTargetURL}`);
		await world.driver.get(testTargetURL);

		logger.debug(`loadTestPage - test page ${testTargetURL} loaded`);
	} catch (err) {
		throw new Error(
			`loadTestPage - Failed in loading test page ${testTargetURL}, reason = ${err}`
		);
	}
};

const setupWorld = async (world) => {
	if (!world.ready) {
		if (driver) {
			world.driver = driver;
		} else {
			logger.debug(`hooks - setupWorld()
				- browserOptions : ${JSON.stringify(world.browserOptions)}`);
			world.driver = await createBrowserDriver(world.browserOptions);
		}

		world.ready = true;
	}
};

const prepareTest = async (world, tag) => {
	await setupWorld(world);
	await world.driver.manage().setTimeouts({
		script: asyncScriptTimeoutInMs,
	});
	await loadTestPage(world, tag);
};

Before({ timeout: 18000000 }, async function () {
	try {
		await prepareTest(this, "default");
	} catch (err) {
		throw new Error(`Loading player failed, reason = ${err}`);
	}
});

After(async function (scenario) {
	const wrld = this;
	if (scenario.result.status === Status.FAILED) {
		var filePath = path.join(
			__dirname,
			"..",
			"..",
			"..",
			"moduleTest",
			"testResults",
			BROWSER_NAME + "_" + scenario.pickle.name + ".png"
		);

		//Saving the screenshot directly fails for some reason to do with base64 encoding i think
		//but a workaround of saving the png and then reload it to attach to the scenario
		// TODO hidden for now
		// await this.page.browser.takeScreenshot().then((data) => {
		// 	fs.writeFileSync(filePath, data, "base64");
		// 	const file = fs.readFileSync(filePath);
		// 	wrld.attach(file, "image/png");
		// });
	}

	try {
		await this.driver.get(`${localhostAddr}moduleTestDevice/between.html`);
	} catch (err) {
		// We do not really care if it has not loaded the page in between tests
	}
});

AfterAll(async function () {
	if (driver) {
		await driver.quit();
		driver = null;
		logger.debug("webdriver quit");
	}
});
