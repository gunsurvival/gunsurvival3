import { type } from "@colyseus/schema"
import { lerp, lerpAngle } from "../utils/common"
import { CasualWorld } from "../world/CasualWorld"
import { Gunner } from "./Gunner"
import { Server } from "@/lib/multiplayer-world/decorators"

export class GunnerBot extends Gunner {
	targetAngle = 0

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
			this.display.rotation = lerpAngle(
				this.display.rotation,
				Math.atan2(this.vel.y, this.vel.x),
				0.2
			)
		}

		if (this.world.frameCount % Math.floor(Math.random() * 100 + 100) === 0) {
			this.randomTargetAngle()
		}
		this.updateVelocity()
	}

	@Server({ skipSync: true })
	randomTargetAngle() {
		this.targetAngle = Math.random() * Math.PI * 2
		;(this.world as CasualWorld).addEntity("Bullet", {
			x: this.pos.x,
			y: this.pos.y,
			angle: this.targetAngle,
			velX: Math.cos(this.targetAngle) * 40,
			velY: Math.sin(this.targetAngle) * 40,
		})
	}

	@Server({ skipSync: true })
	updateVelocity() {
		this.vel.x = Math.cos(this.targetAngle) * 2
		this.vel.y = Math.sin(this.targetAngle) * 2
	}
}
