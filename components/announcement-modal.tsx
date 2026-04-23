'use client'

/**
 * @fileoverview Generic announcement modal
 *
 * Shows when profile.show_announcement === true AND account is older than 7 days.
 * Any CTA dismisses and flips the flag to false server-side.
 *
 * Operational pattern for future campaigns:
 *   1. Update the copy + visual below.
 *   2. Deploy.
 *   3. In Supabase: UPDATE users SET show_announcement = true;
 *
 * Column default is TRUE so users signing up between campaigns still see the
 * current campaign once they age past 7 days. If the team wants a quiet period
 * with no active announcement, run UPDATE users SET show_announcement = false;
 * and change the column default in a follow-up migration.
 *
 * Current campaign: introducing GW1 Tactics.
 */

import { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { Modal, ModalBody } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { TACTICS_URL } from '@/lib/constants'
import { isAccountOldEnough } from '@/lib/announcements'

export function AnnouncementModal() {
  const { profile, refreshProfile } = useAuth()
  // Local override so the modal closes optimistically on dismiss without
  // waiting for the profile round-trip. Derived `isOpen` stays in sync with
  // any external profile change (sign-out, admin retrigger, etc.).
  const [dismissed, setDismissed] = useState(false)

  const shouldShow =
    profile?.show_thank_you !== true &&
    profile?.show_announcement === true &&
    isAccountOldEnough(profile?.created_at)

  const isOpen = shouldShow && !dismissed

  const dismiss = async () => {
    try {
      const response = await fetch('/api/user/dismiss-announcement', {
        method: 'POST',
      })
      if (response.ok) {
        await refreshProfile()
      }
    } catch {
      // Swallow — modal closes regardless; worst case it reappears next load.
    }
  }

  const handleDismiss = async () => {
    // Close optimistically; flag flip + profile refresh run in the background.
    setDismissed(true)
    await dismiss()
  }

  const handleOpenTactics = async () => {
    // Route through /api/tactics so the preview-gate password is attached
    // server-side and never ships in the client bundle.
    window.open('/api/tactics', '_blank', 'noopener,noreferrer')
    setDismissed(true)
    await dismiss()
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      closeOnBackdropClick={false}
      closeOnEscape={false}
      showCloseButton={false}
      showHeader={false}
      maxWidth="max-w-2xl"
    >
      <ModalBody className="p-0 relative">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-md text-text-muted hover:text-text-primary bg-bg-card/80 hover:bg-bg-hover backdrop-blur-sm transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Left column — arena image (same asset used on tactics.gw1builds.com) */}
          <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[340px] overflow-hidden rounded-t-xl md:rounded-t-none md:rounded-l-xl">
            <Image
              src="/images/tactics-arena.jpg"
              alt="GW1 Tactics arena"
              fill
              sizes="(min-width: 768px) 320px, 100vw"
              className="object-cover"
              priority
              unoptimized
            />
            {/* Mood overlay — mirrors the gradient used on tactics.gw1builds.com's PLAY card */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/40 pointer-events-none" />
          </div>

          {/* Right column — copy */}
          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-text-primary leading-tight">
              Early Concept Preview
            </h2>
            <div className="flex flex-col gap-4 text-text-secondary leading-relaxed">
              <p>
                Imagine you could press{' '}
                <span className="text-text-primary font-medium">Battle</span>{' '}
                on your team build.
              </p>
              <p className="text-base font-semibold text-text-primary leading-tight">
                6vs6 against other player builds.
              </p>
              <p>
                It&apos;s still early but we&apos;d love your feedback.
              </p>
            </div>

            {TACTICS_URL && (
              <Button
                onClick={handleOpenTactics}
                variant="primary"
                size="lg"
                className="w-full uppercase tracking-wider font-bold"
              >
                I love early access
              </Button>
            )}

            <p className="text-xs text-text-muted text-center">
              Only GW1Builds regulars are seeing this.
            </p>
          </div>
        </div>
      </ModalBody>
    </Modal>
  )
}
