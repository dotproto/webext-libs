# Arrow function members for event listeners

Some classes in this repo have arrow functions as class fields. This approach is used for two reasons:

1. We have to maintain a reference to a WebExtension event listeners in order to unregister them when they are no longer needed. If we don't, we will have a memory leak.
2. We can't use a shared instance of this function or the internal `this` references won't point to the correct parent object.

