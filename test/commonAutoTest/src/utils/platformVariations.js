// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { Platform } from "react-native";

export function isRunningInSafariBrowser() {
	let returnValue = false;

	if (
		Platform.OS === "web" &&
		window &&
		window.navigator &&
		window.navigator.userAgent
	) {
		const isSmartTv = window.navigator.userAgent
			.toLowerCase()
			.includes("smart");
		returnValue =
			!isSmartTv &&
			window.navigator.userAgent.indexOf("Safari") !== -1 &&
			window.navigator.userAgent.indexOf("Chrome") === -1;
	}
	return returnValue;
}

export function isRunningOnAndroid() {
	return Platform.OS === "android" ? true : false;
}

export function isRunningOniOS() {
	return Platform.OS === "ios" ? true : false;
}

export function isRunningOnSmartTV() {
	let isSmartTv = false;
	if (
		Platform.OS === "web" &&
		window &&
		window.navigator &&
		window.navigator.userAgent
	) {
		isSmartTv = window.navigator.userAgent.toLowerCase().includes("smart");
	}

	return isSmartTv;
}

export function isRunningOntvOS() {
	return isRunningOniOS() && Platform.isTV ? true : false;
}

export function isRunningOnTVKeyCapable() {
	let isTVKeyCapable = false;

	if (
		Platform.OS === "web" &&
		window &&
		window.navigator &&
		window.navigator.userAgent
	) {
		const lowerCaseUA = window.navigator.userAgent.toLowerCase();
		isTVKeyCapable =
			lowerCaseUA.includes("hbbtv") && lowerCaseUA.includes("tizen");
	}

	console.log(`isTVKeyCapable? ${isTVKeyCapable}`);
	return isTVKeyCapable;
}

export function isRunningOnLGTV() {
	let isLGTv = false;

	if (
		Platform.OS == "web" &&
		window &&
		window.navigator &&
		window.navigator.userAgent
	) {
		isLGTv = window.navigator.userAgent.toLowerCase().includes("web0s");
	}
	console.log("isLGTV: " + isLGTv);
	return isLGTv;
}

export function isRunningOnTizenTV() {
	let isTizen = false;

	if (
		Platform.OS === "web" &&
		window &&
		window.navigator &&
		window.navigator.userAgent
	) {
		isTizen =
			window.navigator.userAgent.toLowerCase().includes("smart") &&
			!window.navigator.userAgent.toLowerCase().includes("hbbtv") &&
			!window.navigator.userAgent.toLowerCase().includes("web0s") &&
			!window.navigator.userAgent.toLowerCase().includes("vidaa");
	}
	console.log("isTizen: " + isTizen);
	return isTizen;
}

export function isRunningOnHiSenseTV() {
	let isHisenseTV = false;

	if (
		Platform.OS === "web" &&
		window &&
		window.navigator &&
		window.navigator.userAgent
	) {
		isHisenseTV = window.navigator.userAgent
			.toLowerCase()
			.includes("vidaa");
	}
	console.log("isHisenseTV: " + isHisenseTV);
	return isHisenseTV ? true : false;
}
