const originalPerfHooks = require('perf_hooks');

// Your custom implementation of createHistogram
function _customCreateHistogram(options: any) {
  // Implement your polyfill logic here
  return {
    // Mock or polyfill methods as needed
    record: (value: any) => console.log(`Recorded value: ${value}`),
    // Other necessary methods...
  };
}

// Override the createHistogram function
originalPerfHooks.createHistogram = _customCreateHistogram;

// Older Bun builds exposed built-ins through require.cache, but newer builds may not.
const requireCache = (require as NodeJS.Require & { cache?: Record<string, { exports: unknown }> }).cache;

if (requireCache?.['perf_hooks']) {
  requireCache['perf_hooks'].exports = originalPerfHooks;
}
