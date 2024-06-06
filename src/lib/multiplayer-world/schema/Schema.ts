import { Schema as ColySchema, type } from "@colyseus/schema"
import uniqid from "uniqid"

import { Client } from "colyseus"
import { getHandlers, serverHandlersMap } from "../decorators"
import type { World } from "../world/World"
import EventEmitter from "events"

export class Schema<TWorld extends World = World> extends ColySchema {
	___: {
		//! Put world in ___ to avoid colyseus sync this
		world: TWorld
	} = {} as any

	@type("string") id: string = uniqid()

	eventHandlers = new Map<string, Function[]>()
	serverState: typeof this | undefined
	ee = new EventEmitter()

	get serverHandlers() {
		return getHandlers(this.constructor, "server")
	}

	get clientHandlers() {
		return getHandlers(this.constructor, "client")
	}

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
						console.log(serverHandlersMap)
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
		const checkSymbol = Symbol("check")
		let result = checkSymbol as T

		this.ee.once("prepare-done", () => {
			result = func?.() as T
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
