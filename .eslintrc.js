module.exports = {
  extends: ["@gliff-ai"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json", "./babel.config.json"],
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      rules: {},
    },
  ],
};
