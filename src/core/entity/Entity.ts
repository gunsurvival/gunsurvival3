import uniqid from "uniqid"
import { Schema, type } from "@/lib/multiplayer-world/schema"
import { Vec2 } from "../schema/Vec2"
import { Server } from "@/lib/multiplayer-world/decorators"
import { Container } from "pixi.js"
import * as Controllers from "@/core/controller"
import { ServerController } from "@/lib/multiplayer-world/ServerController"

export class Entity extends Schema {
	display: Container = this.clientOnly(() => new Container())
	@type(Vec2) pos = new Vec2()
	@type(Vec2) vel = new Vec2()
	@type(Vec2) acc = new Vec2()
	controller: ServerController | undefined
	controllerRegistry = new Map<string, typeof ServerController>(
		Object.entries(Controllers) as any
	)
	_options = {}

	markAsRemoved = false

	async prepare() {}

	async init(options: {}) {}

	initServer(serverState: typeof this) {}

	@Server()
	moveTo(x: number, y: number) {
		this.log("Moving entity to", x, y)
		this.pos.x = x
		this.pos.y = y
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
		const controller = new controllerClass(id, this)
		controller.init(options)
		if (this.isClient) {
			controller.setupClient()
		}

		this.controller = controller
		console.log("Controller added: ", controller.id)
		return controller
	}

	getSnapshot() {
		return {
			pos: { x: this.pos.x, y: this.pos.y },
			vel: { x: this.vel.x, y: this.vel.y },
			acc: { x: this.acc.x, y: this.acc.y },
			_options: this._options,
		}
	}

	applySnapshot(snapshot: ReturnType<this["getSnapshot"]>): void {
		this.pos.x = snapshot.pos.x
		this.pos.y = snapshot.pos.y
		this.vel.x = snapshot.vel.x
		this.vel.y = snapshot.vel.y
		this.acc.x = snapshot.acc.x
		this.acc.y = snapshot.acc.y
	}
}
