import { Assets, Sprite } from "pixi.js"
import { Entity } from "./Entity"

export class Gunner extends Entity {
	display = this.clientOnly<Sprite>()

	async init(options: { x: number; y: number }) {
		if (this.isClient) {
			this.display = new Sprite(await Assets.load("images/terrorist.png"))
			this.display.width = 80
			this.display.height = 80
			this.display.anchor.x = 0.5
			this.display.anchor.y = 0.5
			this.display.x = options.x
			this.display.y = options.y
		}
	}

	nextTick() {
		this.display.x = 100
		this.display.y = 100
		this.display.rotation += 0.01
	}
}
