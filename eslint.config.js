// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // React Three Fiber props (<mesh args>, <primitive object>) are not HTML attributes.
      "react/no-unknown-property": [
        "warn",
        {
          ignore: [
            "args",
            "attach",
            "object",
            "material",
            "map",
            "transparent",
            "depthWrite",
            "depthTest",
            "renderOrder",
            "side",
            "intensity",
            "visible",
          ],
        },
      ],
    },
  },
]);
