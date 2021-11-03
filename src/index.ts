import deepEqual from 'fast-deep-equal'

type Tuple<T = any> = [T] | T[]
type Await<T> = T extends Promise<infer V> ? V : never
type PromiseCache<Keys extends Tuple<unknown>> = {
  promise: Promise<unknown>
  keys: Keys
  error?: any
  response?: unknown
}
type Config = {
  lifespan?: number
}

const globalCache: PromiseCache<Tuple<unknown>>[] = []

function query<Keys extends Tuple<unknown>, Fn extends (...keys: Keys) => Promise<unknown>>(
  fn: Fn,
  keys: Keys,
  preload = false,
  config: Partial<Config> = { lifespan: 0 }
) {
  for (const entry of globalCache) {
    // Find a match
    if (deepEqual(keys, entry.keys)) {
      // If we're pre-loading and the element is present, just return
      if (preload) return undefined as unknown as Await<ReturnType<Fn>>
      // If an error occurred, throw
      if (entry.error) throw entry.error
      // If a response was successful, return
      if (entry.response) return entry.response as Await<ReturnType<Fn>>
      // If the promise is still unresolved, throw
      if (!preload) throw entry.promise
    }
  }

  // The request is new or has changed.
  const entry: PromiseCache<Keys> = {
    keys,
    promise:
      // Make the promise request.
      fn(...keys)
        // Response can't be undefined or else the loop above wouldn't be able to return it
        // This is for promises that do not return results (delays for instance)
        .then((response) => (entry.response = (response ?? true) as Response))
        .then(() => {
          if (config && config.lifespan && config.lifespan > 0) {
            setTimeout(() => {
              const index = globalCache.indexOf(entry)
              if (index !== -1) globalCache.splice(index, 1)
            }, config.lifespan)
          }
        })
        .catch((e) => (entry.error = e ?? 'unknown error')),
  }
  globalCache.push(entry)
  if (!preload) throw entry.promise
  return undefined as unknown as Await<ReturnType<Fn>>
}

function clear<Keys extends Tuple<unknown>>(keys?: Keys) {
  if (keys === undefined || keys.length === 0) globalCache.splice(0, globalCache.length)
  else {
    const entry = globalCache.find((entry) => deepEqual(keys, entry.keys))
    if (entry) {
      const index = globalCache.indexOf(entry)
      if (index !== -1) globalCache.splice(index, 1)
    }
  }
}

const suspend = <Keys extends Tuple<unknown>, Fn extends (...keys: Keys) => Promise<unknown>>(fn: Fn, keys: Keys, config?: Config) =>
  query(fn, keys, false, config)

const preload = <Keys extends Tuple<unknown>, Fn extends (...keys: Keys) => Promise<unknown>>(fn: Fn, keys: Keys, config?: Config) =>
  void query(fn, keys, true, config)

const peek = <Keys extends Tuple<unknown>>(keys: Keys) =>
  globalCache.find((entry) => deepEqual(keys, entry.keys))?.response

export { suspend, clear, preload, peek }
