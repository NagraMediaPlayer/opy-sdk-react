module.exports = {
	preset: "react-native",
	testEnvironment: "jsdom",
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node", "d.ts"],
	rootDir: "../../",
	roots: ["./tests/web/"],
	collectCoverage: true,
	collectCoverageFrom: ["./src/web/**/*.ts"],
	coverageDirectory: "./tests/web/reports/coverage",
	reporters: ["default", ["jest-junit", { outputDirectory: "reports" }]],
};
