// Longest tests first; every command remains in exactly one deterministic shard.
export function planShards(commands, total, durations = {}) {
  if (!Number.isInteger(total) || total < 1 || new Set(commands).size !== commands.length) throw new Error('Invalid browser manifest/shard count')
  const shards = Array.from({ length: total }, () => ({ commands: [], seconds: 0 }))
  const cost = command => Number.isFinite(durations[command]) && durations[command] > 0 ? durations[command] : 15
  const ordered = commands.map((command, index) => ({ command, index, seconds: cost(command) }))
    .sort((a, b) => b.seconds - a.seconds || a.index - b.index)
  for (const item of ordered) {
    const shard = shards.reduce((best, current) => current.seconds < best.seconds ? current : best)
    shard.commands.push(item.command)
    shard.seconds += item.seconds
  }
  return shards
}
