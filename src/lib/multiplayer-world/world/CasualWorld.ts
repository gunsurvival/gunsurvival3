import * as Entities from "@/core/entity"
import { World } from "./World"
import { Entity } from "../entity/Entity"
import {
	ResponseBodyRefEntity,
	serializeResponse,
} from "../utils/dectect-collisions"

export type EntityClassKey = keyof typeof Entities

export abstract class CasualWorld extends World {
	beforeTick(entity: Entity, delta: number) {
		entity.beforeTick(delta)
	}

	finalizeTick(entity: Entity, delta: number) {
		entity.finalizeTick(delta)
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

	nextTick(delta: number): void {
		super.nextTick(delta)
		this.entities.forEach((entity) => {
			this.beforeTick(entity, delta)
		})
		this.entities.forEach((entity) => {
			entity.controller?.nextTick(delta)
			if (this.isClientOnly() && entity.serverState && window.isSync) {
				entity.reconcileServerState(entity.serverState)
			}
			if (entity.readyToRender) entity.nextTick(delta)
		})

		// ---- DETECT COLLISIONS ----
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
						const serializedResponse = serializeResponse(response)
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
						const serializedResponse = serializeResponse(response)
						this.collisionHashMap.delete(uniq)
						entityA.onCollisionExit(entityB.id, serializedResponse)
					}
				}
			}
		)

		this.entities.forEach((entity) => {
			this.finalizeTick(entity, delta)
			if (entity.markAsRemoved) {
				if (entity.body) this.physics.remove(entity.body)
				this.entities.delete(entity.id)
				entity.onRemoveFromWorld()
			}
		})
	}
}
