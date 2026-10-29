import assert from "node:assert/strict";

console.log("Running blob URL revocation verification tests...");

// Mock URL.createObjectURL and URL.revokeObjectURL
const createdUrls = new Set();
const revokedUrls = new Set();
let idCounter = 0;

globalThis.URL = globalThis.URL || {};
globalThis.URL.createObjectURL = (file) => {
  const url = `blob:http://localhost/${++idCounter}`;
  createdUrls.add(url);
  return url;
};
globalThis.URL.revokeObjectURL = (url) => {
  revokedUrls.add(url);
};

// Test implementation of the blob URL tracking manager
function createBlobTracker() {
  const blobUrls = new Set();

  const createBlob = (file) => {
    const url = URL.createObjectURL(file);
    blobUrls.add(url);
    return url;
  };

  const revokeBlobUrl = (url) => {
    if (blobUrls.has(url)) {
      URL.revokeObjectURL(url);
      blobUrls.delete(url);
    }
  };

  const revokeAllBlobs = () => {
    blobUrls.forEach((url) => URL.revokeObjectURL(url));
    blobUrls.clear();
  };

  return { blobUrls, createBlob, revokeBlobUrl, revokeAllBlobs };
}

// 1. Single allocation and revocation on remove
{
  const tracker = createBlobTracker();
  const url1 = tracker.createBlob({ name: "p1.jpg" });
  assert.equal(tracker.blobUrls.has(url1), true);

  tracker.revokeBlobUrl(url1);
  assert.equal(tracker.blobUrls.has(url1), false);
  assert.equal(revokedUrls.has(url1), true);
}

// 2. Replacement revokes replaced photo
{
  const tracker = createBlobTracker();
  const oldUrl = tracker.createBlob({ name: "old.jpg" });
  const newUrl = tracker.createBlob({ name: "new.jpg" });

  tracker.revokeBlobUrl(oldUrl);
  assert.equal(tracker.blobUrls.has(oldUrl), false);
  assert.equal(tracker.blobUrls.has(newUrl), true);
  assert.equal(revokedUrls.has(oldUrl), true);
}

// 3. Revoke all on sheet close / unmount
{
  const tracker = createBlobTracker();
  const u1 = tracker.createBlob({ name: "1.jpg" });
  const u2 = tracker.createBlob({ name: "2.jpg" });
  const u3 = tracker.createBlob({ name: "3.jpg" });

  assert.equal(tracker.blobUrls.size, 3);
  tracker.revokeAllBlobs();
  assert.equal(tracker.blobUrls.size, 0);
  assert.equal(revokedUrls.has(u1), true);
  assert.equal(revokedUrls.has(u2), true);
  assert.equal(revokedUrls.has(u3), true);
}

console.log("All blob URL revocation tests PASSED!");
