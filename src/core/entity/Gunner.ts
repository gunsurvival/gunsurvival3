import { Assets, Sprite } from "pixi.js"
import { Entity } from "./Entity"
import { lerp, lerpAngle } from "../utils/common"
import { Body, Circle } from "detect-collisions"
import type { SerializedResponse } from "../world/CasualWorld"
import { Server } from "@/lib/multiplayer-world/decorators"
import { getZIndexByName } from "../settings"

export class Gunner extends Entity {
	body = new Circle({ x: 0, y: 0 }, 40)
	display = this.clientOnly<Sprite>()

	async init(options: { x: number; y: number }) {
		this.pos.x = options.x
		this.pos.y = options.y

		if (this.isClient) {
			this.display = new Sprite(await Assets.load("images/terrorist.png"))
			this.display.width = 80
			this.display.height = 80
			this.display.anchor.x = 0.5
			this.display.anchor.y = 0.5
			this.display.x = options.x
			this.display.y = options.y
			this.display.zIndex = getZIndexByName(this.constructor.name)
		}
	}

	nextTick() {
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
		if (this.isClient) {
			if (this.serverState) {
				// kéo khúc này ra function khác, chỉ đc gọi reconcile state khi có defined
				if (window.isSync) {
					this.pos.x = lerp(this.pos.x, this.serverState.pos.x, 0.1)
					this.pos.y = lerp(this.pos.y, this.serverState.pos.y, 0.1)
					this.vel.x = lerp(this.vel.x, this.serverState.vel.x, 0.3)
					this.vel.y = lerp(this.vel.y, this.serverState.vel.y, 0.3)
				}
			}

			this.display.x = this.pos.x
			this.display.y = this.pos.y
			this.display.rotation = lerpAngle(
				this.display.rotation,
				Math.atan2(this.vel.y, this.vel.x),
				0.2
			)
		}
	}

	@Server({ allowClient: true })
	onCollisionEnter(otherId: string, response: SerializedResponse): void {}

	onCollisionStay(otherId: string, response: SerializedResponse): void {
		// @ts-ignore
		const other = this.world.entities.get(otherId)
		if (other instanceof Gunner) {
			this.pos.x -= response.overlapV.x / 2
			this.pos.y -= response.overlapV.y / 2
		}
	}

	@Server({ allowClient: true })
	onCollisionExit(otherId: string, response: SerializedResponse): void {}
}
