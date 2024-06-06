import { lerp } from "@/core/utils/common"
import { SATVector } from "detect-collisions"
import { Viewport } from "pixi-viewport"

export class Camera {
	pos = new SATVector(0, 0)
	rotation = 0
	followingPos: { x: number; y: number } = { x: 0, y: 0 }

	constructor(public viewport: Viewport, public speed = 0.05) {}

	get x() {
		return this.pos.x
	}

	get y() {
		return this.pos.y
	}

	follow(pos: { x: number; y: number }) {
		this.followingPos = pos
	}

	nextTick(delta: number) {
		this.pos.x =
			-this.followingPos.x * this.viewport.scale._x + window.innerWidth / 2
		this.pos.y =
			-this.followingPos.y * this.viewport.scale._y + window.innerHeight / 2
		this.viewport.position.set(
			lerp(this.viewport.position.x, this.pos.x, this.speed),
			lerp(this.viewport.position.y, this.pos.y, this.speed)
		)
	}

	shake(amount: number) {
		this.viewport.position.set(
			this.viewport.position.x + (Math.random() * amount - amount / 2),
			this.viewport.position.y + (Math.random() * amount - amount / 2)
		)
	}
}
