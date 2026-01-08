/**
 * @fileoverview Downloads all GW1 skill icons from the wiki
 * @module scripts/download-skill-icons
 *
 * Run with: npx tsx scripts/download-skill-icons.ts
 *
 * Downloads skill icons from wiki.guildwars.com and saves them to
 * public/skills/{skill_id}.jpg for fast local serving.
 */

import { mkdir, writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const WIKI_BASE = 'https://wiki.guildwars.com/wiki/Special:Redirect/file'
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'skills')
const CONCURRENT_DOWNLOADS = 10 // Limit concurrent requests to avoid rate limiting
const RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000 // ms

interface SkillDesc {
  id: number
  name: string
}

/**
 * Converts skill name to wiki filename format
 */
function toWikiFilename(name: string): string {
  return name.replace(/ /g, '_')
}

/**
 * Downloads a single skill icon with retry logic
 */
async function downloadIcon(
  skillId: number,
  skillName: string,
  attempt = 1
): Promise<{ success: boolean; skillId: number; error?: string }> {
  const filename = toWikiFilename(skillName)
  const url = `${WIKI_BASE}/${encodeURIComponent(filename)}.jpg`
  const outputPath = path.join(OUTPUT_DIR, `${skillId}.jpg`)

  // Skip if already exists
  if (existsSync(outputPath)) {
    return { success: true, skillId }
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GW1Builds/1.0 (https://gw1builds.com; skill icon download)',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    await writeFile(outputPath, Buffer.from(buffer))

    return { success: true, skillId }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)

    if (attempt < RETRY_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
      return downloadIcon(skillId, skillName, attempt + 1)
    }

    return { success: false, skillId, error: errorMsg }
  }
}

/**
 * Process downloads in batches to limit concurrency
 */
async function downloadBatch(
  skills: Array<{ id: number; name: string }>,
  onProgress: (completed: number, total: number) => void
): Promise<{ succeeded: number; failed: Array<{ id: number; name: string; error: string }> }> {
  const failed: Array<{ id: number; name: string; error: string }> = []
  let completed = 0

  // Process in chunks
  for (let i = 0; i < skills.length; i += CONCURRENT_DOWNLOADS) {
    const batch = skills.slice(i, i + CONCURRENT_DOWNLOADS)
    const results = await Promise.all(
      batch.map(skill => downloadIcon(skill.id, skill.name))
    )

    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      if (!result.success) {
        failed.push({
          id: batch[j].id,
          name: batch[j].name,
          error: result.error || 'Unknown error',
        })
      }
    }

    completed += batch.length
    onProgress(completed, skills.length)
  }

  return { succeeded: skills.length - failed.length, failed }
}

async function main() {
  console.log('🎮 GW1 Skill Icon Downloader\n')

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true })
    console.log(`📁 Created directory: ${OUTPUT_DIR}\n`)
  }

  // Load skill descriptions
  console.log('📖 Loading skill data...')
  const skillDescPath = path.join(process.cwd(), 'lib', 'gw', 'data', 'skilldesc-en.json')
  const skillDescRaw = await readFile(skillDescPath, 'utf-8')
  const skillDescData = JSON.parse(skillDescRaw) as { skilldesc: Record<string, SkillDesc> }

  const skills = Object.values(skillDescData.skilldesc).map(s => ({
    id: s.id,
    name: s.name,
  }))

  console.log(`📊 Found ${skills.length} skills to download\n`)

  // Count existing files
  const existing = skills.filter(s => existsSync(path.join(OUTPUT_DIR, `${s.id}.jpg`))).length
  if (existing > 0) {
    console.log(`⏭️  Skipping ${existing} already downloaded icons\n`)
  }

  // Download all icons
  console.log('⬇️  Downloading icons...\n')
  const startTime = Date.now()

  const { succeeded, failed } = await downloadBatch(skills, (completed, total) => {
    const percent = Math.round((completed / total) * 100)
    const bar = '█'.repeat(Math.floor(percent / 2)) + '░'.repeat(50 - Math.floor(percent / 2))
    process.stdout.write(`\r[${bar}] ${percent}% (${completed}/${total})`)
  })

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n\n✅ Downloaded ${succeeded} icons in ${elapsed}s`)

  if (failed.length > 0) {
    console.log(`\n⚠️  Failed to download ${failed.length} icons:`)
    for (const f of failed.slice(0, 10)) {
      console.log(`   - ${f.id}: ${f.name} (${f.error})`)
    }
    if (failed.length > 10) {
      console.log(`   ... and ${failed.length - 10} more`)
    }

    // Save failed list for debugging
    const failedPath = path.join(OUTPUT_DIR, '_failed.json')
    await writeFile(failedPath, JSON.stringify(failed, null, 2))
    console.log(`\n📝 Full failed list saved to: ${failedPath}`)
  }

  console.log('\n🎉 Done!')
}

main().catch(console.error)
