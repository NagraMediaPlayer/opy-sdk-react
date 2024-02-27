// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
const path = require("path");
const modules = path.join(process.cwd(), "/node_modules");
const fetch = require(`${modules}/node-fetch`);
const htmlparser = require(`${modules}/htmlparser2`);
const semver = require(`${modules}/semver`);
const papa = require(`${modules}/papaparse`);
const util = require("util");
const execWithPromise = util.promisify(require("child_process").exec);
const logger = require("../support/logger").getLogger();

let chromeStableReleaseInfo = {};

let firefoxStableReleaseInfo = null;
let edgeChromiumStableReleaseInfo = null;

const getChromeStableReleaseVersion = async (os) => {
	const resp = await fetch(
		`https://chromiumdash.appspot.com/fetch_releases?channel=Stable&platform=${os}&num=1&offset=0`
	);
	const content = await resp.json();
	console.log(
		`content of Chrome version query => ${JSON.stringify(content, null, 2)}`
	);

	const latestStableRelease = semver.coerce(content[0].version);

	console.info(`Detected Chrome stable release: ${latestStableRelease}`);
	return latestStableRelease;
};

const getEdgeChromiumStableReleaseVersion = async () => {
	const resp = await fetch(
		"https://msedgedriver.azureedge.net/LATEST_STABLE"
	);
	const content = await resp.text();

	// Strip bad characters before and between the digits
	const version = content.replace(/[^0-9\.]/g, "");
	const info = semver.coerce(version);
	// semver.coerce drops the 4th version component, but we'll
	// need it if we want to download that specific version
	// driver, so add an 'originalVersion' property
	info.originalVersion = version;
	console.log(`content of chromium edge version file => v${version}`);
	return info;
};

const getFirefoxStableReleaseVersion = async () => {
	let firefoxVersions = [];

	const parseFirefoxVersion = (versionStr) => {
		const re = /\.\.\/(\d+\.\d+(\.\d+)?(\.\d+)?)\/.*/;
		const matched = versionStr.match(re);
		const version = semver.coerce(matched[1]);
		return version;
	};

	const firefoxReleasePageParser = new htmlparser.Parser({
		onopentag: (name, attr) => {
			// look for <a href="../59.0/releasenotes/">59.0</a> to extract version info
			if (
				name === "a" &&
				attr.href &&
				attr.href.includes("..") &&
				attr.href.includes("releasenotes")
			) {
				const version = parseFirefoxVersion(attr.href);
				firefoxVersions.push(version);
			}
		},
	});

	const resp = await fetch("https://www.mozilla.org/en-US/firefox/releases/");
	const content = await resp.text();
	firefoxReleasePageParser.write(content);
	firefoxReleasePageParser.end();
	const latestStableRelease = firefoxVersions.sort(semver.rcompare)[0];
	return latestStableRelease;
};

const detectWinBrowsers = async (browser) => {
	const detect = require(`${modules}/@nagra/win-detect-browsers`);
	const detectPromise = util.promisify(detect);
	browser = browser.replace("headless", "");
	browser = browser.replace("handheld", "");
	try {
		// util.promisify detect to get result through error callback....
		await detectPromise([browser], {});
	} catch (browsers) {
		browsers.map((b) =>
			logger.debug(
				`detectWinBrowsers - ${browser}, ${b.version}, ${b.path}`
			)
		);
		return browsers;
	}
};

async function findAndroidPackageVersion(packageName) {
	const adbCommand = `adb shell dumpsys package ${packageName}`;

	const { stdout, stderr } = await execWithPromise(adbCommand).catch(
		(err) => {
			console.error("Error running sdb devices: " + err);
			throw err;
		}
	);

	var start = 0;
	// Go through stdout line by line

	const versionText = "versionName";
	while (start < stdout.length) {
		const indexOfNewLine = stdout.indexOf("\n", start);
		const line = stdout.substr(start, indexOfNewLine - start);
		const indexOfDeviceText = line.indexOf(versionText);
		if (indexOfDeviceText > 0) {
			// Grab the name from the end of the line
			let stringTokenArray = line.split("=");

			const versionNumber =
				stringTokenArray[stringTokenArray.length - 1].trim();
			console.log(`${packageName} found versionNumber: ${versionNumber}`);

			return versionNumber;
		}

		start = indexOfNewLine + 1;
	}
	console.log("failed to find a real versionName");
	return null;
}

const detectHandheldBrowsers = async (browser) => {
	let browsers = [];
	const browserPackageDetails = {
		chromehandheld: "com.android.chrome",
	};
	const browserName = {
		chromehandheld: "Google Chrome",
	};

	let bundleCache = {};

	// find Application path(s)
	const find = async (id) => {
		if (bundleCache[id]) {
			return bundleCache[id];
		}

		let version = await findAndroidPackageVersion(
			browserPackageDetails[id]
		);
		bundleCache[id] = version;

		logger.debug(
			`detectHandheldBrowsers: found ${JSON.stringify(bundleCache[id])}`
		);
		return bundleCache[id];
	};

	const version = await find(browser);
	const b = {
		name: browserName[browser],
		version: version,
		path: browserPackageDetails[browser],
	};

	browsers.push(b);

	return browsers;
};

const detectLinuxBrowsers = async (browser) => {
	let browsers = [];
	const browserPathDetails = {
		chrome: "/usr/bin/google-chrome",
		chromeheadless: "/usr/bin/google-chrome",
		firefoxheadless: "/usr/bin/firefox",
		firefox: "/usr/bin/firefox",
		chromehandheld: "/usr/bin/google-chrome",
	};
	const browserName = {
		chrome: "Google Chrome",
		chromeheadless: "Google Chrome",
		firefox: "Mozilla Firefox",
		firefoxheadless: "Mozilla Firefox",
		chromehandheld: "Google Chrome",
	};

	let bundleCache = {};
	const execSync = require("child_process").execSync;
	const os = require("os");

	// find Application path(s)
	const find = (id) => {
		if (bundleCache[id]) {
			return bundleCache[id];
		}

		const pathQuery = `${browserPathDetails[id]} --version`;
		bundleCache[id] = execSync(pathQuery)
			.toString()
			.split(os.EOL)
			.filter((o) => o.length > 0);

		logger.debug(`detectLinuxBrowsers: found ${bundleCache[id]}`);
		return bundleCache[id];
	};

	const applications = find(browser);
	for (const app of applications) {
		const version = app.replace(browserName[browser], "").trim();
		const b = {
			name: browserName[browser],
			version: version,
			path: browserPathDetails[browser],
		};

		browsers.push(b);
	}

	return browsers;
};

const detectMacBrowsers = async (browser) => {
	const browserApplicationBundle = {
		edgechromium: "com.microsoft.edgemac",
		edgechromiumheadless: "com.microsoft.edgemac",
		chrome: "com.google.Chrome",
		chromeheadless: "com.google.Chrome",
		firefox: "org.mozilla.firefox",
		firefoxheadless: "org.mozilla.firefox",
		chromehandheld: "com.google.Chrome",
	};

	const browserApplicationVersionKey = {
		edgechromium: "CFBundleShortVersionString",
		edgechromiumheadless: "CFBundleShortVersionString",
		chrome: "KSVersion",
		chromeheadless: "KSVersion",
		firefox: "CFBundleShortVersionString",
		firefoxheadless: "CFBundleShortVersionString",
		chromehandheld: "KSVersion",
	};

	let browsers = [];

	// the following is inspired by https://github.com/james-proxy/james-browser-launcher/blob/master/lib/darwin/index.js
	const execSync = require("child_process").execSync;
	const fs = require("fs");
	const path = require("path");
	const plist = require(`${modules}/plist`);
	const os = require("os");

	let bundleCache = {};
	let infoCache = {};

	// find Application path(s)
	const find = (id) => {
		if (bundleCache[id]) {
			return bundleCache[id];
		}

		const pathQuery = `mdfind kMDItemCFBundleIdentifier==${id}`;
		bundleCache[id] = execSync(pathQuery)
			.toString()
			.split(os.EOL)
			.filter((o) => o.length > 0);
		return bundleCache[id];
	};

	// parse plist info
	const parse = (file) => {
		if (infoCache[file]) {
			return infoCache[file];
		}

		if (!fs.existsSync(file)) {
			throw new Error(`cannot parse non-existant plist: ${file}`);
		}

		const content = fs.readFileSync(file, {
			encoding: "utf8",
		});

		const plistInfo = plist.parse(content);
		infoCache[file] = plistInfo;
		return infoCache[file];
	};

	const getInfoPath = (p) => {
		return path.join(p, "Contents", "Info.plist");
	};

	const applications = find(browserApplicationBundle[browser]);
	for (const app of applications) {
		const b = {
			version: parse(getInfoPath(app))[
				browserApplicationVersionKey[browser]
			],
			path: app,
		};
		browsers.push(b);
	}

	for (const b of browsers) {
		if (browser.includes("chrome")) {
			b.path += "/Contents/MacOS/Google Chrome";
		}
		if (browser.includes("edgechromium")) {
			b.path += "/Contents/MacOS/Microsoft Edge";
		}

		if (browser.includes("firefox")) {
			b.path += "/Contents/MacOS/firefox";
		}

		logger.debug(`detectMacBrowsers - ${browser}, ${b.version}, ${b.path}`);
	}

	return browsers;
};

const detectOs = () => {
	const platform = process.platform;
	if (platform === "win32") {
		return "win";
	} else if (platform === "darwin") {
		return "mac";
	} else if (platform === "linux") {
		return "linux";
	} else {
		throw new Error(`detectOs - unsupported OS: ${platform}`);
	}
};

const getStableReleaseInfo = async (browser, os) => {
	let info = null;
	if (browser.includes("chrome")) {
		let checkOS = os;
		if (os === "win") {
			checkOS = "win64";
		}

		if (!chromeStableReleaseInfo[os]) {
			chromeStableReleaseInfo[os] = await getChromeStableReleaseVersion(
				checkOS
			);
		}

		info = chromeStableReleaseInfo[os];
	}

	if (browser.includes("firefox")) {
		if (!firefoxStableReleaseInfo) {
			firefoxStableReleaseInfo = await getFirefoxStableReleaseVersion();
		}

		info = firefoxStableReleaseInfo;
	}

	if (browser.includes("edgechromium")) {
		if (!edgeChromiumStableReleaseInfo) {
			edgeChromiumStableReleaseInfo =
				await getEdgeChromiumStableReleaseVersion();
		}

		info = edgeChromiumStableReleaseInfo;
	}

	if (info) {
		logger.debug(
			`getStableReleaseInfo - stable release info: ${browser}, ${info.version}`
		);
	} else {
		logger.error(
			`getStableReleaseInfo - cannot find stable release info for ${browser}`
		);
	}

	return info;
};

const detectBrowsers = async (browser, os) => {
	if (browser.includes("handheld")) {
		let info = await detectHandheldBrowsers(browser);
		console.log(`${JSON.stringify(info)}`);
		return info;
	} else if (os === "win") {
		let info = await detectWinBrowsers(browser);
		console.log(`${JSON.stringify(info)}`);
		return info;
	} else if (os === "linux") {
		return await detectLinuxBrowsers(browser);
	} else {
		return await detectMacBrowsers(browser);
	}
};

const isBrowserLatestStable = async (version, stableReleaseInfo, channel) => {
	let returnVal = true;

	if (
		channel === "stable" &&
		semver.lte(semver.coerce(version), stableReleaseInfo)
	) {
		if (semver.lt(semver.coerce(version), stableReleaseInfo)) {
			returnVal = false;
		}
	}
	return returnVal;
};

/**
 * Get installed browser info
 * @param {String} browser `chrome(headless)`, `firefox(headless)`, `edgechromium(headless)`
 * @param {String} channel `stable`, `beta`
 *
 * @return Object { browser, os, channel, version, path }
 */
const getBrowser = async (browser, channel) => {
	let browserInfo = null;

	if (
		![
			"chrome",
			"chromeheadless",
			"firefox",
			"firefoxheadless",
			"edgechromium",
			"edgechromiumheadless",
			"chromehandheld",
		].includes(browser)
	) {
		throw new Error(`getBrowser - unsupported browser: ${browser}`);
	}

	if (!["stable", "beta"].includes(channel)) {
		throw new Error(`getBrowser - unsupported channel: ${channel}`);
	}

	const hostOperatingSystem = detectOs();
	let operatingSystem = hostOperatingSystem;
	if (browser.includes("handheld")) {
		operatingSystem = "android";
	}

	const stableReleaseInfo = await getStableReleaseInfo(
		browser,
		operatingSystem
	);
	const browsers = await detectBrowsers(browser, operatingSystem);
	for (let b of browsers) {
		logger.debug(`Checking ${b.version} vs ${stableReleaseInfo}`);

		// installed version can surpass "latest" advertised
		if (channel === "stable") {
			if (!b.path.toLowerCase().includes("beta")) {
				browserInfo = b;
				if (semver.lt(semver.coerce(b.version), stableReleaseInfo)) {
					logger.warn(`${browser} is not the latest stable!`);
				}
				break;
			}
		}

		if (channel === "beta" && b.path.toLowerCase().includes(channel)) {
			// Chromium based Beta could actually be at the same version as
			// stable channel occasionally so check >=
			// but this doesn't work for FF
			if (
				browser.includes("firefox") &&
				semver.gt(semver.coerce(b.version), stableReleaseInfo)
			) {
				browserInfo = b;
				break;
			} else if (
				browser.includes("chrom") &&
				semver.gte(semver.coerce(b.version), stableReleaseInfo)
			) {
				browserInfo = b;
				break;
			}
		}
	}

	if (!browserInfo) {
		logger.error(
			`Cannot detect ${channel} channel of ${browser} installed`
		);
		if (browsers) {
			logger.warn(`Use any detected ${browser}`);
			browserInfo = browsers[0];
		} else {
			throw new Error(`Cannot detect ${browser} installed`);
		}
	}

	logger.debug(
		`getBrowser - return browser: ${browser} from ${channel} channel on ${operatingSystem} (via ${hostOperatingSystem}) at version ${browserInfo.version}. local path: ${browserInfo.path}`
	);

	let returnInfo = {
		browser: browser,
		os: operatingSystem,
		channel: channel,
		version: browserInfo.version,
		path: browserInfo.path,
	};

	return returnInfo;
};

const example = async () => {
	const browser = await getBrowser("chrome", "beta");
	logger.debug(browser);
};

module.exports.getBrowser = getBrowser;
module.exports.detectOs = detectOs;
module.exports.getStableReleaseInfo = getStableReleaseInfo;
module.exports.isBrowserLatestStable = isBrowserLatestStable;
