// Assign a bound version of a property on the prototype chain to the instance
// itself. This is useful in situations where a callback handler is defined on
// an object's prototype but the handler must be bound to the instance in order
// to preserver `this` references.
//
// The main disadvantage to this approach is that the bound version of the
// function does not reflect changes to the underlyig
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