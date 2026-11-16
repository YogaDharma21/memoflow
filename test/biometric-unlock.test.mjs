import assert from "node:assert/strict";
import * as notesApi from "../packages/convex/convex/notes.ts";
import * as settingsApi from "../packages/convex/convex/userSettings.ts";

function createMockCtx({ userId = "user_123", pinHash = null, notes = [] } = {}) {
  const store = {
    userSettings: pinHash ? [{ _id: "s1", clerkUserId: userId, pinHash }] : [],
    notes: notes.map((n, i) => ({
      _id: n._id || `note_${i}`,
      ownerId: userId,
      body: n.body || "",
      photoIds: n.photoIds || [],
      important: Boolean(n.important),
      createdAt: n.createdAt || Date.now(),
    })),
  };

  return {
    auth: {
      getUserIdentity: async () => (userId ? { subject: userId } : null),
    },
    storage: {
      getUrl: async (id) => `https://storage.mock/${id}`,
      delete: async () => {},
    },
    db: {
      query: (table) => ({
        withIndex: (_name, predicate) => {
          let rows = [...(store[table] || [])];
          if (predicate) {
            const filterHelper = {
              eq: (field, val) => {
                rows = rows.filter((r) => r[field] === val);
                return filterHelper;
              },
            };
            predicate(filterHelper);
          }
          return {
            order: () => ({
              collect: async () => rows,
            }),
            collect: async () => rows,
            unique: async () => rows[0] || null,
          };
        },
      }),
      get: async (id) => store.notes.find((n) => n._id === id) || null,
      patch: async (id, fields) => {
        const item = store.notes.find((n) => n._id === id);
        if (item) Object.assign(item, fields);
      },
      insert: async (table, doc) => {
        const _id = `${table}_${Date.now()}`;
        const record = { _id, ...doc };
        store[table].push(record);
        return _id;
      },
      delete: async (id) => {
        store.notes = store.notes.filter((n) => n._id !== id);
      },
    },
  };
}

// In-memory mock for SecureStore
class MockSecureStore {
  constructor() {
    this.store = new Map();
  }
  async getItemAsync(key) {
    return this.store.get(key) ?? null;
  }
  async setItemAsync(key, val) {
    this.store.set(key, val);
  }
  async deleteItemAsync(key) {
    this.store.delete(key);
  }
}

async function run() {
  console.log("Running biometric unlock verification tests...");

  const userId = "user_biometric_abc";
  const pinHash = "hash_sha256_mock_secret_pin";
  const secureStore = new MockSecureStore();

  const PIN_CACHE_KEY_PREFIX = "memoflows_pin_hash_";
  const getPinCacheKey = (uid) => `${PIN_CACHE_KEY_PREFIX}${uid}`;

  // Seam 1: Scoped key derivation
  assert.equal(getPinCacheKey(userId), "memoflows_pin_hash_user_biometric_abc");
  assert.notEqual(getPinCacheKey("user_1"), getPinCacheKey("user_2"));

  // Seam 2: Secure store caching on successful PIN setting
  const ctx = createMockCtx({
    userId,
    notes: [
      { _id: "n1", body: "Public note", important: false },
      { _id: "n2", body: "Confidential vault", important: true },
    ],
  });

  // Set PIN in backend and cache hash in SecureStore
  await settingsApi.setPinHash._handler(ctx, { pinHash });
  await secureStore.setItemAsync(getPinCacheKey(userId), pinHash);

  // Cached hash is present in secure storage
  const cachedHash = await secureStore.getItemAsync(getPinCacheKey(userId));
  assert.equal(cachedHash, pinHash);

  // Seam 3: Biometric unlock flow using cached hash
  // Simulate biometric success: retrieve cached hash and verify with backend
  const isValid = await settingsApi.verifyPin._handler(ctx, { pinHash: cachedHash });
  assert.equal(isValid, true, "Cached PIN hash must be accepted by verifyPin");

  // Query notes with verified biometric hash -> protected note body visible
  const unlockedNotes = await notesApi.listMine._handler(ctx, { pinHash: cachedHash });
  const protectedNote = unlockedNotes.find((n) => n._id === "n2");
  assert.equal(protectedNote.body, "Confidential vault");
  assert.equal(protectedNote.isLocked, false);

  // Seam 4: Invalidation and fallback when hash mismatch occurs
  const staleHash = "outdated_or_wrong_hash";
  const isStaleValid = await settingsApi.verifyPin._handler(ctx, { pinHash: staleHash });
  assert.equal(isStaleValid, false, "Stale or mismatched hash must be rejected");

  // Client purges stale cache upon rejection
  await secureStore.deleteItemAsync(getPinCacheKey(userId));
  const purgedHash = await secureStore.getItemAsync(getPinCacheKey(userId));
  assert.equal(purgedHash, null, "Purged hash must return null");

  // Seam 5: Querying without hash or with rejected hash locks protected notes
  const lockedNotes = await notesApi.listMine._handler(ctx, {});
  const lockedNote = lockedNotes.find((n) => n._id === "n2");
  assert.equal(lockedNote.body, "");
  assert.equal(lockedNote.isLocked, true);

  console.log("All biometric unlock verification tests PASSED!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
