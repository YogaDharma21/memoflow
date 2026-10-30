import assert from "node:assert/strict";
import * as notesApi from "../packages/convex/convex/notes.ts";

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
      tags: n.tags,
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
      delete: async (id) => {
        const idx = store.notes.findIndex((n) => n._id === id);
        if (idx !== -1) store.notes.splice(idx, 1);
      },
      insert: async (table, doc) => {
        const item = { _id: `gen_${Date.now()}`, ...doc };
        store[table].push(item);
        return item._id;
      },
    },
    _store: store,
  };
}

async function runTests() {
  console.log("Running Hashtag extraction and filter tests...");

  // 1. extractTags helper
  {
    assert.deepEqual(notesApi.extractTags(""), []);
    assert.deepEqual(notesApi.extractTags("No hashtags here"), []);
    assert.deepEqual(notesApi.extractTags("#ideas"), ["#ideas"]);
    assert.deepEqual(
      notesApi.extractTags("Working on #fitness and #work-life with #ideas!"),
      ["#fitness", "#work-life", "#ideas"]
    );
    // Deduplication & case-insensitivity
    assert.deepEqual(notesApi.extractTags("#Work and #work and #WORK"), ["#work"]);
    // Pure numbers ignored (like issue references #123)
    assert.deepEqual(notesApi.extractTags("Issue #123 and #v2 and #42"), ["#v2"]);
    // Punctuation handling
    assert.deepEqual(notesApi.extractTags("(#alpha) [#beta] <#gamma>"), ["#alpha", "#beta", "#gamma"]);
  }

  // 2. Note creation auto-extracts tags
  {
    const ctx = createMockCtx();
    const id = await notesApi.create._handler(ctx, {
      body: "Drafting #strategy for #q4-goals",
      photoIds: [],
      createdAt: 1000,
    });
    const saved = ctx._store.notes.find((n) => n._id === id);
    assert.ok(saved);
    assert.deepEqual(saved.tags, ["#strategy", "#q4-goals"]);
  }

  // 3. Note update re-extracts tags
  {
    const ctx = createMockCtx({
      notes: [{ _id: "n1", body: "Old text #old", photoIds: [], important: false }],
    });
    await notesApi.update._handler(ctx, {
      id: "n1",
      body: "Updated note with #new_tag and #ideas",
      photoIds: [],
    });
    const updated = ctx._store.notes.find((n) => n._id === "n1");
    assert.deepEqual(updated.tags, ["#new_tag", "#ideas"]);
  }

  // 4. listMine backwards compatibility for legacy notes without tags field
  {
    const ctx = createMockCtx({
      notes: [{ _id: "legacy1", body: "Old unindexed #retro tag", photoIds: [], important: false }],
    });
    const list = await notesApi.listMine._handler(ctx, {});
    assert.deepEqual(list[0].tags, ["#retro"]);
  }

  // 5. Privacy: Locked notes must NEVER leak tags while locked
  {
    const ctxLocked = createMockCtx({
      pinHash: "secret_hash",
      notes: [
        { _id: "n_secret", body: "Secret info #classified", photoIds: [], important: true, tags: ["#classified"] },
        { _id: "n_public", body: "Public note #general", photoIds: [], important: false, tags: ["#general"] },
      ],
    });
    const lockedList = await notesApi.listMine._handler(ctxLocked, {});
    const secret = lockedList.find((n) => n._id === "n_secret");
    const pub = lockedList.find((n) => n._id === "n_public");

    assert.equal(secret.isLocked, true);
    assert.equal(secret.body, "");
    assert.deepEqual(secret.tags, [], "Locked note must return empty tags");

    assert.equal(pub.isLocked, false);
    assert.deepEqual(pub.tags, ["#general"]);

    // With correct pinHash
    const unlockedList = await notesApi.listMine._handler(ctxLocked, { pinHash: "secret_hash" });
    const unlockedSecret = unlockedList.find((n) => n._id === "n_secret");
    assert.equal(unlockedSecret.isLocked, false);
    assert.deepEqual(unlockedSecret.tags, ["#classified"]);
  }

  console.log("All Hashtag tests PASSED!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
