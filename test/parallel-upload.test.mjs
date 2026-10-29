import assert from "node:assert/strict";

async function uploadDrafts(drafts, { getUploadUrl, uploadBlob }) {
  return Promise.all(
    drafts.map(async (p) => {
      if (p.kind === "stored") return p.storageId;
      const url = await getUploadUrl({});
      const storageId = await uploadBlob(url, p);
      return storageId;
    })
  );
}

// Test: preserves order and executes concurrently even when resolution is out of order
let active = 0;
let maxConcurrent = 0;
const delays = { p1: 50, p2: 10 };

const drafts = [
  { kind: "new", id: "p1" },
  { kind: "stored", storageId: "stored_abc" },
  { kind: "new", id: "p2" },
];

const results = await uploadDrafts(drafts, {
  getUploadUrl: async () => "https://upload.url",
  uploadBlob: async (url, p) => {
    active++;
    maxConcurrent = Math.max(maxConcurrent, active);
    await new Promise((r) => setTimeout(r, delays[p.id]));
    active--;
    return `stored_${p.id}`;
  },
});

assert.deepEqual(results, ["stored_p1", "stored_abc", "stored_p2"]);
assert.equal(maxConcurrent, 2, "uploads should run concurrently");
console.log("parallel upload test passed");
