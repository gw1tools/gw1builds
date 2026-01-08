/**
 * @fileoverview Build edit page
 * @module app/b/[id]/edit/page
 *
 * Edit page for existing builds.
 * - Fetches build data on mount
 * - Checks ownership (redirects if not owner)
 * - Pre-populates form with existing data
 * - PATCH updates to API
 * - Delete button with confirmation
 */

import { Metadata } from 'next'
import { EditBuildForm } from './edit-build-form'

export const metadata: Metadata = {
  title: 'Edit Build',
  description: 'Edit your build.',
}

interface EditBuildPageProps {
  params: Promise<{ id: string }>
}

export default async function EditBuildPage({ params }: EditBuildPageProps) {
  const { id } = await params
  return <EditBuildForm buildId={id} />
}
