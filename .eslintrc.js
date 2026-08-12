module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
  },
  extends: ["prettier"],
  rules: {
    "no-console": "off",
    "no-unused-vars": ["warn", { args: "none", ignoreRestSiblings: true }],
    "no-undef": "error",
  },
};
