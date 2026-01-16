'use client'

/**
 * @fileoverview Thank you modal for bug reporters
 *
 * Shows when admin sets profile.show_thank_you = true.
 * Dismisses on button click, sets flag back to false.
 * Can be re-triggered anytime by admin.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { Modal, ModalBody } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

export function ThankYouModal() {
  const { profile, refreshProfile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)

  // Show modal if show_thank_you flag is true
  useEffect(() => {
    if (profile?.show_thank_you === true) {
      setIsOpen(true)
    }
  }, [profile?.show_thank_you])

  const handleDismiss = async () => {
    setIsDismissing(true)
    try {
      const response = await fetch('/api/user/dismiss-thank-you', {
        method: 'POST',
      })
      if (response.ok) {
        await refreshProfile()
      }
    } finally {
      setIsDismissing(false)
      setIsOpen(false)
    }
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
      maxWidth="max-w-sm"
    >
      <ModalBody className="text-center py-8">
        <div className="text-5xl mb-6">💛</div>
        <h2 className="text-xl font-semibold text-text-primary mb-3">
          Thank You!
        </h2>
        <p className="text-text-secondary mb-6 leading-relaxed">
          Thank you for reporting all those bugs! We&apos;ve fixed them and
          truly appreciate you making GW1 Builds better for the community.
        </p>
        <p className="text-accent-gold font-medium mb-6">
          You&apos;re awesome.
        </p>
        <Button
          onClick={handleDismiss}
          isLoading={isDismissing}
          variant="primary"
          className="w-full"
        >
          You&apos;re Welcome!
        </Button>
      </ModalBody>
    </Modal>
  )
}
