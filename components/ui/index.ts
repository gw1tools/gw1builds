/**
 * UI Components - GW1 Builds Design System
 *
 * Re-exports all UI components for convenient imports:
 * import { Button, Card, Tag } from '@/components/ui'
 */

// Base UI
export { Button, type ButtonProps } from './button'
export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  type CardProps,
  type CardHeaderProps,
} from './card'
export { Tag, TagGroup, type TagProps, type TagGroupProps } from './tag'
export {
  Badge,
  CountBadge,
  type BadgeProps,
  type CountBadgeProps,
} from './badge'
export { Input, Textarea, type InputProps, type TextareaProps } from './input'
export { Toggle, type ToggleProps } from './toggle'
export { IconButton, type IconButtonProps } from './icon-button'
export { StarButton, type StarButtonProps } from './star-button'
export {
  PlayerCountControl,
  type PlayerCountControlProps,
} from './player-count-control'
export { VariantTabs, type VariantTabsProps } from './variant-tabs'

// Build-specific
export { SkillSlot, type SkillSlotProps } from './skill-slot'
export {
  SkillBar,
  SkillBarCompact,
  type SkillBarProps,
  type SkillBarCompactProps,
} from './skill-bar'
export {
  ProfessionBadge,
  ProfessionDot,
  type ProfessionBadgeProps,
  type ProfessionDotProps,
} from './profession-badge'
export { ProfessionIcon, type ProfessionIconProps } from './profession-icon'
export {
  AttributeBar,
  AttributeInline,
  type AttributeBarProps,
  type AttributeInlineProps,
} from './attribute-bar'
export {
  TemplateCode,
  TemplateCodeList,
  type TemplateCodeProps,
  type TemplateCodeListProps,
} from './template-code'

// Feedback
export {
  Skeleton,
  SkillBarSkeleton,
  BuildCardSkeleton,
  BuildPageSkeleton,
  type SkeletonProps,
} from './skeleton'
export {
  EmptyState,
  NoBuildsFound,
  NoBuildsSaved,
  NoBuildsCreated,
  BuildNotFound,
  ErrorState,
  type EmptyStateProps,
} from './empty-state'
export { Tooltip, SimpleTooltip, type TooltipProps } from './tooltip'

// Loading
export { ProfessionSpinner } from './profession-spinner'

// Social
export {
  CollaboratorList,
  type CollaboratorListProps,
} from './collaborator-list'
export { UserAvatar, type UserAvatarProps } from './user-avatar'
