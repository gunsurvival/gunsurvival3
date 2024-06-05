import { System, type Body, type Response } from "detect-collisions"
import uniqid from "uniqid"
import { Application } from "pixi.js"
import { World } from "@/lib/multiplayer-world/World"
import * as Entities from "@/core/entity"
import { Entity } from "@/core/entity/Entity"
import { Server } from "@/lib/multiplayer-world/decorators"
import { type } from "@colyseus/schema"
import { MapSchema } from "@/lib/multiplayer-world/schema"

export type EntityClassKey = keyof typeof Entities

export class CasualWorld extends World {
	@type({ map: Entity }) entities = new MapSchema<Entity>()

	entityRegistry = new Map<EntityClassKey, typeof Entity>(
		Object.entries(Entities) as any
	)

	// client side variables
	app = this.clientOnly(() => new Application())

	async init(options: {}) {
		const nextTick = this.nextTick.bind(this)
		if (this.isClient) {
			await this.app.init({
				width: window.innerWidth,
				height: window.innerHeight,
				resizeTo: window,
			})
			const gameRoot = document.getElementById("game-root")
			if (gameRoot) {
				gameRoot.innerHTML = ""
				gameRoot.appendChild(this.app.canvas)
			} else {
				throw new Error("node game-root not found!")
			}
		}

		const internal: {
			accumulator: number
			elapsedMs: number
			targetDelta: number
			elapseTick: number
		} = {
			accumulator: 0,
			elapsedMs: 0,
			targetDelta: 1000 / 60,
			elapseTick: 0,
		}
		if (this.isClient) {
			// TODO: bỏ setTimeout, khúc này phải đợi tất cả các sprite init xong hết thì mới đc chạy nextTick
			setTimeout(() => {
				this.app.ticker.add(() => {
					const deltaMS = this.app.ticker.deltaMS
					internal.accumulator += deltaMS
					while (internal.accumulator >= internal.targetDelta) {
						internal.elapseTick++
						internal.accumulator -= internal.targetDelta
						const tickData = {
							accumulator: internal.accumulator,
							elapsedMs: internal.elapsedMs,
							deltaMs: internal.targetDelta,
							delta: 1,
						}

						nextTick(1000 / 60)
					}
				})
			}, 2000)
		} else if (this.isServerOnly()) {
			this.room.clock.setInterval(() => {
				const deltaMS = this.room.clock.deltaTime
				internal.accumulator += deltaMS
				while (internal.accumulator >= internal.targetDelta) {
					internal.elapseTick++
					internal.accumulator -= internal.targetDelta
					const tickData = {
						accumulator: internal.accumulator,
						elapsedMs: internal.elapsedMs,
						deltaMs: internal.targetDelta,
						delta: 1,
					}

					nextTick(1000 / 60)
				}
			}, 1000 / 60)
		}

		// setTimeout(() => {
		// 	setInterval(() => {
		// 		nextTick(1000 / 60)
		// 	}, 1000 / 60)
		// }, 2000)
	}

	@Server({ skipSync: true })
	// Why skipSync: we are just create id on server side to make sure both client and server have the same id (passing to addEntityById)
	// So we don't need to sync this line to client as the addEntityById will be skipped on client side (because it's server only)
	async addEntity<ClassName extends EntityClassKey>(
		className: ClassName,
		options: Parameters<
			(typeof Entities)[ClassName] extends typeof Entity
				? InstanceType<(typeof Entities)[ClassName]>["init"]
				: (options: {}) => any
		>[0]
	) {
		const id = uniqid()
		return this.addEntityById(id, className, options)
	}

	@Server()
	async addEntityById(id: string, className: string, options: {}) {
		const entityClass = this.entityRegistry.get(
			className as keyof typeof Entities
		)
		if (!entityClass) {
			throw new Error(`Entity class "${className}" not found!`)
		}
		// @ts-ignore
		const entity = new entityClass() as Entity
		entity.id = id
		this.entities.set(entity.id, entity)
		//! init must be apear after Map set or Array push
		entity._options = options
		await entity.init(options)
		if (entity.body) {
			;(entity.body as BodyRefEntity).entitiyRef = entity
			this.physics.insert(entity.body)
		}

		if (this.isClient) {
			this.app.stage.addChild(entity.display)
		}
		return entity
	}

	@Server({ skipSync: true })
	removeEntity(entity: Entity | Entity[]) {
		const entities = Array.isArray(entity) ? entity : [entity]
		entities.forEach((entity) => {
			this.removeEntityById(entity.id)
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

	beforeTick(entity: Entity, deltaTime: number) {
		entity.beforeTick(deltaTime)
	}

	finalizeTick(entity: Entity, deltaTime: number) {
		entity.finalizeTick(deltaTime)
		if (entity.acc.len() > 0.01) {
			entity.vel.x += entity.acc.x
			entity.vel.y += entity.acc.y
		}

		if (entity.vel.len() > 0.01) {
			entity.pos.x += entity.vel.x
			entity.pos.y += entity.vel.y
		}
		entity.body?.setPosition(entity.pos.x, entity.pos.y)

		if (entity.vel.len() > 0.01) {
			entity.vel.x *= 0.91
			entity.vel.y *= 0.91
		}
		if (entity.acc.x !== 0) {
			// prevent unnecessary assign setter (for colyseus performance)
			entity.acc.x = 0
		}
		if (entity.acc.y !== 0) {
			// prevent unnecessary assign setter (for colyseus performance)
			entity.acc.y = 0
		}
	}

	serializeResponse(response: ResponseBodyRefEntity): SerializedResponse {
		const { a, b, ...serializedResponse } = response
		return serializedResponse
	}

	nextTick(deltaTime: number) {
		this.frameCount++
		this.entities.forEach((entity) => {
			this.beforeTick(entity, deltaTime)
		})
		this.entities.forEach((entity) => {
			entity.controller?.nextTick(deltaTime)
			entity.nextTick(deltaTime)
		})

		this.newCollisionHashMap.clear()

		this.entities.forEach((entity) => {
			if (!entity.body) return
			this.physics.updateBody(entity.body)

			this.physics.checkOne(
				entity.body,
				({ ...response }: ResponseBodyRefEntity) => {
					const entityA = response.a.entitiyRef
					const entityB = response.b.entitiyRef

					if (entityA && entityB) {
						// if (entityA.isStatic && entityB.isStatic) {
						// 	// If current both entities are static, skip collision check
						// 	return
						// }

						const uniq = `${entityA.id}-${entityB.id}`
						const serializedResponse = this.serializeResponse(response)
						this.newCollisionHashMap.set(uniq, response)
						if (this.collisionHashMap.has(uniq)) {
							entity.onCollisionStay(entityB.id, serializedResponse)
						} else {
							this.collisionHashMap.set(uniq, response)
							entityA.onCollisionEnter(entityB.id, serializedResponse)
						}
					}
				}
			)
		})
		this.collisionHashMap.forEach(
			(response: ResponseBodyRefEntity, uniq: string) => {
				if (!this.newCollisionHashMap.has(uniq)) {
					const entityA = response.a.entitiyRef
					const entityB = response.b.entitiyRef
					if (entityA && entityB) {
						const uniq = `${entityA.id}-${entityB.id}`
						const serializedResponse = this.serializeResponse(response)
						this.collisionHashMap.delete(uniq)
						entityA.onCollisionExit(entityB.id, serializedResponse)
					}
				}
			}
		)

		this.entities.forEach((entity) => {
			this.finalizeTick(entity, deltaTime)
			if (entity.markAsRemoved) {
				if (entity.body) this.physics.remove(entity.body)
				this.entities.delete(entity.id)
				if (this.isClient) {
					this.app.stage.removeChild(entity.display)
				}
				// entity.onRemoved()
			}
		})
		// this.entities.forEach((entity) => {
		// 	if (entity.markAsRemoved) {
		// 		this.entities.delete(entity.id)
		// 		if (this.isClient) {
		// 			this.app.stage.removeChild(entity.display)
		// 		}
		// 		// entity.onRemoved()
		// 	}
		// })
	}

	registerEntityClass(entityClass: typeof Entity) {
		this.entityRegistry.set(entityClass.name as EntityClassKey, entityClass)
	}

	getSnapshot() {
		return {
			entities: Array.from(this.entities.values()).map((entity) => [
				entity.constructor.name,
				entity.id,
				entity.getSnapshot(),
			]) as [string, string, ReturnType<Entity["getSnapshot"]>][],
		}
	}

	applySnapshot(snapshot: ReturnType<this["getSnapshot"]>) {
		console.log("Applying snapshot", snapshot)
		this.entities.clear()
		snapshot.entities.forEach(async ([className, id, entitySnapshot]) => {
			const entity = await this.skipCheck().addEntityById(
				id,
				className,
				entitySnapshot._options
			)

			entity.applySnapshot(entitySnapshot)
		})
	}
}

type BodyRefEntity = Body & { entitiyRef: Entity }
type ResponseBodyRefEntity = Omit<Response, "a" | "b"> & {
	a: BodyRefEntity
	b: BodyRefEntity
}
export type SerializedResponse = Omit<Response, "a" | "b" | "clear">
