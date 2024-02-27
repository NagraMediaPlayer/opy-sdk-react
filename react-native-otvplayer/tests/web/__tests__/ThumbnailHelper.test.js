// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://jestjs.io/"}
 */

jest.mock("../../../src/web/NMPWebPlayer", () => jest.fn());
jest.mock("../../../src/web/OTVSDKManager", () => jest.fn());

import Thumbnail from "../../../src/web/ThumbnailHelper";
import { OTTPlayerStates } from "../../../src/web/common/interface";
import { OTTHelper } from "../../../src/web/OTTHelper";

const triggerErrorCB = jest.fn();
const mockErrorHandler = {
	triggerError: triggerErrorCB,
};
const mockSeekable = { length: 1, start: () => 0, end: () => 1000 };

const getThumbnailFn = jest.fn();
const mockToolkit = {
	getThumbnail: getThumbnailFn,
};

const mockShaka = {
	getImageTracks: jest.fn(() => [{ label: "" }]),
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

let thumbnailHelper;

beforeEach(() => {
	jest.spyOn(OTTHelper, "isCurrentPlatform").mockImplementation(() => false);
	thumbnailHelper = new Thumbnail();
	jest.spyOn(thumbnailHelper, "_getContainerElement").mockImplementation(
		() => mockContainer
	);
	thumbnailHelper.initialiseThumbnailClass(mockPlayer, mockErrorHandler);
});

afterEach(() => {
	jest.clearAllMocks();
});

describe(" Test ThumbnailHelper ", () => {
	test(" Test method createThumbnailContainerAndAttach ", () => {
		const containerName = "testThumbnail";
		const getElementByIdFn = jest.spyOn(document, "getElementById");
		thumbnailHelper.createThumbnailContainerAndAttach(containerName);
		expect(getElementByIdFn).toHaveBeenCalledWith(containerName);
	});
	test(" Test method checkThumbnailAvailableAndTriggerEvent ", () => {
		const availableFn = jest.fn();
		thumbnailHelper.checkThumbnailAvailableAndTriggerEvent(availableFn);
		expect(availableFn).toHaveBeenCalled();
	});

	test(" Test method setThumbnailProperties ", () => {
		const property = {
			display: true,
			positionInSeconds: 0,
			style: {
				top: 0,
				left: 0,
				width: 200,
				height: 200,
				borderWidth: 1,
				borderColor: "#000000",
			},
		};
		const setStyleFn = jest.spyOn(
			thumbnailHelper,
			"setThumbnailProperties"
		);
		thumbnailHelper.createThumbnailContainerAndAttach("testNode");
		thumbnailHelper.checkThumbnailAvailableAndTriggerEvent(jest.fn());
		thumbnailHelper.setThumbnailProperties(
			property,
			OTTPlayerStates.PLAYING
		);
		expect(setStyleFn).toHaveBeenCalled();
		expect(getThumbnailFn).toHaveBeenCalled();
	});

	test(" Test method thumbnailHandler ", () => {
		const thumbnailObj = {
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			url: "test",
		};
		const style = {
			top: 0,
			left: 0,
			width: 200,
			height: 200,
			borderWidth: 1,
			borderColor: "#000000",
		};
		const createElementFn = jest.spyOn(document, "createElement");
		thumbnailHelper.createThumbnailContainerAndAttach("testNode");
		thumbnailHelper.checkThumbnailAvailableAndTriggerEvent(jest.fn());
		thumbnailHelper.thumbnailHandler(thumbnailObj, style);
		expect(createElementFn).toHaveBeenCalledWith("img");
	});

	test(" Test method _updateContainerStyle ", () => {
		const thumbnailObj = {
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			url: "test",
		};
		const style = {
			top: 0,
			left: 0,
			width: 200,
			height: 200,
			borderWidth: 1,
			borderColor: "#000000",
		};
		const imgTag = {
			naturalWidth: 100,
			naturalHeight: 100,
		};
		thumbnailHelper.createThumbnailContainerAndAttach("testNode");
		thumbnailHelper.checkThumbnailAvailableAndTriggerEvent(jest.fn());
		thumbnailHelper._updateContainerStyle(
			mockContainer,
			imgTag,
			thumbnailObj,
			style
		);
		expect(mockContainer.style.backgroundImage).toBe("url(test)");
	});
});
