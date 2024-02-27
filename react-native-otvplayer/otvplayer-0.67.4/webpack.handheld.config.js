const webpack = require("webpack");
const path = require("path");

module.exports = () => {
	let config = [
		{
			entry: "../src/index.js",
			externals: {
				react: "react",
				"react-native": "react-native",
			},
			output: {
				path: path.resolve(__dirname, "../dist/0.67.4"),
				filename: "react-otvplayer.min.js",
				libraryTarget: "umd",
				globalObject: "this",
				// clean: true, keep this commentd as this clears the web build files, if already published
			},
			module: {
				rules: [
					{
						test: /\.(tsx|ts)$/,
						exclude: [/node_modules/, /dist/, /examples/],
						loader: "ts-loader",
						options: {
							configFile: path.resolve(__dirname, "./tsconfig.handheld.json"),
						},
					},
				],
			},
			resolve: {
				modules: [path.resolve(__dirname),
					path.resolve(__dirname, "node_modules")],
				extensions: [".handheld.tsx", ".ts", ".js", ".tsx"],
			},
			// stats: "verbose"
		},
	];

	return config;
};
