import uniqid from "uniqid"
import { Application } from "pixi.js"
import { World } from "@/lib/multiplayer-world/World"
import * as Entities from "@/core/entity"
import { Entity } from "@/core/entity/Entity"
import { Server } from "@/lib/multiplayer-world/decorators"
import { type } from "@colyseus/schema"
import { MapSchema } from "@/lib/multiplayer-world/schema"
import { Controller } from "@/lib/multiplayer-world/Controller"

export type EntityClassKey = keyof typeof Entities

export class CasualWorld extends World {
	@type({ map: Entity }) entities = new MapSchema<Entity>()

	entityRegistry = new Map<EntityClassKey, typeof Entity>(
		Object.entries(Entities) as any
	)

	// client side variables
	app = this.clientOnly(() => new Application())

	async init(options: {}) {
		if (this.isClient) {
			await this.app.init({
				width: window.innerWidth,
				height: window.innerHeight,
				resizeTo: window,
			})
			const nextTick = this.nextTick.bind(this)
			this.app.ticker.add((delta) => {
				nextTick(delta.deltaTime)
			})
			const gameRoot = document.getElementById("game-root")
			if (gameRoot) {
				gameRoot.innerHTML = ""
				gameRoot.appendChild(this.app.canvas)
			} else {
				throw new Error("node game-root not found!")
			}
		}
	}

	@Server()
	async addEntity<ClassName extends EntityClassKey>(
		className: ClassName,
		options: Parameters<
			(typeof Entities)[ClassName] extends typeof Entity
				? InstanceType<(typeof Entities)[ClassName]>["init"]
				: (options: {}) => any
		>[0]
	) {
		const id = uniqid()
		return this.sync().addEntityById(id, className, options)
	}

	@Server()
	async addEntityById(id: string, className: string, options: {}) {
		const entityClass = this.entityRegistry.get(
			className as keyof typeof Entities
		)
		if (!entityClass) {
			throw new Error(`Entity class "${className}" not found!`)
		}
		const entity = new entityClass()
		entity.id = id
		this.entities.set(entity.id, entity)
		//! init must be apear after Map set or Array push
		await entity.init(options)

		if (this.isClient) {
			this.app.stage.addChild(entity.display)
		}
		return entity
	}

	beforeTick(entity: Entity, deltaTime: number) {
		if (entity.acc.x !== 0) {
			// prevent unnecessary assign setter (for colyseus performance)
			entity.acc.x = 0
		}
		if (entity.acc.y !== 0) {
			// prevent unnecessary assign setter (for colyseus performance)
			entity.acc.y = 0
		}
		entity.beforeTick(deltaTime)
	}

	finalizeTick(entity: Entity, deltaTime: number) {
		entity.vel.x += entity.acc.x
		entity.vel.y += entity.acc.y
		entity.pos.x += entity.vel.x
		entity.pos.y += entity.vel.y

		entity.vel.x *= 0.9
		entity.vel.y *= 0.9
	}

	nextTick(deltaTime: number) {
		this.entities.forEach((entity) => {
			this.beforeTick(entity, deltaTime)
		})
		this.entities.forEach((entity) => {
			if (entity.controller) {
				entity.controller.nextTick(deltaTime)
			}
			entity.nextTick(deltaTime)
		})
		this.entities.forEach((entity) => {
			this.finalizeTick(entity, deltaTime)
		})
	}

	registerEntityClass(entityClass: typeof Entity) {
		this.entityRegistry.set(entityClass.name as EntityClassKey, entityClass)
	}
}
