const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("glb", "gltf", "bin", "hdr", "ktx2");

// three's CJS entry (picked when R3F does `require("three")`) calls the
// Node-only `process.emitWarning`, which crashes on React Native.
// Always resolve `three` to its ESM build instead.
const threeModule = path.resolve(__dirname, "node_modules/three/build/three.module.js");
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "three") {
    return { type: "sourceFile", filePath: threeModule };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });