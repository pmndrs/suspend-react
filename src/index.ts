type Tuple<T = any> = [T] | T[]
type Await<T> = T extends Promise<infer V> ? V : never
type Config = { lifespan?: number; equal?: (a: any, b: any) => boolean }
type Cache<Keys extends Tuple<unknown>> = {
  promise: Promise<unknown>
  keys: Keys
  equal?: (a: any, b: any) => boolean
  error?: any
  response?: unknown
}

function shallowEqualArrays(
  arrA: any[],
  arrB: any[],
  equal: (a: any, b: any) => boolean = (a: any, b: any) => a === b
) {
  if (arrA === arrB) return true
  if (!arrA || !arrB) return false
  const len = arrA.length
  if (arrB.length !== len) return false
  for (let i = 0; i < len; i++) if (!equal(arrA[i], arrB[i])) return false
  return true
}

const globalCache: Cache<Tuple<unknown>>[] = []

function query<Keys extends Tuple<unknown>, Fn extends (...keys: Keys) => Promise<unknown>>(
  fn: Fn,
  keys: Keys,
  preload = false,
  config: Partial<Config> = {}
) {
  for (const entry of globalCache) {
    // Find a match
    if (shallowEqualArrays(keys, entry.keys, entry.equal)) {
      // If we're pre-loading and the element is present, just return
      if (preload) return undefined as unknown as Await<ReturnType<Fn>>
      // If an error occurred, throw
      if (Object.prototype.hasOwnProperty.call(entry, 'error')) throw entry.error
      // If a response was successful, return
      if (Object.prototype.hasOwnProperty.call(entry, 'response')) return entry.response as Await<ReturnType<Fn>>
      // If the promise is still unresolved, throw
      if (!preload) throw entry.promise
    }
  }

  // The request is new or has changed.
  const entry: Cache<Keys> = {
    keys,
    equal: config.equal,
    promise:
      // Execute the promise
      fn(...keys)
        // When it resolves, store its value
        .then((response) => (entry.response = response))
        // Remove the entry if a lifespan was given
        .then(() => {
          if (config.lifespan && config.lifespan > 0) {
            setTimeout(() => {
              const index = globalCache.indexOf(entry)
              if (index !== -1) globalCache.splice(index, 1)
            }, config.lifespan)
          }
        })
        // Store caught errors, they will be thrown in the render-phase to bubble into an error-bound
        .catch((error) => (entry.error = error)),
  }
  // Register the entry
  globalCache.push(entry)
  // And throw the promise, this yields control back to React
  if (!preload) throw entry.promise
  return undefined as unknown as Await<ReturnType<Fn>>
}

const suspend = <Keys extends Tuple<unknown>, Fn extends (...keys: Keys) => Promise<unknown>>(
  fn: Fn,
  keys: Keys,
  config?: Config
) => query(fn, keys, false, config)

const preload = <Keys extends Tuple<unknown>, Fn extends (...keys: Keys) => Promise<unknown>>(
  fn: Fn,
  keys: Keys,
  config?: Config
) => void query(fn, keys, true, config)

const peek = <Keys extends Tuple<unknown>>(keys: Keys) =>
  globalCache.find((entry) => shallowEqualArrays(keys, entry.keys, entry.equal))?.response

const clear = <Keys extends Tuple<unknown>>(keys?: Keys) => {
  if (keys === undefined || keys.length === 0) globalCache.splice(0, globalCache.length)
  else {
    const entry = globalCache.find((entry) => shallowEqualArrays(keys, entry.keys, entry.equal))
    if (entry) {
      const index = globalCache.indexOf(entry)
      if (index !== -1) globalCache.splice(index, 1)
    }
  }
}

export { suspend, clear, preload, peek }
