import { Gunner } from "./Gunner"
import { Server } from "@/lib/multiplayer-world/decorators"

export class GunnerBot extends Gunner {
	targetAngle = 0

	nextTick(delta: number) {
		if (this.world.frameCount % Math.floor(Math.random() * 100 + 100) === 0) {
			this.randomTargetAngle()
		}
		this.updateVelocity()
		this.updateDisplay(delta)
	}

	@Server({ skipSync: true })
	randomTargetAngle() {
		this.targetAngle = Math.random() * Math.PI * 2
		this.world.addEntity("Bullet", {
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
