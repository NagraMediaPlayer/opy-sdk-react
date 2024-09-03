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
import {
	getEventVerifier,
	playMeGivenStream,
	sleepInMs,
	playThisStream,
} from "../common";

import { isRunningInSafariBrowser, isRunningOniOS } from "../../utils/platformVariations";
import { createTextComponent } from "../../utils/textComponent";
import { renderComponent } from "../../utils/render";

export async function executeHttpErrorTests(otvPlayer, streamName) {
	let eventVerifier = getEventVerifier();

	await describe(`play ${streamName} and see onHttpError event`, async () => {
		beforeAll(async () => {
			console.log(
				"Before ALL: due to a chicken/egg bug this can't be reached"
			);
		});

		beforeEach(async () => {
			eventVerifier.reset();
		});

		afterEach(async (thisTestDetails) => {
			const afterEachComponent = createTextComponent(thisTestDetails);

			await renderComponent(afterEachComponent);
		});

		afterAll(async () => { });

		await it(`play ${streamName} and see onHttpError event`,
			`@high_priority @nonSafari @httpError @events`,
			async () => {
				const resource = await playMeGivenStream(otvPlayer, streamName);
				await sleepInMs(15000); // TODO refine this

				const httpErrorEvent = await eventVerifier.whatPayloadForEvent("onHttpError");
				expect(httpErrorEvent).not.toBeUndefined("Event occurrence?");
				expect(httpErrorEvent.date).not.toBeUndefined("Date?");
				expect(httpErrorEvent.message).not.toBeUndefined("Message?");
				expect(httpErrorEvent.statusCode).toBe(404, "404?");
				expect(httpErrorEvent.platform).not.toBeUndefined("Platform?");
				expect(httpErrorEvent.platform.name).not.toBeUndefined("Name of the platform?");
				expect(httpErrorEvent.platform.data).not.toBeUndefined("Data of the platform?");
				expect(httpErrorEvent.url).not.toBeUndefined("URL present?");
			}
		);

		await it(`play httpErrorGenerator (400) and see onHttpError event`,
			`@high_priority @nonSafari @httpError @events`,
			async () => {
				const sourceObject = {
					src: "https://otvplayer.nagra.com/http/httpErrorGenerator.php?error=400",
					type: isRunningInSafariBrowser() || isRunningOniOS ? "application/x-mpegURL" : "application/dash+xml",
				};
				await playThisStream(
					sourceObject,
					otvPlayer,
					{
						"autoplay": true,
						"muted": true,
						"volume": 0
					},
					5000
				);

				await sleepInMs(10000); // TODO refine this

				const httpErrorEvent = await eventVerifier.whatPayloadForEvent("onHttpError");
				expect(httpErrorEvent).not.toBeUndefined("Event occurrence?");
				expect(httpErrorEvent.date).not.toBeUndefined("Date?");
				expect(httpErrorEvent.message).not.toBeUndefined("Message?");
				expect(httpErrorEvent.statusCode).toBe(400, "400?");
				expect(httpErrorEvent.platform).not.toBeUndefined("Platform?");
				expect(httpErrorEvent.platform.name).not.toBeUndefined("Name of the platform?");
				expect(httpErrorEvent.platform.data).not.toBeUndefined("Data of the platform?");
				expect(httpErrorEvent.url).not.toBeUndefined("URL present?");
			}
		);
	});

};
