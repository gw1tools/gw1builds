/**
 * @fileoverview Dynamic sitemap generation for SEO
 * @module app/sitemap
 *
 * Generates sitemap.xml with all public builds and static pages.
 * Updates dynamically based on database content.
 */
import { MetadataRoute } from 'next'
import { createServerClient } from '@supabase/ssr'
import { SITE_URL } from '@/lib/constants'

// Create a static-compatible Supabase client (no cookies)
function createStaticClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages - always included even if DB fails
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  try {
    const supabase = createStaticClient()

    const { data: builds, error } = await supabase
      .from('builds')
      .select('id, updated_at')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Sitemap generation error:', error.code)
      return staticPages
    }

    const buildUrls: MetadataRoute.Sitemap =
      builds?.map(build => ({
        url: `${SITE_URL}/b/${build.id}`,
        lastModified: new Date(build.updated_at),
        changeFrequency: 'weekly',
        priority: 0.8,
      })) ?? []

    return [...staticPages, ...buildUrls]
  } catch (error) {
    console.error('Sitemap generation failed:', error)
    return staticPages
  }
}
