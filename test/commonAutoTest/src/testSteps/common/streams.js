// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { getStream } from "../../res/media";

export function getClearStream(streamName) {
	return getStream(streamName);
}

export function getClearNoTNStream() {
	return getStream("HLS Basic Bip Bop (No Thumbs) Clear");
}
