class Store {
  // Internal cache of key-value pairs from browser.storage.
  _cache = new Map();

  // The set of keys that we know exist on `_cache`.
  _knownKeys = new Set();

  // Promise indicating that data has been retrieved from browser.storage and
  // the instance is ready for use.
  ready;
  _readyResolvers;

  // Cached reference to the global `browser` namespace. Primarily used to
  // facilitate unit testing.
  _browser;


  constructor(
    areaName,
    { browser = globalThis.browser ?? globalThis.chrome } = {},
  ) {
    this._area = areaName;
    this._browser = browser;
    this.init();
  }

  init() {
    // Remove previous event listeners (if any)
    this.destroy();

    // Reset cache
    this._clearCache();

    // Prepare "ready" promise to signal that we've finished initialization
    const resolvers = Promise.withResolvers();
    this._readyResolvers = resolvers;
    this.ready = resolvers.promise;

    this._populateCache({resolvers: this._readyResolvers});

    this._browser.storage.onChanged.addListener(this._handleStorageChange);

  }

  _clearCache() {
    this._cache.clear();
  }

  _populateCache({keys = null, resolvers}) {
    this._browser.storage[this._area].get(keys).then((data) => {
      if (this._browser.runtime.lastError) {
        return resolvers.reject(this._browser.runtime.lastError);
      }
      for (const [key, value] of Object.entries(data)) {
        this._knownKeys.add(key);
        this._cache.set(key, value);
      }
      resolvers.resolve(this);
    });
  }

  // Instance-specific version of the handleStorageChange callback function. We need a bound version
  // of this function to remove the event listener or we'll leak memory.
  _handleStorageChange = (...args) => {
    this._handleStorageChangeInternal(...args);
  }

  // TBD
  //
  // NOTE: This callback WILL NOT be called if another piece of code in this
  // JavaScript environment calls `browser.storage.<area>.set()`. They MUST use
  // the instance's `set()` method or the instance's cache will de-sync.
  _handleStorageChangeInternal(changes, areaName) {
    if (areaName !== this._area) return;
    for (const [key, values] of Object.entries(changes)) {
      if (!values.hasOwnProperty("newValue")) {
        // Key was deleted, remove it from cache
        this._cache.delete(key);
      } else {
        // Value was changed, update cache to reflect the change
        this._cache.set(key, values.newValue);
      }
    }
  }

  // Behavior options
  //
  // | Value         | Description |
  // | ------------- | ----------- |
  // | "sync"        | (default) Synchronously return the value of the key in cache. |
  // | "readthrough" | Synchronously return the value of the key in cache and asynchronously fetch the value from browser storage and cache it. |
  // | "async"       | Asynchronously fetch the value from browser storage and cache it. |
  // | "asyncread"   | Asynchronously fetch the value from browser storage, but DO NOT cache it.

  // Would it be better to just expose options to update the value?
  //
  // "update": (Boolean, default: `true`) Specifies whether or not to update the
  // value in cache when interacting with browser storage. Has no effect when
  // "from" value is "cache".
  //
  // "return": ("sync"| "async", default: "sync") a
  //
  // "from": ("cache" | "storage", default: "cache") Where the value should be
  // retrieved from. "cache" will implicitly cause the function to return
  // synchronously. "storage" implicitly makes the function return
  // asynchronously, as the value must be fetched from storage.
  //
  // Example 1: Synchronously retrieve the current cached value.
  //
  // var value = store.get(key);
  //
  // Example 2: Synchronously retrieve the current value from cache and update
  // the cached value in the background.
  //
  // var value = store.get(key, {update: true});
  //
  // Example 3: Asynchronously retrieve the value from browser storage and
  // update the cached value.
  //
  // // `from: 'storage'` implicitly sets `update: true` and `return: "async"`.
  // const value = await store.get(key, {from: "storage"});
  //
  // Example 4: Asynchronously retrieve the value from browser storage, but DO
  // NOT update the cached value.
  //
  // const value = await store.get(key, {from: "storage", update: false});

  get(key) {
    return this._cache.get(key);
  }
  lazyGet(key, {refresh = false} = {}) {
    if (refresh) {
      return this._browser.storage[this._area].get(key).then((data) => {
        if (this._browser.runtime.lastError) {
          throw this._browser.runtime.lastError;
        }
        this._knownKeys.add(key);
        this._cache.set(key, data[key]);
        return data[key];
      });
    }

    if (this._knownKeys.has(key) && !refresh) {
      return this._cache.get();
    }
  }

  _getAndCache(key) {

  }

  /**
   *
   * @param {string} key
   * @param {*} value
   * @returns {Promise} A promise that will resolve when the value is written to
   * browser storage.
   */
  set(key, value) {
    if (typeof key !== "string") {
      console?.warn(`set() was called with a key of type "${typeof key}". This value will coerced into the string "${key.toString()}" which may result in unexpected behavior.`)
      key = key.toString();
    };
    this._knownKeys.set(key);
    this._cache.set(key, value);
    return this._browser.storage[this._area].set({[key]: value});
  }

  remove(key) {
    this._knownKeys.remove(key);
    this._cache.delete(key);
    return this._browser.storage[this._area].remove(key);
  }

  clear() {
    this._knownKeys.clear();
    this._cache.clear();
    return this._browser.storage[this._area].clear();
  }

  destroy() {
    this._browser.storage.onChanged.removeListener(this._handleStorageChange);
  }
}