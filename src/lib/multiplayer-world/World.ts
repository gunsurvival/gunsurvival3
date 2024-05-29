import { Room as RoomServer } from "@colyseus/core"
import { Room as RoomClient } from "colyseus.js"

import { Schema } from "./schema/Schema"
import { pairClientServer } from "./utils/common"
import { waitFor } from "./utils/waitFor"

export class World extends Schema {
	__holderMap = new Map<string, Schema>()
	__isServer = false
	__isClient = false
	room?: RoomServer | RoomClient
	clientState = {}

	constructor({ mode, room }: WorldOptions) {
		super()
		if (mode === "server") {
			this.__isServer = true
			this.__isClient = false
			this.room = room
			if (!room) {
				throw new Error("Room is required for server mode!")
			}
		} else if (mode === "client") {
			this.__isServer = false
			this.__isClient = true
			if (room) {
				throw new Error('Do not pass "room" in client mode!')
			}
		} else if (mode === "both") {
			this.__isServer = true
			this.__isClient = true
			if (room) {
				throw new Error('Do not pass "room" in mode "both"!')
			}
		} else {
			throw new Error("Invalid mode!")
		}
	}

	async init(options: Record<string, any>) {}

	get isClient() {
		return this.__isClient
	}

	get isServer() {
		return this.__isServer
	}

	isServerOnly(): this is { room: RoomServer } {
		return this.isServer && !this.isClient
	}

	isClientOnly(): this is { room: RoomClient } {
		return !this.isServer && this.isClient
	}

	isBoth(): this is { room: undefined } {
		return this.isServer && this.isClient
	}

	clientOnly<T extends any>(func: () => T): T {
		if (this.isClient) {
			return func()
		} else {
			return new Proxy(
				{},
				{
					get: () => {
						throw new Error("This property is client-only!")
					},
					set: () => {
						throw new Error("This property is client-only!")
					},
				}
			) as T
		}
	}

	setupRPC(room: RoomClient) {
		room.onStateChange.once((state) => {
			pairClientServer(this, room.state, this.__holderMap)

			room.onMessage<RPCRequest>("rpc", async (message) => {
				try {
					await waitFor(() => this.__holderMap.has(message.id), {
						waitForWhat: `holderMap has ${message.id}`,
						timeoutMs: 5000,
						immediate: true,
					})
					const holder = this.__holderMap.get(message.id)!
					const handler =
						holder.serverHandlers.get(message.method) ||
						holder.clientHandlers.get(message.method) ||
						(holder[message.method as keyof typeof holder] as Function)
					if (!handler) {
						throw new Error(`Handler not found for ${message.method}`)
					}
					if (!(handler instanceof Function)) {
						throw new Error(`Handler "${message.method}" is not a function!`)
					}
					// console.log(`CLIENT: Invoking ${message.method} with args:`, message.args);
					holder?.eventHandlers
						.get(message.method)
						?.forEach((handler) => handler.bind(holder)(...message.args))
					handler.bind(holder)(...message.args)
				} catch (error) {
					console.error("RPC error:", error)
				}
			})
		})
	}
}

export type WorldOptions =
	| {
			mode: "server"
			room: RoomServer
	  }
	| {
			mode: "client"
			room: RoomClient
	  }
	| {
			mode: "both"
			room?: undefined
	  }

export type RPCRequest = {
	id: string
	method: string
	args: any[]
}
