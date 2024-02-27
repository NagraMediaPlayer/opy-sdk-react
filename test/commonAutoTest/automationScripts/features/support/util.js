// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
"use strict";
const path = require("path");
const modules = path.join(process.cwd(), "/node_modules");

const fetch = require(`${modules}/node-fetch`);
const BROWSER_NAME = require("../support/config").browser;

const sleepInMs = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

module.exports.sleepInMs = sleepInMs;
