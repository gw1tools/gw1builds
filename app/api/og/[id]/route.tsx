/**
 * @fileoverview OG Image API route
 * @module app/api/og/[id]/route
 *
 * Generates OG images for build sharing with skill icons.
 * Uses raw fetch to Supabase REST API (supabase-js has issues with JSONB in serverless).
 * Uses Node.js runtime for Buffer/base64 support.
 */
import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

const size = { width: 1200, height: 630 }

// Cache for 1 week, stale-while-revalidate for 1 month
const cacheHeaders = {
  'Cache-Control':
    'public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000',
}

const colors = {
  bgPrimary: '#18181b',
  bgSecondary: '#1f1f23',
  textPrimary: '#fafaf9',
  textMuted: '#6b6b70',
  border: '#3a3a42',
  accentGold: '#e8b849',
}

const professionColors: Record<string, string> = {
  Warrior: '#d4a855',
  Ranger: '#5bb98b',
  Monk: '#5b9bd5',
  Necromancer: '#4a9e7d',
  Mesmer: '#a78bda',
  Elementalist: '#e05555',
  Assassin: '#c97878',
  Ritualist: '#5bc5c5',
  Paragon: '#d4b855',
  Dervish: '#8bc55b',
  None: '#6b6b70',
}

const professionAbbrev: Record<string, string> = {
  Warrior: 'W',
  Ranger: 'R',
  Monk: 'Mo',
  Necromancer: 'N',
  Mesmer: 'Me',
  Elementalist: 'E',
  Assassin: 'A',
  Ritualist: 'Rt',
  Paragon: 'P',
  Dervish: 'D',
  None: '',
}

function getLayoutConfig(barCount: number) {
  if (barCount === 1) {
    return {
      iconSize: 80,
      gap: 8,
      rowGap: 10,
      profFontSize: 28,
      badgePadding: '6px 0',
      badgeWidth: 70,
    }
  } else if (barCount === 2) {
    return {
      iconSize: 68,
      gap: 8,
      rowGap: 12,
      profFontSize: 24,
      badgePadding: '5px 0',
      badgeWidth: 65,
    }
  } else if (barCount <= 4) {
    return {
      iconSize: 58,
      gap: 6,
      rowGap: 10,
      profFontSize: 20,
      badgePadding: '4px 0',
      badgeWidth: 58,
    }
  } else if (barCount <= 6) {
    return {
      iconSize: 50,
      gap: 5,
      rowGap: 8,
      profFontSize: 18,
      badgePadding: '3px 0',
      badgeWidth: 54,
    }
  } else {
    return {
      iconSize: 44,
      gap: 4,
      rowGap: 6,
      profFontSize: 16,
      badgePadding: '3px 0',
      badgeWidth: 50,
    }
  }
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    return `data:${contentType};base64,${base64}`
  } catch {
    return null
  }
}

function createErrorImage(message: string) {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bgPrimary,
        color: colors.textMuted,
        fontSize: 24,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {message}
    </div>,
    { ...size, headers: cacheHeaders }
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.NODE_ENV === 'development') {
    return createErrorImage('OG Image (disabled in dev)')
  }

  const { id } = await params

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gw1builds.com'

  if (!supabaseUrl || !supabaseKey) {
    return createErrorImage('Configuration error')
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/builds?select=id,name,bars,author:users!builds_author_id_fkey(username)&id=eq.${id}&deleted_at=is.null`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )

    if (!response.ok) {
      return createErrorImage('Database error')
    }

    const rows = await response.json()
    if (!rows || rows.length === 0) {
      return createErrorImage('Build not found')
    }

    const data = rows[0]
    const buildName = String(data.name || 'Untitled Build')
    const authorName = data.author?.username || null

    type Bar = { primary: string; secondary: string; skills: number[] }
    const bars = ((data.bars as Bar[]) || []).slice(0, 8)
    const config = getLayoutConfig(bars.length)

    // Collect all skill IDs from all bars
    const allSkillIds: number[] = []
    for (const bar of bars) {
      const skills = bar.skills || []
      for (let i = 0; i < 8; i++) {
        allSkillIds.push(skills[i] || 0)
      }
    }

    // Fetch all skill images in parallel
    const allSkillImages = await Promise.all(
      allSkillIds.map(async skillId => {
        if (skillId <= 0) return null
        return fetchImageAsBase64(`${siteUrl}/skills/${skillId}.jpg`)
      })
    )

    // Split images back into bars
    const barSkillImages: (string | null)[][] = []
    for (let i = 0; i < bars.length; i++) {
      barSkillImages.push(allSkillImages.slice(i * 8, (i + 1) * 8))
    }

    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: colors.bgPrimary,
          backgroundImage:
            'radial-gradient(ellipse 120% 80% at 50% 100%, rgba(40, 40, 45, 0.8) 0%, transparent 70%)',
          padding: '32px 40px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                fontSize: bars.length === 1 ? 44 : bars.length <= 4 ? 36 : 30,
                fontWeight: 700,
                color: colors.textPrimary,
                letterSpacing: '-0.025em',
              }}
            >
              {buildName}
            </div>
            {authorName && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 15,
                  color: colors.textMuted,
                  marginTop: 8,
                  letterSpacing: '0.01em',
                }}
              >
                by {authorName}
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 16,
              fontWeight: 600,
              color: colors.accentGold,
              opacity: 0.9,
              letterSpacing: '0.02em',
            }}
          >
            GW1Builds.com
          </div>
        </div>

        {/* Skill grid - centered */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: config.rowGap,
          }}
        >
          {bars.map((bar, rowIndex) => {
            const profColor =
              professionColors[bar.primary] || professionColors.None
            const profAbbrev = professionAbbrev[bar.primary] || '?'
            const secAbbrev =
              bar.secondary && bar.secondary !== 'None'
                ? `/${professionAbbrev[bar.secondary] || ''}`
                : ''
            const skillImages = barSkillImages[rowIndex]

            return (
              <div
                key={rowIndex}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                {/* Profession badge */}
                <div
                  style={{
                    display: 'flex',
                    padding: config.badgePadding,
                    backgroundColor: `${profColor}18`,
                    borderRadius: 5,
                    border: `1px solid ${profColor}35`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: config.badgeWidth,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: config.profFontSize,
                      fontWeight: 600,
                      color: profColor,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {profAbbrev}
                    {secAbbrev}
                  </span>
                </div>

                {/* Skills row */}
                <div style={{ display: 'flex', gap: config.gap }}>
                  {skillImages.map((img, colIndex) => {
                    return (
                      <div
                        key={colIndex}
                        style={{
                          width: config.iconSize,
                          height: config.iconSize,
                          borderRadius: 5,
                          overflow: 'hidden',
                          backgroundColor: colors.bgSecondary,
                          boxShadow: '2px 3px 0 rgba(0,0,0,0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {img ? (
                          <img
                            src={img}
                            width={config.iconSize}
                            height={config.iconSize}
                          />
                        ) : (
                          <div
                            style={{
                              width: config.iconSize * 0.22,
                              height: config.iconSize * 0.22,
                              borderRadius: config.iconSize * 0.11,
                              backgroundColor: colors.border,
                              opacity: 0.6,
                            }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>,
      { ...size, headers: cacheHeaders }
    )
  } catch (error) {
    console.error('[OG Image] Generation failed:', error)
    return createErrorImage('Failed to generate image')
  }
}
