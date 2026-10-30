import assert from "node:assert/strict";
import { calculateTargetDimensions, compressImage } from "../apps/web/lib/image.ts";

console.log("Running image compression and dimension bounding tests...");

// 1. Landscape image larger than maxDim (e.g. 4032 x 3024 iPhone photo)
{
  const { width, height } = calculateTargetDimensions(4032, 3024, 2048);
  assert.equal(width, 2048, "Landscape width should be capped at 2048");
  assert.equal(height, 1536, "Landscape height should preserve aspect ratio");
}

// 2. Portrait image larger than maxDim (e.g. 3024 x 4032)
{
  const { width, height } = calculateTargetDimensions(3024, 4032, 2048);
  assert.equal(width, 1536, "Portrait width should preserve aspect ratio");
  assert.equal(height, 2048, "Portrait height should be capped at 2048");
}

// 3. Square image larger than maxDim
{
  const { width, height } = calculateTargetDimensions(3000, 3000, 2048);
  assert.equal(width, 2048);
  assert.equal(height, 2048);
}

// 4. Image already within bounds (no upscaling)
{
  const { width, height } = calculateTargetDimensions(1200, 800, 2048);
  assert.equal(width, 1200, "Width within bounds should not change");
  assert.equal(height, 800, "Height within bounds should not change");
}

// 5. Exact boundary
{
  const { width, height } = calculateTargetDimensions(2048, 1080, 2048);
  assert.equal(width, 2048);
  assert.equal(height, 1080);
}

// 6. Zero / negative safety
{
  const dims = calculateTargetDimensions(0, 0, 2048);
  assert.ok(dims.width >= 1);
  assert.ok(dims.height >= 1);
}

// 7. compressImage non-image / svg / non-browser fallback
{
  const fakeFile = new File(["dummy text"], "test.txt", { type: "text/plain" });
  const result = await compressImage(fakeFile);
  assert.equal(result, fakeFile, "Non-image should return original file");

  const svgFile = new File(["<svg></svg>"], "icon.svg", { type: "image/svg+xml" });
  const svgResult = await compressImage(svgFile);
  assert.equal(svgResult, svgFile, "SVG should return original file");

  const gifFile = new File(["gif"], "anim.gif", { type: "image/gif" });
  const gifResult = await compressImage(gifFile);
  assert.equal(gifResult, gifFile, "GIF should return original file");
}

console.log("All image compression tests PASSED!");
