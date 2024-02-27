// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import {
	describe,
	it,
	expect,
	beforeEach,
	afterEach,
	beforeAll,
	afterAll,
} from "@nagra/kwuo";
import { renderComponent } from "../../utils/render";
import {
	getEventVerifier,
	waitAndCheckProgress,
	playThisStream,
} from "../common";
import { createTextComponent } from "../../utils/textComponent";
import { getStream } from "../../res/media";

const playGivenStreamWithAutoplayConfig = async (
	otvPlayer,
	streamName,
	autoplay
) => {
	let stream = getStream(streamName);
	let sourceObject = getSource(stream);
	let newProperty = stream.props;
	newProperty.autoplay = autoplay;
	await playThisStream(sourceObject, otvPlayer, newProperty, 5000);
};

const getSource = (stream) => {
	let sourceObject = {
		src: stream.url,
		type: stream.mimeType,
		token: stream.token,
		drm: {
			ssmServerURL: stream.ssmServerURL,
			certificateURL: stream.certificateURL,
			licenseURL: stream.licenseURL,
			type: stream.drm,
		},
	};
	return sourceObject;
};

const SET_TAGS = "@high_priority @props";

export async function executeAutoPlayTests(otvPlayer, streamName) {
	let eventVerifier = getEventVerifier();

	await describe("Verify Autoplay Prop", async () => {
		beforeAll(async () => {
			console.log(
				"Before ALL: due to a chicken/egg bug this can't be reached"
			);
		});

		beforeEach(async () => {});

		afterEach(async (thisTestDetails) => {
			let afterEachComponent = createTextComponent(thisTestDetails);

			eventVerifier.reset();
			await renderComponent(afterEachComponent);
		});

		afterAll(async () => {});

		await it(
			`plays ${streamName} when autoplay is false`,
			`${SET_TAGS}`,
			async () => {
				await playGivenStreamWithAutoplayConfig(
					otvPlayer,
					streamName,
					false
				);
				let progressed = await waitAndCheckProgress(4, 2);
				expect(progressed).toBe(false, "Are we progressing?");
			}
		);

		await it(
			`plays ${streamName} when autoplay is undefined`,
			`${SET_TAGS}`,
			async () => {
				await playGivenStreamWithAutoplayConfig(
					otvPlayer,
					streamName,
					undefined
				);
				let progressed = await waitAndCheckProgress(4, 2);
				expect(progressed).toBe(false, "Are we progressing?");
			}
		);

		await it(
			`plays ${streamName} when autoplay is true`,
			`${SET_TAGS}`,
			async () => {
				await playGivenStreamWithAutoplayConfig(
					otvPlayer,
					streamName,
					true
				);
				let progressed = await waitAndCheckProgress(4, 2);
				expect(progressed).toBe(true, "Are we progressing?");
			}
		);
	});
}
