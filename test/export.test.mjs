import assert from "node:assert/strict";
import fs from "node:fs";
import { execSync } from "node:child_process";
import * as exportApi from "../packages/convex/convex/export.ts";

function createMockCtx({
  userId = "user_456",
  pinHash = null,
  notes = [],
  storageBlobs = {},
} = {}) {
  const store = {
    userSettings: pinHash ? [{ _id: "s1", clerkUserId: userId, pinHash }] : [],
    notes: notes.map((n, i) => ({
      _id: n._id || `note_${i}`,
      ownerId: userId,
      body: n.body || "",
      photoIds: n.photoIds || [],
      important: Boolean(n.important),
      createdAt: n.createdAt || Date.now() - i * 1000,
    })),
    storageFiles: { ...storageBlobs },
    storedZips: [],
  };

  const db = {
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
  };

  const storage = {
    get: async (id) => {
      const item = store.storageFiles[id];
      if (!item) return null;
      return new Blob([item.data], { type: item.type || "image/jpeg" });
    },
    store: async (blob) => {
      const id = `storage_zip_${Date.now()}`;
      const buf = await blob.arrayBuffer();
      store.storedZips.push({ id, buf });
      return id;
    },
    getUrl: async (id) => `https://storage.mock/${id}`,
  };

  const auth = {
    getUserIdentity: async () => (userId ? { subject: userId } : null),
  };

  return {
    auth,
    db,
    storage,
    store,
    runQuery: async (fn, args) => {
      // In tests, route internal query handler directly
      return await exportApi.getExportData._handler({ auth, db }, args);
    },
  };
}

async function runTests() {
  console.log("Running export verification tests...");

  // 1. Markdown note formatting test
  {
    const note = {
      _id: "note_abc",
      body: "Meeting notes and action items",
      createdAt: 1729000000000,
      important: true,
    };
    const photos = ["photos/note_abc_1.jpg", "photos/note_abc_2.png"];
    const md = exportApi.buildMarkdown(note, photos);

    assert.ok(md.includes('id: "note_abc"'), "frontmatter contains id");
    assert.ok(md.includes("important: true"), "frontmatter contains important status");
    assert.ok(md.includes('- "../photos/note_abc_1.jpg"'), "frontmatter lists photo 1");
    assert.ok(md.includes("Meeting notes and action items"), "body included");
    assert.ok(
      md.includes("![Photo 1](../photos/note_abc_1.jpg)"),
      "markdown image link included"
    );
    assert.ok(
      md.includes("![Photo 2](../photos/note_abc_2.png)"),
      "markdown image link 2 included"
    );
  }

  // 2. Format note filename test
  {
    const filename = exportApi.formatNoteFilename(1729000000000, "note_xyz");
    assert.ok(filename.startsWith("notes/"), "filename is in notes/ folder");
    assert.ok(filename.endsWith("_note_xyz.md"), "filename ends with sanitized id and .md");
  }

  // 3. Security & PIN boundary tests in getExportData
  {
    const sampleNotes = [
      { _id: "n1", important: true, body: "Secret pin note", photoIds: ["p1"] },
      { _id: "n2", important: false, body: "Public grocery note", photoIds: [] },
    ];

    // Case A: User has PIN, query has no PIN -> must throw
    const ctxLocked = createMockCtx({ pinHash: "hash_pass_123", notes: sampleNotes });
    await assert.rejects(
      async () => {
        await exportApi.getExportData._handler(ctxLocked, {});
      },
      /PIN required/,
      "Must reject export when user has PIN and pinHash is missing"
    );

    // Case B: User has PIN, wrong PIN -> must throw
    await assert.rejects(
      async () => {
        await exportApi.getExportData._handler(ctxLocked, { pinHash: "wrong_hash" });
      },
      /PIN required/,
      "Must reject export when user provides wrong PIN hash"
    );

    // Case C: User has PIN, correct PIN -> exports all notes
    const unlockedData = await exportApi.getExportData._handler(ctxLocked, {
      pinHash: "hash_pass_123",
    });
    assert.equal(unlockedData.notes.length, 2, "Exports all notes with valid PIN");
    assert.equal(unlockedData.notes[0]._id, "n1");
    assert.equal(unlockedData.notes[0].body, "Secret pin note");

    // Case D: User has NO PIN -> exports directly without pinHash
    const ctxNoPin = createMockCtx({ pinHash: null, notes: sampleNotes });
    const noPinData = await exportApi.getExportData._handler(ctxNoPin, {});
    assert.equal(noPinData.notes.length, 2, "Exports without pin when user has no PIN");
  }

  // 4. End-to-end exportArchive action test (ZIP archive generation + storage)
  {
    const sampleNotes = [
      {
        _id: "n_arch_1",
        important: false,
        body: "Archive test note body",
        photoIds: ["photo_id_1"],
        createdAt: 1729000000000,
      },
    ];

    const ctx = createMockCtx({
      userId: "user_archiver",
      pinHash: null,
      notes: sampleNotes,
      storageBlobs: {
        photo_id_1: {
          data: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]), // JPEG magic bytes
          type: "image/jpeg",
        },
      },
    });

    const result = await exportApi.exportArchive._handler(ctx, {});
    assert.ok(result.downloadUrl.includes("https://storage.mock/"), "Returns download URL");
    assert.ok(result.filename.startsWith("memoflows-export-"), "Filename has date prefix");
    assert.ok(result.filename.endsWith(".zip"), "Filename ends in .zip");
    assert.equal(result.notesCount, 1, "noteCount matches");
    assert.equal(result.photosCount, 1, "photoCount matches");
    assert.equal(ctx.store.storedZips.length, 1, "Stored 1 zip in storage");

    // 5. Unpack and verify zip contents with Windows Expand-Archive or zip inspect
    const zipBuffer = Buffer.from(ctx.store.storedZips[0].buf);
    const testZipPath = "test-export-verify.zip";
    const testExtractDir = "test-export-extract";

    fs.writeFileSync(testZipPath, zipBuffer);

    try {
      execSync(
        `powershell -Command "Expand-Archive -Path ${testZipPath} -DestinationPath ${testExtractDir} -Force"`,
        { stdio: "ignore" }
      );

      // Verify data.json
      assert.ok(fs.existsSync(`${testExtractDir}/data.json`), "data.json exists");
      const jsonData = JSON.parse(fs.readFileSync(`${testExtractDir}/data.json`, "utf-8"));
      assert.equal(jsonData.notesCount, 1);
      assert.equal(jsonData.photosCount, 1);
      assert.equal(jsonData.notes[0].id, "n_arch_1");

      // Verify README.md
      assert.ok(fs.existsSync(`${testExtractDir}/README.md`), "README.md exists");

      // Verify notes/*.md
      const noteFiles = fs.readdirSync(`${testExtractDir}/notes`);
      assert.equal(noteFiles.length, 1, "1 markdown note extracted");
      const mdContent = fs.readFileSync(`${testExtractDir}/notes/${noteFiles[0]}`, "utf-8");
      assert.ok(mdContent.includes("Archive test note body"));
      assert.ok(mdContent.includes("![Photo 1](../photos/n_arch_1_1.jpg)"));

      // Verify photos/*
      const photoFiles = fs.readdirSync(`${testExtractDir}/photos`);
      assert.equal(photoFiles.length, 1, "1 photo extracted");
      assert.equal(photoFiles[0], "n_arch_1_1.jpg");
    } finally {
      if (fs.existsSync(testZipPath)) fs.unlinkSync(testZipPath);
      if (fs.existsSync(testExtractDir)) fs.rmSync(testExtractDir, { recursive: true, force: true });
    }
  }

  console.log("All export verification tests PASSED!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
