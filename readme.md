[![Build Size](https://img.shields.io/bundlephobia/min/suspend-react?label=bunlde%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=suspend-react)
[![Version](https://img.shields.io/npm/v/suspend-react?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/suspend-react)

<a href="https://github.com/pmndrs/suspend-react"><img src="https://github.com/pmndrs/suspend-react/blob/main/hero.svg?raw=true" /></a>

```shell
npm install suspend-react
```

This library integrates your async ops into React suspense. It allows you to establish error-handling and loading fallbacks at the parental level. The individual component functions similar to how async/await works in Javascript.

- Chain your operations synchroneously
- No useEffect/setState hassle
- No checking for the presence of your data

```jsx
import { Suspense } from 'react'
import { suspend } from 'suspend-react'

function Post({ id, version = 'v0' }) {
  // Results are cached, the function will only execute when dependencies change
  // When it does execute it will suspend the component until it has resolved
  const { by, title } = suspend(async (/*id, version*/) => {
    // Any async task can run in here, fetch requests, parsing, workers, promises, ...
    const res = await fetch(`https://hacker-news.firebaseio.com/${version}/item/${id}.json`)
    return await res.json()
  }, [id, version])
  // By the time we're here the async data is guaranteed to exist!
  return <div>{title} by {by}</div>
}

function App() {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <Post id={10000} />
    </Suspense>
  )
}
```

#### Preloading

You can preload your cache with the same cache keys you later read form. The async function can be external (that goes for `suspend(fn, [args])` as well), it receives the cache key dependencies as function arguments and in the same order.



```jsx
import { preload } from 'suspend-react'

async function fetchFromHN(id, version) {
  const res = await fetch(`https://hacker-news.firebaseio.com/${version}/item/${id}.json`)
  return await res.json()
}

// You can preload assets, these will be executed and cached immediately
preload(fetchFromHN, [10000, 'v0'])
```

#### Cache busting

You can remove cached items, either by clearing them all, or by providing cache keys.

```jsx
import { clear } from 'suspend-react'

// Clear all cached entries
clear()
// Clear a specific entry
clear([10000, 'v0'])
```

#### Peeking into entries outside of suspense

Peeking into the cache will give you the result immediately or return `undefined` if it is not present yet.

```jsx
import { peek } from 'suspend-react'

// This will either return the value (without suspense!) or undefined
peek(['1000', 'v0'])
```

#### Typescript

Correct types will be inferred automatically.

# Demos

Fetching posts from hacker-news: [codesandbox](https://codesandbox.io/s/use-asset-forked-yb62q?file=/src/App.js)
