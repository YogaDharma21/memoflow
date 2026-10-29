import assert from "node:assert/strict"

function highlightMatch(text, query) {
  const q = query.trim()
  if (!q || !text) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return text

  const start = idx > 60 ? Math.max(0, idx - 30) : 0
  const snippet = (start > 0 ? "... " : "") + text.slice(start)

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

const longText = "a".repeat(80) + " keyword in the middle " + "b".repeat(80)
const res3 = highlightMatch(longText, "keyword")
assert(res3[0].startsWith("... "))
assert.deepEqual(res3[1], { mark: "keyword" })

console.log("highlight tests pass")
