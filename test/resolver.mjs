export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'convex/values') {
    return {
      format: 'module',
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export const v = { optional: (x) => x, string: () => ({}), boolean: () => ({}), number: () => ({}), id: () => ({}), array: () => ({}) };'),
    };
  }
  if (specifier === 'convex/server') {
    return {
      format: 'module',
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export const queryGeneric = (c) => ({ ...c, _handler: c.handler }); export const mutationGeneric = (c) => ({ ...c, _handler: c.handler }); export const actionGeneric = () => {}; export const httpActionGeneric = () => {}; export const internalActionGeneric = () => {}; export const internalMutationGeneric = () => {}; export const internalQueryGeneric = () => {};'),
    };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
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
