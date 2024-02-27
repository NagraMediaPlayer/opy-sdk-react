# Understanding the test framework

## Overview of components of the framework

The Javascript code within this React Native aware environment makes use of the ability to differentiate platform specific differences via the suffix of a module. For example:

- [.native.js](src/utils/automationSupport.native.js)
- [.web.js](src/utils/automationSupport.web.js)

> This pattern can be extended to `.ios.js` or `.android.js` where required.

### Test framework core

See [this page](dependencies/kwuo/README.md) for more details and the style of tests cases used here.

### Entry point for test execution

<details><summary>Click to expand</summary>

The [`index.js`](index.js) file in this folder is the entry point for the common tests to be executed.

It brings together all the test suites which are required to be executed in turn as well as utilities that facilitate test management.

The basic premise of this module is that it wraps the algorithm within an `async` [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE).

Each test suite's entry point is called upon in turn, in each case it **MUST** have an `await` to ensure they run exclusively.

Some text to indicate execution completion is rendered when all suites are executed.

> This is required for automation to detect completion.

Test results are collected and `POST`ed to the result service.

An arbitrary wait happens before the final wrap up is called.

> During test debug/development, the length of the timer is simply to allow some perusal of test output before (in the case of Smart TV) it allows the device to become available for other test requirements.

```javascript
(async () => {
  // Call each of the test suites in turn
  await abc(otvPlayer);
  await def(otvPlayer);
  await ghi(otvPlayer);

  // When done, mark it so
  await renderComponent(endedComponent);

  // Collate and publish the results
  showTestsResults();
  postTestResults();

  await testsCompleted();
})();
```

</details>

### Test Steps

Each of the test suites listed for execution above are contained within the [`testSteps`](src/testSteps/) folder tree and their placement within reflects logical groupings of feature functionality.

### Player Event Verifier

Within the [`PlayerEventVerifier`](src/PlayerEventVerifier/index.js) folder there is ES6 JS class which is used to verify events, event order and event payloads.

> The same style of re-usable module style **SHOULD** be followed as further tests are implemented.

### Platform specific folders

The following folders carry the build environment and scripting for the different platforms:

1. `web` (including SmartTV)
1. `android`
1. `ios` (including tvOS)

### CI Automation scripts

The [`automationScripts`](automationScripts/) folder contains variations scripts to facilitate build, test execution and results collation.
