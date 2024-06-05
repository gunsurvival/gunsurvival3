import { Assets, Sprite } from "pixi.js"
import { Entity } from "./Entity"
import { lerp } from "../utils/common"
import { Gunner } from "./Gunner"
import { Circle } from "detect-collisions"
import { Server } from "@/lib/multiplayer-world/decorators"
import type { SerializedResponse } from "../world/CasualWorld"

export class Bullet extends Entity {
	body = new Circle({ x: 0, y: 0 }, 4)
	display = this.clientOnly<Sprite>()

	async init(options: {
		x: number
		y: number
		velX: number
		velY: number
		angle: number
	}) {
		this.pos.x = options.x
		this.pos.y = options.y
		this.vel.x = options.velX
		this.vel.y = options.velY
		// this.applyForceByAngle(options.angle, 20)

		if (this.isClient) {
			this.display = new Sprite(await Assets.load("images/Bullet2.png"))
			this.display.width = 8
			this.display.height = 8
			this.display.anchor.x = 0.5
			this.display.anchor.y = 0.5
			this.display.x = options.x
			this.display.y = options.y
			this.display.rotation = options.angle
		}
	}

	nextTick() {
		if (this.isClient) {
			if (this.serverState) {
				// kéo khúc này ra function khác, chỉ đc gọi reconcile state khi có defined
				if (window.isSync) {
					this.pos.x = lerp(this.pos.x, this.serverState.pos.x, 0.3)
					this.pos.y = lerp(this.pos.y, this.serverState.pos.y, 0.3)
					this.vel.x = lerp(this.vel.x, this.serverState.vel.x, 0.3)
					this.vel.y = lerp(this.vel.y, this.serverState.vel.y, 0.3)
				}
			}

			this.display.x = this.pos.x
			this.display.y = this.pos.y
		}
	}

	@Server({ allowClient: true })
	onCollisionEnter(otherId: string, response: SerializedResponse): void {
		// @ts-ignore
		const other = this.world.entities.get(otherId)
		if (other instanceof Gunner) {
			other.applyForceByVelocity(this.vel, 0.1)
			// this.markAsRemoved
		}
	}
}
