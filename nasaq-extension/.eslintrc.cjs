module.exports = {
  env: { browser: true, webextensions: true, es2022: true },
  overrides: [{ files: ['tests/*.mjs'], env: { node: true } }],
};
