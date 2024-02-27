// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import OTVPlayer, { OTVSDK } from "./OTVPlayer";

import {
	OTVSDK_LOGLEVEL,
	STATISTICS_TYPES,
	AUDIO_ENCODING_TYPE,
	TEXT_ENCODING_TYPE,
	DRMTypes,
} from "./common/enums";

import { OTVPlayerWithInsight } from "./OTVPlayerWithInsight";

export {
	OTVPlayerWithInsight,
	OTVSDK,
	OTVSDK_LOGLEVEL,
	STATISTICS_TYPES,
	AUDIO_ENCODING_TYPE,
	TEXT_ENCODING_TYPE,
	DRMTypes,
};

export default OTVPlayer;
