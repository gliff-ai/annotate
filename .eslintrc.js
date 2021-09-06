module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
      tsconfigRootDir: __dirname,
      project: ["./tsconfig.json"],
  },
  plugins: ["@typescript-eslint"],
  extends: [
      "eslint:recommended",
      "airbnb",
      "airbnb-typescript",
      "plugin:@typescript-eslint/recommended",
      "plugin:@typescript-eslint/recommended-requiring-type-checking",
      "prettier",
  ],
  overrides: [
      {
          files: ["*.ts", "*.tsx"],
          rules: {
              "global-require": 0,
              "import/extensions": 0,
              "@typescript-eslint/no-var-requires": 0,
              "no-void": ["error", { allowAsStatement: true }],
              "react/react-in-jsx-scope": "off", // This isn't true as of React 17
              "react/jsx-indent": "off", // this just argues with prettier, and we validate against prettier anyway
              "react/destructuring-assignment": "off", // This would be nice, but we call a lot of methods on props we pass down which rules it out
              "import/prefer-default-export": "off", // Most of the internet agrees this should be off
              "no-restricted-syntax": [
                  // AirBnb don't allow for...of loops. We do, but still want to restrict the rest. Huge argument here: https://github.com/airbnb/javascript/issues/1271
                  "error",
                  {
                      selector: "ForInStatement",
                      message:
                          "for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.",
                  },
                  {
                      selector: "LabeledStatement",
                      message:
                          "Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.",
                  },
                  {
                      selector: "WithStatement",
                      message:
                          "`with` is disallowed in strict mode because it makes code impossible to predict and optimize.",
                  },
              ],
              "react/static-property-placement": [2, "static public field"],
              "no-param-reassign": [2, { props: false }],
          },
      },
      {
          files: ["./*.js"],
          rules: {
              "@typescript-eslint/no-var-requires": "off",
          },
          env: {
              node: true,
          },
      },
      {
          files: ["*.test.*", "*.spec.*"],
          rules: {
              "@typescript-eslint/no-unsafe-member-access": "off",
          },
      },
  ],
};
