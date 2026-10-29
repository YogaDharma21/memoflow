import assert from "node:assert/strict";
import { getFlashbacks, groupFlashbacksByYear } from "../apps/web/lib/flashbacks.ts";

function runTests() {
  console.log("Running Flashbacks verification tests...");

  const cursor = new Date(2026, 9, 30, 12, 0, 0); // October 30, 2026

  const sampleNotes = [
    // Today (2026-10-30) - should NOT be included in flashbacks
    { _id: "n_today", createdAt: new Date(2026, 9, 30, 9, 0).getTime(), body: "Today note", photoIds: [], photoUrls: [], important: false, ownerId: "u1" },
    // 1 year ago (2025-10-30)
    { _id: "n_2025_1", createdAt: new Date(2025, 9, 30, 14, 0).getTime(), body: "1 year ago memo 1", photoIds: [], photoUrls: [], important: false, ownerId: "u1" },
    { _id: "n_2025_2", createdAt: new Date(2025, 9, 30, 10, 0).getTime(), body: "1 year ago memo 2", photoIds: [], photoUrls: [], important: false, ownerId: "u1" },
    // 2 years ago (2024-10-30)
    { _id: "n_2024", createdAt: new Date(2024, 9, 30, 18, 30).getTime(), body: "2 years ago memory", photoIds: [], photoUrls: [], important: true, ownerId: "u1" },
    // Different day, same year (2025-10-29) - should NOT be included
    { _id: "n_wrong_day", createdAt: new Date(2025, 9, 29, 14, 0).getTime(), body: "Wrong day note", photoIds: [], photoUrls: [], important: false, ownerId: "u1" },
    // Different month, same day (2025-11-30) - should NOT be included
    { _id: "n_wrong_month", createdAt: new Date(2025, 10, 30, 14, 0).getTime(), body: "Wrong month note", photoIds: [], photoUrls: [], important: false, ownerId: "u1" },
  ];

  // 1. getFlashbacks extracts notes from previous years on the exact calendar day
  {
    const flashbacks = getFlashbacks(sampleNotes, cursor);
    assert.equal(flashbacks.length, 3, "Only notes from 2025-10-30 and 2024-10-30 match");
    assert.equal(flashbacks[0]._id, "n_2025_1", "Sorted newest first");
    assert.equal(flashbacks[1]._id, "n_2025_2");
    assert.equal(flashbacks[2]._id, "n_2024");
  }

  // 2. groupFlashbacksByYear groups by year descending with yearsAgo count
  {
    const groups = groupFlashbacksByYear(sampleNotes, cursor);
    assert.equal(groups.length, 2, "Two distinct previous years");

    assert.equal(groups[0].year, 2025);
    assert.equal(groups[0].yearsAgo, 1);
    assert.equal(groups[0].notes.length, 2);

    assert.equal(groups[1].year, 2024);
    assert.equal(groups[1].yearsAgo, 2);
    assert.equal(groups[1].notes.length, 1);
    assert.equal(groups[1].notes[0]._id, "n_2024");
  }

  // 3. Empty or non-matching returns empty array
  {
    const emptyDate = new Date(2026, 0, 1);
    assert.deepEqual(getFlashbacks(sampleNotes, emptyDate), []);
    assert.deepEqual(groupFlashbacksByYear(sampleNotes, emptyDate), []);
  }

  console.log("All Flashbacks verification tests PASSED!");
}

runTests();
