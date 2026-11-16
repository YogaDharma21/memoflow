export type MarkdownBlock =
  | { type: "code"; lang?: string; content: string }
  | { type: "task"; checked: boolean; text: string; taskIndex: number }
  | { type: "text"; text: string }

export function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.split(/\r?\n/)
  const blocks: MarkdownBlock[] = []
  let inCodeBlock = false
  let codeLang = ""
  let codeLines: string[] = []
  let taskCount = 0

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      if (inCodeBlock) {
        blocks.push({
          type: "code",
          lang: codeLang,
          content: codeLines.join("\n"),
        })
        codeLines = []
        inCodeBlock = false
        codeLang = ""
      } else {
        inCodeBlock = true
        codeLang = line.trimStart().slice(3).trim()
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    const taskMatch = line.match(/^(\s*[-*]\s*\[)([ xX])\]\s*(.*)$/)
    if (taskMatch) {
      const checkedChar = taskMatch[2] ?? ""
      const taskText = taskMatch[3] ?? ""
      blocks.push({
        type: "task",
        checked: checkedChar.toLowerCase() === "x",
        text: taskText,
        taskIndex: taskCount++,
      })
      continue
    }

    blocks.push({ type: "text", text: line })
  }

  if (inCodeBlock && codeLines.length) {
    blocks.push({
      type: "code",
      lang: codeLang,
      content: codeLines.join("\n"),
    })
  }

  return blocks
}

export function toggleTaskInMarkdown(content: string, targetTaskIndex: number): string {
  const lines = content.split(/\r?\n/)
  let inCodeBlock = false
  let currentTaskIndex = 0

  const updatedLines = lines.map((line) => {
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock
      return line
    }
    if (inCodeBlock) {
      return line
    }
    const taskMatch = line.match(/^(\s*[-*]\s*\[)([ xX])\](.*)$/)
    if (taskMatch) {
      if (currentTaskIndex === targetTaskIndex) {
        currentTaskIndex++
        const checkedChar = taskMatch[2] ?? ""
        const isChecked = checkedChar.toLowerCase() === "x"
        const nextChar = isChecked ? " " : "x"
        const prefix = taskMatch[1] ?? ""
        const suffix = taskMatch[3] ?? ""
        return `${prefix}${nextChar}]${suffix}`
      }
      currentTaskIndex++
      return line
    }
    return line
  })

  return updatedLines.join("\n")
}

export function isSafeUrl(url: string): boolean {
  return /^(https?:\/\/|mailto:|\/)/i.test(url.trim())
}

export type InlineToken =
  | { type: "code"; text: string }
  | { type: "link"; text: string; href: string }
  | { type: "bold"; text: string }
  | { type: "text"; text: string }

export function parseInlineTokens(text: string): InlineToken[] {
  if (!text) return []

  const tokenRegex = /(`[^`]+`)|(\[([^\]]+)\]\(((?:https?:\/\/|mailto:|\/)[^\s)]+)\))|(\*\*([^*]+)\*\*)|(__([^_]+)__)/g
  const tokens: InlineToken[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(text)) !== null) {
    const matchStart = match.index
    if (matchStart > lastIndex) {
      tokens.push({ type: "text", text: text.slice(lastIndex, matchStart) })
    }

    const [fullMatch, inlineCode, , linkText, linkUrl, , boldAsterisk, , boldUnderscore] = match

    if (inlineCode) {
      tokens.push({ type: "code", text: inlineCode.slice(1, -1) })
    } else if (linkText && linkUrl) {
      tokens.push({ type: "link", text: linkText, href: linkUrl })
    } else if (boldAsterisk || boldUnderscore) {
      const boldText = boldAsterisk || boldUnderscore || ""
      tokens.push({ type: "bold", text: boldText })
    }

    lastIndex = matchStart + (fullMatch?.length ?? 0)
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", text: text.slice(lastIndex) })
  }

  return tokens
}
