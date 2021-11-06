export type Tuple<T = any> = [T] | T[]

export type CacheEntry<T> = {
  keys: Array<any>
  equal?: (a: any, b: any) => boolean
  value: T
}

export class Cache<T> {
  private readonly array: Array<CacheEntry<T>> = []

  insert<Keys extends Tuple<unknown>>(value: T, keys: Keys, equal?: (a: any, b: any) => boolean): CacheEntry<T> {
    const entry = {
      keys,
      value,
      equal,
    }
    this.array.push(entry)
    return entry
  }

  delete<Keys extends Tuple<unknown>>(keys?: Keys): void {
    if (keys === undefined || keys.length === 0) {
      this.array.splice(0, this.array.length)
    } else {
      const entry = this.get(keys)
      if (entry != null) {
        this.deleteEntry(entry)
      }
    }
  }

  deleteEntry(entry: CacheEntry<T>): void {
    const index = this.array.indexOf(entry)
    if (index !== -1) this.array.splice(index, 1)
  }

  get<Keys extends Tuple<unknown>>(keys: Keys): CacheEntry<T> | undefined {
    return this.array.find((entry) => shallowEqualArrays(keys, entry.keys, entry.equal))
  }
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
