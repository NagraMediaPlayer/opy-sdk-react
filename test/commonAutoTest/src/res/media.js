// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import mediaData from "./mediaList";

const streams = new Map(Object.entries(mediaData.streams));

export function getStream(streamId) {
	const stream = streams.get(streamId);
	if (stream === undefined) {
		throw `Stream ${streamId} not found`;
	}
	return stream;
}

export function getStreams(streamIds) {
	return streamIds.map((streamId) => getStream(streamId));
}
