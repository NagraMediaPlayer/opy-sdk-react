const log = console.log;
var beforeEachs = [];
var afterEachs = [];
var afterAlls = [];
var beforeAlls = [];
var totalTests = 0;
var skippedTests = 0;
var passedExpects = 0;
var failedExpects = 0;
var stats = [];
var currDesc = {
  it: [],
};

var currIt = {};

var _testExecutionTagConfig = { incl: [], excl: [] };

/**
 * var fn = kwuo.fn()
 * forEach([1,2], fn)
 * expect(fn.mock.calls.length).toBe(2)
 */
let kwuo = {
  fn: function (callback) {
    var calls = [];
    var returnValues = [];
    calls.push();
    if (callback) {
      callback();
    }
    return {
      mock: {
        calls: calls,
        returnValues: returnValues,
      },
    };
  },
  mock: function (params) {},
};

let _anyExistsInList = (_theList, _theItemToCheck) => {
  return _theList.some((arrVal) => _theItemToCheck === arrVal);
};

let _allExistsInList = (_theList, _theItemToCheck) => {
  return _theList.every((arrVal) => _theItemToCheck === arrVal);
};

function shouldIRunThisTestScenario(tagList) {
  let iShould = true;

  if (tagList) {
    if (!Array.isArray(tagList)) {
      tagList = tagList.split(" ");
    }

    for (let i = 0; i < _testExecutionTagConfig.incl.length; i++) {
      if (!_anyExistsInList(tagList, _testExecutionTagConfig.incl[i])) {
        iShould = false;
        break;
      }
    }

    for (let i = 0; i < tagList.length; i++) {
      if (_anyExistsInList(_testExecutionTagConfig.excl, tagList[i])) {
        iShould = false;
        break;
      }
    }
  }
  return iShould;
}

export function beforeEach(fn) {
  beforeEachs.push(fn);
}

export function afterEach(fn) {
  afterEachs.push(fn);
}

export function beforeAll(fn) {
  beforeAlls.push(fn);
}

export function afterAll(fn) {
  afterAlls.push(fn);
}

const deepEqual = (x, y) => {
  if (x === y) {
    return true;
  } else if (
    typeof x === "object" &&
    x !== null &&
    typeof y === "object" &&
    y !== null
  ) {
    if (Object.keys(x).length !== Object.keys(y).length) {
      return false;
    }

    for (var prop in x) {
      if (y.hasOwnProperty(prop)) {
        if (!deepEqual(x[prop], y[prop])) {
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  } else {
    return false;
  }
};

const logExpectResult = (currIt, message, expectPassed) => {
  currIt.expects.push({ name: message, status: expectPassed });
  if (expectPassed) {
    console.log(message);
    passedExpects++;
  } else {
    console.error(message);
    failedExpects++;
    throw new Error(message);
  }
};

// TODO if we have > 1 expect per test then it increments the counts of
// passes/fails confusingly.
export function expect(value) {
  return {
    // Match or Asserts that expected and actual objects are same.
    toBe: function (expected, message) {
      let output = `${message ? message : ""} Expected "${JSON.stringify(value)}" toBe "${JSON.stringify(
        expected
      )}"`;

      logExpectResult(currIt, output, value === expected);
    },

    // Match the expected and actual result of the test.
    toEqual: function (expected, message) {
      let output = `${message ? message : ""} Expected "${JSON.stringify(
        value
      )}" toEqual "${JSON.stringify(expected)}"`;

      logExpectResult(currIt, output, deepEqual(value, expected));
    },

    toEqualWithTolerance: function (expected, tolerance, message) {
      let output = `${message ? message : ""} Expected "${JSON.stringify(
        value
      )}" toEqualWithTolerance "${JSON.stringify(
        expected
      )} (within tolerance of ${tolerance})"`;

      let result =
        value >= expected - tolerance && value <= expected + tolerance;
      logExpectResult(currIt, output, result);
    },

    toBeInTheSet: function (expectedSet, message) {
      let output = `${message ? message : ""} Expected "${JSON.stringify(
        value
      )}" to toBeInTheSet "${JSON.stringify(expectedSet)}"`;

      let result = _anyExistsInList(expectedSet, value);

      logExpectResult(currIt, output, result);
    },

    not: {
      toBe: function (expected, message) {
        let output = `${message ? message : ""} Expected "${JSON.stringify(
          value
        )}" not.toBe "${JSON.stringify(expected)}"`;

        logExpectResult(currIt, output, value !== expected);
      },
      toEqual: function (expected, message) {
        let output = `${message ? message : ""} Expected "${JSON.stringify(
          value
        )}" not.toEqual "${JSON.stringify(expected)}"`;

        logExpectResult(currIt, output, !deepEqual(value, expected));
      },
      toBeUndefined: function (message) {
        let output = `${message ? message : ""} Expected "${JSON.stringify(value)}" not.toBeUndefined`;

        logExpectResult(currIt, output, typeof value !== "undefined");
      },
      toBeEmpty: function (message) {
        let output = `${message ? message : ""} Expected "${JSON.stringify(value)}" not.toBeEmpty`;
        const isNotEmpty = Object.keys(value).length !== 0;

        logExpectResult(currIt, output, isNotEmpty);
      },
    },

    toMatch: function (params) {},

    //Method is used to check expected result is defined or not.
    toBeDefined: function () {},

    toBeEmpty: function (message) {
      let output = `${message ? message : ""} Expected "${JSON.stringify(value)}" toBeEmpty`;
      const isEmpty = Object.keys(value).length === 0;

      logExpectResult(currIt, output, isEmpty);
    },

    //Method is used to check expected result is undefined or not.
    toBeUndefined: function (message) {
      let output = `${message ? message : ""} Expected "${JSON.stringify(value)}" toBeUndefined`;

      logExpectResult(currIt, output, typeof value === "undefined");
    },

    //Method is used to check expected result is null or not.
    toBeNull: function () {
      // TODO
    },

    //Method is used to check expected result is null or not.
    toBeTruthy: function () {
      // TODO
    },

    //Method is used to match the expected result is true or not i.e. means expected result is a Boolean value.
    toBeFalsy: function () {
      // TODO
    },

    //Method is used to match the expected result is false or not i.e. means expected result is a Boolean value.
    toContain: function (expected, message) {
      let output = `${message ? message : ""} Expected "${JSON.stringify(
        value
      )}" toContain "${JSON.stringify(expected)}"`;

      logExpectResult(currIt, output, value.incl(expected));
    },

    // Method is used to verify the value result is > the expected value.
    toBeGreaterThan: function (expected, message) {
      let output = `${message ? message : ""} Expected "${JSON.stringify(
        value
      )}" toBeGreaterThan "${JSON.stringify(expected)}"`;

      logExpectResult(currIt, output, value > expected);
    },

    // Method is used to verify the value result is < the expected value.
    toBeLessThan: function (expected, message) {
      let output = `${message ? message : ""} Expected "${JSON.stringify(
        value
      )}" toBeLessThan "${JSON.stringify(expected)}"`;

      logExpectResult(currIt, output, value < expected);
    },

    // Method is used to verify the value result is >= the expected value.
    toBeGreaterOrEqualTo: function (expected, message) {
      let output = `${message ? message : ""} Expected "${JSON.stringify(
        value
      )}" toBeGreaterOrEqualTo "${JSON.stringify(expected)}"`;

      logExpectResult(currIt, output, value >= expected);
    },

    // Method is used to verify the value result is <= the expected value.
    toBeLessOrEqualTo: function (expected, message) {
      let output = `${message ? message : ""} Expected "${JSON.stringify(
        value
      )}" toBeLessOrEqualTo "${JSON.stringify(expected)}"`;

      logExpectResult(currIt, output, value <= expected);
    },

    //Method is used to match the expected result is greater than y.
    toThrow: function (string) {
      // TODO
    },

    //Method is used to throw any message from expected result.
    toThrowError: function (string) {
      // TODO
    },
  };
}

export async function it() {
  let desc = arguments[0];
  let tags = ["@high_priority"];
  let fn;

  // Variable args to retain backwards compatibility with tests
  // that do not have tags yet
  if (typeof arguments[1] === "function") {
    fn = arguments[1];
  }
  if (typeof arguments[2] === "function") {
    fn = arguments[2];

    tags =
      typeof arguments[1] === "string" ? arguments[1].split(" ") : arguments[1];
  }

  currIt = {
    name: desc,
    expects: [],
    tags: tags,
    skipped: false,
  };
  totalTests++;

  console.info(`NEXT SCENARIO: ${currIt.name} [${currIt.tags.join(",")}]`);

  let tagsSayToRun = await shouldIRunThisTestScenario(tags);

  if (!tagsSayToRun) {
    currIt.skipped = true;
    skippedTests++;
    console.info(`SKIPPING: "${currIt.name}"`);
  } else {
    if (beforeEachs) {
      for (let index = 0; index < beforeEachs.length; index++) {
        console.log(`Before EACH: "${currIt.name}"`);
        await beforeEachs[index].apply(this);
      }
    }

    try {
      await fn.apply(this);
    } catch (testingException) {
      let message = `${currIt.name}: observed exception: ${testingException}`;
      console.error(message);
    }

    for (let index = 0; index < afterEachs.length; index++) {
      let details = `Auto test: After EACH [${totalTests}]\n`;
      details += `["${currIt.name}"]\n`;
      details += `[${currIt.tags.join(",")}]\n`;
      console.log(`After EACH: "${details}"`);
      await afterEachs[index].apply(this, [details]);
    }
  }
  currDesc.it.push(currIt);
}

export async function describe(desc, fn) {
  currDesc = {
    it: [],
  };
  currDesc.name = desc;

  try {
    for (var index = 0; index < beforeAlls.length; index++) {
      await beforeAlls[index].apply(this);
    }

    await fn.apply(this);

    for (var index = 0; index < afterAlls.length; index++) {
      console.log(`After ALL: "${currDesc.name}"`);
      await afterAlls[index].apply(this);
    }
  } catch (testingException) {
    let message = `${currDesc.name}: observed exception: ${testingException}`;
    console.error(message);
    // fail one of the current tests
    let failIt = {
      name: "Exception",
      expects: [{ name: testingException.message, status: false }],
    };
    currDesc.it.push(failIt);
  }

  stats.push(currDesc);

  // befores and afters should be specific to a `describe`.
  // reset them here
  beforeEachs = [];
  afterEachs = [];
  afterAlls = [];
  beforeAlls = [];
}

export function recordExceptionFailure(anException) {
  let failIt = {
    name: "Exception",
    expects: [{ name: anException.message, status: false }],
  };
  let failDesc = { name: "Exception", it: [] };
  failDesc.it.push(failIt);
  stats.push(failDesc);
}

export function showTestsResults() {
  console.log(`Total Test: ${totalTests}
    Test Suites: passed, total
    Expects: ${passedExpects} passed, ${failedExpects} failed
    Tests: ${totalTests} total

`);
  log("Test Suites");
  for (var index = 0; index < stats.length; index++) {
    var e = stats[index];
    const descName = e.name;
    const its = e.it;
    log(`Test Suite: "${descName}"`);
    for (var i = 0; i < its.length; i++) {
      var _e = its[i];
      log(`   Test Scenario: ${_e.skipped ? "SKIPPED " : ""}"${_e.name}"`);
      for (var ii = 0; ii < _e.expects.length; ii++) {
        const expect = _e.expects[ii];
        log(`      ${expect.status === true ? "√" : "X"} ${expect.name}`);
      }
    }
    log();
  }

  console.log("Junit: \n" + getJunitXml());
}

function getName(item) {
  let theName = item.name;
  if (item.name) {
    theName = item.name.replace(/&/g, "&amp;");
  }
  return theName;
}

export function getJunitXml(testConfig) {
  // FYI Schema at https://github.com/windyroad/JUnit-Schema/blob/master/JUnit.xsd
  let results = stats;
  const didExpectFail = (expect) => !expect.status;
  const didItFail = (it) => it.expects.some(didExpectFail);
  const wasItSkipped = (it) => it.skipped;

  const testsuiteName =
    testConfig && testConfig.deviceId ? testConfig.deviceId : "commonAutoTest";

  let junit = '<?xml version="1.0"?>\n';
  const failures = results.reduce(
    (total, describe) => total + describe.it.filter(didItFail).length,
    0
  );
  const tests = results.reduce(
    (total, describe) => total + describe.it.length,
    0
  );
  junit += `<testsuites name="${testsuiteName}" tests="${tests}" failures="${failures}" >\n`;
  for (const describe of results) {
    const describeFailureCount = describe.it.filter(didItFail).length;
    const describeSkipCount = describe.it.filter(wasItSkipped).length;
    junit += `    <testsuite name="${getName(describe)}" tests="${describe.it.length}" failures="${describeFailureCount}">\n`;
    for (const it of describe.it) {
      const itFailures = it.expects.filter(didExpectFail);
      if (it.skipped) {
        // do nothing
      } else {
        junit += `        <testcase name="${getName(it)}" class="${getName(describe)}"`;
        if (itFailures.length) {
          junit += ">\n";
          for (const failure of itFailures) {
            junit += `            <failure>\n`;
            junit += `                ${getName(failure)}\n`;
            junit += `            </failure>\n`;
          }
          junit += "        </testcase>\n";
        } else {
          junit += "/>\n";
        }
      }
    }
    junit += "    </testsuite>\n";
  }
  junit += "</testsuites>";
  return junit;
}

export async function setTestExecutionTagConfig(testExecutionTagConfig) {
  _testExecutionTagConfig = testExecutionTagConfig;
}
