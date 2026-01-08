/**
 * @fileoverview Build creation page
 * @module app/new/page
 *
 * Full build creation form with:
 * - Auth check (redirects to auth modal if not logged in)
 * - Draft auto-save and recovery
 * - Mobile-first responsive layout
 * - Skill bar editors (1-8 bars)
 * - Rich text notes editor
 * - Tag selector
 * - Form validation
 */

import { Metadata } from 'next'
import { NewBuildForm } from './new-build-form'

export const metadata: Metadata = {
  title: 'Create Build',
  description: 'Create and share a new build.',
}

export default function NewBuildPage() {
  return <NewBuildForm />
}
