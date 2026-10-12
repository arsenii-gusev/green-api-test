const COLORS = ['#ff6b6b', '#f59f00', '#37b24d', '#1c7ed6', '#7048e8', '#d6336c', '#0ca678']

function colorFor(seed: string) {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

function initials(title: string) {
  const letters = title
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
  return letters.toUpperCase() || '?'
}

interface AvatarProps {
  seed: string
  title: string
  size?: number
}

export function Avatar({ seed, title, size = 48 }: AvatarProps) {
  return (
    <div
      className="avatar"
      style={{ background: colorFor(seed), width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {/^\+?\d+$/.test(title) ? title.replace('+', '').slice(-2) : initials(title)}
    </div>
  )
}
