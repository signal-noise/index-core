/* eslint-env node */
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint',
    "no-loops",
    "no-comments"],
  root: true,
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'import/extensions': 0,
    "no-console": 1,
    "no-loops/no-loops": 2,
    "no-comments/disallowComments": 1
  },
};
