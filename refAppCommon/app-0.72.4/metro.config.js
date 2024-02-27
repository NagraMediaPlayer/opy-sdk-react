const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require("path");

const extraNodeModules = {
  node_modules: path.resolve(__dirname + "/node_modules/"),
};
const watchFolders = [path.resolve(__dirname + "/node_modules/")];

config = {
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
    sourceExts: ["js", "jsx", "ts", "tsx", "json"],
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

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
