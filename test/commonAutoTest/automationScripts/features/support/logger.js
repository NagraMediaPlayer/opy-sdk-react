// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
"use strict";
const path = require("path");
const modules = path.join(process.cwd(), "/node_modules");
const winston = require(`${modules}/winston`);

const tsFormat = () => new Date().toISOString();

let logger = null;

const getLogger = () => {
	if (logger) {
		return logger;
	}

	logger = new winston.Logger({
		transports: [
			// colorize the output to the console
			new winston.transports.Console({
				timestamp: tsFormat,
				colorize: true,
			}),
		],
	});

	logger.level = "debug";
	logger.debug(`Using Node ${process.version}`);

	return logger;
};

module.exports.getLogger = getLogger;
