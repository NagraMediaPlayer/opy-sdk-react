// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/*eslint no-console: off*/
const path = require("path");
const DIST_DIR = "../dist";
const PACKAGE_VERSION_INDEX = 2;

// Path needs to be generated as this script is outside the calling directory
const fsExtraPath = path.resolve(
	__dirname,
	"../otvplayer-" +
		process.argv[PACKAGE_VERSION_INDEX] +
		"/node_modules/fs-extra"
);

const fs = require(fsExtraPath);

/**
 * General purpose copy a single file
 * @param {*} src
 * @param {*} dst
 */
const copyFile = (src, dst) => {
	console.log(`Copy ${src} to ${dst}`);
	fs.copySync(src, dst);
};

/**
 * General purpose copy a folder
 * @param {*} src
 * @param {*} dst
 */
const copyDirectory = (src, dst) => {
	console.log("Copying Directory: " + src);
	console.log("               to: " + dst);
	for (const f of fs.readdirSync(src)) {
		const absolutePath = path.join(src, f);
		if (f === "node_modules" && fs.lstatSync(absolutePath).isDirectory()) {
			console.log(`${absolutePath} is not copied`);
		} else {
			fs.copySync(absolutePath, path.join(dst, f));
		}
	}
};

/**
 * Copy stuff to dist
 */
const copyToDist = () => {
	if (process.argv.length < 3) {
		console.error("ERROR: Invalid number of agruments");
		console.error("Usage: node copyDistFiles.js <ReactNativeVersion>");
		console.error("Example: node copyDistFiles.js 0.63.4");
		return -1;
	}

	// check if particular otvplayer version path exists
	let otvplayerPath = path.resolve(
		__dirname,
		"../otvplayer-" + process.argv[PACKAGE_VERSION_INDEX]
	);
	console.log("OTVPLAYER PATH: ", otvplayerPath);

	fs.exists(otvplayerPath)
		.then((exists) => {
			if (!exists) {
				console.error(
					"ERROR: Invalid agrument: ",
					process.argv[PACKAGE_VERSION_INDEX]
				);
				console.error("Path does not exist: ", otvplayerPath);

				return -2;
			} else {
				let files = [
					{
						src: otvplayerPath + "/package.json",
						dst:
							process.argv[PACKAGE_VERSION_INDEX] +
							"/package.json",
					},
					{
						src: __dirname + "/../src/OTVPlayerTypes.d.ts",
						dst:
							process.argv[PACKAGE_VERSION_INDEX] +
							"/OTVPlayerTypes.d.ts",
					},
				];
				if (process.argv[3] === "web") {
					files.push({
						src: __dirname + "/../src/web/public/index.js",
						dst:
							process.argv[PACKAGE_VERSION_INDEX] +
							"/web/index.js",
					});
				}

				// Iterate through copy specs doing each copy
				for (const file of files) {
					let src = file.src;
					let dst = path.join(DIST_DIR, file.dst);
					if (fs.lstatSync(src).isDirectory()) {
						copyDirectory(src, dst);
					} else {
						copyFile(src, dst);
					}
				}
			}
		})
		.catch((error) => {
			console.error("ERROR: ", error);
			return -3;
		});
};

copyToDist();
