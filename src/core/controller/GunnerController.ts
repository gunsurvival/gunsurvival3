import { ServerController } from "@/lib/multiplayer-world/ServerController"
import { Gunner } from "../entity"
import { Controller, Server } from "@/lib/multiplayer-world/decorators"
import { AsyncEE } from "@/lib/AsyncEE"
import type { PixiWorld } from "@/lib/multiplayer-world/world"

export class GunnerController extends ServerController<Gunner> {
	speed = 0.5
	state = {
		up: false,
		down: false,
		left: false,
		right: false,
		shoot: false,
	}
	ee = new AsyncEE<{
		keypress: (key: keyof GunnerController["state"]) => void
		"*": () => void
	}>()

	setupClient() {
		console.log("Setting up client")
		if ((this.world as PixiWorld)?.camera) {
			;(this.world as PixiWorld).camera.follow(this.target.pos)
		}
		const handleKeydown = (e: KeyboardEvent) => {
			if (e.key === "w") {
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
		const handleClick = (e: MouseEvent) => {
			this.enable("shoot")
		}
		this.ee.addListener("keypress", (key) => {
			if (key === "shoot") {
				this.shoot()
			}
		})

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
			this.ee.emit("keypress", key)
		}
	}

	disable(key: keyof typeof this.state) {
		if (this.state[key]) {
			this.setState(key, false)
		}
	}

	@Controller()
	setState(key: keyof typeof this.state & string, value: boolean) {
		// if (value) {
		// 	console.log("Enabling", key)
		// } else {
		// 	console.log("Disabling", key)
		// }
		this.state[key] = value
	}

	@Controller({ serverOnly: true })
	shoot() {
		const angle = Math.atan2(this.target.vel.y, this.target.vel.x)
		// @ts-ignore
		this.world.addEntity("Bullet", {
			pos: {
				x: this.target.pos.x + Math.cos(angle) * 70,
				y: this.target.pos.y + Math.sin(angle) * 70,
			},
			vel: {
				x: Math.cos(angle) * 40,
				y: Math.sin(angle) * 40,
			},
			rotation: Math.atan2(this.target.vel.y, this.target.vel.x),
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
			this.hookShoot()
		}
	}

	@Server()
	hookShoot() {
		if (this.state.shoot) {
			if (this.world.frameCount % 10 === 0) {
				this.shoot()
			}
		}
	}
}
