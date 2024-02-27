// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
// defining content type
export const CONTENT_TYPE = {
	VOD: 'VOD',
	LIVE: 'LIVE',
};

export const AVAILABLE_RESOLUTION = [
	{resolution: 'Infinity', width: Infinity, height: Infinity},
	{resolution: '360p', width: 640, height: 360},
	{resolution: '720p', width: 1280, height: 720},
	{resolution: '1080p', width: 1920, height: 1080},
	{resolution: '1440p', width: 2560, height: 1440},
	{resolution: '4K', width: 3840, height: 2160},
	{resolution: 'null', width: null, height: null},
	{resolution: 'undefined', width: undefined, height: undefined},
];

export const VOLUME_DELTA = 0.1;
export const INIT_VOLUME = 0.2;
export const SEEK_TIME = 10;
export const SEEK_TIME_DELTA = 5;
