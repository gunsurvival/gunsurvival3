import { Assets, Sprite } from "pixi.js"
import { Entity } from "./Entity"

export class Bullet extends Entity {
	display = this.clientOnly<Sprite>()

	async init(options: { x: number; y: number }) {
		this.pos.x = options.x
		this.pos.y = options.y

		if (this.isClient) {
			this.display = new Sprite(await Assets.load("images/Bullet.png"))
			this.display.width = 5
			this.display.height = 5
			this.display.anchor.x = 0.5
			this.display.anchor.y = 0.5
			this.display.x = options.x
			this.display.y = options.y
		}
	}

	nextTick() {
		if (this.isClient) {
			this.pos.x = this.serverState?.pos.x
			this.pos.y = this.serverState?.pos.y

			this.display.x = this.pos.x
			this.display.y = this.pos.y
		}
	}
}
