import { Store } from "./store.js";

globalThis.browser ??= chrome;

const store = new Store("local", {prime: []});
store.ready().catch(e => {
  console.error("Ooops!", e);
});
globalThis.store = store;


browser.runtime.onInstalled.addListener(() => {
  store.clear();
  store.set("key", "value");
  store.set("userSettings", {
    theme: "dark",
  })
});

browser.action.onClicked.addListener(async (tab) => {
  await store.ready();

  console.log(store.keys());
});
