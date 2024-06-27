import { hitch } from "./shared/shackle.js"

class StorageArea extends EventTarget {
  // In order to minimize overhead and keep our view of the data consistent,
  // we use a single shared cache of the values in WebExtension storage. This
  // addresses situations where developers create multiple instances of
  // StorageArea in a single execution context that get out of sync from each
  // other.
  static sharedCache = {};

  static changeListenerInitialized = false;
  static instanceRegistry = new Set();

  static initChangeListener() {
    if (StorageArea.changeListenerInitialized) return;
    this.browser.storage.onChanged.addListener(StorageArea.handleChange);
  }

  static registerInstance(instance) {
    StorageArea.instanceRegistry.add(instance);
  }

  static unregisterInstance(instance) {
    StorageArea.instanceRegistry.remove(instance);
  }

  static handleChange(changes, areaName) {
    for (const instance of StorageArea.instanceRegistry) {
      instance.handleChange(changes, areaName);
    }
  }

  constructor(name, {initKeys=null, browser = (typeof browser === 'undefined' ? chrome : browser)} = {}) {
    this.browser = browser;
    this.areaName = name;
    this.area = this.browser.storage[name];

    this.initialized = this.initStorageArea(initKeys);
  }

  async initStorageArea(initKeys = null) {
    if (!StorageArea.sharedCache[areaName]) {
      StorageArea.sharedCache[areaName] = new Map();
    }

    const data = await browser.storage.session.get(initKeys);

    for (const [key, value] of Object.entries(data)) {
      StorageArea.sharedCache[this.areaName].set(key, value);
    }

    return this;
  }

  get(key) {
    let getKeys = [];
    if (Array.isArray(key)) {
      getKeys = key;
    } else if (typeof key === 'object') {
      getKeys = Object.keys(key);
    }

    let response = {};
    for (let getKey of getKeys) {
      response[getKey] = StorageArea.sharedCache[this.areaName].get(getKey);
    }
    return response;
  }

  set(key, value) {
    let data = {};
    if (typeof key === 'object') {
      try {
        data = JSON.parse(JSON.stringify(key));
      } catch (e) {
        throw new TypeError("The supplied parameters are not JSON serializable.", {cause: e});
      }
    } else {
      data[key] = value;
    }

    for (const [key, value] of Object.entries(data)) {
      StorageArea.sharedCache[this.areaName].set(key, value);
    }

    return this.area.set(data);
  }

  remove(key) {
    let removeKeys = [];
    if (Array.isArray(key)) {
      removeKeys = key;
    } else if (typeof key === 'object') {
      removeKeys = Object.keys(key);
    } else {
      removeKeys.push(key);
    }

    for (const removeKey of removeKeys) {
      StorageArea.sharedCache[this.areaName].delete(removeKey);
    }

    return this.area.remove(removeKeys);
  }
}

// =========
// Test case
// =========

// var session = new StorageArea("session");
console.log('set', await session.set("test", 'value'));
console.log(StorageArea.sharedCache.session);
console.log(await browser.storage.session.get(null));

console.log('remove', await session.remove('test'));
console.log(StorageArea.sharedCache.session);
console.log(await browser.storage.session.get(null));

// Extra bonus –
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "session") return;

  for (const [key, {oldValue, newValue}] of Object.entries(changes)) {
    if (oldValue && newValue === undefined) {
      StorageArea.sharedCache[areaName].delete(key);
    } else {
      StorageArea.sharedCache[areaName].set(key, newValue);
    }
  }
});

// ==================
// Background example
// ==================

let session = new StorageArea('session');

browser.action.onClicked.addListener(async (tab) => {
  await session.initialized;

  const watchedUrls = session.get('watchedUrls');
  if (watchedUrls.includes(tab.url)) {
    browser.runtime.sendMessage({ /* ... */ });
  }
});

