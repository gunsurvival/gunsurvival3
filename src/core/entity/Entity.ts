import { Schema, type } from "@/lib/multiplayer-world/schema"
import { Vec2 } from "../schema/Vec2"
import { Server } from "@/lib/multiplayer-world/decorators"
import { Container, Graphics, Sprite } from "pixi.js"

export class Entity extends Schema {
	display: Container = this.clientOnly(() => new Container())
	@type(Vec2) pos = new Vec2()

	async prepare() {}

	async init(options: {}) {}

	@Server()
	moveTo(x: number, y: number) {
		this.log("Moving entity to", x, y)
		this.pos.x = x
		this.pos.y = y
	}

	nextTick() {}
}
