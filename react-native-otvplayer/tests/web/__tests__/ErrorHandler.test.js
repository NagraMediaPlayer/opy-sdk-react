// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://jestjs.io/"}
 */

jest.mock("../../../src/web/NMPWebPlayer", () => jest.fn());
jest.mock("../../../src/web/OTVSDKManager", () => jest.fn());

import { ErrorCodeTypes } from "../../../src/web/common/interface";

import {
	ErrorHandler,
	PluginErrorCode,
} from "../../../src/web/common/ErrorHandler";

const mockSeekable = { length: 1, start: () => 0, end: () => 1000 };

const mockToolkit = {
	// intentionally empty
};

const mockShaka = {
	// intentionally empty
};

const mockPlayer = {
	otvtoolkit: () => mockToolkit,
	tech_: { shaka_: mockShaka },
	currentTime: jest.fn(() => {
		return 1000;
	}),
	seekable: () => mockSeekable,
};

const mockContainer = {
	style: {},
};

let errorHandler;
let errorFunction;
let httpErrorFunction;

beforeEach(() => {
	errorFunction = jest.fn();
	errorHandler = new ErrorHandler({ onError: errorFunction, onHttpError: httpErrorFunction });
});

afterEach(() => {
	jest.clearAllMocks();
});

describe("Test ErrorHandler", () => {
	test("method triggerError", () => {
		const errorObj = {
			errorCode: PluginErrorCode.INVALID_MIMETYPE,
			errorMessage: "Mime Type Invalid",
		};
		errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);

		expect(errorFunction).toHaveBeenCalled();

		const expectedEvent = {
			code: 7001,
			nativeError: {
				platform: "Browser",
				details: {
					errorCode: errorObj.errorCode,
					errorMessage: errorObj.errorMessage,
					content: undefined,
				},
			},
		};
		expect(errorFunction).toHaveBeenCalledWith(expectedEvent);
	});

	test("callback update", () => {
		const alternativeErrorFunction = jest.fn();

		errorHandler.onErrorEvent = alternativeErrorFunction;

		// Now fake an error
		const errorObj = {
			errorCode: PluginErrorCode.INVALID_MIMETYPE,
			errorMessage: "Mime Type Invalid",
		};
		errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);

		expect(errorFunction).not.toHaveBeenCalled();
		expect(alternativeErrorFunction).toHaveBeenCalled();
	});

	test("triggerError with non numeric error code", () => {
		const alternativeErrorFunction = jest.fn();

		errorHandler.onErrorEvent = alternativeErrorFunction;

		const errorObj = {
			errorCode: "Not a number",
			errorMessage: "Mime Type Invalid",
		};
		errorHandler.triggerError(ErrorCodeTypes.PLUGIN, errorObj);

		expect(alternativeErrorFunction).toHaveBeenCalled();

		const expectedEvent = {
			code: 1000,
			nativeError: {
				platform: "Browser",
				details: {
					errorCode: errorObj.errorCode,
					errorMessage: errorObj.errorMessage,
					content: undefined,
				},
			},
		};
		expect(alternativeErrorFunction).toHaveBeenCalledWith(expectedEvent);
	});

	test("triggerHttpError", () => {
		const alternativeErrorFunction = jest.fn();

		errorHandler.onHttpErrorEvent = alternativeErrorFunction;

		const errorHtml = `<!DOCTYPE html>
<html>
	<head>
		<link rel="shortcut icon" href="favicon.ico" />
		<title>Oops! Something went wrong...</title>",
	</head>
</html>`;

		const expectedEvent = {
			error: "https://otvplayer.nagra.com/",
			date: "2021-06-01T14:00:00Z",
			statusCode: 403,
			message: "Forbidden",
			body: errorHtml,
		};

		errorHandler.triggerHttpError(expectedEvent);

		expect(alternativeErrorFunction).toHaveBeenCalled();

		expect(alternativeErrorFunction).toHaveBeenCalledWith(expectedEvent);
	});
});
