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
import { renderComponent } from "../../../../utils/render";
import {
	updateOTVPlayerProps,
	playMeGivenStream,
	sleepInMs,
} from "../../../common";
import { createTextComponent } from "../../../../utils/textComponent";
import { getEventVerifier } from "../../../common";
import { isRunningInSafariBrowser } from "../../../../utils/platformVariations";

const SET_TAGS = "@played @events @nonSafari";

export async function executeThumbnailsTests(otvPlayer, streamName) {
	let eventVerifier = getEventVerifier();

	async function testStyle(stream, isSeek) {
		let tnPropsObj = {};

		let resource = await playMeGivenStream(otvPlayer, stream);

		expect(eventVerifier.didEventOccur("onThumbnailAvailable")).toBe(
			true,
			"Expecting thumbnails"
		);

		// Now set the positionInSeconds to 30 seconds, enable display and re-render the player.
		if (isSeek) tnPropsObj.positionInSeconds = 30;
		tnPropsObj.display = true;
		if (resource.props.thumbnail && resource.props.thumbnail.style) {
			tnPropsObj.style = resource.props.thumbnail.style;
		}

		let updateProps = { ...resource.props, thumbnail: tnPropsObj };
		console.log(`updated Props ${JSON.stringify(updateProps)}`);

		await updateOTVPlayerProps(otvPlayer, updateProps);

		// We cannot validate if thumbnail is really displayed.
		expect(eventVerifier.didEventOccur("onError")).toBe(
			true,
			"Expecting error"
		);

		let actualPayload =
			eventVerifier.whatPayloadForFirstOfAnEvent("onError");
		expect(actualPayload).not.toBeUndefined();

		if (actualPayload) {
			expect(actualPayload.code).toBe(7022);
		}
	}

	await describe(`Verify thumbnails feature for ${streamName}`, async () => {
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
			`Play ${streamName} and wait for onThumbnailAvailable notification, verify that onThumbnailAvailable notification is received`,
			`@high_priority ${SET_TAGS} @onThumbnailAvailable @thumbnails`,
			async () => {
				let resource = await playMeGivenStream(otvPlayer, streamName);
				expect(
					eventVerifier.didEventOccur("onThumbnailAvailable")
				).toBe(true, "Expecting thumbnails");
			}
		);

		await it(
			`Play ${streamName}, wait for onThumbnailAvailable notification, set Style, set Postion to 30 seconds and set display to false, Verify that thumbnail is not displayed without TN errors.`,
			`@high_priority ${SET_TAGS} @thumbnails`,
			async () => {
				let tnPropsObj = {};

				let resource = await playMeGivenStream(otvPlayer, streamName);
				expect(
					eventVerifier.didEventOccur("onThumbnailAvailable")
				).toBe(true, "Expecting thumbnails");

				tnPropsObj.style = {
					top: 10,
					left: 10,
					width: 100,
					height: 100,
					borderWidth: 5.0,
					borderColor: "#ffd700", //Gold color border
				};

				// Now set the Position to 30 seconds and re-render the player.
				tnPropsObj.display = false;
				tnPropsObj.positionInSeconds = 30;
				let updateProps = { ...resource.props, thumbnail: tnPropsObj };
				console.log(`updated Props ${JSON.stringify(updateProps)}`);
				await updateOTVPlayerProps(otvPlayer, updateProps);

				// We cannot validate if thumbnail is really displayed.
				expect(eventVerifier.didEventOccur("onError")).toBe(false);
			}
		);

		await it(
			`Play ${streamName}, wait for onThumbnailAvailable notification, set Style , set Position to outside seekable window, set display to true, then a thumbnail Postion error (7021) should be thrown.`,
			`@high_priority ${SET_TAGS} @thumbnails`,
			async () => {
				let tnPropsObj = {};

				let resource = await playMeGivenStream(otvPlayer, streamName);

				expect(
					eventVerifier.didEventOccur("onThumbnailAvailable")
				).toBe(true, "Expecting thumbnails");

				tnPropsObj.style = {
					top: 10,
					left: 10,
					width: 100,
					height: 100,
					borderWidth: 5.0,
					borderColor: "#ffd700", //Gold color border
				};

				// Get the seek payload to know the current position.
				var actualPayload =
					eventVerifier.whatPayloadForEvent("onProgress");

				// Now set the positionInSeconds to currentPosition and re-render the player.
				tnPropsObj.positionInSeconds =
					actualPayload.seekableDuration + 20;

				tnPropsObj.display = true;

				let updateProps = { ...resource.props, thumbnail: tnPropsObj };
				console.log(`updated Props ${JSON.stringify(updateProps)}`);
				await updateOTVPlayerProps(otvPlayer, updateProps);

				// Get the seek payload to know the current position.
				actualPayload = eventVerifier.whatPayloadForEvent("onError");
				expect(actualPayload).not.toBeUndefined();

				if (actualPayload) {
					expect(actualPayload.code).toBe(7021);
				}
			}
		);

		await it(
			`Play ${streamName}, wait for onThumbnailAvailable notification, No Style set, No Position set, set display(true), Verify that thumbnails is not displayed & thumbnail Style error (7022) is thrown.`,
			`@high_priority ${SET_TAGS} @thumbnails`,
			async () => {
				await testStyle(streamName, false);
			}
		);

		await it(
			`Play ${streamName}, wait for onThumbnailAvailable notification, No thumbnail Style set, set positionInSeconds to 30 sec, set display to true, then a thumbnailStyle error (7022) should be thrown.`,
			`@high_priority ${SET_TAGS} @thumbnails`,
			async () => {
				await testStyle(streamName, true);
			}
		);

		await it(
			"Play a TN stream, wait for onThumbnailAvailable notification, set thumbnail Style (top missing), set display to true, then thumbnailStyle error (7022) should be thrown",
			`@high_priority ${SET_TAGS} @thumbnails`,
			async () => {
				await testStyle(
					"THUMBNAIL Content With Style PropMissing",
					false
				);
			}
		);

		await it(
			"Play a TN stream, wait for onThumbnailAvailable notification, set thumbnail Style (left missing), set display to true, then thumbnailStyle error (7022) should be thrown",
			`@high_priority ${SET_TAGS} @thumbnails`,
			async () => {
				await testStyle("THUMBNAIL Content left Style Missing", false);
			}
		);

		await it(
			"Play a TN stream, wait for onThumbnailAvailable notification, set thumbnail Style (width missing), set display to true, then thumbnailStyle error (7022) should be thrown",
			`@high_priority ${SET_TAGS} @thumbnails`,
			async () => {
				await testStyle("THUMBNAIL Content width Style Missing", false);
			}
		);

		await it(
			"Play a TN stream, wait for onThumbnailAvailable notification, set thumbnail Style (height missing), set display to true, then thumbnailStyle error (7022) should be thrown",
			`@high_priority ${SET_TAGS} @thumbnails`,
			async () => {
				await testStyle(
					"THUMBNAIL Content height Style Missing",
					false
				);
			}
		);

		await it(
			"Play a TN stream, wait for onThumbnailAvailable notification, set thumbnailStyle (top missing), positionInSeconds to 30 sec, set display to true, then thumbnailStyle error (7022) should be thrown",
			`@high_priority ${SET_TAGS} @thumbnails`,
			async () => {
				await testStyle(
					"THUMBNAIL Content With Style PropMissing",
					true
				);
			}
		);

		await it(
			"Play a TN stream, wait for onThumbnailAvailable notification, set thumbnail Style (left missing), positionInSeconds to 30 sec, set display to true, then thumbnailStyle error (7022) should be thrown",
			`@high_priority ${SET_TAGS} @thumbnails`,
			async () => {
				await testStyle("THUMBNAIL Content left Style Missing", true);
			}
		);

		await it(
			"Play a TN stream, wait for onThumbnailAvailable notification, set thumbnail Style (width missing), positionInSeconds to 30 sec, set display to true, then thumbnailStyle error (7022) should be thrown",
			`@high_priority ${SET_TAGS} @thumbnails`,
			async () => {
				await testStyle("THUMBNAIL Content width Style Missing", true);
			}
		);

		await it(
			"Play a TN stream, wait for onThumbnailAvailable notification, set thumbnail Style (height missing), positionInSeconds to 30 sec, set display to true, then thumbnailStyle error (7022) should be thrown",
			`@high_priority ${SET_TAGS} @thumbnails`,
			async () => {
				await testStyle("THUMBNAIL Content height Style Missing", true);
			}
		);

		await it(
			`Play ${streamName}, wait for onThumbnailAvailable notification, set thumbnail Style, positionInSeconds (30 sec),display(true), verify that TN displayed. Zap to non-TN stream, set all TN props, verify that TN not displayed`,
			`@medium_priority ${SET_TAGS} @thumbnails`,
			async () => {
				let tnPropsObj = {};

				let resource = await playMeGivenStream(otvPlayer, streamName);

				expect(
					eventVerifier.didEventOccur("onThumbnailAvailable")
				).toBe(true, "Expecting thumbnails");

				// Now set Thumbnails props and re-render the player.
				tnPropsObj.style = {
					top: 10,
					left: 10,
					width: 100,
					height: 100,
					borderWidth: 5.0,
					borderColor: "#ffd700", //Gold color border
				};
				tnPropsObj.positionInSeconds = 30;
				tnPropsObj.display = true;

				let updateProps = { ...resource.props, thumbnail: tnPropsObj };
				console.log(`updated Props ${JSON.stringify(updateProps)}`);
				await updateOTVPlayerProps(otvPlayer, updateProps);
				await sleepInMs(5000);

				expect(eventVerifier.didEventOccur("onError")).toBe(false);

				// change things atomically. TN will not be displayed.
				let newTNpropsObj = { ...tnPropsObj };
				newTNpropsObj.display = false;

				let newProps = { ...updateProps, thumbnail: newTNpropsObj };
				console.log(`updated Props ${JSON.stringify(newProps)}`);
				await updateOTVPlayerProps(otvPlayer, newProps);
				await sleepInMs(2000);

				//Zap to non-TN stream with TN properties, set TN position to 30 secs, no thumbnail should be displayed.
				await playMeGivenStream(
					otvPlayer,
					isRunningInSafariBrowser()
						? "HLS NO ThumbNail Content"
						: "NO ThumbNail Content"
				);

				await sleepInMs(5000);
				expect(eventVerifier.didEventOccur("onError")).toBe(false);
			}
		);

		await it(
			`Play ${streamName}, wait for onThumbnailAvailable notification, set thumbnail Style, positionInSeconds, display(true), Verify thumbnail style is correct`,
			`@high_priority ${SET_TAGS} @thumbnails`,
			async () => {
				let tnPropsObj = {};

				let resource = await playMeGivenStream(otvPlayer, streamName);

				expect(
					eventVerifier.didEventOccur("onThumbnailAvailable")
				).toBe(true, "Expecting thumbnails");

				tnPropsObj.display = true;

				// Now set the thumbnail props and re-render the player.
				tnPropsObj.style = {
					top: 10,
					left: 10,
					width: 100,
					height: 100,
					borderWidth: 5.0,
					borderColor: "#ffd700", //Gold color border
				};
				tnPropsObj.positionInSeconds = 30;

				let updateProps = { ...resource.props, thumbnail: tnPropsObj };
				console.log(`updated Props ${JSON.stringify(updateProps)}`);
				await updateOTVPlayerProps(otvPlayer, updateProps);

				// We cannot validate if thumbnail is really displayed.
				expect(eventVerifier.didEventOccur("onError")).toBe(false);
			}
		);

		await it(
			"play a clear non Thumbnail stream, Verify that onThumbnailAvailable is not received.",
			`@high_priority ${SET_TAGS} @thumbnails`,
			async () => {
				await playMeGivenStream(
					otvPlayer,
					isRunningInSafariBrowser()
						? "HLS NO ThumbNail Content"
						: "NO ThumbNail Content"
				);
				expect(
					eventVerifier.didEventOccur("onThumbnailAvailable")
				).toBe(false);
			}
		);

		await it(
			"play a clear non Thumbnail stream, set display to true, Verify that thumbnail Not available error (7023) is thrown.",
			`@high_priority ${SET_TAGS} @thumbnails`,
			async () => {
				let resource = await playMeGivenStream(
					otvPlayer,
					isRunningInSafariBrowser()
						? "HLS NO ThumbNail Content"
						: "NO ThumbNail Content"
				);

				let tnPropsObj = {};

				tnPropsObj.style = {
					top: 10,
					left: 10,
					width: 100,
					height: 100,
					borderWidth: 5.0,
					borderColor: "#ffd700", //Gold color border
				};
				tnPropsObj.display = true;

				let updateProps = { ...resource.props, thumbnail: tnPropsObj };
				console.log(`updated Props ${JSON.stringify(updateProps)}`);

				await updateOTVPlayerProps(otvPlayer, updateProps);

				expect(eventVerifier.didEventOccur("onError")).toBe(
					true,
					"Expecting error"
				);
				let actualPayload =
					eventVerifier.whatPayloadForFirstOfAnEvent("onError");
				expect(actualPayload).not.toBeUndefined();

				if (actualPayload) {
					expect(actualPayload.code).toBe(7023);
				}
			}
		);

		await it(
			"play a Thumbnail stream, set display to true when initialization, Verify that thumbnail status unknown error (7024) is thrown.",
			`@high_priority ${SET_TAGS} @thumbnails @under_development`,
			async () => {
				await playMeGivenStream(
					otvPlayer,
					"ThumbNail Content with display true"
				);

				expect(eventVerifier.didEventOccur("onError")).toBe(
					true,
					"Expecting error"
				);
				let actualPayload =
					eventVerifier.whatPayloadForFirstOfAnEvent("onError");
				expect(actualPayload).not.toBeUndefined();

				if (actualPayload) {
					expect(actualPayload.code).toBe(7024);
				}
			}
		);
	});
}
