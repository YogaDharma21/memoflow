export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier === 'convex/values') {
      return { url: new URL('./mocks/convex-values.mjs', import.meta.url).href, format: 'module', shortCircuit: true };
    }
    if (specifier === 'convex/server') {
      return { url: new URL('./mocks/convex-server.mjs', import.meta.url).href, format: 'module', shortCircuit: true };
    }
    if (err.code === 'ERR_MODULE_NOT_FOUND' && (specifier.startsWith('./') || specifier.startsWith('../'))) {
      for (const ext of ['.ts', '.js', '/index.ts', '/index.js']) {
        try {
          return await nextResolve(specifier + ext, context);
        } catch {}
      }
    }
    throw err;
  }
}
