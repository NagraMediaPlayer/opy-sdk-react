//webpack
//Case 1:If RNINSIGHT_PROD value is true, by default it takes RN Plugin (production/release mode).
//Case 2:If it is false, then it takes RN Plugin (debug mode).
//Case 3:If RNINSIGHT_PROD value is undefined, then it takes RN Plugin (production/release mode)

//react-script
//Case 1:If REACT_APP_RNINSIGHT_PROD value is true, by default it takes RN Plugin (production/release mode).
//Case 2:If it is false, then it takes RN Plugin (debug mode).
//Case 3:If REACT_APP_RNINSIGHT_PROD value is undefined, then it takes RN Plugin (production/release mode)
let isProduction = true;
if (typeof process === "undefined") {
  isProduction = typeof RNINSIGHT_PROD === "undefined" ? true : RNINSIGHT_PROD;
} else {
  let rnInsightProd = true;
  if (process.env.REACT_APP_RNINSIGHT_PROD) {
    rnInsightProd = JSON.parse(
      process.env.REACT_APP_RNINSIGHT_PROD.toLowerCase()
    );
  }
  isProduction =
    typeof process.env.REACT_APP_RNINSIGHT_PROD === "undefined"
      ? true
      : rnInsightProd;
}
if (isProduction === true) {
  module.exports = require("./react-insight.js");
} else {
  module.exports = require("./react-insight-debug.js");
}
