import assert from "node:assert/strict";
import { extractImageFiles, filterImageFiles } from "../apps/web/lib/media.ts";

async function run() {
  console.log("Running media capture verification tests...");

  // 1. extractImageFiles: extracts only images from clipboard items
  {
    const mockFile1 = { name: "pic1.png", type: "image/png" };
    const mockFile2 = { name: "pic2.jpeg", type: "image/jpeg" };
    const items = [
      { type: "text/plain", getAsFile: () => ({ name: "notes.txt", type: "text/plain" }) },
      { type: "image/png", getAsFile: () => mockFile1 },
      { type: "application/json", getAsFile: () => null },
      { type: "image/jpeg", getAsFile: () => mockFile2 },
    ];

    const result = extractImageFiles(items);
    assert.equal(result.length, 2, "must extract exactly 2 images");
    assert.equal(result[0].name, "pic1.png");
    assert.equal(result[1].name, "pic2.jpeg");

    // Null/empty safety
    assert.deepEqual(extractImageFiles(null), []);
    assert.deepEqual(extractImageFiles([]), []);
  }

  // 2. filterImageFiles: filters files from drag-drop
  {
    const files = [
      { name: "photo.webp", type: "image/webp" },
      { name: "document.pdf", type: "application/pdf" },
      { name: "graphic.svg", type: "image/svg+xml" },
    ];

    const result = filterImageFiles(files);
    assert.equal(result.length, 2, "must keep only image files");
    assert.equal(result[0].name, "photo.webp");
    assert.equal(result[1].name, "graphic.svg");

    // Null/empty safety
    assert.deepEqual(filterImageFiles(null), []);
    assert.deepEqual(filterImageFiles([]), []);
  }

  console.log("All media capture tests passed successfully.");
}

run();
