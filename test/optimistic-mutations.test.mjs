import assert from "node:assert/strict";

function createMockLocalStore(initialQueries = {}) {
  const store = new Map();
  for (const [key, val] of Object.entries(initialQueries)) {
    store.set(key, JSON.parse(JSON.stringify(val)));
  }

  const serialize = (func, args) => `${func.name || "func"}:${JSON.stringify(args || {})}`;

  return {
    getQuery(func, args) {
      return store.get(serialize(func, args));
    },
    setQuery(func, args, value) {
      store.set(serialize(func, args), JSON.parse(JSON.stringify(value)));
    },
    raw: store,
  };
}

function applyRemoveOptimistic(localStore, { id, pinHash }, activePinHash, listMineFunc) {
  const queryArgsList = [{}];
  if (activePinHash) queryArgsList.push({ pinHash: activePinHash });
  if (pinHash && pinHash !== activePinHash) queryArgsList.push({ pinHash });
  for (const qArgs of queryArgsList) {
    const current = localStore.getQuery(listMineFunc, qArgs);
    if (Array.isArray(current)) {
      localStore.setQuery(
        listMineFunc,
        qArgs,
        current.filter((n) => n._id !== id)
      );
    }
  }
}

function applySetImportantOptimistic(
  localStore,
  { id, important, pinHash },
  activePinHash,
  unlocked,
  listMineFunc
) {
  const queryArgsList = [{}];
  if (activePinHash) queryArgsList.push({ pinHash: activePinHash });
  if (pinHash && pinHash !== activePinHash) queryArgsList.push({ pinHash });
  for (const qArgs of queryArgsList) {
    const current = localStore.getQuery(listMineFunc, qArgs);
    if (Array.isArray(current)) {
      localStore.setQuery(
        listMineFunc,
        qArgs,
        current.map((n) =>
          n._id === id
            ? {
                ...n,
                important,
                isLocked: important ? Boolean(n.isLocked && !unlocked) : false,
              }
            : n
        )
      );
    }
  }
}

async function run() {
  const listMine = function listMine() {};

  // Test 1: Remove note removes target note from local query cache
  {
    const store = createMockLocalStore({
      "listMine:{}": [
        { _id: "n1", body: "hello", important: false },
        { _id: "n2", body: "world", important: true },
      ],
    });

    applyRemoveOptimistic(store, { id: "n1" }, null, listMine);
    const updated = store.getQuery(listMine, {});
    assert.equal(updated.length, 1);
    assert.equal(updated[0]._id, "n2");
  }

  // Test 2: Remove note updates both active pin query and default query if present
  {
    const store = createMockLocalStore({
      'listMine:{"pinHash":"pin_abc"}': [
        { _id: "n1", body: "secret", important: true },
        { _id: "n2", body: "other", important: false },
      ],
    });

    applyRemoveOptimistic(
      store,
      { id: "n1", pinHash: "pin_abc" },
      "pin_abc",
      listMine
    );
    const updated = store.getQuery(listMine, { pinHash: "pin_abc" });
    assert.equal(updated.length, 1);
    assert.equal(updated[0]._id, "n2");
  }

  // Test 3: Set important toggles to true optimistically
  {
    const store = createMockLocalStore({
      "listMine:{}": [
        { _id: "n1", body: "hello", important: false, isLocked: false },
      ],
    });

    applySetImportantOptimistic(
      store,
      { id: "n1", important: true },
      null,
      true,
      listMine
    );
    const updated = store.getQuery(listMine, {});
    assert.equal(updated[0].important, true);
    assert.equal(updated[0].isLocked, false);
  }

  // Test 4: Set important toggles to false optimistically and unlocks
  {
    const store = createMockLocalStore({
      "listMine:{}": [
        { _id: "n1", body: "hello", important: true, isLocked: true },
      ],
    });

    applySetImportantOptimistic(
      store,
      { id: "n1", important: false },
      null,
      false,
      listMine
    );
    const updated = store.getQuery(listMine, {});
    assert.equal(updated[0].important, false);
    assert.equal(updated[0].isLocked, false);
  }

  console.log("All optimistic mutation tests passed.");
}

run();
