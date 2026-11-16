import assert from "node:assert/strict"

function highlightMatch(text, query) {
  const q = query.trim()
  if (!q || !text) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return text

  const start = idx > 60 ? Math.max(0, idx - 30) : 0
  const end = Math.min(text.length, Math.max(start + 140, idx + q.length + 30))
  const snippet =
    (start > 0 ? "... " : "") +
    text.slice(start, end) +
    (end < text.length ? "..." : "")

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const parts = snippet.split(new RegExp(`(${escaped})`, "gi")).filter(Boolean)

  return parts.map((part) =>
    part.toLowerCase() === q.toLowerCase() ? { mark: part } : part
  )
}

assert.equal(highlightMatch("hello world", ""), "hello world")
assert.equal(highlightMatch("", "test"), "")
assert.equal(highlightMatch("hello world", "missing"), "hello world")

const res1 = highlightMatch("hello world", "WORLD")
assert.deepEqual(res1, ["hello ", { mark: "world" }])

const res2 = highlightMatch("test regex (special) [chars]", "(special)")
assert.deepEqual(res2, ["test regex ", { mark: "(special)" }, " [chars]"])

const longText = "a".repeat(80) + " keyword in the middle " + "b".repeat(800)
const res3 = highlightMatch(longText, "keyword")
assert(res3[0].startsWith("... "))
assert.deepEqual(res3[1], { mark: "keyword" })
assert(res3[2].endsWith("..."))
const totalLength = res3.reduce(
  (acc, part) => acc + (typeof part === "string" ? part.length : part.mark.length),
  0
)
assert(totalLength < 250)

console.log("highlight tests pass")
