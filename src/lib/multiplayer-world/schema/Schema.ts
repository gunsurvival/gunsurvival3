import { Schema as ColySchema, type } from "@colyseus/schema"
import uniqid from "uniqid"

import { Init } from "../decorators"
import { World } from "../World"

@Init()
export class Schema extends ColySchema {
	___: {
		world: World
	} = {} as any

	serverHandlers!: Map<string, Function>
	clientHandlers!: Map<string, Function>
	eventHandlers = new Map<string, Function[]>()

	@type("string") id: string = uniqid()

	sync<T extends Schema>(this: T) {
		const schema = this
		return new Proxy(
			{},
			{
				// TODO: implement setter, if invoking set, then make the rpc changes sync to client
				get(target, key: string) {
					const handler = schema.serverHandlers.get(key)
					if (handler) {
						// schema.log(`Invoking server method "${key}" on Schema "${schema.constructor.name}"!`);
						return (...args: any[]) => {
							if (schema.___.world.isServerOnly()) {
								handler.bind(schema)(...args)
								// only broadcast to other clients if it's server only
								schema.___.world.room.broadcast("rpc", {
									id: schema.id,
									method: key,
									args,
								})
							}
						}
					}

					throw new Error(
						`Server method "${key}" not found on Schema "${schema.constructor.name}"! Make sure to use @Server() decorator on your method!`
					)
				},
			}
		) as Omit<T, keyof Schema | FieldKeys<T>>
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
}

type FieldKeys<T> = {
	[K in keyof T]: T[K] extends Function ? never : K
}[keyof T]

type NewMethodOnly<T> = Exclude<keyof T, keyof Schema | FieldKeys<T>>
