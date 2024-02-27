// Copyright (c) 2020--2023 Nagravision SA. All rights reserved
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const rootDir = path.join(__dirname, '../..');
const webpackEnv = process.env.NODE_ENV || 'development';

let webCon = {
	mode: webpackEnv,
	entry: {
		app: path.join(rootDir, '/src/index.tsx'),
	},
	output: {
		path: path.join(rootDir, './dist/0.72.4'),
		filename: 'app-[hash].bundle.js',
	},
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.(tsx|ts|jsx|js|mjs)$/,
				exclude: [/node_modules/, /dist/, /examples/],
				loader: 'ts-loader',
				options: {
					configFile: path.resolve(__dirname, 'tsconfig.json'),
				},
			},
			{
				test: /(react-native-elements|react-native-vector-icons|react-native-ratings).*\.(ts|js)x?$/,
				loader: 'babel-loader',
				options: { presets: ['@babel/env', '@babel/preset-react'] },
			},
			{
				// Fix for nullish coalising operator (??) breaking Chrome Browsers < 80
				test: /(react-navigation).*\.(ts|js)x?$/,
				loader: 'babel-loader',
				options: {
					presets: ['@babel/env', '@babel/preset-react'],
					plugins: [
						'@babel/plugin-syntax-nullish-coalescing-operator',
					],
				},
			},
			{
				test: /\.(png|jpe?g|gif)$/i,
				loader: 'file-loader',
				options: {
					name: '[path][name].[ext]',
				},
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.join(rootDir, './src/public/index.html'),
		}),
		//If OTVPLAYER_PROD value is true, by default it takes RN Plugin (production/release mode).
		//If it is false, then it takes RN Plugin (debug mode).
		new webpack.DefinePlugin({
			OTVPLAYER_PROD: false,
		}),
		new webpack.HotModuleReplacementPlugin(),
	],
	resolve: {
		modules: [path.resolve(__dirname, './../node_modules')],
		extensions: [
			'.web.tsx',
			'.web.ts',
			'.tsx',
			'.ts',
			'.web.jsx',
			'.web.js',
			'.jsx',
			'.js',
			'.web.json',
		], // read files in fillowing order
		alias: Object.assign({
			'react-native$': 'react-native-web',
		}),
	},
	devServer: {
		static: {
			directory: path.join(__dirname, './dist/0.72.4'),
		},
		port: 4000,
		open: true,
	},
};

module.exports = webCon;
