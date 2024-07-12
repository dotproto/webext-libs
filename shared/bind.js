// This file contains a couple of different alternatives methods of binding
// functions to a particular context. While basic `fn.bind()` calls are
// extremely useful, in some situations you may want a more expressive way to
// perform that binding or need subtly different behavior from the typical
// pattern.

/**
 * Binds a method on an object's prototype chain to the object itself and return
 * a reference to the bound method. `bond()` is similar to
 * `Function.prototype.bind()`, but has a few key differences:
 *
 * 1. In addition to returning a bound version of the method, this function will
 *    also assign the bound method to the `instance`.
 * 2. `bond()` _only_ binds methods declared on the object's prototype chain. If
 *    the object already has a member with that name, it will be replaced.
 * 3. If a method cannot be found on the object's prototype chain, the `bond()`
 *    call will throw. This behavior is similar to how a `.bind()` call on a
 *    non-existent function will throw.
 * 4. `bond()` provides a shorter, more expressive syntax for performing the
 *    conventional binding of a class's method on in instance.
 *
 * @example
 * class Example {
 *   constructor(eventTarget) {
 *     eventTarget.addEventListener("message", bond(this, "handleMessage"));
 *   }
 *
 *   handleMessage() { ... }
 * }
 * @param {*} instance - The object that will be searched for the method and to
 * which the bound method will be assigned.
 * @param {*} methodName The name of the method `instance`'s prototype chain.
 * @returns The bound method
 */
export function bond(instance, methodName) {
  instance[methodName] = Reflect.getPrototypeOf(instance)[methodName].bind(instance);
}

// This version preserves the default behavior of dynamically looking up the
// method on the prototype and calling it against the current instance.
export function hitch(instance, methodName) {
	const proto = Object.getPrototypeOf(instance);

  const name = proto[methodName].name ?? methodName;
 	const tmp = {
    [name]() {
      return Object.getPrototypeOf(instance)[methodName].call(instance, ...arguments)
    }
	}
	instance[methodName] = tmp[methodName];
}

function getNames(obj, prop) {
  console.log(`desc`, Object.getOwnPropertyDescriptor(obj, prop));
  console.log(`desc val name ${Object.getOwnPropertyDescriptor(obj, prop).value.name}`);
  console.log(`desc for desc name`, Object.getOwnPropertyDescriptor(obj[prop], "name"));
}