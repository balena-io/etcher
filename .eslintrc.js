module.exports = {
  extends: ["./node_modules/@balena/lint/config/.eslintrc.js"],
  root: true,
  ignorePatterns: ["node_modules/", "dist/", "examples/", "tests/"],
  rules: {
    "@typescript-eslint/no-floating-promises": "off",
    "@typescript-eslint/no-var-requires": "off",
  },
};
