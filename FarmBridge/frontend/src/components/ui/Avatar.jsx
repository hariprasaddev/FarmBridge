import './Avatar.css';

const SIZES = { sm: 'fb-avatar-sm', md: 'fb-avatar-md', lg: 'fb-avatar-lg', xl: 'fb-avatar-xl' };

/** Derive initials from a display name or email. */
export function getInitials(nameOrEmail) {
  if (!nameOrEmail) return '?';
  const trimmed = nameOrEmail.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

/**
 * Initials avatar with optional image source.
 * @example <Avatar name="Hariprasad" size="lg" ring />
 */
function Avatar({ name, src = null, size = 'md', ring = false, alt, className = '', ...rest }) {
  const classes = [
    'fb-avatar',
    SIZES[size] || SIZES.md,
    ring ? 'fb-avatar-ring' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (src) {
    return (
      <span className={classes} {...rest}>
        <img className="fb-avatar-image" src={src} alt={alt || name || 'avatar'} />
      </span>
    );
  }

  return (
    <span className={classes} role="img" aria-label={alt || name || 'avatar'} {...rest}>
      {getInitials(name)}
    </span>
  );
}

export default Avatar;
