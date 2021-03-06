/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',  // https://kulshekhar.github.io/ts-jest/docs/getting-started/presets
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: true,
  globals: {
    'ts-jest': {
      tsconfig: {
        noUncheckedIndexedAccess: false
      }
    }
  },
  "testPathIgnorePatterns": [
    "/node_modules/",  // default value
    "/tests/test.[jt]s"  // ignore translation test files
  ]
};