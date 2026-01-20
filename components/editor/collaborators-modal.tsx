'use client'

/**
 * @fileoverview Modal wrapper for CollaboratorsSection
 * @module components/editor/collaborators-modal
 */

import { Modal } from '@/components/ui/modal'
import {
  CollaboratorsSection,
  type PendingCollaborator,
} from '@/components/build/collaborators-section'
import type { CollaboratorWithUser } from '@/types/database'
import { Users } from 'lucide-react'
import { MAX_COLLABORATORS } from '@/components/build/collaborators-section'

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

  const collaboratorsCount =
    sectionProps.mode === 'draft'
      ? sectionProps.pendingCollaborators.length
      : sectionProps.collaborators.length

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showHeader
      title="Collaborators"
      headerContent={
        <div className="flex gap-2 items-center text-base">
          <Users className="w-4 h-4 text-accent-gold" />
          <h2 className="font-semibold text-text-primary">Collaborators</h2>
          <span className="text-xs text-text-muted">
            ({collaboratorsCount}/{MAX_COLLABORATORS})
          </span>
        </div>
      }
    >
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
    </Modal>
  )
}

export type { PendingCollaborator }
