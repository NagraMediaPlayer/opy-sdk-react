/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const path = require("path");

const extraNodeModules = {
	node_modules: path.resolve(__dirname + "/node_modules/"),
};
const watchFolders = [path.resolve(__dirname + "/node_modules/")];

module.exports = {
	resetCache: true,
	projectRoot: path.resolve(__dirname + "/../src"),
	transformer: {
		getTransformOptions: async () => ({
			transform: {
				experimentalImportSupport: false,
				inlineRequires: true,
			},
		}),
	},
	resolver: {
		sourceExts: ["js", "jsx", "ts", "tsx"],
		nodeModulesPaths: [path.resolve(__dirname)],
		extraNodeModules: new Proxy(extraNodeModules, {
			get: (target, name) =>
				//redirects dependencies referenced from src/ to local node_modules
				name in target
					? target[name]
					: path.join(process.cwd(), `node_modules/${name}`),
		}),
	},
	watchFolders,
};
