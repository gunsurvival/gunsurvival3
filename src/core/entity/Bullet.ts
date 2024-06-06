import { Assets, Sprite } from "pixi.js"
import { lerp } from "../utils/common"
import { Gunner } from "./Gunner"
import { Circle } from "detect-collisions"
import { Server } from "@/lib/multiplayer-world/decorators"
import type { SerializedResponse } from "../../lib/multiplayer-world/utils/dectect-collisions"
import { PixiEntity } from "@/lib/multiplayer-world/entity/PixiEntity"

export class Bullet extends PixiEntity {
	declare display: Sprite
	body = new Circle({ x: 0, y: 0 }, 4)

	async prepare(options: Parameters<this["init"]>[0]): Promise<void> {
		this.display = new Sprite(await Assets.load("images/Bullet2.png"))
		await super.prepare(options)
		this.display.anchor.x = 0.5
		this.display.anchor.y = 0.5
		this.display.width = 8
		this.display.height = 8
	}

	nextTick(delta: number) {
		if (this.vel.len() < 0.1) {
			this.destroy()
		}
		this.updateDisplay(delta)
	}

	@Server({ allowClient: true })
	onCollisionEnter(otherId: string, response: SerializedResponse): void {
		// @ts-ignore
		const other = this.world.entities.get(otherId)
		if (other instanceof Gunner) {
			other.applyForceByVelocity(this.vel, 0.1)
			this.destroy()
		}
	}
}
