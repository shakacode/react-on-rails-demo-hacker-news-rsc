const path = require('path');
const { createRequire } = require('module');

const { env } = process;
const rendererHost = env.RENDERER_HOST || (env.RAILS_ENV === 'production' ? '0.0.0.0' : 'localhost');
const rendererRequire = createRequire(require.resolve('react-on-rails-pro-node-renderer'));

const patchFastifyListenDefaultHost = (host) => {
  const fastifyPath = rendererRequire.resolve('fastify');
  const originalFastify = rendererRequire('fastify');

  if (originalFastify.__cpflowDefaultHostPatched) {
    return;
  }

  const patchedFastify = (...args) => {
    const app = originalFastify(...args);
    const originalListen = app.listen.bind(app);

    app.listen = (options, ...rest) => {
      if (typeof options === 'function') {
        return originalListen({ host }, options, ...rest);
      }

      if (options == null) {
        return originalListen({ host }, ...rest);
      }

      if (typeof options === 'object' && !Object.hasOwn(options, 'host')) {
        return originalListen({ ...options, host }, ...rest);
      }

      return originalListen(options, ...rest);
    };

    return app;
  };

  Object.assign(patchedFastify, originalFastify, { __cpflowDefaultHostPatched: true });
  Object.setPrototypeOf(patchedFastify, originalFastify);
  require.cache[fastifyPath].exports = patchedFastify;
};

patchFastifyListenDefaultHost(rendererHost);

const { reactOnRailsProNodeRenderer } = require('react-on-rails-pro-node-renderer');
const parseWorkersCount = (value) => {
  if (value == null || value === '') {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : null;
};

const configuredWorkersCount =
  parseWorkersCount(env.RENDERER_WORKERS_COUNT) ?? parseWorkersCount(env.NODE_RENDERER_CONCURRENCY);

const config = {
  serverBundleCachePath:
    env.RENDERER_SERVER_BUNDLE_CACHE_PATH || path.resolve(__dirname, '../tmp/.node-renderer-bundles'),
  // This package version ignores the configured host unless Fastify receives it at listen-time.
  host: rendererHost,
  port: Number(env.RENDERER_PORT) || 3800,
  logLevel: env.RENDERER_LOG_LEVEL || 'info',

  // See value in /config/initializers/react_on_rails_pro.rb
  password: env.RENDERER_PASSWORD || 'devPassword',

  // Number of Node.js worker threads for SSR rendering
  // Set RENDERER_WORKERS_COUNT env var to override (e.g., for production tuning)
  // Set to 0 for single-process mode (useful for debugging).
  // Legacy fallback: NODE_RENDERER_CONCURRENCY
  workersCount: configuredWorkersCount ?? 3,

  // If set to true, `supportModules` enables the server-bundle code to call a default set of NodeJS modules
  // that get added to the VM context: { Buffer, process, setTimeout, setInterval, clearTimeout, clearInterval }.
  // This option is required to equal `true` if you want to use loadable components.
  // Setting this value to false causes the NodeRenderer to behave like ExecJS
  supportModules: true,

  // Additional Node.js globals to add to the VM context.
  additionalContext: { URL, AbortController },

  // Required to use setTimeout, setInterval, & clearTimeout during server rendering
  stubTimers: false,

  // Replay console logs from async server operations
  replayServerAsyncOperationLogs: true,
};

// Renderer detects a total number of CPUs on virtual hostings like Heroku or CircleCI instead
// of CPUs number allocated for current container. This results in spawning many workers while
// only 1-2 of them really needed.
if (env.CI && configuredWorkersCount == null) {
  config.workersCount = 2;
}

reactOnRailsProNodeRenderer(config);
