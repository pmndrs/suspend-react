import deepEqual from 'fast-deep-equal'

type Tuple<T = any> = [T] | T[]
type Await<T> = T extends Promise<infer V> ? V : never

type PromiseCache<Args extends Tuple<unknown>> = {
  promise: Promise<unknown>
  args: Args
  error?: any
  response?: unknown
}

const globalCache: PromiseCache<Tuple<unknown>>[] = []

function suspend<Args extends Tuple<unknown>, Fn extends (...args: Args) => Promise<unknown>>(fn: Fn, args: Args, preload = false) {
  for (const entry of globalCache) {
    // Find a match
    if (deepEqual(args, entry.args)) {
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
  const entry: PromiseCache<Args> = {
    args,
    promise:
      // Make the promise request.
      fn(...args)
        // Response can't be undefined or else the loop above wouldn't be able to return it
        // This is for promises that do not return results (delays for instance)
        .then((response) => (entry.response = (response ?? true) as Response))
        .catch((e) => (entry.error = e ?? 'unknown error')),
  }
  globalCache.push(entry)
  if (!preload) throw entry.promise
  return undefined as unknown as Await<ReturnType<Fn>>
}

function clear<Args extends Tuple<unknown>>(args?: Args) {
  if (args === undefined || args.length === 0) globalCache.splice(0, globalCache.length)
  else {
    const entry = globalCache.find((entry) => deepEqual(args, entry.args))
    if (entry) {
      const index = globalCache.indexOf(entry)
      if (index !== -1) globalCache.splice(index, 1)
    }
  }
}

const preload = <Args extends Tuple<unknown>, Fn extends (...args: Args) => Promise<unknown>>(fn: Fn, args: Args) =>
  void suspend(fn, args, true)

const peek = <Args extends Tuple<unknown>>(args: Args) =>
  globalCache.find((entry) => deepEqual(args, entry.args))?.response

export { suspend, clear, preload, peek }