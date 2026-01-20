'use client'

/**
 * @fileoverview Modal wrapper for CollaboratorsSection
 * @module components/editor/collaborators-modal
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CollaboratorsSection,
  type PendingCollaborator,
} from '@/components/build/collaborators-section'
import type { CollaboratorWithUser } from '@/types/database'

// Draft mode props (for new builds)
interface DraftModeProps {
  mode: 'draft'
  pendingCollaborators: PendingCollaborator[]
  onPendingChange: (collaborators: PendingCollaborator[]) => void
}

// Edit mode props (for existing builds)
interface EditModeProps {
  mode: 'edit'
  buildId: string
  isOwner: boolean
  ownerUsername?: string
  collaborators: CollaboratorWithUser[]
  onCollaboratorAdded: (collaborator: CollaboratorWithUser) => void
  onCollaboratorRemoved: (collaboratorId: string) => void
}

type CollaboratorsModalProps = (DraftModeProps | EditModeProps) & {
  isOpen: boolean
  onClose: () => void
}

export function CollaboratorsModal(props: CollaboratorsModalProps) {
  const { isOpen, onClose, ...sectionProps } = props

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <div className="relative">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'absolute -top-2 -right-2 z-10 p-1.5 rounded-full cursor-pointer',
                  'bg-bg-card border border-border',
                  'text-text-muted hover:text-text-primary hover:border-border-hover',
                  'transition-colors'
                )}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              {sectionProps.mode === 'draft' ? (
                <CollaboratorsSection
                  mode="draft"
                  pendingCollaborators={sectionProps.pendingCollaborators}
                  onPendingChange={sectionProps.onPendingChange}
                />
              ) : (
                <CollaboratorsSection
                  mode="edit"
                  buildId={sectionProps.buildId}
                  isOwner={sectionProps.isOwner}
                  ownerUsername={sectionProps.ownerUsername}
                  collaborators={sectionProps.collaborators}
                  onCollaboratorAdded={sectionProps.onCollaboratorAdded}
                  onCollaboratorRemoved={sectionProps.onCollaboratorRemoved}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export type { PendingCollaborator }
