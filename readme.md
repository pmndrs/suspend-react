[![Build Size](https://img.shields.io/bundlephobia/minzip/suspend-react?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=suspend-react)
[![Version](https://img.shields.io/npm/v/suspend-react?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/suspend-react)

<br />
<a href="https://github.com/pmndrs/suspend-react"><img src="https://github.com/pmndrs/suspend-react/blob/main/hero.svg?raw=true" /></a>
<br />
<br />

```shell
npm install suspend-react
```

This library integrates your async ops into React suspense. Error-handling & loading states are handled at the parental level. The individual component functions similar to async/await in Javascript.

- Chain your operations synchronously
- No useEffect/setState hassle
- No checking for the presence of your data
- All React versions >= 16.6

```jsx
import { Suspense } from 'react'
import { suspend } from 'suspend-react'

function Post({ id, version = 'v0' }) {
  const { by, title } = suspend(async (/*id, version*/) => {
    const res = await fetch(`https://hacker-news.firebaseio.com/${version}/item/${id}.json`)
    return await res.json()
  }, [id, version])
  return <div>{title} by {by}</div>
}

function App() {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <Post id={1000} />
    </Suspense>
  )
}
```

What happened here?

1. You have a promise, stick it into the `suspend` function. It will interupt the component.
2. The component needs to be wrapped into `<Suspense fallback={...}>` which allows you to set a fallback.
3. If `suspend` runs again with the same dependencies it will return the cached result.

#### API

```jsx
const result = suspend((...dependencies) => Promise<any>, keys: any[], config)
```

The keys act as cache-keys. The resolved result is cached according to those keys, the same keys return a previously cached entry immediately. The function has to return a thenable (async function or a promise). It will receive the cache keys as arguments. You can define it externally. `suspend` will eventually return the resolved value, which is guaranteed, you do not have to check for its presence. Errors will bubble up to the nearest error-boundary.

Both `suspend` and `preload` can reveive a config object that, for now, only contains a `lifespan` prop that defaults to `0` (do nothing). This allows you to invalidate items over time.

```jsx
// Keep cached item alive for one minute
suspend(fn, keys, { lifespan: 60000 })
```

#### Preloading

```jsx
import { preload } from 'suspend-react'

async function fetchFromHN(id, version) {
  const res = await fetch(`https://hacker-news.firebaseio.com/${version}/item/${id}.json`)
  return await res.json()
}

preload(fetchFromHN, [1000, 'v0'])
```

#### Cache busting

```jsx
import { clear } from 'suspend-react'

// Clear all cached entries
clear()
// Clear a specific entry
clear([1000, 'v0'])
```

#### Peeking into entries outside of suspense

```jsx
import { peek } from 'suspend-react'

// This will either return the value (without suspense!) or undefined
peek([1000, 'v0'])
```

#### Typescript

Correct types will be inferred automatically.

#### React 18

Suspense, as is, has been a stable part of React since 16.6, but React will likely add some [interesting caching and cache busting APIs](https://github.com/reactwg/react-18/discussions/25) that could allow you to define cache boundaries declaratively. Expect these to be work for suspend-react once they come out.

# Demos

Fetching posts from hacker-news: [codesandbox](https://codesandbox.io/s/use-asset-forked-yb62q?file=/src/App.js)
