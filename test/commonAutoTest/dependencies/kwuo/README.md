# Kwuo

**Kwuo** - A JavaScript testing framework.

## Usage

The premise of a test suite module is that it **MUST** export an `async` function (to be referenced by the test executor JS) which takes an argument of a reference to the common object under test.

Within this function a `describe` function is defined which **MUST** be `await`ed in order to continue to enforce the test execution exclusivity.

```javascript
export async function abc(otvPlayer) {
  await describe("Verify ... when ...", async () => {
    renderComponent(idleComponent);

    beforeAll(async () => {
      await sleepInMs(4000);
    });

    beforeEach(async () => {});

    afterEach(async (details) => {
      // details argument provides some text commentary of the current
      // test case that is just finishing.
      renderComponent(idleComponent);
    });

    afterAll(async () => {});

    await it("GIVEN xxxxx WHEN yyyyy THEN zzzzz", async () => {
      await playMeAClearStream(otvPlayer, eventVerifier);

      expect(eventVerifier.didEventOccur("onLoadStart")).toBe(true);
    });
  });
}
```

### `describe`

This method is used to represent a group with related test blocks. This method needs to execute with two arguments:

- Test name
- A function

The contents of the `describe` function **MUST** contain an initial rendering of the idle component to ensure a clean break between test suites.

The `describe` function **SHOULD** define `beforeAll()`, `beforeEach()` and `afterAll()` functions where appropriate bookend tasks can take place.

The `describe` function **MUST** contain **at least one** `it()` function whose arguments document the test case scenario/environment.

### `it`

This method executes a function to perform a test operation.
`it()` can take 2 or 3 arguments:
1. `desc` the name of the test scenario [mandatory]
1. `tags` a list of tags applied to the test [optional] - when omitted this will default to `@high_priority`
   This can take the form of a space separated list e.g. `"@high_priority @events @notSafari"` or as an array of tags,
   e.g. `["@high_priority", "@events", "@notSafari"]`
1. `fn` the function that will execute the test steps [mandatory]

The `it()` function(s) **MUST** be `async` and `await`ed for in order to ensure test execution exclusivity.

The steps within an `it()` **MUST** be `await`ed.

### expect

This method evaluates the result from the test block and performs the assert statements.

An `expect()` call **MUST** be contained within an `it()` function.

- One `expect()` per `it()` style **SHOULD** be applied.

> The `it()` cases **SHOULD** follow the [_Arrange/Act/Assert_ design pattern](https://java-design-patterns.com/patterns/arrange-act-assert/).

### `beforeAll`

This method is executed only once in the test block to provide the description of the test suites. This function is called once, before all the test specifications in a `describe` test suite are run.

### `afterAll`

This function is called once after all the test specifications in a test suite are finished.

### `beforeEach`

This function is called before each test specification has been run.

### `afterEach`

This function is called after each test specification has been run.

A `describe` function **MUST** define an `afterEach()` function in order to render the idle component that (at least) ensures a clean break between test cases.

## Available functions

In each case an optional enriching message can be included to prefix the logged output when the expect is executed.

> Note not all of these are fully implemented yet.

### `expect(x).toEqual(val, [message])`

Match the expected and actual result of the test.

### `expect(x).toBe(obj, [message])`

Asserts that expected and actual objects are the same - this caters for a deep equality of objects if necessary.

### `expect(x).toMatch(regexp, [message])`

Match the expected result is the same according to the given regular expression.

### `expect(x).toBeDefined([message])`

Method is used to check expected result is not/is `undefined`.

### `expect(x).toBeUndefined([message])`

Method is used to check expected result is `undefined` or not.

### `expect(x).toBeNull([message])`

Method is used to check expected result is `null` or not.

### `expect(x).toBeTruthy([message])`

Method is used to match the expected result is true or not i.e.
means expected result is a `Boolean` value.

### `expect(x).toBeFalsy([message])`

Method is used to match the expected result is false or not i.e. means expected result is a `Boolean` value.

### `expect(x).toContain(y, [message])`

Method is used to match the expected result contains the value of y.

### `expect(x).toBeGreaterThan(y, [message])`

Method is used to match the expected result is greater than y.

### `expect(x).toBeGreaterOrEqualTo(y, [message])`

### `expect(x).toBeLessThan(y, [message])`

### `expect(x).toBeLessOrEqualTo(y, [message])`

### `expect(fn).toThrow(string, [message])`

Method is used to throw any message from expected result.

### `expect(fn).toThrowError(string, [message])`

Method is used to throw any exception error from expected result.
