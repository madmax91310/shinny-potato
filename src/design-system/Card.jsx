export default function Card({ className = '', as: As = 'div', ...props }) {
  return <As className={`workspace-panel ${className}`} {...props} />
}
