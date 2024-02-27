const webpack = require("webpack");
const path = require("path");

module.exports = (env, argv) => {
	const isProd = argv.mode === "production" ? true : false;
	const sdkJSFilename = isProd ? "react-otvplayer" : "react-otvplayer-debug";
	const debugLoaders = [
		{
			test: /\.(tsx|ts)$/,
			loader: "ts-loader",
			options: {
				configFile: path.resolve(__dirname, "tsconfig.json")
			}
		},
		{
			test: /\.css$/i,
			use: ["style-loader", "css-loader"],
		},
	];
	const productionLoaders = [
		{
			test: /\.(tsx|ts)$/,
			loader: "string-replace-loader",
			options: {
				/**
				 * . matches any character (except for line terminators)
				 * logger matches the characters logger literally (case insensitive)
				 * . matches any character (except for line terminators)
				 * log matches the characters log literally (case insensitive)
				 * 1st Capturing Group (.*)
				 * . matches any character (except for line terminators)
				 * * matches the previous token between zero and unlimited times, as many times as possible, giving back as needed (greedy)
				 * ; matches the character ; with index 5910 (3B16 or 738) literally (case insensitive)
				 */
				search: /.*logger.log(.*);/g,
				replace: "",
			},
		},
		...debugLoaders,
	];

	return [
		{
			entry: "../src/index.js",
			mode: isProd ? "production" : "development",
			externals: {
				react: "react",
				"react-dom": "react-dom",
				"react-native-web": "react-native-web"
			},
			output: {
				path: path.resolve(__dirname, "../dist/0.72.4/web"),
				filename: `${sdkJSFilename}.js`,
				libraryTarget: "umd",
				globalObject: "this",
				//clean: true, //removed this code because we need to build code twice //yarn build-web-all // yarn build-web-publish
			},
			module: {
				rules: isProd ? [...productionLoaders] : [...debugLoaders],
			},
			resolve: {
				modules: [path.resolve(__dirname),
				path.resolve(__dirname, "node_modules"),
				path.resolve(__dirname, "web")],
				extensions: [".web.tsx", ".web.ts", ".tsx", ".ts", ".js"],
				alias: {
					"react-native$": "react-native-web",
				},
			},
			// stats: "verbose"
		},
	];
};
