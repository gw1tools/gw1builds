'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Github } from 'lucide-react'

// Compute year once at module level to prevent hydration mismatch
const CURRENT_YEAR = new Date().getFullYear()

// All 10 profession colors
const professionColors = [
  'bg-warrior',
  'bg-ranger',
  'bg-monk',
  'bg-necromancer',
  'bg-mesmer',
  'bg-elementalist',
  'bg-assassin',
  'bg-ritualist',
  'bg-paragon',
  'bg-dervish',
]

const dotVariants = {
  initial: { y: 0 },
  hover: (i: number) => ({
    y: [0, -4, 0],
    transition: {
      delay: i * 0.04,
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  }),
}

/**
 * Minimal site footer with GW1 flair - fixed at bottom
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left - Links */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Link
              href="/changes"
              className="hover:text-text-secondary transition-colors"
            >
              Changes
            </Link>
            <span>·</span>
            <Link
              href="/privacy"
              className="hover:text-text-secondary transition-colors"
            >
              Privacy
            </Link>
            <span>·</span>
            <Link
              href="/terms"
              className="hover:text-text-secondary transition-colors"
            >
              Terms
            </Link>
            <span>·</span>
            <a
              href="https://github.com/gw1tools/gw1builds"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-secondary transition-colors"
              aria-label="View source on GitHub"
            >
              <Github className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Right - Year + Profession dots */}
          <motion.div
            className="flex items-center gap-3"
            initial="initial"
            whileHover="hover"
          >
            <span className="text-xs text-text-muted">© {CURRENT_YEAR}</span>
            <div className="flex items-center gap-1">
              {professionColors.map((color, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={dotVariants}
                  className={`w-1.5 h-1.5 rounded-full ${color}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}
