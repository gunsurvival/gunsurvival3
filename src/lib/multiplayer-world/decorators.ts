import { Schema } from "./schema"

export function Server<Target extends Schema, Descriptor extends Function>() {
	// This decorator will make the method only run if the world is server side and send signal to call the method remotely on client side
	// It's mean any method that has this decorator will treat as "dispatch" method to client
	// Example creating a bullet, the bullet will be created on server (random data will be calculated on server)
	// and then dispatch to client to make sure both client and server have the same bullet data

	return function (
		target: Target,
		propertyKey: any,
		descriptor: TypedPropertyDescriptor<Descriptor>
	) {
		const originalMethod = descriptor.value
		if (!originalMethod) {
			throw new Error("You must use this decorator on a method!")
		}

		target.serverHandlers.set(propertyKey, originalMethod)

		// @ts-ignore
		descriptor.value = function (this: Schema, ...args: any[]) {
			if (this.___.world.isServer) {
				originalMethod?.bind(this)(...args)
			}
		}

		return descriptor
	}
}

export function Client<Target extends Schema, Descriptor extends Function>() {
	return function (
		target: Target,
		propertyKey: any,
		descriptor: TypedPropertyDescriptor<Descriptor>
	) {
		const originalMethod = descriptor.value
		if (!originalMethod) {
			throw new Error("You must use this decorator on a method!")
		}

		target.clientHandlers.set(propertyKey, originalMethod)

		// @ts-ignore
		descriptor.value = function (this: Schema, ...args: any[]) {
			if (this.___.world.isClient) {
				originalMethod?.bind(this)(...args)
			}
		}

		return descriptor
	}
}

export function Init() {
	return function (target: typeof Schema) {
		target.prototype.serverHandlers ||= new Map<string, Function>()
		target.prototype.clientHandlers ||= new Map<string, Function>()
	}
}
