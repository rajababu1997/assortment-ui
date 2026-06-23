export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps {
  /** Image URL. Falls back to initials, then icon. */
  src?: string;
  /** Alt text for the image. */
  alt?: string;
  /** Used to generate initials when no image. */
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  /** Status indicator dot. */
  status?: AvatarStatus;
  className?: string;
}

export interface AvatarGroupProps {
  /** Max avatars shown before "+N" overflow. Default: 4 */
  max?: number;
  size?: AvatarSize;
  className?: string;
  children: React.ReactNode;
}
