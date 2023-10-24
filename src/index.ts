type Tuple<T = any> = [T] | T[]
type Config = { lifespan?: number; equal?: (a: any, b: any) => boolean }
type Cache<T extends unknown, Keys extends Tuple<unknown>> = {
  promise: Promise<T>
  keys: Keys
  equal?: (a: any, b: any) => boolean
  error?: any
  response?: T
  timeout?: ReturnType<typeof setTimeout>
  remove: () => void
}

const isPromise = (promise: any): promise is Promise<unknown> =>
  typeof promise === 'object' && typeof (promise as Promise<any>).then === 'function'

const globalCache: Cache<unknown, Tuple<unknown>>[] = []

function get(keys: Tuple<unknown>) {
  return globalCache.find((entry) => shallowEqualArrays(keys, entry.keys, entry.equal))
}

function set<T extends unknown, Keys extends Tuple<unknown>>(
  fn: Promise<T> | ((...keys: Keys) => Promise<T>),
  keys: Keys,
  config: Partial<Config> = {}
) {
  const entry: Cache<T, Keys> = {
    keys,
    equal: config.equal,
    remove: () => {
      const index = globalCache.indexOf(entry)
      if (index !== -1) globalCache.splice(index, 1)
    },
    promise:
      // Execute the promise
      (isPromise(fn) ? fn : fn(...keys))
        // When it resolves, store its value
        .then((response) => {
          entry.response = response
          // Remove the entry in time if a lifespan was given
          if (config.lifespan && config.lifespan > 0) {
            entry.timeout = setTimeout(entry.remove, config.lifespan)
          }
        })
        // Store caught errors, they will be thrown in the render-phase to bubble into an error-bound
        .catch((error) => (entry.error = error)),
  }
  globalCache.push(entry)
  return entry
}

function query<T extends unknown, Keys extends Tuple<unknown>>(
  fn: Promise<T> | ((...keys: Keys) => Promise<T>),
  keys: Keys = null as unknown as Keys,
  config?: Partial<Config>
) {
  if (keys === null) keys = [fn] as unknown as Keys
  const cached = get(keys)
  if (cached) return cached as Cache<T, Keys>
  return set(fn, keys, config)
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

const suspend = <T extends unknown, Keys extends Tuple<unknown>>(
  fn: Promise<T> | ((...keys: Keys) => Promise<T>),
  keys?: Keys,
  config?: Config
) => {
  const entry = query(fn, keys, config)
  if (Object.prototype.hasOwnProperty.call(entry, 'error')) throw entry.error
  if (Object.prototype.hasOwnProperty.call(entry, 'response')) {
    if (config?.lifespan && config.lifespan > 0) {
      if (entry.timeout) clearTimeout(entry.timeout)
      entry.timeout = setTimeout(entry.remove, config.lifespan)
    }
    return entry.response as T
  }
  throw entry.promise
}

const preload = <T extends unknown, Keys extends Tuple<unknown>>(
  fn: Promise<T> | ((...keys: Keys) => Promise<T>),
  keys?: Keys,
  config?: Config
) => query(fn, keys, config).promise

const peek = <Keys extends Tuple<unknown>>(keys: Keys) => get(keys)?.response

const clear = <Keys extends Tuple<unknown>>(keys?: Keys) => {
  if (keys === undefined || keys.length === 0) globalCache.splice(0, globalCache.length)
  else {
    const entry = get(keys)
    if (entry) entry.remove()
  }
}

export { suspend, clear, preload, peek }
