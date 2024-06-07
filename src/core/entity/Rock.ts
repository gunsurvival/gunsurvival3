import { PixiEntity } from "@/lib/multiplayer-world/entity/PixiEntity"
import type { SerializedResponse } from "@/lib/multiplayer-world/utils/dectect-collisions"
import { Assets, Sprite } from "pixi.js"
import { Server } from "@/lib/multiplayer-world/decorators"
import { type } from "@/lib/multiplayer-world/schema"
import { Circle } from "detect-collisions"
import { Bush } from "./Bush"
import { Bullet } from "./Bullet"

export class Rock extends PixiEntity {
	@type("number") health = 100
	body = new Circle({ x: 0, y: 0 }, 90)
	minSize = 0.8
	maxHealth = 100

	display!: Sprite
	async prepare(options: Parameters<this["init"]>[0]): Promise<void> {
		this.display = new Sprite(await Assets.load("images/Rock.png"))
		this.display.anchor.x = 0.5
		this.display.anchor.y = 0.5
		this.display.width = 160
		this.display.height = 160
		super.prepare(options)
	}

	nextTick(delta: number) {
		if (this.health < 0) {
			this.destroy()
		}
		if (this.isClient) {
			this.display.scale =
				(this.health / this.maxHealth) * (1 - this.minSize) + this.minSize
		}
		this.updateDisplay(delta)
	}

	onCollisionEnter(otherId: string, response: SerializedResponse): void {
		const other = this.world.entities.get(otherId)
		if (other instanceof Bullet) {
			const len = other.vel.len()
			other.pos.x += response.overlapV.x
			other.pos.y += response.overlapV.y
			other.vel.x = response.overlapN.x * len * 0.4
			other.vel.y = response.overlapN.y * len * 0.4

			if (len > 10) {
				this.health -= len / 5
			}
		}
	}

	onCollisionStay(otherId: string, response: SerializedResponse): void {
		const other = this.world.entities.get(otherId)
		if (other && !(other instanceof Bush) && !(other instanceof Rock)) {
			other.pos.x += response.overlapV.x / 2
			other.pos.y += response.overlapV.y / 2
		}
	}
}
