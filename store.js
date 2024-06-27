class Store {
  cache = new Map();

  _readyResolvers = Promise.withResolvers()
  ready = this._readyResolvers.promise;

  constructor(areaName) {
    this.areaName = areaName;

    browser.storage[this.areaName].get(null).then((data) => {
      for (const [key, value] of Object.entries(data)) {
        this.cache.set(key, value);
      }
      this._readyResolvers.resolve(this);
    });

    browser.storage.onChanged.addListener(this._handleStorageChange);
  }

  // Instance-specific version of the handleStorageChange callback function. We need a bound version
  // of this function to remove the event listener or we'll leak memory.
  _handleStorageChange = (...args) => {
    this.handleStorageChange(...args);
  }

  handleStorageChange(changes, areaName) {
    if (areaName !== this.areaName) return;
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

  get(key) {
    this.cache.get(key);
  }

  set(key, value) {
    this.cache.set(key, value);
    browser.storage[this.areaName].set({[key]: value});
  }

  destroy() {
    browser.storage.onChanged.removeListener(this._handleStorageChange);
  }
}