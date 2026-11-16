export const queryGeneric = (fn) =>
  typeof fn === "function" ? { _handler: fn, isQuery: true } : { ...fn, _handler: fn.handler, isQuery: true };
export const mutationGeneric = (fn) =>
  typeof fn === "function" ? { _handler: fn, isMutation: true } : { ...fn, _handler: fn.handler, isMutation: true };
export const actionGeneric = (fn) =>
  typeof fn === "function" ? { _handler: fn, isAction: true } : { ...fn, _handler: fn.handler, isAction: true };
export const internalQueryGeneric = queryGeneric;
export const internalMutationGeneric = mutationGeneric;
export const internalActionGeneric = actionGeneric;
export const httpActionGeneric = (fn) => fn;
export const defineSchema = (s) => s;
export const defineTable = (t) => {
  const table = { ...t };
  table.index = () => table;
  table.searchIndex = () => table;
  table.vectorIndex = () => table;
  return table;
};
