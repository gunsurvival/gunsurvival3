import { Schema as ColySchema, type } from "@colyseus/schema"
import uniqid from "uniqid"

import { World } from "../World"
import { waitFor } from "../utils/waitFor"
import { Client } from "colyseus"

export class Schema extends ColySchema {
	___: {
		//! Put world in ___ to avoid colyseus sync this
		world: World
	} = {} as any

	serverHandlers!: Map<string, Function>
	clientHandlers!: Map<string, Function>
	eventHandlers = new Map<string, Function[]>()
	serverState!: typeof this

	@type("string") id: string = uniqid()

	// use this to sync the method to specific client (server purpose only but mode "both" still work)
	sync<T extends Schema>(this: T, client: Client) {
		const schema = this
		return new Proxy(
			{},
			{
				get(target, key: string) {
					if (!schema[key as keyof typeof schema]) {
						throw new Error(
							`Method "${key}" not found on Schema "${schema.constructor.name}"!`
						)
					}

					const serverHandler = schema.serverHandlers.get(key)

					if (!serverHandler) {
						throw new Error(
							`Server method "${key}" not found on Schema "${schema.constructor.name}"! Make sure to add @Server() decorator on the method!`
						)
					}

					return (...args: any[]) => {
						if (schema.___.world.isServerOnly()) {
							client.send("rpc", {
								id: schema.id,
								method: key,
								args,
							})
						}

						return serverHandler.bind(schema)(...args)
					}
				},
				// TODO: implement setter, if invoking set, then make the rpc changes sync to client
			}
		) as Omit<T, keyof Schema>
	}

	skipCheck<T extends Schema>(this: T) {
		const schema = this
		return new Proxy(
			{},
			{
				get(target, key: string) {
					if (!schema[key as keyof typeof schema]) {
						throw new Error(
							`Method "${key}" not found on Schema "${schema.constructor.name}"!`
						)
					}

					const handler =
						schema.serverHandlers.get(key) ||
						schema.clientHandlers.get(key) ||
						(schema[key as keyof typeof schema] as Function | undefined)

					if (!handler || !(handler instanceof Function)) {
						throw new Error(
							`Method "${key}" not found on Schema "${schema.constructor.name} or not a function!`
						)
					}

					return (...args: any[]) => {
						return handler.bind(schema)(...args)
					}
				},
			}
		) as Omit<T, keyof Schema>
	}

	addListener<T extends Schema, EventKey extends NewMethodOnly<T>>(
		this: T,
		event: EventKey,
		listener: (
			...args: Parameters<
				T[EventKey] extends (...args: any) => any ? T[EventKey] : never
			>
		) => any
	) {
		const handlers = this.eventHandlers.get(event as string)
		if (handlers) {
			handlers.push(listener)
		} else {
			this.eventHandlers.set(event as string, [listener])
		}

		return () => {
			this.removeListener(event, listener)
		}
	}

	removeListener<T extends Schema, EventKey extends NewMethodOnly<T>>(
		this: T,
		event: EventKey,
		listener: (
			...args: Parameters<
				T[EventKey] extends (...args: any) => any ? T[EventKey] : never
			>
		) => any
	) {
		const handlers = this.eventHandlers.get(event as string)
		if (handlers) {
			const index = handlers.indexOf(listener)
			if (index !== -1) {
				handlers.splice(index, 1)
			}
		}
	}

	clearListeners(eventKey?: NewMethodOnly<this>) {
		if (eventKey) {
			this.eventHandlers.delete(eventKey as string)
			return
		}

		this.eventHandlers.clear()
	}

	on<T extends Schema, EventKey extends NewMethodOnly<T>>(
		this: T,
		event: EventKey,
		listener: (
			...args: Parameters<
				T[EventKey] extends (...args: any) => any ? T[EventKey] : never
			>
		) => any
	) {
		this.clearListeners()
		return this.addListener(event, listener)
	}

	off<T extends Schema, EventKey extends NewMethodOnly<T>>(
		this: T,
		event: EventKey,
		listener: (
			...args: Parameters<
				T[EventKey] extends (...args: any) => any ? T[EventKey] : never
			>
		) => any
	) {
		this.clearListeners(event)
	}

	log(...args: any) {
		console.log(
			`${this.___.world.isServerOnly() ? "SERVER" : "CLIENT"}:`,
			...args
		)
	}

	clientOnly<T extends any>(func?: () => T): T {
		// TODO: refactor waitfor timeout (it's not good), subcribe to signal from internal variable (when World add this entity, or after addRecursiveWorld on this) and run func()
		const checkSymbol = Symbol("check")
		let result = checkSymbol as T

		waitFor(
			() => {
				if (this.___.world.__isClient === true) {
					result = func?.() as T
				}
				return true
			},
			{
				waitForWhat: "schema.___.world.isClient is defined",
				timeoutMs: 10000,
				skipTestThrow: true,
			}
		).catch((e) => {
			console.log(this.constructor.name, e)
		})
		const that = this

		return new Proxy(
			{},
			{
				get() {
					if (result === checkSymbol && that.___.world.isServerOnly()) {
						throw new Error("This property is client-only!")
					}
					return result
				},
			}
		) as T
	}

	getSnapshot(): Record<string, any> {
		return {}
	}

	applySnapshot(snapshot: ReturnType<this["getSnapshot"]>) {}

	get isClient() {
		return this.___.world.__isClient
	}

	get isServer() {
		return this.___.world.__isServer
	}

	get world() {
		return this.___.world
	}
}

type FieldKeys<T> = {
	[K in keyof T]: T[K] extends Function ? never : K
}[keyof T]

type NewMethodOnly<T> = Exclude<keyof T, keyof Schema | FieldKeys<T>>
