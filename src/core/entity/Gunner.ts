import { Assets, Sprite } from "pixi.js"
import { Circle } from "detect-collisions"
import type { SerializedResponse } from "@/lib/multiplayer-world/utils/dectect-collisions"
import { PixiEntity } from "@/lib/multiplayer-world/entity/PixiEntity"

export class Gunner extends PixiEntity {
	declare display: Sprite
	body = new Circle({ x: 0, y: 0 }, 40)

	async prepare(options: Parameters<this["init"]>[0]): Promise<void> {
		this.display = new Sprite(await Assets.load("images/terrorist.png"))
		this.display.width = 80
		this.display.height = 80
		this.display.anchor.x = 0.5
		this.display.anchor.y = 0.5
	}

	nextTick(delta: number) {
		if (this.pos.x < 0) {
			this.pos.x = 0
		}
		if (this.pos.y < 0) {
			this.pos.y = 0
		}
		if (this.pos.x > 1920) {
			this.pos.x = 1920
		}
		if (this.pos.y > 1080) {
			this.pos.y = 1080
		}
		this.rotation = Math.atan2(this.vel.y, this.vel.x)
		this.updateDisplay(delta)
	}

	onCollisionStay(otherId: string, response: SerializedResponse): void {
		// @ts-ignore
		const other = this.world.entities.get(otherId)
		if (other instanceof Gunner) {
			this.pos.x -= response.overlapV.x / 2
			this.pos.y -= response.overlapV.y / 2
		}
	}
}
