import { ServerController } from "@/lib/multiplayer-world/ServerController"
import { Gunner } from "../entity"
import { Client, Controller } from "@/lib/multiplayer-world/decorators"

export class GunnerController extends ServerController<Gunner> {
	speed = 0.1
	state = {
		up: false,
		down: false,
		left: false,
		right: false,
		shoot: false,
	}

	setupClient() {
		console.log("Setting up client")
		const handleKeydown = (e: KeyboardEvent) => {
			if (e.key === "w") {
				console.log("w")
				this.enable("up")
			}
			if (e.key === "s") {
				this.enable("down")
			}
			if (e.key === "a") {
				this.enable("left")
			}
			if (e.key === "d") {
				this.enable("right")
			}
			if (e.key === " ") {
				this.enable("shoot")
			}
		}
		const handleKeyup = (e: KeyboardEvent) => {
			if (e.key === "w") {
				this.disable("up")
			}
			if (e.key === "s") {
				this.disable("down")
			}
			if (e.key === "a") {
				this.disable("left")
			}
			if (e.key === "d") {
				this.disable("right")
			}
			if (e.key === " ") {
				this.disable("shoot")
			}
		}

		document.addEventListener("keydown", handleKeydown)
		document.addEventListener("keyup", handleKeyup)

		return () => {
			document.removeEventListener("keydown", handleKeydown)
			document.removeEventListener("keyup", handleKeyup)
		}
	}

	enable(key: keyof typeof this.state) {
		if (!this.state[key]) {
			this.setState(key, true)
		}
	}

	disable(key: keyof typeof this.state) {
		if (this.state[key]) {
			this.setState(key, false)
		}
	}

	@Controller()
	setState(key: keyof typeof this.state & string, value: boolean) {
		if (value) {
			console.log("Enabling", key)
		} else {
			console.log("Disabling", key)
		}
		this.state[key] = value
	}

	@Controller()
	shoot() {
		// @ts-ignore
		this.world.addEntity("Bullet", {
			x: this.target.pos.x,
			y: this.target.pos.y,
		})
	}

	nextTick() {
		if (this.target) {
			if (this.state.up) {
				this.target.acc.y -= this.speed
			}
			if (this.state.down) {
				this.target.acc.y += this.speed
			}
			if (this.state.left) {
				this.target.acc.x -= this.speed
			}
			if (this.state.right) {
				this.target.acc.x += this.speed
			}
			if (this.state.shoot) {
				this.shoot()
			}
		}
	}
}
