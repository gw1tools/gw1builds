'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'

const dotVariants = {
  initial: { y: 0 },
  hover: (i: number) => ({
    y: [0, -6, 0],
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  }),
}
import { Plus, LogOut, Loader2, FileText } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { useAuthModal } from '@/components/auth/auth-modal'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import { dropdownVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function Header() {
  const { user, profile, loading, signOut } = useAuth()
  const { openModal } = useAuthModal()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // Close dropdown on Escape key
  useEffect(() => {
    if (!dropdownOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false)
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [dropdownOpen])

  const handleSignOut = async () => {
    if (signingOut) return

    setSigningOut(true)
    try {
      await signOut()
      // Note: signOut redirects to home, so we don't need to do anything else
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out. Please try again.')
      setSigningOut(false)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-bg-primary border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div initial="initial" whileHover="hover">
            <Link href="/" className="flex items-center gap-4">
              <span className="text-xl font-bold tracking-tight">
                <span className="text-accent-gold">GW1</span>
                <span className="text-text-primary"> Builds</span>
              </span>
              {/* Profession dots - 6 with good contrast */}
              <div className="flex items-center gap-1.5">
                <motion.span
                  custom={0}
                  variants={dotVariants}
                  className="w-2 h-2 rounded-full bg-warrior"
                />
                <motion.span
                  custom={1}
                  variants={dotVariants}
                  className="w-2 h-2 rounded-full bg-elementalist"
                />
                <motion.span
                  custom={2}
                  variants={dotVariants}
                  className="w-2 h-2 rounded-full bg-monk"
                />
                <motion.span
                  custom={3}
                  variants={dotVariants}
                  className="w-2 h-2 rounded-full bg-necromancer"
                />
                <motion.span
                  custom={4}
                  variants={dotVariants}
                  className="w-2 h-2 rounded-full bg-mesmer"
                />
                <motion.span
                  custom={5}
                  variants={dotVariants}
                  className="w-2 h-2 rounded-full bg-ritualist"
                />
              </div>
            </Link>
          </motion.div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Auth Section */}
            {loading ? (
              <div className="h-9 w-9 rounded-full bg-bg-card animate-pulse" />
            ) : user && profile ? (
              <div className="relative">
                <button
                  id="user-menu-button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={cn(
                    'rounded-full transition-all cursor-pointer',
                    dropdownOpen &&
                      'ring-2 ring-accent-gold ring-offset-2 ring-offset-bg-primary'
                  )}
                  aria-label="User menu"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="menu"
                >
                  <UserAvatar userId={user.id} username={profile.username} />
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setDropdownOpen(false)}
                      />

                      {/* Dropdown menu */}
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 mt-2 w-56 z-50"
                        role="menu"
                        aria-labelledby="user-menu-button"
                      >
                        <div className="bg-bg-card border border-border rounded-lg shadow-sticky overflow-hidden">
                          {/* Username display */}
                          <div className="px-4 py-3 border-b border-border">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {profile.username || 'Anonymous'}
                            </p>
                            <p className="text-xs text-text-muted truncate">
                              {user.email}
                            </p>
                          </div>

                          {/* Menu items */}
                          <div className="p-1">
                            {/* Create Build link - primary action */}
                            <Link
                              href="/new"
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20"
                              onClick={() => setDropdownOpen(false)}
                              role="menuitem"
                            >
                              <Plus className="h-4 w-4" />
                              Create Build
                            </Link>

                            {/* My Builds link */}
                            <Link
                              href="/my-builds"
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                              onClick={() => setDropdownOpen(false)}
                              role="menuitem"
                            >
                              <FileText className="h-4 w-4" />
                              My Builds
                            </Link>

                            {/* Sign out button */}
                            <button
                              onClick={handleSignOut}
                              disabled={signingOut}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                                signingOut
                                  ? 'text-text-muted cursor-not-allowed'
                                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                              )}
                              role="menuitem"
                            >
                              {signingOut ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <LogOut className="h-4 w-4" />
                              )}
                              {signingOut ? 'Signing out...' : 'Sign Out'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="md"
                onClick={() => openModal('/my-builds')}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
