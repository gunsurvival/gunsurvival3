import { Room as RoomClient } from "colyseus.js"
import { World } from "@/lib/multiplayer-world/World"
import { Gunner } from "../entity"
import { Schema } from "@/lib/multiplayer-world/schema"
import { Client } from "@/lib/multiplayer-world/decorators"

export class Controller<T = any> extends Schema {
	target: T | undefined
	constructor(public world: World, public room: RoomClient) {
		super()
	}

	initClient() {}

	setTarget(target: T) {
		this.target = target
	}
}

export class MovingController extends Controller<Gunner> {
	speed = 5
	direction = {
		up: false,
		down: false,
		left: false,
		right: false,
	}
	enableBidirectional = true

	initClient() {
		document.addEventListener("keydown", (e) => {
			if (e.key === "w") {
				this.sync().move("up")
			}
			if (e.key === "s") {
				this.sync().move("down")
			}
			if (e.key === "a") {
				this.sync().move("left")
			}
			if (e.key === "d") {
				this.sync().move("right")
			}
		})
	}

	@Client()
	move(direction: "up" | "down" | "left" | "right") {
		this.direction[direction] = true
	}

	@Client()
	stop(direction: "up" | "down" | "left" | "right") {
		this.direction[direction] = false
	}

	nextTick() {
		if (this.target) {
			if (this.direction.up) {
				this.target.acc.y = -this.speed
			}
			if (this.direction.down) {
				this.target.acc.y = this.speed
			}
			if (this.direction.left) {
				this.target.acc.x = -this.speed
			}
			if (this.direction.right) {
				this.target.acc.x = this.speed
			}
		}
	}
}
