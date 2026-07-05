'use client'

/**
 * @fileoverview Mobile launch announcement banner + popup
 *
 * Shows a dismissible banner below the top bar on every page (logged in or not)
 * celebrating the GW1 mobile launch. Clicking it opens a popup with the app icon
 * and the App Store / Google Play download links. Shown once per browser via a
 * localStorage dismissal flag.
 *
 * To retire this campaign: remove <AnnouncementBanner /> from app/layout.tsx.
 */

import { useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Modal, ModalBody } from '@/components/ui/modal'
import { Tag } from '@/components/ui/tag'
import { cn } from '@/lib/utils'
import { trackMobileLaunchBannerClicked } from '@/lib/analytics'

const STORAGE_KEY = 'gw1builds:mobile-launch-banner-dismissed'
const ICON_SRC = '/images/gw1-mobile-icon.webp'

const APP_STORE_URL =
  'https://apps.apple.com/us/app/guild-wars-reforged/id820613069'
const GOOGLE_PLAY_URL =
  'https://play.google.com/store/apps/details?id=net.arena.guildwars.reforged&pcampaignid=web_share'

/** Official-style App Store + Google Play download badges. */
function StoreBadges() {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
        Get the app
      </p>
      <div className="flex flex-wrap gap-2.5">
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download on the App Store"
          className={cn(
            'flex h-14 items-center gap-2.5 rounded-lg bg-black border border-border px-4',
            'hover:border-border-hover transition-colors'
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-7 h-7 shrink-0 fill-white"
            aria-hidden="true"
          >
            <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
          </svg>
          <span className="flex flex-col text-left text-white whitespace-nowrap">
            <span className="text-[11px] leading-none">Download on the</span>
            <span className="text-base font-semibold leading-tight">
              App Store
            </span>
          </span>
        </a>
        <a
          href={GOOGLE_PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Get it on Google Play"
          className={cn(
            'flex h-14 items-center gap-2.5 rounded-lg bg-black border border-border px-4',
            'hover:border-border-hover transition-colors'
          )}
        >
          <svg
            viewBox="0 0 512 512"
            className="w-6 h-6 shrink-0"
            aria-hidden="true"
          >
            <path
              fill="#00d3ff"
              d="M48 59.49v393a4.33 4.33 0 0 0 7.37 3.07L260 256 55.37 56.42A4.33 4.33 0 0 0 48 59.49z"
            />
            <path
              fill="#00f076"
              d="M345.8 174L89.22 32.64l-.16-.09c-4.42-2.4-8.62 3.58-5 7.06l201.13 201.51z"
            />
            <path
              fill="#ff3a44"
              d="M84.07 472.39c-3.64 3.48.57 9.46 5 7.06l.16-.1L345.8 338l-60.61-67.18z"
            />
            <path
              fill="#ffc400"
              d="M449.38 231.84l-71.65-39.46-66.5 63.62 66.5 63.61 71.65-39.45c19.49-10.77 19.49-37.99 0-48.86z"
            />
          </svg>
          <span className="flex flex-col text-left text-white whitespace-nowrap">
            <span className="text-[11px] leading-none">Get it on</span>
            <span className="text-base font-semibold leading-tight">
              Google Play
            </span>
          </span>
        </a>
      </div>
    </div>
  )
}

// Tiny external store for the dismissed flag. Using useSyncExternalStore keeps
// the localStorage read out of an effect (avoids hydration mismatch and the
// set-state-in-effect rule) while still re-rendering on same-tab dismissal.
const listeners = new Set<() => void>()

function subscribeDismissed(onChange: () => void): () => void {
  listeners.add(onChange)
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

function getDismissedSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

// Render hidden during SSR/first paint; the client re-reads immediately after.
function getDismissedServerSnapshot(): boolean {
  return true
}

function writeDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY, 'true')
  } catch {
    // Swallow — worst case the banner reappears next load.
  }
  listeners.forEach(l => l())
}

export function AnnouncementBanner() {
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    getDismissedSnapshot,
    getDismissedServerSnapshot
  )
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = () => {
    trackMobileLaunchBannerClicked()
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    // Seen it, so retire the banner. It shows only once per browser.
    writeDismissed()
  }

  if (dismissed) return null

  return (
    <>
      <div className="flex items-center gap-3 bg-accent-red/15 border-b border-accent-red/30 px-4 py-2">
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 min-w-0',
            'text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer'
          )}
        >
          <Image
            src={ICON_SRC}
            alt="GW1 mobile"
            width={20}
            height={20}
            className="rounded shrink-0"
            unoptimized
          />
          <span className="truncate">
            <span className="font-medium text-text-primary">
              GW1 is on mobile!
            </span>{' '}
            More infos <span aria-hidden="true">→</span>
          </span>
        </button>
        <button
          type="button"
          onClick={writeDismissed}
          aria-label="Dismiss announcement"
          className={cn(
            'shrink-0 p-1 rounded-md',
            'text-text-muted hover:text-text-primary',
            'hover:bg-accent-red/20 transition-colors cursor-pointer'
          )}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        showHeader={false}
        showCloseButton={false}
        centerOnMobile
        maxWidth="max-w-3xl"
      >
        <ModalBody className="p-0 relative">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-10 p-1.5 rounded-md text-text-muted hover:text-text-primary bg-bg-card/80 hover:bg-bg-hover backdrop-blur-sm transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            {/* Left column — app icon */}
            <div className="relative flex items-center justify-center p-6 md:min-h-[300px] bg-accent-red/10 overflow-hidden rounded-t-xl md:rounded-t-none md:rounded-l-xl">
              <Image
                src={ICON_SRC}
                alt="GW1 mobile app icon"
                width={160}
                height={160}
                className="w-24 h-24 md:w-40 md:h-40"
                priority
                unoptimized
              />
            </div>

            {/* Right column — copy + store badges */}
            <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-text-primary leading-tight">
                GW1 is on mobile!
              </h2>
              <div className="flex flex-col gap-4 text-text-secondary leading-relaxed">
                <p>
                  Guild Wars Reforged is out on{' '}
                  <span className="text-text-primary font-medium">
                    iOS and Android
                  </span>
                  .
                </p>
                <p>
                  Take your builds anywhere, and look for the{' '}
                  <Tag
                    label="mobile-friendly"
                    size="sm"
                    className="mx-0.5 align-middle"
                  />{' '}
                  tag to find builds that shine on mobile.
                </p>
              </div>

              <div className="mt-2">
                <StoreBadges />
              </div>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </>
  )
}
