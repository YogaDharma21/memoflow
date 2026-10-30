import assert from "node:assert/strict";

function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function computeNoteTimestamp(cursor, now = new Date()) {
  return sameDay(cursor, now)
    ? now.getTime()
    : startOfDay(cursor).getTime() + (now.getTime() - startOfDay(now).getTime());
}

// 1. Past date preserves time-of-day components down to millisecond
{
  const cursor = new Date(2025, 5, 15); // past date
  const now = new Date(2026, 9, 29, 14, 32, 45, 678);
  const ts = computeNoteTimestamp(cursor, now);
  const result = new Date(ts);

  assert.equal(result.getFullYear(), 2025);
  assert.equal(result.getMonth(), 5);
  assert.equal(result.getDate(), 15);
  assert.equal(result.getHours(), 14);
  assert.equal(result.getMinutes(), 32);
  assert.equal(result.getSeconds(), 45);
  assert.equal(result.getMilliseconds(), 678);
}

// 2. Sequential notes in same hour do not collapse to identical milliseconds
{
  const cursor = new Date(2025, 5, 15);
  const t1 = new Date(2026, 9, 29, 14, 10, 0, 100);
  const t2 = new Date(2026, 9, 29, 14, 25, 30, 200);

  const ts1 = computeNoteTimestamp(cursor, t1);
  const ts2 = computeNoteTimestamp(cursor, t2);

  assert.notEqual(ts1, ts2, "Timestamps must not be identical");
  assert.ok(ts1 < ts2, "First note must sort before second note");
}

// 3. Today date returns exact current timestamp
{
  const now = new Date(2026, 9, 29, 10, 0, 0, 0);
  const cursor = new Date(2026, 9, 29, 1, 0, 0, 0); // same day, different time
  const ts = computeNoteTimestamp(cursor, now);

  assert.equal(ts, now.getTime());
}

console.log("All past note timestamp tests passed.");
