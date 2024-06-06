import { ServerController } from "./ServerController"
import { Schema } from "./schema"

// unbuild handlers
export const _serverHandlersMap = new Map<any, Record<string, Function>>()
export const _clientHandlersMap = new Map<any, Record<string, Function>>()
export const _controllerHandlersMap = new Map<any, Record<string, Function>>()

// built handlers
export const serverHandlersMap = new Map<any, Map<string, Function>>()
export const clientHandlersMap = new Map<any, Map<string, Function>>()
export const controllerHandlersMap = new Map<any, Map<string, Function>>()

export function Server({ skipSync = false, allowClient = false } = {}) {
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

		const serverHandlers = _serverHandlersMap.get(target.constructor) || {}
		if (!_serverHandlersMap.has(target.constructor)) {
			_serverHandlersMap.set(target.constructor, serverHandlers)
		}
		serverHandlers[propertyKey] = originalMethod

		// target.serverHandlers ||= new Map<string, Function>()
		// if (target.serverHandlers.has(propertyKey)) {
		// 	// debugger
		// }
		// target.serverHandlers.set(propertyKey, originalMethod)
		// console.log("register server handler", propertyKey, target.constructor.name)

		descriptor.value = function (this: Schema, ...args: any[]) {
			if (this instanceof Schema) {
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
			}

			if (this.isServer || allowClient) {
				// console.log(propertyKey, args, this)
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

		// target.clientHandlers ||= new Map<string, Function>()
		// target.clientHandlers.set(propertyKey, originalMethod)

		const clientHandlers = _clientHandlersMap.get(target.constructor) || {}
		if (!_clientHandlersMap.has(target.constructor)) {
			_clientHandlersMap.set(target.constructor, clientHandlers)
		}
		clientHandlers[propertyKey] = originalMethod

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

export function Controller({ serverOnly = false } = {}) {
	return function (
		target: any,
		propertyKey: any,
		descriptor: TypedPropertyDescriptor<any>
	) {
		const originalMethod = descriptor.value
		checkFunction(originalMethod)

		// target.controllerHandlers ||= new Map<string, Function>()
		// target.controllerHandlers.set(propertyKey, originalMethod)

		const controllerHandlers =
			_controllerHandlersMap.get(target.constructor) || {}
		if (!_controllerHandlersMap.has(target.constructor)) {
			_controllerHandlersMap.set(target.constructor, controllerHandlers)
		}
		controllerHandlers[propertyKey] = originalMethod

		descriptor.value = function (this: ServerController, ...args: any[]) {
			if (this.target.world.isClientOnly()) {
				this.target.world.room.send("rpc-controller", {
					id: this.id,
					method: propertyKey,
					args,
				})
			}

			if (!serverOnly || !this.isClient)
				return originalMethod.bind(this)(...args)
		}
	}
}

function checkFunction(func: any): asserts func is Function {
	if (!func || !(func instanceof Function)) {
		throw new Error("You must use this decorator on a method!")
	}
}

function getHandlersMapByType<
	Temp extends boolean,
	Return extends Temp extends true
		? Map<any, Record<string, Function>>
		: Map<any, Map<string, Function>>
>(type: "server" | "client" | "controller", isTemp: Temp): Return {
	return (() => {
		switch (type) {
			case "server":
				return isTemp ? _serverHandlersMap : serverHandlersMap
			case "client":
				return isTemp ? _clientHandlersMap : clientHandlersMap
			case "controller":
				return isTemp ? _controllerHandlersMap : controllerHandlersMap
		}
	})() as Return
}

function getRecordHandlers(
	constructor: any,
	type: "server" | "client" | "controller"
): Record<string, Function> {
	const _handlersMap = getHandlersMapByType(type, true)
	const handlersMap = getHandlersMapByType(type, false)
	if (!constructor) {
		return {}
	}
	const result = {
		...getRecordHandlers(Object.getPrototypeOf(constructor), type),
		..._handlersMap.get(constructor)!,
	}
	handlersMap.set(constructor, createMapFromRecord(result))
	return result
}

export function getHandlers(
	constructor: any,
	type: "server" | "client" | "controller"
): Map<string, Function> {
	const handlersMap = getHandlersMapByType(type, false)
	if (handlersMap.has(constructor)) {
		return handlersMap.get(constructor)!
	}
	const record = getRecordHandlers(constructor, type)
	const map = createMapFromRecord(record)
	handlersMap.set(constructor, map)
	return map
}

function createMapFromRecord<K extends string, V>(
	record: Record<K, V>
): Map<K, V> {
	const map = new Map<K, V>()

	// Iterate over each entry in the record
	Object.entries(record).forEach(([key, value]) => {
		map.set(key as K, value as V) // Set each entry in the map
	})

	return map
}
