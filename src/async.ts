import { Tuple, Cache, Config, CacheEntry } from '.'

type Await<T> = T extends Promise<infer V> ? V : never

type AsyncValue = {
  error?: any
  response?: unknown
  promise: Promise<unknown>
}

const asyncGlobalCache = new Cache<AsyncValue>()

function query<Keys extends Tuple<unknown>, Fn extends (...keys: Keys) => Promise<unknown>>(
  fn: Fn,
  keys: Keys,
  preload = false,
  config: Partial<Config> = {}
) {
  // Find a match
  const exisitingEntry = asyncGlobalCache.get(keys)
  if (exisitingEntry != null) {
    // If we're pre-loading and the element is present, just return
    if (preload) return undefined as unknown as Await<ReturnType<Fn>>
    // If an error occurred, throw
    if (Object.prototype.hasOwnProperty.call(exisitingEntry.value, 'error')) throw exisitingEntry.value.error
    // If a response was successful, return
    if (Object.prototype.hasOwnProperty.call(exisitingEntry.value, 'response'))
      return exisitingEntry.value.response as Await<ReturnType<Fn>>
    // If the promise is still unresolved, throw
    if (!preload) throw exisitingEntry.value.promise
  }

  // The request is new or has changed.
  // Register the entry
  const entry: CacheEntry<AsyncValue> = asyncGlobalCache.insert(
    {
      promise:
        // Execute the promise
        fn(...keys)
          // When it resolves, store its value
          .then((response) => (entry.value.response = response))
          // Remove the entry if a lifespan was given
          .then(() => {
            if (config.lifespan && config.lifespan > 0) {
              setTimeout(() => asyncGlobalCache.deleteEntry(entry), config.lifespan)
            }
          })
          // Store caught errors, they will be thrown in the render-phase to bubble into an error-bound
          .catch((error) => (entry.value.error = error)),
    },
    keys,
    config.equal
  )
  // And throw the promise, this yields control back to React
  if (!preload) throw entry.value.promise
  return undefined as unknown as Await<ReturnType<Fn>>
}

export const suspend = <Keys extends Tuple<unknown>, Fn extends (...keys: Keys) => Promise<unknown>>(
  fn: Fn,
  keys: Keys,
  config?: Config
) => query(fn, keys, false, config)

export const preload = <Keys extends Tuple<unknown>, Fn extends (...keys: Keys) => Promise<unknown>>(
  fn: Fn,
  keys: Keys,
  config?: Config
) => void query(fn, keys, true, config)

export const peek = <Keys extends Tuple<unknown>>(keys: Keys) => asyncGlobalCache.get(keys)?.value.response

export const clear: <Keys extends Tuple<unknown>>(keys?: Keys) => void = asyncGlobalCache.delete.bind(asyncGlobalCache)
