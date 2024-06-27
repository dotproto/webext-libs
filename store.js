class Store {
  cache = new Map();

  constructor(storageArea) {
    this.area = storageArea;

    const {promise, resolve, reject} = Promise.withResolvers();
    this.ready = promise;

    browser.storage[this.area].get(null).then((data) => {
      if (browser.runtime.lastError) {
        return reject(browser.runtime.lastError);
      }
      for (const [key, value] of Object.entries(data)) {
        this.cache.set(key, value);
      }
      resolve();
    });

    browser.storage.onChanged.addListener(this.handleStorageChange);
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    this.cache.set(key, value);
    browser.storage[this.area].set({[key]: value});
  }

  destroy() {
    browser.storage.onChanged.removeListener(this.handleStorageChange);
  }

  handleStorageChange = (changes, area) => {
    if (area !== this.area) return;
    for (const [key, values] of Object.entries(changes)) {
      if (!values.hasOwnProperty("newValue")) {
        // Key was deleted, remove it from cache
        this.cache.delete(key);
      } else {
        // Value was changed, update cache to reflect the change
        this.cache.set(key, values.newValue);
      }
    }
  }
}
