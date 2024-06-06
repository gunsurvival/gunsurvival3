import uniqid from "uniqid"
import { System, type Response } from "detect-collisions"
import { Room as RoomServer } from "@colyseus/core"
import { Room as RoomClient } from "colyseus.js"

import { Schema } from "../schema/Schema"
import { pairClientServer } from "../utils/common"
import { waitFor } from "../utils/waitFor"
import { Server } from "../decorators"
import { ServerController } from "../ServerController"
import { MapSchema, type } from "../schema"
import { Entity } from "../entity/Entity"
import { BodyRefEntity } from "../utils/dectect-collisions"

export abstract class World extends Schema {
	frameCount = 0
	__holderMap = new Map<string, Schema>() // holding schema at client
	__schemaMap = new Map<string, Schema>() // holding schema at both
	__isServer = false
	__isClient = false

	@type({ map: Entity }) entities = new MapSchema<Entity>()

	clientState = {}
	room?: RoomServer | RoomClient
	entityRegistry = new Map<string, typeof Entity>()
	controllerRegistry = new Map<string, typeof ServerController>()

	physics = new System()
	collisionHashMap = new Map<string, Response>()
	newCollisionHashMap = new Map<string, Response>()

	constructor({ mode, room, entityClasses }: WorldOptions) {
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

		if (entityClasses) {
			Object.entries(entityClasses).forEach(([className, entityClass]) => {
				this.registerEntityClass(entityClass)
			})
		}
	}

	abstract prepare(options: Parameters<this["init"]>[0]): Promise<void>

	nextTick(delta: number) {
		this.frameCount++
	}

	init(
		options: Partial<{
			entities: [string, string, ReturnType<Entity["getSnapshot"]>][]
		}>
	) {
		if (options.entities) {
			this.entities.clear()
			options.entities.forEach(async ([className, id, entitySnapshot]) => {
				this.skipCheck().addEntityById(id, className, entitySnapshot)
			})
		}
	}

	getSnapshot(): Parameters<this["init"]>[0] {
		return {
			entities: Array.from(this.entities.values()).map((entity) => [
				entity.constructor.name,
				entity.id,
				entity.getSnapshot(),
			]) as [string, string, ReturnType<Entity["getSnapshot"]>][],
		}
	}

	start(): () => void {
		this.frameCount = 0
		const nextTick = this.nextTick.bind(this)
		let interval = setInterval(() => {
			nextTick(1000 / 60)
		}, 1000 / 60)
		return () => {
			clearInterval(interval)
		}
	}

	@Server({ skipSync: true })
	// Why skipSync: we are just create id on server side to make sure both client and server have the same id (passing to addEntityById)
	// So we don't need to sync this line to client as the addEntityById will be skipped on client side (because it's server only)
	async addEntity(
		className: string,
		options: {}
		// options: Parameters<
		// 	(typeof Entities)[ClassName] extends typeof Entity
		// 		? InstanceType<(typeof Entities)[ClassName]>["init"]
		// 		: (options: {}) => any
		// >[0]
	) {
		const id = uniqid()
		return this.addEntityById(id, className, options)
	}

	@Server()
	addEntityById(id: string, className: string, options: {}) {
		const entityClass = this.entityRegistry.get(className)
		if (!entityClass) {
			throw new Error(
				`Entity class "${className}" not found! Do you forget to register it?`
			)
		}
		// @ts-ignore
		const entity = new entityClass() as Entity
		entity.id = id
		this.entities.set(entity.id, entity)
		//! init must be apear after Map set or Array push
		// entity._options = options

		// Flow must be like this: prepare -> init -> physic insert -> onAddToWorld

		const afterPrepare = () => {
			entity.init(options)
			if (entity.body) {
				;(entity.body as BodyRefEntity).entitiyRef = entity
				this.physics.insert(entity.body)
			}
			entity.onAddToWorld()
		}

		if (this.isClient) {
			// only run prepare on client or both
			entity
				.prepare(options)
				.then(() => {
					entity.ee.emit("prepare-done")
					afterPrepare()
				})
				.catch((error) => {
					console.error(
						`Error while preparing entity ${entity.constructor.name}:`,
						error
					)
				})
		} else {
			// server only, do not run prepare
			afterPrepare()
		}

		return entity
	}

	@Server({ skipSync: true })
	removeEntity(entity: Entity | Entity[]) {
		const entities = Array.isArray(entity) ? entity : [entity]
		entities.forEach((entity) => {
			this.removeEntityById(entity.id)
			entity.onRemoveFromWorld()
		})
	}

	@Server()
	removeEntityById(id: string | string[]) {
		const ids = Array.isArray(id) ? id : [id]
		ids.forEach((id) => {
			const entity = this.entities.get(id)
			if (entity) {
				entity.markAsRemoved = true
			}
		})
	}

	registerEntityClass(entityClass: typeof Entity<World>) {
		if (this.entityRegistry.has(entityClass.name)) {
			throw new Error(
				`Entity class "${entityClass.name}" already exists in world "${this.constructor.name}"!`
			)
		}
		this.entityRegistry.set(entityClass.name, entityClass as typeof Entity)
	}

	registerControllerClass(controllerClass: typeof ServerController) {
		if (this.controllerRegistry.has(controllerClass.name)) {
			throw new Error(
				`Controller class "${controllerClass.name}" already exists in world "${this.constructor.name}"!`
			)
		}
		this.controllerRegistry.set(controllerClass.name, controllerClass)
	}

	beforeTick(entity: Entity, delta: number) {
		entity.beforeTick(delta)
	}
	finalizeTick(entity: Entity, delta: number) {
		entity.finalizeTick(delta)
	}

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
	async setupServerRPC(roomClient: RoomClient) {
		const applySnapshot = async () => {
			return new Promise<ReturnType<this["getSnapshot"]>>((resolve) => {
				const remove = roomClient.onMessage(
					"snapshot",
					(snapshot: ReturnType<this["getSnapshot"]>) => {
						this.init(snapshot)
						remove()
						resolve(snapshot)
					}
				)
			})
		}

		const pairing = async () => {
			return new Promise<void>((resolve) => {
				// roomClient.onStateChange.once((state) => {
				pairClientServer(this, roomClient.state, this.__holderMap)
				resolve()
				// })
			})
		}

		const setupRPC = () => {
			return roomClient.onMessage<RPCRequest>("rpc", async (message) => {
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
						?.forEach((handler) => handler.bind(clientSchema)(...message.args))

					handler.bind(clientSchema)(...message.args)
				} catch (error) {
					console.error(
						`RPC error for method "${message.method}":`,
						message,
						error
					)
				}
			})
		}

		roomClient.send("ready-to-get-snapshot")
		await applySnapshot()
		await pairing()
		setupRPC()
		roomClient.send("ready-to-join")
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
}

export type WorldOptions = (
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
) & {
	entityClasses?: Record<string, typeof Entity<World>>
}

export type RPCRequest = {
	id: string
	method: string
	args: any[]
}
