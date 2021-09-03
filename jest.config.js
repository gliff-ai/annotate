module.exports = {
  testEnvironment: "jsdom",

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8",

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  // setupFilesAfterEnv: ["./jest-setup.ts"],

  // The glob patterns Jest uses to detect test files
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ["/node_modules/", "dist/"],

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [
    // the package three contains ES6 modules, so it needs to be transpiled, so tell jest to ignore everything in node_modules except three
    // (would ignore everything in node_modules by default: https://jestjs.io/docs/en/configuration.html#transformignorepatterns-arraystring )
    "/node_modules/(?!three)/", // would normally be "/node_modules/"
    "\\.pnp\\.[^\\/]+$", // unchanged from default
  ],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    "\\.s?css$": "<rootDir>/src/testUtils/cssmock.js", // allows Jest to not die when importing a module that imports CSS
  },

  "transform": {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
};
