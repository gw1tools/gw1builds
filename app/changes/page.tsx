import { promises as fs } from 'fs'
import path from 'path'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "What's New | GW1 Builds",
  description: "See what's new in GW1 Builds",
}

type ReleaseEntry = {
  date: string
  title?: string
  items: string[]
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

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]?.trim()
      if (!line) continue

      // Check for **Title** format
      if (line.startsWith('**') && line.endsWith('**')) {
        title = line.slice(2, -2)
      }
      // Check for bullet points
      else if (line.startsWith('- ')) {
        items.push(line.slice(2))
      }
    }

    if (dateLine) {
      entries.push({ date: dateLine, title, items })
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
                          {item}
                        </li>
                      ))}
                    </ul>
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
