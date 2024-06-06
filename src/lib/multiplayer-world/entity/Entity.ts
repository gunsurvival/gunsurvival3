import uniqid from "uniqid"
import { Schema, type } from "@/lib/multiplayer-world/schema"
import { Vec2 } from "../schema/Vec2"
import { Server } from "@/lib/multiplayer-world/decorators"
import * as Controllers from "@/core/controller"
import { ServerController } from "@/lib/multiplayer-world/ServerController"
import { Body } from "detect-collisions"
import { World } from "../world/World"
import type { SerializedResponse } from "../utils/dectect-collisions"
import EventEmitter from "events"
import { lerp, lerpAngle } from "@/core/utils/common"

export abstract class Entity<
	TWorld extends World = World
> extends Schema<TWorld> {
	body: Body | undefined
	@type(Vec2) pos = new Vec2()
	@type(Vec2) vel = new Vec2()
	@type(Vec2) acc = new Vec2()
	@type("float32") rotation = 0
	controller: ServerController | undefined
	controllerRegistry = new Map<string, typeof ServerController>(
		Object.entries(Controllers) as any
	)

	markAsRemoved = false

	get isControlling() {
		return Boolean(this.controller)
	}

	abstract prepare(options: Parameters<this["init"]>[0]): Promise<void>

	init(
		options: Partial<{
			pos: { x: number; y: number }
			vel: { x: number; y: number }
			acc: { x: number; y: number }
			rotation: number
		}>
	): void {
		if (options.pos) {
			this.pos.x = options.pos.x
			this.pos.y = options.pos.y
			if (this.body) this.body.setPosition(this.pos.x, this.pos.y)
		}
		if (options.vel) {
			this.vel.x = options.vel.x
			this.vel.y = options.vel.y
		}
		if (options.acc) {
			this.acc.x = options.acc.x
			this.acc.y = options.acc.y
		}
		if (options.rotation) {
			this.rotation = options.rotation
		}
	}

	initClient(options: {}) {}

	getSnapshot(): Parameters<this["init"]>[0] {
		return {
			pos: { x: this.pos.x, y: this.pos.y },
			vel: { x: this.vel.x, y: this.vel.y },
			acc: { x: this.acc.x, y: this.acc.y },
		}
	}

	onAddToWorld() {}
	onRemoveFromWorld() {}

	// TODO: change "typeof this" to be filtered schema only
	onAttachServerState(serverState: typeof this) {}
	reconcileServerState(serverState: typeof this) {
		this.pos.x = lerp(this.pos.x, serverState.pos.x, 0.1)
		this.pos.y = lerp(this.pos.y, serverState.pos.y, 0.1)
		this.vel.x = lerp(this.vel.x, serverState.vel.x, 0.3)
		this.vel.y = lerp(this.vel.y, serverState.vel.y, 0.3)
		this.rotation = lerpAngle(this.rotation, serverState.rotation, 0.2)
	}

	beforeTick(deltaTime: number) {}
	finalizeTick(deltaTime: number) {}
	nextTick(deltaTime: number) {}

	@Server({ skipSync: true })
	addController(className: string, options: {}) {
		const id = uniqid()
		return this.addControllerById(id, className, options)
	}

	// @Server({ isPrivate: true })
	@Server()
	addControllerById(id: string, className: string, options: {}) {
		const controllerClass = this.controllerRegistry.get(className)
		if (!controllerClass) {
			throw new Error(`Controller class "${className}" not found!`)
		}
		const controller = new controllerClass(id, this) as ServerController<Entity>
		controller.init(options)
		if (this.isClient) {
			controller.setupClient()
		}

		this.controller = controller
		console.log("Controller added: ", controller.id)
		return controller
	}

	@Server()
	applyForceByAngle(angle: number, force: number) {
		this.acc.x += Math.cos(angle) * force
		this.acc.y += Math.sin(angle) * force
	}

	@Server()
	applyForceByVelocity(velocity: Vec2, force: number) {
		this.acc.x += velocity.x * force
		this.acc.y += velocity.y * force
	}

	@Server()
	onCollisionEnter(otherId: string, response: SerializedResponse) {}

	// Dont use server decorator here (lack of datapack)
	onCollisionStay(otherId: string, response: SerializedResponse) {}

	@Server()
	onCollisionExit(otherId: string, response: SerializedResponse) {}

	@Server({ allowClient: true })
	destroy() {
		this.markAsRemoved = true
	}
}
