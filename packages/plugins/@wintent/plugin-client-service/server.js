const { createRequire } = require('node:module');

const require2 = createRequire(import.meta.url);
const packageJson = require2('./package.json');

if (packageJson?.main) {
  const main = require2(packageJson.main);
  module.exports = main;
}
