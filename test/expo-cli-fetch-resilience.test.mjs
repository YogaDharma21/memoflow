import assert from 'node:assert';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

async function runTests() {
  console.log('Running Expo CLI fetch resilience verification tests...');

  const expoPath = require.resolve('expo/package.json', { paths: [path.join(__dirname, '../apps/mobile')] });
  const clientPath = require.resolve('@expo/cli/build/src/api/rest/client.js', { paths: [expoPath] });
  const validateDepsPath = require.resolve(
    '@expo/cli/build/src/start/doctor/dependencies/validateDependenciesVersions.js',
    { paths: [expoPath] }
  );

  const { isNetworkError } = require(clientPath);
  if (typeof isNetworkError === 'function') {
    assert.strictEqual(
      isNetworkError(new TypeError('fetch failed')),
      true,
      'isNetworkError must classify TypeError: fetch failed as a network error'
    );
    assert.strictEqual(
      isNetworkError({ code: 'ECONNRESET' }),
      true,
      'isNetworkError must classify ECONNRESET as a network error'
    );
    assert.strictEqual(
      isNetworkError({ code: 'ECONNREFUSED' }),
      true,
      'isNetworkError must classify ECONNREFUSED as a network error'
    );
  }

  // Verify validateDependenciesVersionsAsync does not crash on fetch failure
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.reject(new TypeError('fetch failed'));
  process.env.EXPO_NO_CACHE = '1';

  try {
    const { validateDependenciesVersionsAsync } = require(validateDepsPath);
    const exp = { sdkVersion: '54.0.0', name: 'mobile', slug: 'mobile' };
    const pkg = { name: 'mobile', version: '1.0.0', dependencies: {} };

    const result = await validateDependenciesVersionsAsync(
      path.join(__dirname, '../apps/mobile'),
      exp,
      pkg
    );

    assert(result !== undefined, 'validateDependenciesVersionsAsync should return without throwing');
    console.log('validateDependenciesVersionsAsync handled fetch failure without crashing.');
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.EXPO_NO_CACHE;
  }

  console.log('All Expo CLI fetch resilience tests PASSED!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
