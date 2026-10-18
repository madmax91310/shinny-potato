// Disjoint exhaustive partitions: every pool index belongs to exactly one shard.
export function* shardIndices(length, index = 0, count = 1) {
  if (!Number.isSafeInteger(length) || length < 0 || !Number.isSafeInteger(count) || count < 1 ||
      !Number.isSafeInteger(index) || index < 0 || index >= count) throw new Error('Invalid Tweet Midi shard')
  for (let item = index; item < length; item += count) yield item
}
