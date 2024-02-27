// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
const path = require("path");
const modules = path.join(process.cwd(), "/node_modules");
const winston = require(`${modules}/winston`);
const webdriver = require(`${modules}/selenium-webdriver`);
const chrome = require(`${modules}/selenium-webdriver/chrome`);
const safari = require(`${modules}/selenium-webdriver/safari`);
const edge = require(`${modules}/selenium-webdriver/edge`);
const firefox = require(`${modules}/selenium-webdriver/firefox`);

const chromeDriverPath = require(`${modules}/chromedriver`).path;
const edgeChromiumDriverPath =
	process.platform !== "linux" ? require(`${modules}/msedgedriver`).path : "";

const getBrowser = require("./browserUtil").getBrowser;

const logger = require("./logger").getLogger();

// keep a global cache of the created driver
let driver = null;

const buildChromeDriver = (browserName, localBrowser) => {
	const options = new chrome.Options();
	options.setChromeBinaryPath(localBrowser.path);
	options.excludeSwitches("disable-component-update");

	// Enables collection of console logs from browser
	options.setLoggingPrefs({ browser: "DEBUG" });
	// TODO get this working
	if (browserName.includes("headless")) {
		options.addArguments("--headless");
		options.addArguments("--window-size=1440,900");
	} else {
		options.addArguments("--kiosk");
	}

	//android chrome launch
	if (browserName.includes("handheld")) {
		options.androidChrome();
	}
	options.addArguments("--start-maximized");
	options.addArguments("--allow-running-insecure-content");
	options.addArguments("--ignore-certificate-errors");
	// The follow may be necessary for HTTPS unless CORS is set properly on the agents.
	// Interestingly we found it's not necessary for HTTP cases.... -- I don't quite understand this yet.
	options.addArguments("--disable-web-security");

	let driverPath = chromeDriverPath;
	if (browserName === "edgechromium") {
		driverPath = edgeChromiumDriverPath;
	}

	let chromeDriver = new webdriver.Builder()
		.withCapabilities({
			browserName: "chrome",
			acceptInsecureCerts: true,
		})
		.setChromeService(new chrome.ServiceBuilder(driverPath))
		.setChromeOptions(options)
		.build();

	return chromeDriver;
};

const buildEdgeChromiumDriver = (browserName, localBrowser) => {
	const options = new edge.Options();
	options.setBinaryPath(localBrowser.path);
	options.excludeSwitches("disable-component-update");

	// Enables collection of console logs from browser
	options.setLoggingPrefs({ browser: "DEBUG" });

	if (browserName.includes("headless")) {
		options.addArguments("--headless");
		options.addArguments("--window-size=1440,900");
	} else {
		options.addArguments("--kiosk");
	}

	options.addArguments("--start-maximized");
	options.addArguments("--allow-running-insecure-content");
	options.addArguments("--ignore-certificate-errors");
	// The follow may be necessary for HTTPS unless CORS is set properly on the agents.
	// Interestingly we found it's not necessary for HTTP cases.... -- I don't quite understand this yet.
	options.addArguments("--disable-web-security");

	var service = new edge.ServiceBuilder(edgeChromiumDriverPath).build();
	let driver = edge.Driver.createSession(options, service);

	return driver;
};

const buildFirefoxDriver = (browserName, localBrowser) => {
	let firefoxOptions = new firefox.Options();
	if (browserName.includes("headless")) {
		firefoxOptions = new firefox.Options().headless();
	}

	firefoxOptions.setBinary(localBrowser.path);
	firefoxOptions.setPreference("browser.cache.disk.enable", false);
	firefoxOptions.setPreference("browser.cache.memory.enable", false);
	firefoxOptions.setPreference("browser.cache.offline.enable", false);
	firefoxOptions.setPreference("network.http.use-cache", false);
	firefoxOptions.setPreference(
		"security.fileuri.strict_origin_policy",
		false
	);

	const firefoxDriver = new webdriver.Builder()
		.withCapabilities({ browserName: "firefox" })
		.setFirefoxOptions(firefoxOptions)
		.build();

	// Start in fullscreen to gain focus on macOS so that the step
	// "user clicks on full screen" actually goes fullscreen
	firefoxDriver.manage().window().fullscreen();
	return firefoxDriver;
};

const buildSafariDriver = (browserName) => {
	let safariOptions = new safari.Options();
	safariOptions.setTechnologyPreview(false);

	let platformName = "macOS";
	if (browserName.includes("handheld")) {
		platformName = "iOS";
	}

	let safariDriver = new webdriver.Builder()
		.forBrowser("safari")
		.withCapabilities({ browserName: "safari", platformName: platformName })
		.setSafariOptions(safariOptions)
		.build();
	safariDriver.manage().window().maximize();
	return safariDriver;
};

const buildEdgeDriver = () => {
	return new webdriver.Builder()
		.forBrowser("MicrosoftEdge")
		.setEdgeService(new edge.ServiceBuilder())
		.build();
};

const createDriver = {
	firefox: buildFirefoxDriver,
	firefoxheadless: buildFirefoxDriver,
	edgechromium: buildEdgeChromiumDriver,
	edgechromiumheadless: buildEdgeChromiumDriver,
	chrome: buildChromeDriver,
	chromeheadless: buildChromeDriver,
	edge: buildEdgeDriver,
	safari: buildSafariDriver,
	safarihandheld: buildSafariDriver,
	chromehandheld: buildChromeDriver,
};

const createBrowserDriver = async (browser) => {
	if (!driver) {
		if (
			[
				"chrome",
				"chromeheadless",
				"firefox",
				"firefoxheadless",
				"edgechromium",
				"edgechromiumheadless",
				"chromehandheld",
			].includes(browser.name)
		) {
			const localBrowser = await getBrowser(
				browser.name,
				browser.channel
			);
			driver = createDriver[browser.name](browser.name, localBrowser);
		} else {
			driver = createDriver[browser.name](browser.name);
		}
	}

	return driver;
};

module.exports.createBrowserDriver = createBrowserDriver;
