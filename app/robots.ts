/**
 * @fileoverview Robots.txt configuration for crawler rules
 * @module app/robots
 *
 * Controls search engine crawler access to site content.
 * Allows crawling of public pages while blocking private/admin areas.
 */
import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/b/*', '/terms', '/privacy'],
      disallow: ['/api/*', '/auth/*', '/my-builds', '/new', '/design-system'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
