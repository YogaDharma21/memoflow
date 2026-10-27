const assert = require('assert');

// ponytail: verification seam for locked note masking across web/mobile views
function getNotePreview(note, unlocked) {
  if (note.important && !unlocked) {
    return '🔒 Locked note';
  }
  return note.body.trim() ? note.body : 'photo';
}

function shouldGateEdit(note, unlocked) {
  return Boolean(note.important && !unlocked);
}

// 1. Locked important note when locked -> masked
assert.strictEqual(
  getNotePreview({ important: true, body: 'Secret note' }, false),
  '🔒 Locked note'
);

// 2. Locked important note when unlocked -> revealed
assert.strictEqual(
  getNotePreview({ important: true, body: 'Secret note' }, true),
  'Secret note'
);

// 3. Regular note when locked -> visible
assert.strictEqual(
  getNotePreview({ important: false, body: 'Public note' }, false),
  'Public note'
);

// 4. Photo-only note when locked -> masked
assert.strictEqual(
  getNotePreview({ important: true, body: '' }, false),
  '🔒 Locked note'
);

// 5. Photo-only note when unlocked -> "photo"
assert.strictEqual(
  getNotePreview({ important: true, body: '' }, true),
  'photo'
);

// 6. Gating logic for edit sheet
assert.strictEqual(shouldGateEdit({ important: true }, false), true);
assert.strictEqual(shouldGateEdit({ important: true }, true), false);
assert.strictEqual(shouldGateEdit({ important: false }, false), false);

console.log('All locked note masking and gating assertions passed.');
