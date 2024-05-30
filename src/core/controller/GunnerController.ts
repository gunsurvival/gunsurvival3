import { Controller } from "@/lib/multiplayer-world/Controller"
import { Gunner } from "../entity"
import { Client } from "@/lib/multiplayer-world/decorators"

export class GunnerController extends Controller<Gunner> {
	speed = 0.1
	direction = {
		up: false,
		down: false,
		left: false,
		right: false,
	}

	initClient() {
		const handleKeydown = (e: KeyboardEvent) => {
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
		}
		const handleKeyup = (e: KeyboardEvent) => {
			if (e.key === "w") {
				this.sync().stop("up")
			}
			if (e.key === "s") {
				this.sync().stop("down")
			}
			if (e.key === "a") {
				this.sync().stop("left")
			}
			if (e.key === "d") {
				this.sync().stop("right")
			}
		}

		document.addEventListener("keydown", handleKeydown)
		document.addEventListener("keyup", handleKeyup)

		return () => {
			document.removeEventListener("keydown", handleKeydown)
			document.removeEventListener("keyup", handleKeyup)
		}
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
				this.target.acc.y -= this.speed
			}
			if (this.direction.down) {
				this.target.acc.y += this.speed
			}
			if (this.direction.left) {
				this.target.acc.x -= this.speed
			}
			if (this.direction.right) {
				this.target.acc.x += this.speed
			}
		}
	}
}
