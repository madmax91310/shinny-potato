export default function Button({ variant = 'primary', className = '', as: As = 'button', children, ...props }) {
  // Decorative emoji in legacy action labels do not belong to the minimal UI.
  // Preserve the existing accessible name used by callers and automation.
  const label = typeof children === 'string'
    ? children.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+/u, '')
    : children
  return <As aria-label={typeof children === 'string' && label !== children ? children : undefined} className={`workspace-button workspace-button--${variant} ${className}`} {...props}>{label}</As>
}
