import uniqid from "uniqid"
import { Schema, type } from "@/lib/multiplayer-world/schema"
import { Vec2 } from "../schema/Vec2"
import { Server } from "@/lib/multiplayer-world/decorators"
import { Container, Graphics, Sprite } from "pixi.js"
import * as Controllers from "@/core/controller"
import { addWorldRecursive } from "@/lib/multiplayer-world/utils/common"
import { Controller } from "@/lib/multiplayer-world/Controller"

export class Entity extends Schema {
	display: Container = this.clientOnly(() => new Container())
	@type(Vec2) pos = new Vec2()
	@type(Vec2) vel = new Vec2()
	@type(Vec2) acc = new Vec2()
	controller: Controller | undefined
	controllerRegistry = new Map<string, typeof Controller>(
		Object.entries(Controllers) as any
	)

	async prepare() {}

	async init(options: {}) {}

	@Server()
	moveTo(x: number, y: number) {
		this.log("Moving entity to", x, y)
		this.pos.x = x
		this.pos.y = y
	}

	beforeTick(deltaTime: number) {}
	finalizeTick(deltaTime: number) {}
	nextTick(deltaTime: number) {}

	@Server()
	async addController<ClassName extends keyof typeof Controllers>(
		className: ClassName,
		options: Parameters<
			(typeof Controllers)[ClassName] extends typeof Controller
				? InstanceType<(typeof Controllers)[ClassName]>["init"]
				: (options: {}) => any
		>[0]
	) {
		const id = uniqid()
		return this.sync().addControllerById(id, className, options)
	}

	@Server()
	async addControllerById(id: string, className: string, options: {}) {
		const controllerClass = this.controllerRegistry.get(className)
		if (!controllerClass) {
			throw new Error(`Controller class "${className}" not found!`)
		}
		const controller = new controllerClass(this.___.world)
		controller.id = id
		controller.world = this.___.world
		if (this.isClient) {
			const cleanup = controller.initClient()
			// TODO: implement cleanup when destroying entity
		}
		addWorldRecursive(controller, this.___.world)
		this.controller = controller
		return controller
	}
}
