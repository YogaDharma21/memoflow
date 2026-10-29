import assert from "node:assert/strict";
import {
  parseMarkdownBlocks,
  toggleTaskInMarkdown,
  parseInlineTokens,
  isSafeUrl,
} from "../packages/ui/src/lib/markdown.ts";

// Test 1: parseMarkdownBlocks extracts text, tasks, and code blocks
{
  const input = [
    "Intro text with **bold** and `code`",
    "- [ ] Task 1",
    "- [x] Task 2",
    "```ts",
    "// - [ ] Not a task",
    "const x = 1",
    "```",
    "- [ ] Task 3",
  ].join("\n");

  const blocks = parseMarkdownBlocks(input);
  assert.equal(blocks.length, 5);

  assert.equal(blocks[0].type, "text");
  assert.equal(blocks[0].text, "Intro text with **bold** and `code`");

  assert.equal(blocks[1].type, "task");
  assert.equal(blocks[1].checked, false);
  assert.equal(blocks[1].text, "Task 1");
  assert.equal(blocks[1].taskIndex, 0);

  assert.equal(blocks[2].type, "task");
  assert.equal(blocks[2].checked, true);
  assert.equal(blocks[2].text, "Task 2");
  assert.equal(blocks[2].taskIndex, 1);

  assert.equal(blocks[3].type, "code");
  assert.equal(blocks[3].lang, "ts");
  assert.equal(blocks[3].content, "// - [ ] Not a task\nconst x = 1");

  assert.equal(blocks[4].type, "task");
  assert.equal(blocks[4].checked, false);
  assert.equal(blocks[4].text, "Task 3");
  assert.equal(blocks[4].taskIndex, 2);
}

// Test 2: toggleTaskInMarkdown toggles specific checkbox and ignores code blocks
{
  const input = [
    "Note heading",
    "- [ ] First",
    "```",
    "- [ ] Not this",
    "```",
    "- [x] Second",
    "  - [ ] Nested third",
  ].join("\n");

  // Toggle first task (index 0: - [ ] -> - [x])
  const toggled0 = toggleTaskInMarkdown(input, 0);
  assert.equal(
    toggled0,
    [
      "Note heading",
      "- [x] First",
      "```",
      "- [ ] Not this",
      "```",
      "- [x] Second",
      "  - [ ] Nested third",
    ].join("\n")
  );

  // Toggle second task (index 1: - [x] -> - [ ])
  const toggled1 = toggleTaskInMarkdown(input, 1);
  assert.equal(
    toggled1,
    [
      "Note heading",
      "- [ ] First",
      "```",
      "- [ ] Not this",
      "```",
      "- [ ] Second",
      "  - [ ] Nested third",
    ].join("\n")
  );

  // Toggle third task (index 2:   - [ ] ->   - [x]) preserving indentation
  const toggled2 = toggleTaskInMarkdown(input, 2);
  assert.equal(
    toggled2,
    [
      "Note heading",
      "- [ ] First",
      "```",
      "- [ ] Not this",
      "```",
      "- [x] Second",
      "  - [x] Nested third",
    ].join("\n")
  );

  // Out of range index leaves content unchanged
  const outOfRange = toggleTaskInMarkdown(input, 99);
  assert.equal(outOfRange, input);
}

// Test 3: parseInlineTokens handles bold, inline code, and links with URL safety
{
  const text = "Normal text **bold text** and `const a = 1` and [Link](https://example.com) plus [Unsafe](javascript:alert(1))";
  const tokens = parseInlineTokens(text);

  assert.deepEqual(tokens, [
    { type: "text", text: "Normal text " },
    { type: "bold", text: "bold text" },
    { type: "text", text: " and " },
    { type: "code", text: "const a = 1" },
    { type: "text", text: " and " },
    { type: "link", text: "Link", href: "https://example.com" },
    { type: "text", text: " plus [Unsafe](javascript:alert(1))" },
  ]);

  assert.equal(isSafeUrl("https://example.com"), true);
  assert.equal(isSafeUrl("http://example.com"), true);
  assert.equal(isSafeUrl("/relative/path"), true);
  assert.equal(isSafeUrl("mailto:test@example.com"), true);
  assert.equal(isSafeUrl("javascript:alert(1)"), false);
  assert.equal(isSafeUrl("data:text/html,..."), false);
}

console.log("Markdown parsing and task checklist tests passed.");
