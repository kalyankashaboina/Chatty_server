// eslint.config.cjs
const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  ...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended'),
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
      },
      parser: '@typescript-eslint/parser',
    },
    env: {
      node: true,
      es2021: true,
    },
    rules: {
      // your rules here
    },
  },
];
