/**
 * @fileoverview Dismiss thank-you modal endpoint
 * @module app/api/user/dismiss-thank-you/route
 *
 * POST /api/user/dismiss-thank-you - Dismiss the thank-you modal
 *
 * @requires Authentication - User must be logged in
 * @returns { success: boolean }
 * @throws {401} - If user is not authenticated
 * @throws {500} - If database update fails
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('users')
      .update({ show_thank_you: false })
      .eq('id', user.id)

    if (error) {
      console.error('Failed to dismiss thank-you modal:', {
        userId: user.id,
        errorCode: error.code,
      })
      return NextResponse.json(
        { error: 'Failed to dismiss' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Dismiss thank-you API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
