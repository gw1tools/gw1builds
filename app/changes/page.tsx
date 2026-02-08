import { promises as fs } from 'fs'
import path from 'path'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "What's New | GW1 Builds",
  description: "See what's new in GW1 Builds",
}

type DetailsBlock = {
  summary: string
  items: string[]
}

type ReleaseEntry = {
  date: string
  title?: string
  items: string[]
  details: DetailsBlock[]
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  // Match **bold**, [text](url), and plain text segments
  const regex = /(\*\*(.+?)\*\*)|(\[([^\]]+)\]\(([^)]+)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      // Bold text
      nodes.push(
        <strong key={match.index} className="font-semibold text-text-primary">
          {match[2]}
        </strong>
      )
    } else if (match[3]) {
      // Link
      nodes.push(
        <a
          key={match.index}
          href={match[5]}
          className="text-accent-blue hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {match[4]}
        </a>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

function parseChangelog(markdown: string): ReleaseEntry[] {
  const entries: ReleaseEntry[] = []

  // Remove the main title
  const content = markdown.replace(/^# What's New\n+/, '')

  // Split by date headers (## Month Day, Year)
  const sections = content.split(/^## /m).filter(Boolean)

  for (const section of sections) {
    const lines = section.trim().split('\n')
    const dateLine = lines[0]?.trim()

    if (!dateLine) continue

    let title: string | undefined
    const items: string[] = []
    const details: DetailsBlock[] = []

    let inDetails = false
    let currentSummary = ''
    let currentDetailItems: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i] ?? ''
      const trimmed = line.trim()

      // Handle <details> blocks
      if (trimmed === '<details>') {
        inDetails = true
        currentSummary = ''
        currentDetailItems = []
        continue
      }

      if (trimmed === '</details>') {
        if (inDetails && currentSummary) {
          details.push({ summary: currentSummary, items: currentDetailItems })
        }
        inDetails = false
        continue
      }

      if (inDetails) {
        const summaryMatch = trimmed.match(/^<summary>(.+?)<\/summary>$/)
        if (summaryMatch) {
          currentSummary = summaryMatch[1] ?? ''
          continue
        }
        if (trimmed.startsWith('- ')) {
          currentDetailItems.push(trimmed.slice(2))
        }
        continue
      }

      // Regular content (outside <details>)
      if (!trimmed) continue

      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        title = trimmed.slice(2, -2)
      } else if (trimmed.startsWith('- ')) {
        items.push(trimmed.slice(2))
      }
    }

    if (dateLine) {
      entries.push({ date: dateLine, title, items, details })
    }
  }

  return entries
}

export default async function ChangesPage() {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')
  let entries: ReleaseEntry[] = []

  try {
    const content = await fs.readFile(changelogPath, 'utf-8')
    entries = parseChangelog(content)
  } catch {
    // No changelog file
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        {/* Card container */}
        <div>
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-semibold text-text-primary tracking-tight">
              What&apos;s New
            </h1>
          </header>

          {entries.length > 0 ? (
            <div className="space-y-12">
              {entries.map((entry, index) => (
                <article key={index}>
                  {/* Date */}
                  <time className="text-sm font-medium text-text-muted uppercase tracking-wider">
                    {entry.date}
                  </time>

                  {/* Title (if present) */}
                  {entry.title && (
                    <h2 className="mt-2 text-xl font-medium text-text-primary">
                      {entry.title}
                    </h2>
                  )}

                  {/* Items */}
                  {entry.items.length > 0 && (
                    <ul className="mt-4 space-y-3">
                      {entry.items.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="text-text-secondary leading-relaxed pl-4 border-l-2 border-border"
                        >
                          {renderInlineMarkdown(item)}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Collapsible detail sections */}
                  {entry.details.length > 0 && (
                    <div className="mt-6 space-y-2">
                      {entry.details.map((block, blockIndex) => (
                        <details
                          key={blockIndex}
                          className="group rounded-lg border border-border bg-bg-card overflow-hidden"
                        >
                          <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-hover transition-colors select-none">
                            <svg
                              className="h-4 w-4 shrink-0 text-text-muted transition-transform group-open:rotate-90"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                            >
                              <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
                            </svg>
                            {renderInlineMarkdown(block.summary)}
                          </summary>
                          <div className="border-t border-border px-4 py-3">
                            <ul className="space-y-2">
                              {block.items.map((item, itemIndex) => (
                                <li
                                  key={itemIndex}
                                  className="text-sm text-text-secondary leading-relaxed pl-4 border-l-2 border-border"
                                >
                                  {renderInlineMarkdown(item)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-text-muted">No updates yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
