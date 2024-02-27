// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
export function captureConsoleLogs() {
	// Hook into console logs and save them up for reporting
	// Based on https://stackoverflow.com/a/55603620/1751266
	if (console.everything === undefined) {
		console.everything = "";
		console.visible = "";

		console.defaultInfo = console.info.bind(console);
		console.info = function () {
			let additional = `${new Date().toISOString()} Info: ${Array.from(
				arguments
			)}\n`;
			console.everything += additional;
			console.defaultInfo.apply(console, arguments);

			console.visible += additional;
		};
		console.defaultLog = console.log.bind(console);
		console.log = function () {
			let additional = `${new Date().toISOString()} Log: ${Array.from(
				arguments
			)}\n`;
			console.everything += additional;
			console.defaultLog.apply(console, arguments);

			console.visible += additional;
		};
		console.defaultError = console.error.bind(console);
		console.error = function () {
			let additional = `${new Date().toISOString()} Error: ${Array.from(
				arguments
			)}\n`;
			console.everything += additional;
			console.defaultError.apply(console, arguments);

			console.visible += additional;
		};
		console.defaultWarn = console.warn.bind(console);
		console.warn = function () {
			let additional = `${new Date().toISOString()} Warning: ${Array.from(
				arguments
			)}\n`;
			console.everything += additional;
			console.defaultWarn.apply(console, arguments);

			console.visible += additional;
		};
		console.defaultDebug = console.debug.bind(console);
		console.debug = function () {
			let additional = `${new Date().toISOString()} Debug: ${Array.from(
				arguments
			)}\n`;
			console.everything += additional;
			console.defaultDebug.apply(console, arguments);

			console.visible += additional;
		};
	}
}
