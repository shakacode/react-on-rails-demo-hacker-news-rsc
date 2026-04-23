const { config } = require('shakapacker');
const { resolve } = require('path');

// Keep React Flight client-reference discovery scoped to application code.
// The upstream default scans ".", which also includes CI's vendor/bundle gems.
const rscClientReferences = {
  directory: resolve(config.source_path),
  recursive: true,
  include: /\.(js|ts|jsx|tsx)$/,
};

module.exports = rscClientReferences;
