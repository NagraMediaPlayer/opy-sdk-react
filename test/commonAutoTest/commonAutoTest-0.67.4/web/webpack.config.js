const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const rootDir = path.join(__dirname, "/../");
const webpackEnv = process.env.NODE_ENV || "development";
const webTsConfigFile = path.resolve(__dirname, "tsconfigweb.json");
const buildMode = process.argv[3];
let webCon = {
	mode: webpackEnv,
	entry: {
		app: path.join(rootDir, "../src/index.js"),
	},
	output: {
		path: path.resolve(__dirname, "../commonAutoTest-0.67.4/web/"),
		filename: "test.bundle.js",
	},
	devtool: buildMode === "development" ? "source-map" : false,
	performance:
		buildMode === "development" ? { hints: "warning" } : { hints: false },
	module: {
		// rules: [
		//   {
		//     test: /\.(tsx|ts|jsx|js|mjs)$/,
		//     exclude: /node_modules/,
		//     loader: 'ts-loader',
		//     options: {configFile: webTsConfigFile},
		//   },
		//   {
		//     test: /\.(png|jpe?g|gif)$/i,
		//     loader: 'file-loader',
		//     options: {
		//       name: '[path][name].[ext]',
		//     },
		//   },
		// ],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.join(rootDir, "../src/web/index.html"),
		}),
		//If OTVPLAYER_PROD value is true, by default it takes RN Plugin (production/release mode).
		//If it is false, then it takes RN Plugin (debug mode).
		new webpack.DefinePlugin({
			OTVPLAYER_PROD: false,
		}),
		new webpack.HotModuleReplacementPlugin(),
	],
	resolve: {
		modules: [path.resolve(__dirname, "../node_modules")],
		extensions: [
			".web.tsx",
			".web.ts",
			".tsx",
			".ts",
			".web.jsx",
			".web.js",
			".jsx",
			".js",
			".web.json",
		], // read files in fillowing order
		alias: Object.assign({
			"react-native$": "react-native-web",
		}),
	},
};

module.exports = webCon;
