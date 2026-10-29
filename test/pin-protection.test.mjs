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
              gte: (field, val) => {
                rows = rows.filter((r) => r[field] >= val);
                return filterHelper;
              },
              lte: (field, val) => {
                rows = rows.filter((r) => r[field] <= val);
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
  };
}

async function runTests() {
  console.log("Running PIN protection verification tests...");

  // 1. Settings - Never leaks pinHash over the wire
  {
    const ctxWithPin = createMockCtx({ pinHash: "secret_sha256_hash" });
    const res = await settingsApi.getMe._handler(ctxWithPin, {});
    assert.deepEqual(res, { hasPin: true }, "getMe must return hasPin: true");
    assert.equal(res.pinHash, undefined, "getMe must NEVER expose pinHash");

    const ctxNoPin = createMockCtx({ pinHash: null });
    const resNoPin = await settingsApi.getMe._handler(ctxNoPin, {});
    assert.deepEqual(resNoPin, { hasPin: false }, "getMe must return hasPin: false when unset");
  }

  // 2. PIN verification mutation
  {
    const ctx = createMockCtx({ pinHash: "correct_hash" });
    const ok = await settingsApi.verifyPin._handler(ctx, { pinHash: "correct_hash" });
    assert.equal(ok, true, "verifyPin returns true on match");

    const bad = await settingsApi.verifyPin._handler(ctx, { pinHash: "wrong_hash" });
    assert.equal(bad, false, "verifyPin returns false on wrong hash");
  }

  // 3. Redaction in notes:listMine
  {
    const sampleNotes = [
      { _id: "n1", important: true, body: "super confidential", photoIds: ["p1"], createdAt: 100 },
      { _id: "n2", important: false, body: "regular groceries", photoIds: ["p2"], createdAt: 200 },
    ];

    // Case A: User has PIN, query has no pinHash (locked state)
    const ctxLocked = createMockCtx({ pinHash: "pin_1234", notes: sampleNotes });
    const lockedList = await notesApi.listMine._handler(ctxLocked, {});
    const lockedNote = lockedList.find((n) => n._id === "n1");
    const regularNote = lockedList.find((n) => n._id === "n2");

    assert.equal(lockedNote.isLocked, true, "Important note must be marked isLocked");
    assert.equal(lockedNote.body, "", "Important note body must be redacted on server");
    assert.deepEqual(lockedNote.photoIds, [], "Important note photoIds must be redacted on server");
    assert.deepEqual(lockedNote.photoUrls, [], "Important note photoUrls must be redacted on server");

    assert.equal(regularNote.isLocked, false, "Regular note must not be locked");
    assert.equal(regularNote.body, "regular groceries", "Regular note body preserved");
    assert.equal(regularNote.photoIds.length, 1, "Regular note photoIds preserved");

    // Case B: User has PIN, query supplies wrong pinHash
    const badAuthList = await notesApi.listMine._handler(ctxLocked, { pinHash: "bad_pin" });
    const badAuthNote = badAuthList.find((n) => n._id === "n1");
    assert.equal(badAuthNote.isLocked, true, "Wrong pinHash keeps note locked");
    assert.equal(badAuthNote.body, "", "Wrong pinHash keeps body redacted");
    assert.deepEqual(badAuthNote.photoIds, [], "Wrong pinHash keeps photoIds redacted");

    // Case C: User has PIN, query supplies correct pinHash (unlocked state)
    const unlockedList = await notesApi.listMine._handler(ctxLocked, { pinHash: "pin_1234" });
    const unlockedNote = unlockedList.find((n) => n._id === "n1");
    assert.equal(unlockedNote.isLocked, false, "Correct pinHash unlocks note");
    assert.equal(unlockedNote.body, "super confidential", "Body is returned when unlocked");
    assert.equal(unlockedNote.photoIds.length, 1, "Photos are returned when unlocked");

    // Case D: User has no PIN configured
    const ctxNoPin = createMockCtx({ pinHash: null, notes: sampleNotes });
    const noPinList = await notesApi.listMine._handler(ctxNoPin, {});
    const n1 = noPinList.find((n) => n._id === "n1");
    assert.equal(n1.isLocked, false, "Notes are not locked if user has no PIN");
    assert.equal(n1.body, "super confidential", "Body visible if user has no PIN");

    // Case E: Windowed query filtering by createdAt range
    const windowedList = await notesApi.listMine._handler(ctxNoPin, { from: 150, to: 250 });
    assert.equal(windowedList.length, 1, "Windowed query returns only matching timestamp notes");
    assert.equal(windowedList[0]._id, "n2", "Windowed query matches note n2");

    // Case F: On-demand photo URL resolution via getPhotoUrls
    const resolvedUrls = await notesApi.getPhotoUrls._handler(ctxNoPin, { photoIds: ["p2"] });
    assert.deepEqual(resolvedUrls, { p2: "https://storage.mock/p2" }, "getPhotoUrls maps storage IDs to URLs");

    const ctxUnauth = createMockCtx({ userId: null, notes: sampleNotes });
    const unauthUrls = await notesApi.getPhotoUrls._handler(ctxUnauth, { photoIds: ["p2"] });
    assert.deepEqual(unauthUrls, {}, "getPhotoUrls returns empty map for unauthenticated caller");
  }

  // 4. Mutations block unauthenticated edits to locked notes
  {
    const sampleNotes = [
      { _id: "n1", important: true, body: "secret", photoIds: [] },
      { _id: "n2", important: false, body: "public", photoIds: [] },
    ];
    const ctx = createMockCtx({ pinHash: "valid_hash", notes: sampleNotes });

    // Update locked note without PIN throws
    await assert.rejects(
      async () => {
        await notesApi.update._handler(ctx, { id: "n1", body: "hacked", photoIds: [] });
      },
      /Locked note: PIN required/,
      "Updating locked note without PIN must reject"
    );

    // Update locked note with valid PIN succeeds
    await notesApi.update._handler(ctx, { id: "n1", body: "new secret", photoIds: [], pinHash: "valid_hash" });
    const updated = await ctx.db.get("n1");
    assert.equal(updated.body, "new secret", "Updating locked note with valid PIN succeeds");

    // Remove locked note without PIN throws
    await assert.rejects(
      async () => {
        await notesApi.remove._handler(ctx, { id: "n1" });
      },
      /Locked note: PIN required/,
      "Removing locked note without PIN must reject"
    );

    // Remove locked note with valid PIN succeeds
    await notesApi.remove._handler(ctx, { id: "n1", pinHash: "valid_hash" });
    const removed = await ctx.db.get("n1");
    assert.equal(removed, null, "Removing locked note with valid PIN succeeds");
  }

  console.log("All PIN protection verification tests PASSED!");
}

runTests();
