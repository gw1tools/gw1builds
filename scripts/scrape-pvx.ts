/**
 * @fileoverview Scrapes all builds from PvX Wiki
 * @module scripts/scrape-pvx
 *
 * Run with: npx tsx scripts/scrape-pvx.ts
 *
 * Fetches all build pages from PvX Wiki using the MediaWiki API
 * and saves raw data to lib/data/pvx-raw.json for normalization.
 *
 * This is Phase 1a of the PvX indexer - raw scraping.
 * Run scripts/normalize-pvx.ts after this to parse the wikitext.
 */

import { mkdir, writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type { RawPvxPage } from '../types/pvx'
import { PVX_CATEGORIES, PVX_API_URL, PVX_BASE_URL } from '../types/pvx'

// ============================================================================
// CONFIGURATION
// ============================================================================

const OUTPUT_DIR = path.join(process.cwd(), 'lib', 'data')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'pvx-raw.json')
const CACHE_FILE = path.join(OUTPUT_DIR, 'pvx-scrape-cache.json')

/** Concurrent page fetches */
const CONCURRENT_FETCHES = 5

/** Delay between API calls (ms) - be nice to Fandom servers */
const API_DELAY = 200

/** Retry configuration */
const RETRY_ATTEMPTS = 3
const RETRY_DELAY = 2000

/** User agent for API calls */
const USER_AGENT = 'GW1Builds/1.0 (https://gw1builds.com; pvx-scraper)'

// ============================================================================
// TYPES
// ============================================================================

interface CategoryMember {
  pageid: number
  ns: number
  title: string
}

interface CategoryResponse {
  batchcomplete?: string
  continue?: {
    cmcontinue: string
  }
  query: {
    categorymembers: CategoryMember[]
  }
}

interface ParseResponse {
  parse?: {
    title: string
    pageid: number
    wikitext: {
      '*': string
    }
    categories?: Array<{
      '*': string
    }>
  }
  error?: {
    code: string
    info: string
  }
}

interface ScrapeCache {
  fetchedPages: string[]
  lastRun: string
}

// ============================================================================
// HELPERS
// ============================================================================

/** Sleep for specified ms */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Fetch with retry logic */
async function fetchWithRetry(
  url: string,
  attempt = 1
): Promise<Response> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response
  } catch (error) {
    if (attempt < RETRY_ATTEMPTS) {
      console.log(`  ⚠️  Retry ${attempt}/${RETRY_ATTEMPTS}...`)
      await sleep(RETRY_DELAY * attempt)
      return fetchWithRetry(url, attempt + 1)
    }
    throw error
  }
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch all pages from a category, handling pagination
 */
async function fetchCategoryMembers(category: string): Promise<CategoryMember[]> {
  const members: CategoryMember[] = []
  let continueToken: string | undefined

  console.log(`\n📂 Fetching category: ${category}`)

  do {
    const params = new URLSearchParams({
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${category}`,
      cmlimit: '500',
      cmnamespace: '100', // Build namespace
      format: 'json',
    })

    if (continueToken) {
      params.set('cmcontinue', continueToken)
    }

    const url = `${PVX_API_URL}?${params}`
    const response = await fetchWithRetry(url)
    const data = (await response.json()) as CategoryResponse

    members.push(...data.query.categorymembers)
    continueToken = data.continue?.cmcontinue

    console.log(`   Found ${members.length} pages so far...`)
    await sleep(API_DELAY)
  } while (continueToken)

  console.log(`   ✅ Total: ${members.length} pages`)
  return members
}

/**
 * Fetch a single page's wikitext content
 */
async function fetchPageContent(title: string): Promise<{
  wikitext: string
  categories: string[]
} | null> {
  const params = new URLSearchParams({
    action: 'parse',
    page: title,
    prop: 'wikitext|categories',
    format: 'json',
  })

  const url = `${PVX_API_URL}?${params}`

  try {
    const response = await fetchWithRetry(url)
    const data = (await response.json()) as ParseResponse

    if (data.error) {
      console.log(`   ⚠️  Error fetching ${title}: ${data.error.info}`)
      return null
    }

    if (!data.parse) {
      console.log(`   ⚠️  No parse data for ${title}`)
      return null
    }

    return {
      wikitext: data.parse.wikitext['*'],
      categories: data.parse.categories?.map(c => c['*']) || [],
    }
  } catch (error) {
    console.log(`   ❌ Failed to fetch ${title}: ${error}`)
    return null
  }
}

// ============================================================================
// MAIN SCRAPER
// ============================================================================

async function scrapeAllBuilds(): Promise<RawPvxPage[]> {
  // Load cache if exists (for resuming interrupted scrapes)
  let cache: ScrapeCache = { fetchedPages: [], lastRun: '' }
  if (existsSync(CACHE_FILE)) {
    try {
      const cacheData = await readFile(CACHE_FILE, 'utf-8')
      cache = JSON.parse(cacheData)
      console.log(`📦 Loaded cache with ${cache.fetchedPages.length} already-fetched pages`)
    } catch {
      console.log('📦 Cache file corrupted, starting fresh')
    }
  }

  // Collect all unique page titles from all categories
  const allPages = new Map<number, CategoryMember>()

  for (const category of PVX_CATEGORIES) {
    const members = await fetchCategoryMembers(category)
    for (const member of members) {
      // Only add if we haven't seen this page ID before
      if (!allPages.has(member.pageid)) {
        allPages.set(member.pageid, member)
      }
    }
  }

  console.log(`\n📊 Total unique build pages: ${allPages.size}`)

  // Filter out already-fetched pages
  const pagesToFetch = Array.from(allPages.values()).filter(
    p => !cache.fetchedPages.includes(p.title)
  )

  console.log(`⏭️  Skipping ${allPages.size - pagesToFetch.length} already-fetched pages`)
  console.log(`📥 Fetching ${pagesToFetch.length} new pages...\n`)

  // Load existing raw data if resuming
  let rawPages: RawPvxPage[] = []
  if (existsSync(OUTPUT_FILE)) {
    try {
      const existingData = await readFile(OUTPUT_FILE, 'utf-8')
      rawPages = JSON.parse(existingData)
      console.log(`📄 Loaded ${rawPages.length} existing pages from previous run`)
    } catch {
      console.log('📄 Could not load existing data, starting fresh')
    }
  }

  // Fetch pages in batches
  const startTime = Date.now()
  let completed = 0
  const failed: string[] = []

  for (let i = 0; i < pagesToFetch.length; i += CONCURRENT_FETCHES) {
    const batch = pagesToFetch.slice(i, i + CONCURRENT_FETCHES)

    const results = await Promise.all(
      batch.map(async member => {
        const content = await fetchPageContent(member.title)
        await sleep(API_DELAY) // Rate limit

        if (!content) {
          return null
        }

        const page: RawPvxPage = {
          pageId: member.pageid,
          title: member.title,
          url: `${PVX_BASE_URL}/wiki/${encodeURIComponent(member.title.replace(/ /g, '_'))}`,
          categories: content.categories,
          wikitext: content.wikitext,
          fetchedAt: new Date().toISOString(),
        }

        return page
      })
    )

    // Add successful results
    for (let j = 0; j < results.length; j++) {
      if (results[j]) {
        rawPages.push(results[j]!)
        cache.fetchedPages.push(batch[j].title)
      } else {
        failed.push(batch[j].title)
      }
    }

    completed += batch.length

    // Progress indicator
    const percent = Math.round((completed / pagesToFetch.length) * 100)
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
    process.stdout.write(`\r[${percent}%] ${completed}/${pagesToFetch.length} pages (${elapsed}s elapsed)`)

    // Save cache periodically (every 50 pages)
    if (completed % 50 === 0) {
      cache.lastRun = new Date().toISOString()
      await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2))
    }
  }

  console.log('\n')

  // Report failures
  if (failed.length > 0) {
    console.log(`\n⚠️  Failed to fetch ${failed.length} pages:`)
    for (const f of failed.slice(0, 10)) {
      console.log(`   - ${f}`)
    }
    if (failed.length > 10) {
      console.log(`   ... and ${failed.length - 10} more`)
    }
  }

  return rawPages
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🎮 PvX Wiki Build Scraper\n')
  console.log('This script fetches all build pages from PvX Wiki.')
  console.log('It may take 5-15 minutes depending on server response.\n')

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true })
    console.log(`📁 Created directory: ${OUTPUT_DIR}\n`)
  }

  const startTime = Date.now()
  const rawPages = await scrapeAllBuilds()
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  // Save results
  console.log(`\n💾 Saving ${rawPages.length} pages to ${OUTPUT_FILE}...`)
  await writeFile(OUTPUT_FILE, JSON.stringify(rawPages, null, 2))

  // Clean up cache
  if (existsSync(CACHE_FILE)) {
    const { unlink } = await import('fs/promises')
    await unlink(CACHE_FILE)
    console.log('🧹 Cleaned up cache file')
  }

  console.log(`\n✅ Scraping complete in ${elapsed}s`)
  console.log(`📊 Saved ${rawPages.length} raw build pages`)
  console.log(`\n📌 Next step: Run 'npx tsx scripts/normalize-pvx.ts' to parse the wikitext`)
}

main().catch(error => {
  console.error('\n❌ Scraper failed:', error)
  process.exit(1)
})
