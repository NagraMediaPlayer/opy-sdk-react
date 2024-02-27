// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
//webpack
//Case 1:If OTVPLAYER_PROD value is true, by default it takes RN Plugin (production/release mode).
//Case 2:If it is false, then it takes RN Plugin (debug mode).
//Case 3:If OTVPLAYER_PROD value is undefined, then it takes RN Plugin (production/release mode)

//react-script
//Case 1:If REACT_APP_OTVPLAYER_PROD value is true, by default it takes RN Plugin (production/release mode).
//Case 2:If it is false, then it takes RN Plugin (debug mode).
//Case 3:If REACT_APP_OTVPLAYER_PROD value is undefined, then it takes RN Plugin (production/release mode)
let isProduction = true;
if (typeof process === "undefined") {
	isProduction =
		typeof OTVPLAYER_PROD === "undefined" ? true : OTVPLAYER_PROD;
} else {
	let otvPlayerProd = true;
	if (process.env.REACT_APP_OTVPLAYER_PROD) {
		otvPlayerProd = JSON.parse(
			process.env.REACT_APP_OTVPLAYER_PROD.toLowerCase()
		);
	}
	isProduction =
		typeof process.env.REACT_APP_OTVPLAYER_PROD === "undefined"
			? true
			: otvPlayerProd;
}
if (isProduction === true) {
	module.exports = require("./react-otvplayer.js");
} else {
	module.exports = require("./react-otvplayer-debug.js");
}
