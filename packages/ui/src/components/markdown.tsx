import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "cn"
import {
  parseMarkdownBlocks,
  parseInlineTokens,
  toggleTaskInMarkdown,
  type MarkdownBlock,
  type InlineToken,
} from "@workspace/ui/lib/markdown"

export {
  parseMarkdownBlocks,
  parseInlineTokens,
  toggleTaskInMarkdown,
  type MarkdownBlock,
  type InlineToken,
}

export interface MarkdownProps {
  content: string
  className?: string
  onToggleTask?: (taskIndex: number, nextChecked: boolean) => void
}

function renderInline(text: string): React.ReactNode[] {
  const tokens: InlineToken[] = parseInlineTokens(text)
  return tokens.map((token: InlineToken, i: number) => {
    const key = `${token.type}-${i}`
    if (token.type === "code") {
      return (
        <code
          key={key}
          className="rounded-[4px] border border-border/60 bg-surface-inset px-1 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {token.text}
        </code>
      )
    }
    if (token.type === "link") {
      return (
        <a
          key={key}
          href={token.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 transition-opacity hover:opacity-80"
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
        >
          {token.text}
        </a>
      )
    }
    if (token.type === "bold") {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {token.text}
        </strong>
      )
    }
    return <React.Fragment key={key}>{token.text}</React.Fragment>
  })
}

export function Markdown({ content, className, onToggleTask }: MarkdownProps) {
  const blocks: MarkdownBlock[] = parseMarkdownBlocks(content)

  return (
    <div className={cn("space-y-1 text-sm leading-relaxed", className)}>
      {blocks.map((block: MarkdownBlock, idx: number) => {
        if (block.type === "code") {
          return (
            <pre
              key={idx}
              className="my-1.5 overflow-x-auto rounded-[10px] border border-border bg-surface-inset p-2.5 font-mono text-xs text-foreground/90"
            >
              <code>{block.content}</code>
            </pre>
          )
        }

        if (block.type === "task") {
          return (
            <div key={idx} className="flex items-start gap-2 py-0.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={block.checked}
                disabled={!onToggleTask}
                className={cn(
                  "mt-0.5 flex size-4 flex-none items-center justify-center rounded-[4px] border transition-all duration-300 active:scale-95",
                  block.checked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface-inset hover:border-foreground/30",
                  onToggleTask ? "cursor-pointer" : "cursor-default opacity-80"
                )}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation()
                  onToggleTask?.(block.taskIndex, !block.checked)
                }}
              >
                {block.checked && <Check className="size-3 stroke-[2.5]" />}
              </button>
              <span
                className={cn(
                  "min-w-0 flex-1 break-words transition-opacity duration-200",
                  block.checked && "text-muted-foreground line-through opacity-70"
                )}
              >
                {renderInline(block.text)}
              </span>
            </div>
          )
        }

        if (!block.text) {
          return <div key={idx} className="h-1.5" />
        }

        return (
          <div key={idx} className="break-words">
            {renderInline(block.text)}
          </div>
        )
      })}
    </div>
  )
}
