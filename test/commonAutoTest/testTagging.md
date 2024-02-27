# Tagging test cases

## Introduction

Each test scenario shall have one or more `@` prefixed tags. They are essentially metadata about each test scenario, the more tags the better to describe a scenario.
The tags serve more than one purpose:

- Firstly to classify the test cases into related groups.
- Secondly to allow test case execution to be configured from the `Jenkinsfile`.
  > See the `getTagExclusions()` and `getTagInclusions()` functions within the [`Jenkinsfile`](../../Jenkinsfile).
  > These formulate which platform variations will run which tests.

## Tagging strategy

There is no hard and fast rules in terms of tagging. Its expected we use tags as a way of summarising a test scenario's purpose such that tests related to that tag could be executed in isolation as a subset of the complete set.

One application of this is to execute just the test cases of a feature, all of which have been given the same tag name. It would just be important to decide on a feature's tag and use it consistently as the feature's test cases are developed.

> Inspiration for feature tag naming can be drawn from the vast set of tests we already have for the SDKs.

For example, with the Bitrate and Resolution Capping feature, scenarios added to explicity exercise that feature's behaviour carry the `@capping` tag.

## Special meaning tags

- `@under_development`
  test will be avoided in CI as it or the feature it corresponds to has not yet been completed
- `@known_issue`
  test will be avoided in CI as it is likely to fail because of an outstanding bug that shall be linked to in related code comments.
- `@unstable`
  test will be avoided in CI as it has not yet been proven 100% reliable

### CI test case priorities

In fitting with our common approach to test cases and CI we designate different priorites of test cases. **EVERY** test scenario shall have _only_ one of these.

- `@high_priority`
  will be run in CI on every commit.

  > These must run quickly in order to exhibit the [_fail fast_ technique](https://www.martinfowler.com/ieeeSoftware/failFast.pdf).
  >
  > **THESE MUST SUCCEED** for a build to be considered good.
  >
  > Tests without any tags will default to having `@high_priority`.

- `@medium_priority`
  will be run in CI in the evenings only on the best candidate build at the end of a working day.

  > They can be longer running if necessary to execute a feature more deeply.
  >
  > Test failures will _not_ stop the build but still need to be investigated.

- `@robustness`
  will be run in CI in the evenings/overnight only on the best candidate build at the end of a working day.

### Platform specific test execution management

If we know a feature or part of a feature is not applicable on a certain platform or platform variant we can tag the test appropriately to ensure its skipped in CI.

For example, on the Browser platform we do not support DASH and related child features like bitrate & resolution capping on Safari so these test scenarios are tagged with `@nonSafari`.

> This list is not exhaustive, but implies a strategy to be followed.

It is envisaged we will also have tags like `@nonAndroid`, `@nonTVOS` as the test scenarios grow. The logic for this will need to be implemented in the aforementioned functions in the `Jenkinsfile` and all relevant tests tagged appropriately.

For example, this snippet from `getTagExclusions()`:

```groovy
    if (platform.contains("android")) {
        arrayExclusions.add("@nonAndroid")
    }

    if (browser.contains("safari")) {
        arrayExclusions.add("@nonSafari")
    }
```

## Where to put the tags?

The API for a test scenario definition allows for a tag list to be provided as the second argument of the `it()` scenario definition API, immediately after the name (argument 1).

> The tags argument can either be a space separated string of tags or an array of single tag strings, internally the former is converted to the latter.

Since at the time of writing not all tests have been allocated tags, the second argument can be the tags or the function callback.

### Repetition of tags within a set

Test sets can have common tags defined and then the list of individual test scenario's tags appended or wrapped around.
For example:

```javascript
const SET_TAGS = "@clear @played @events @payload";

export async function executeEventPayloadTestsWhenPlayed(otvPlayer) {
	await describe("Verify event payload when stream is played", async () => {
        ...
		await it(
			"plays a clear stream, set a cap and sees the onSelectedBitrateChanged event payload",
			`@medium_priority ${SET_TAGS} @capping @onSelectedBitrateChanged @nonSafari`,
			async () => {
                ...
```

### Examples of tagging

1.  Testing when a **clear** stream is **played**, examining the **payload** of **events**, specifically the **onSelectedBitrateCapping** event which is part of the **capping** feature.

    > Since this is a longer running case and it struggles on iOS/tvOS it is considered a **medium** priority.
    >
    > Also as mentioned above **capping** is not relevant to **Safari**.

    ```javascript
    const SET_TAGS = "@clear @played @events @payload";
    ...
    		`@medium_priority ${SET_TAGS} @capping @onSelectedBitrateChanged @nonSafari`,
    ```

1.  Testing when a **clear** stream is **paused**, examining the **sequence** of **events**, specifically the **onPlay**, **onPlaying** events.

    ```javascript
     const SET_TAGS = "@high_priority @clear @paused @events @sequence";
    ...
    		`${SET_TAGS} @onPlay @onPlaying`,
    ```

### Testing locally with tags

#### Web/Smart TV

Append the hosted URL with (for example) `?tags=@thumbnails and @events and not (@medium_priority or @robustness)`.

#### Android/Apple

Update the configuration in the file [test/commonAutoTest/src/utils/config.js](src/utils/config.js). For example:

```javascript
exports.platform = "dave";
exports.resultsService = "https://resultsServiceURL";
exports.tags = "@clear and @played and @events and @thumbnails and @current";
```
