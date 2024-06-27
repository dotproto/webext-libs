# Approaches

## Approach 1

Combine all retrial functionality in a single `get()` function.

### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `promise` | Boolean | `false` | TODO |
| `update` | Boolean | `true` | Specifies whether or not to update the value in cache when interacting with browser storage. Has no effect when `from: "cache"`. |
| `from` | `"cache" \| "storage"` | `"cache"` | Where the value should be retrieved from. The value `"cache"` will implicitly cause the function to return synchronously. The value `"storage"` implicitly makes the function return asynchronously, as the value must be fetched from storage. |
| `async` | `"sync" \| "async"` | `"sync"` | TODO |

## Approach 2

Expose distinct methods for sync (`get()`) and async (`getAsync()`) retrieval.

This option reduces some of the combinatorial complexity that results from the
ways that `get()` options can interact.


# Examples

In the following examples, `null` option values are used to signal hat the value has no effect.

## Ex 1: Get value from cache

### Approach 1
```js
// All of the following statements are equivalent
var value = store.get("key");
var value = store.get("key", {from: "cache", update: null, async: false, promise: false });
```

### Approach 2
```js
var value = store.get("key");
var value = store.get("key", {from: "cache", update: null});
```

## Ex 2: Get value from browser storage & update cached value

### Approach 1
```js
var value = await store.get("key", {from: "storage", async: true, promise: true});
var value = await store.get("key", {from: "storage", promise: true, update: true});
```

### Approach 2
```js
var value = await store.getAsync("key", {from: "storage"});
```

## Ex 3: Get data from cache & asynchronously update cache with value in browser storage (read-through cache)

### Approach 1

```js
var value = store.get("key", {from: "storage"});
var value = store.get("key", {from: "storage", promise: true, async: true, update: true});
```

### Approach 2

```js
var value = store.get("key", {from: "storage"});
var value = store.get("key", {from: "storage", update: true, })
```

