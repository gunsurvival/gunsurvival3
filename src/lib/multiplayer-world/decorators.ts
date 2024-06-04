import { Entity } from "@/core/entity/Entity"
import { ServerController } from "./ServerController"
import { Schema } from "./schema"

export function Server({ skipSync = false } = {}) {
	// This decorator will make the method only run if the world is server side and send signal to call the method remotely on client side
	// It's mean any method that has this decorator will treat as "dispatch" method to client
	// Example creating a bullet, the bullet will be created on server (random data will be calculated on server)
	// and then dispatch to client to make sure both client and server have the same bullet data

	return function (
		target: any,
		propertyKey: any,
		descriptor: TypedPropertyDescriptor<any>
	) {
		const originalMethod = descriptor.value
		checkFunction(originalMethod)

		target.serverHandlers ||= new Map<string, Function>()
		target.serverHandlers.set(propertyKey, originalMethod)

		descriptor.value = function (this: Schema, ...args: any[]) {
			if (this.world.isServerOnly() && !skipSync) {
				// If current world is in server side, send rpc method to client
				// if (isPrivate) {
				// 	//TODO: make this If the method is private, only send to the entity's client (who control the entity)
				// 	if (this instanceof Entity && this.controller?.clientOnServer) {
				// 		this.world.room.send(this.controller.clientOnServer, "rpc", {
				// 			id: this.id,
				// 			method: propertyKey,
				// 			args,
				// 		})
				// 	}
				// } else {
				this.world.room.broadcast("rpc", {
					id: this.id,
					method: propertyKey,
					args,
				})
				// }
			}

			if (this.isServer) {
				return originalMethod.bind(this)(...args)
			}
		}

		return descriptor
	}
}

export function Client() {
	return function (
		target: any,
		propertyKey: any,
		descriptor: TypedPropertyDescriptor<any>
	) {
		const originalMethod = descriptor.value
		checkFunction(originalMethod)

		target.clientHandlers ||= new Map<string, Function>()
		target.clientHandlers.set(propertyKey, originalMethod)

		// @ts-ignore
		// const errorProxy = new Proxy(
		// 	{},
		// 	{
		// 		get(target, key: string) {
		// 			if (key === "then") {
		// 				return Promise.resolve(errorProxy)
		// 			}
		// 			throw new Error(
		// 				`Method "${propertyKey}" is client only! Are you trying to use its return value on server side?`
		// 			)
		// 		},
		// 	}
		// )

		descriptor.value = function (this: Schema, ...args: any[]) {
			if (this.isClient) {
				return originalMethod.bind(this)(...args)
			}
		}

		return descriptor
	}
}

export function Controller() {
	return function (
		target: any,
		propertyKey: any,
		descriptor: TypedPropertyDescriptor<any>
	) {
		const originalMethod = descriptor.value
		checkFunction(originalMethod)

		target.controllerHandlers ||= new Map<string, Function>()
		target.controllerHandlers.set(propertyKey, originalMethod)

		descriptor.value = function (this: ServerController, ...args: any[]) {
			if (this.target.world.isClientOnly()) {
				this.target.world.room.send("rpc-controller", {
					id: this.id,
					method: propertyKey,
					args,
				})
			}

			return originalMethod.bind(this)(...args)
		}
	}
}

function checkFunction(func: any): asserts func is Function {
	if (!func || !(func instanceof Function)) {
		throw new Error("You must use this decorator on a method!")
	}
}
