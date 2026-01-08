/**
 * @fileoverview OG Image capture and storage utilities
 * @module lib/services/og-image
 *
 * Captures build overview as an image and stores to Supabase Storage
 * for use as Open Graph preview images when sharing build URLs.
 *
 * USAGE (when build editing is implemented):
 * 1. After build save, call captureAndUploadOGImage with the overview ref
 * 2. The image is stored at `og-images/{buildId}.png`
 * 3. The public URL is returned for use in metadata
 *
 * @example
 * // In build save handler:
 * const ogImageUrl = await captureAndUploadOGImage(overviewRef, buildId)
 *
 * @see components/build/team-overview.tsx for the component to capture
 * @see app/b/[id]/page.tsx for metadata that will use these images
 *
 * TODO: When PRD-05 (build editing) is implemented:
 * 1. Create 'og-images' bucket in Supabase Storage (public)
 * 2. Call this from the build save flow
 * 3. Update generateMetadata to include og:image URL
 */

import { toPng } from 'html-to-image'
import { createClient } from '@/lib/supabase/client'

/** Storage bucket name for OG images */
const OG_BUCKET = 'og-images'

/** Base URL for Supabase storage (set in env) */
const STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

/**
 * Captures a DOM element as PNG and uploads to Supabase Storage
 *
 * @param element - DOM element to capture (e.g., TeamOverview ref)
 * @param buildId - Build ID for the filename
 * @returns Public URL of the uploaded image, or null on failure
 *
 * @example
 * const ogUrl = await captureAndUploadOGImage(overviewRef.current, 'abc123')
 * if (ogUrl) {
 *   // Image uploaded successfully
 * }
 */
export async function captureAndUploadOGImage(
  element: HTMLElement,
  buildId: string
): Promise<string | null> {
  try {
    // Generate PNG from the element
    const dataUrl = await toPng(element, {
      backgroundColor: '#18181b', // bg-bg-primary
      pixelRatio: 2, // High resolution for crisp sharing
      // OG images should be 1200x630 ideally
      // The component should be sized appropriately
    })

    // Convert data URL to blob
    const response = await fetch(dataUrl)
    const blob = await response.blob()

    // Upload to Supabase Storage
    const supabase = createClient()
    const filePath = `${buildId}.png`

    const { error } = await supabase.storage
      .from(OG_BUCKET)
      .upload(filePath, blob, {
        contentType: 'image/png',
        upsert: true, // Overwrite if exists (for updates)
      })

    if (error) {
      console.error('[captureAndUploadOGImage] Upload failed:', error)
      return null
    }

    // Return public URL
    return `${STORAGE_URL}/storage/v1/object/public/${OG_BUCKET}/${filePath}`
  } catch (error) {
    console.error('[captureAndUploadOGImage] Capture failed:', error)
    return null
  }
}

/**
 * Gets the public URL for a build's OG image
 *
 * @param buildId - Build ID
 * @returns Public URL (does not verify if image exists)
 */
export function getOGImageUrl(buildId: string): string {
  return `${STORAGE_URL}/storage/v1/object/public/${OG_BUCKET}/${buildId}.png`
}

/**
 * Deletes a build's OG image from storage
 *
 * @param buildId - Build ID
 * @returns true if deleted successfully
 */
export async function deleteOGImage(buildId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.storage
      .from(OG_BUCKET)
      .remove([`${buildId}.png`])

    if (error) {
      console.error('[deleteOGImage] Delete failed:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[deleteOGImage] Error:', error)
    return false
  }
}
