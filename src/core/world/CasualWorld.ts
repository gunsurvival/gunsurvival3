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
		if (this.isClient) {
			await this.app.init({
				width: window.innerWidth,
				height: window.innerHeight,
				resizeTo: window,
			})
			this.app.ticker.add(() => {
				this.entities.forEach((entity) => {
					entity.nextTick()
				})
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
	async spawnEntityClass<ClassName extends EntityClassKey>(
		className: ClassName,
		options: Parameters<
			(typeof Entities)[ClassName] extends typeof Entity
				? InstanceType<(typeof Entities)[ClassName]>["init"]
				: never
		>[0]
	) {
		const entityClass = this.entityRegistry.get(
			className as keyof typeof Entities
		)
		if (!entityClass) {
			throw new Error(`Entity class "${className}" not found!`)
		}
		const entity = new entityClass()

		this.entities.set(entity.id, entity)
		//! init must be apear after Map set or Array push
		await entity.init(options)

		if (this.isClient) {
			this.app.stage.addChild(entity.display)
		}
	}

	registerEntityClass(entityClass: typeof Entity) {
		this.entityRegistry.set(entityClass.name as EntityClassKey, entityClass)
	}
}
