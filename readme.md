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
- **All React versions >= 16.6**

```jsx
import { Suspense } from 'react'
import { suspend } from 'suspend-react'

function Post({ id, version }) {
  const data = suspend(async (/*id, version*/) => {
    const res = await fetch(`https://hacker-news.firebaseio.com/${version}/item/${id}.json`)
    return await res.json()
  }, [id, version])
  return <div>{data.title} by {data.by}</div>
}

function App() {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <Post id={1000} version="v0" />
    </Suspense>
  )
}
```

#### API

```jsx
const result = suspend((...keys) => Promise<any>, keys: any[], config)
```

When you call `suspend` it yields control back to React and the render-phase is aborted. It will resume once your promise resolves. For this to work you need to wrap it into a `<React.Suspense>` boundary, which requires you to set a fallback (which can be `null`).

The dependencies/keys act as cache-keys, use as many as you want. If an entry is already in cache, calling `suspend` with the same keys will return it *immediately*, without breaking the render-phasse. Cache access is similar to useMemo but across the component tree. The first-arg function has to return a thenable (async function or a promise), it receives the keys as arguments. `suspend` will return the resolved value, not a promise! This is guaranteed, you do not have to check for validity. Errors will bubble up to the nearest error-boundary.

#### Config

Both `suspend` and `preload` can *optionally* reveive a config object,

###### Keep-alive

The `lifespan` prop allows you to invalidate items over time, it defaults to `0` (keep-alive forever).

```jsx
// Keep cached item alive for one minute
suspend(fn, keys, { lifespan: 60000 })
```

###### Equality function

The `equal` prop customizes key validation, it defaults to `(a, b) => a === b` (reference equality).

```jsx
import equal from 'fast-deep-equal'

// Validate keys deeply
suspend(fn, keys, { equal })
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

#### Demos

Fetching posts from hacker-news: [codesandbox](https://codesandbox.io/s/use-asset-forked-yb62q)

Infinite list: [codesandbox](https://codesandbox.io/s/use-asset-infinite-list-forked-cwvs7)
