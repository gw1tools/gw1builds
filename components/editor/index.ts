/**
 * @fileoverview Editor Components Exports
 * @module components/editor
 *
 * Clean imports for all editor-related components
 */

export { NotesEditor } from './notes-editor'

export { TemplateInput } from './template-input'
export type { TemplateInputProps } from './template-input'

export { SkillBarEditor } from './skill-bar-editor'
export type { SkillBarEditorProps, SkillBarData } from './skill-bar-editor'

export { AttributeEditorModal } from './attribute-editor-modal'
export type { AttributeEditorModalProps } from './attribute-editor-modal'

export { TagSelector } from './tag-selector'
export type { TagSelectorProps } from './tag-selector'

export { BuildTagsSelector, hasModeTag } from './build-tags-selector'
export type { BuildTagsSelectorProps } from './build-tags-selector'

export { TagsSection } from './tags-section'
export type { TagsSectionProps } from './tags-section'

export { PrivacyToggle } from './privacy-toggle'
export type { PrivacyToggleProps } from './privacy-toggle'

export { CollaboratorsModal } from './collaborators-modal'
export type { PendingCollaborator } from './collaborators-modal'

export { SkillMention } from './skill-mention-extension'
export { MentionList } from './mention-list'
export type { MentionListProps, MentionListRef } from './mention-list'
