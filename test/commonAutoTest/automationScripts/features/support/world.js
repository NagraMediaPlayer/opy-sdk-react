// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
("use strict");
// features/support/world.js

const path = require("path");
const modules = path.join(process.cwd(), "/node_modules");
const { setWorldConstructor } = require(`${modules}/cucumber`);

/**
 * @param {function} attach
 * @param {Object} parameters: {browser: , channel: }
 */
function CustomWorld({ attach, parameters }) {
	this.browserOptions = {
		name: parameters.browser,
		channel: parameters.channel,
	};

	this.ready = false;

	this.attach = attach;

	// example of capture browser logs
	this.grab_browser_log = function (browser) {
		browser.driver
			.manage()
			.logs()
			.get("browser")
			.then(function (log_entries) {
				log_entries.forEach((log_entry) => {
					console.log(
						"[" +
							new Date(
								parseInt(log_entry.timestamp)
							).toISOString() +
							"]",
						log_entry.level.name,
						log_entry.message
					);
				});
			});
	};
}

setWorldConstructor(CustomWorld);
