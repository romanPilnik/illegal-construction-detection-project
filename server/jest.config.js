import { createDefaultPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultPreset({
  useESM: true,
  tsconfig: "src/test/tsconfig.json",
}).transform;

/** @type {import("jest").Config} **/
export default {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  testMatch: ["**/src/test/**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": [
      "$1.ts",
      "$1.js",
      "$1/index.ts",
      "$1/index.js",
    ],
  },
};