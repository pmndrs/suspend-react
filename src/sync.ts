import { Cache, Config, Tuple } from '.'

const syncGlobalCache = new Cache<any>()

export function persist<T, Keys extends Tuple<unknown>, Fn extends (...keys: Keys) => T>(
  fn: Fn,
  keys: Keys,
  config: Partial<Config> = {}
): T {
  const exisitingEntry = syncGlobalCache.get(keys)
  let value = exisitingEntry?.value
  if (value == null) {
    value = fn(...keys)
    const entry = syncGlobalCache.insert(value, keys, config.equal)
    if (config.lifespan && config.lifespan > 0) {
      setTimeout(() => syncGlobalCache.deleteEntry(entry), config.lifespan)
    }
  }
  return value
}

export const dispose: <Keys extends Tuple<unknown>>(keys?: Keys) => void = syncGlobalCache.delete.bind(syncGlobalCache)
