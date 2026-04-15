// The source code including full typescript support is available at: 
// https://github.com/shakacode/react_on_rails_demo_ssr_hmr/blob/master/config/webpack/clientWebpackConfig.js

const commonWebpackConfig = require('./commonWebpackConfig');
const { config } = require('shakapacker');
const { RSCWebpackPlugin } = require('react-on-rails-rsc/WebpackPlugin');

const configureClient = () => {
  const clientConfig = commonWebpackConfig();

  // server-bundle is special and should ONLY be built by the serverConfig
  // In case this entry is not deleted, a very strange "window" not found
  // error shows referring to window["webpackJsonp"]. That is because the
  // client config is going to try to load chunks.
  delete clientConfig.entry['server-bundle'];

  // RSCWebpackPlugin currently relies on Webpack internals that are not yet available in Rspack.
  if (config.assets_bundler !== 'rspack') {
    clientConfig.plugins.push(
      new RSCWebpackPlugin({
        isServer: false,
        // Keep the RSC manifest scan inside application code so vendored gems
        // installed under the repo (for example, vendor/bundle in CI) do not
        // contribute stray client components.
        clientReferences: [{
          directory: './app/javascript',
          recursive: true,
          include: /\.(js|ts|jsx|tsx)$/,
        }],
      }),
    );
  }

  return clientConfig;
};

module.exports = configureClient;
