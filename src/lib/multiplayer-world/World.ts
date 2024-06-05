import { System, type Body, type Response } from "detect-collisions"
import { Room as RoomServer, type Client as ColyClient } from "@colyseus/core"
import { Room as RoomClient } from "colyseus.js"

import { Schema } from "./schema/Schema"
import { pairClientServer } from "./utils/common"
import { waitFor } from "./utils/waitFor"
import { Server } from "./decorators"
import { ServerController } from "./ServerController"

export class World extends Schema {
	frameCount = 0
	__holderMap = new Map<string, Schema>()
	__schemaMap = new Map<string, Schema>()
	__isServer = false
	__isClient = false
	room?: RoomServer | RoomClient
	clientState = {}

	physics = new System()
	collisionHashMap = new Map<string, Response>()
	newCollisionHashMap = new Map<string, Response>()

	constructor({ mode, room }: WorldOptions) {
		super()
		if (mode === "server") {
			this.__isServer = true
			this.__isClient = false
			if (!room) {
				throw new Error("RoomServer is required for server mode!")
			}
			this.room = room
		} else if (mode === "client") {
			this.__isServer = false
			this.__isClient = true
			if (!room) {
				throw new Error("RoomClient is required for client mode!")
			}
			this.room = room
		} else if (mode === "both") {
			this.__isServer = true
			this.__isClient = true
			if (room) {
				throw new Error('Do not pass any "room" in mode "both"!')
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

	/** Run this setup on client */
	setupServerRPC(roomClient: RoomClient) {
		// roomClient.onStateChange.once((state) => {
		roomClient.onMessage(
			"snapshot",
			(snapshot: ReturnType<this["getSnapshot"]>) => {
				this.applySnapshot(snapshot)
				setTimeout(() => {
					// TODO: remove timeout deo hieu sao cho nay bi cannot read pos
					pairClientServer(this, roomClient.state, this.__holderMap)
				}, 1000)
				roomClient.onMessage<RPCRequest>("rpc", async (message) => {
					console.log("rpc message", message)
					try {
						// TODO: refactor this not to use waitFor, hook on holderMap adding event
						await waitFor(() => this.__holderMap.has(message.id), {
							waitForWhat: `holderMap has ${message.id}`,
							timeoutMs: 5000,
							immediate: true,
							intervalMs: 10,
						})

						const clientSchema = this.__holderMap.get(message.id)!
						const handler =
							clientSchema.serverHandlers.get(message.method) ||
							clientSchema.clientHandlers.get(message.method) ||
							(clientSchema[
								message.method as keyof typeof clientSchema
							] as Function)
						if (!handler) {
							throw new Error(`Handler not found for ${message.method}`)
						}
						if (!(handler instanceof Function)) {
							throw new Error(`Handler "${message.method}" is not a function!`)
						}
						// console.log(`CLIENT: Invoking ${message.method} with args:`, message.args);
						clientSchema?.eventHandlers
							.get(message.method)
							?.forEach((handler) =>
								handler.bind(clientSchema)(...message.args)
							)

						handler.bind(clientSchema)(...message.args)
					} catch (error) {
						console.error(
							`RPC error for method "${message.method}":`,
							message,
							error
						)
					}
				})
				roomClient.send("ready-to-join")
			}
		)
		roomClient.send("ready-to-get-snapshot")
		// })
	}

	/** Run this setup on server */
	setupClientRPC(roomServer: RoomServer) {
		roomServer.onMessage<RPCRequest>(
			"rpc-controller",
			async (client, message) => {
				try {
					const controllers = client.userData?.controllers as
						| Map<string, ServerController>
						| undefined
					const controller = controllers?.get(message.id)
					if (!controller) {
						throw new Error(
							`Controller not found on client for id "${message.id}"`
						)
					}

					const handler = controller.controllerHandlers.get(message.method)
					if (!handler) {
						throw new Error(
							`Handler "${message.method}" not found on controller "${controller.constructor.name}"!`
						)
					}
					if (!(handler instanceof Function)) {
						throw new Error(`Handler "${message.method}" is not a function!`)
					}
					handler.bind(controller)(...message.args)
				} catch (error) {
					console.error("RPC error:", error)
				}
			}
		)
	}

	getSnapshot() {
		return {}
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
