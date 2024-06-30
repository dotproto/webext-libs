const isString = (val) => typeof val === "string";
const isStringable = (val) => val != null && (typeof val === "string" || typeof val.toString === "function");
const isNotString = (val) => typeof val !== "string";
const isNotStringable = (val) => val == null || (typeof val !== "string" && typeof val.toString !== "function");

export class Store {
  static {
    this.isStoragePermissionDeclared = (async (browser) => {
      let answer;
      return async () => {
      }
    })()
  }

  static getDerivedStorageAreas(browser = this._browser) {
    // Determine the set of "storage areas" supported by this web browser
    // filtering the list of properties on `browser.storage`. Do not include
    // properties that being with:
    //
    // - a capital letter: these are API-specific types
    // - "on" followed by a capital letter: these are event interfaces
    //
    // All other properties are included in the list of known areas.
    const nonAreaPropExp = /^(on)?[A-Z]/;
    const areas = [];
    for (const prop in browser.storage) {
      if (!nonAreaPropExp.test(prop)) {
        areas.push(prop);
      }
    }
    return areas;
  }
  _area;
  _browser;
  _derivedStorageAreas;

  cache = new Map();
  ready;

  /**
   *
   * @param {string} area The name of the storage area that the new instance
   * will work on.
   * @param {object} options
   */
  constructor(area, {prime: primeKeys = null, browser = globalThis.browser ?? globalThis.chrome} = {}) {
    if (arguments.length < 2) {
      throw new TypeError(`Store constructor: At least 1 argument expected, but only ${arguments.length} passed.`);
    }
    if (arguments.length > 2) {
      throw new TypeError(`Store constructor: At most 2 arguments expected, but ${arguments.length} passed.`);
    }

    this._area = area;
    this._browser = browser;

    this._derivedStorageAreas = Store.getDerivedStorageAreas(this._browser);
    if (!this._derivedStorageAreas.includes(area)) {
      throw new TypeError(`The "area" argument must be one of: ${this._derivedStorageAreas.join(",")}`);
    }

    const hasPermissions = this.hasPermissions().then(granted => {
      if (!granted) {
        throw new Error(`Store.constructor: extension does not have the "storage" permission.`);
      }
    });
    this.ready = hasPermissions.then(() => this.prime(primeKeys));
    browser.storage.onChanged.addListener(this._handleStorageChange);
  }

  async hasPermissions(browser = this.browser) {
    const manifest = browser.runtime.getManifest();
    const allPerms = manifest.permissions.concat(manifest.optional_permissions);

    // If "storage" wasn't declared in the required or optional permissions
    // array, then we DEFINITELY don't have permission.
    if (!allPerms.include("storage")) {
      return false;
    }

    // Check if the extension has been granted the "storage" permission.
    //
    // We can't assume that requesting the permission in the manifest is enough
    // means we have it at runtime. permissions can be restricted by enterprise
    // policies or may be restricted by future browser features (end user
    // overrides).
    return browser.permissions.contains({permissions: ["storage"]});
  }

  // Instance-specific version of the handleStorageChange callback function. We need a bound version
  // of this function to remove the event listener or we'll leak memory.
  _handleStorageChange = (...args) => {
    this.handleStorageChange(...args);
  }

  handleStorageChange(changes, areaName) {
    if (areaName !== this._area) return;
    for (const [key, values] of Object.entries(changes)) {
      if (!values.hasOwnProperty("newValue")) {
        // Key was deleted, remove it from cache
        this.cache.delete(key);
      } else {
        // Value was changed, update cache to match
        this.cache.set(key, values.newValue);
      }
    }
  }

  prime(keys = null) {
    if (arguments.length < this.prime.length || arguments.length > this.prime.length) {
      throw new TypeError(`Store.prime(): Expected ${this.prime.length} arguments but ${arguments.length} were passed.`);
    }

    let fetchKeys;
    if (keys === null) {
      fetchKeys = null;
    } else {
      fetchKeys = [];
      for (let key of keys) {
        if (!this.cache.has(key)) {
          fetchKeys.push(key);
        }
      }
    }

    const resolvers = Promise.withResolvers();

    browser.storage[this._area].get(fetchKeys)
      .then((data) => {
        if (browser.runtime.lastError) {
          return resolvers.reject(browser.runtime.lastError);
        }

        for (const [key, value] of Object.entries(data)) {
          this.cache.set(key, value);
        }
        resolvers.resolve(this);
      });

    return resolvers.promise;
  }

  get(key) {
    this.cache.get(key);
  }

  set(key, value) {
    this.cache.set(key, value);
    browser.storage[this._area].set({[key]: value});
  }

  keys() {
    return this.cache.keys();
  }

  values() {
    return this.cache.values();
  }

  entries() {
    return this.cache.entries();
  }

  destroy() {
    browser.storage.onChanged.removeListener(this._handleStorageChange);
  }
}
