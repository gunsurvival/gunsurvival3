import { Assets, Container, ContainerChild, Sprite } from "pixi.js"
import { Gun } from "./Gun"
import { Server } from "@/lib/multiplayer-world/decorators"
import { type } from "@/lib/multiplayer-world/schema"
import { Gunner } from "../entity"

export class Ak47 extends Gun {
	display: undefined
	@type("string") holderId = ""

	sprite!: Sprite
	frameStartFire = 0
	isFiring = false

	async prepare(options: Parameters<this["init"]>[0]): Promise<void> {
		this.sprite = new Sprite(await Assets.load("images/ak47.png"))
		this.sprite.anchor.x = 0.5
		this.sprite.anchor.y = 0.5
		this.sprite.width = 160
		this.sprite.height = 40
	}

	init(
		options: Partial<{
			holderId: string
		}>
	): void {
		this.holderId = options.holderId ?? ""
	}

	getSnapshot(): Parameters<Ak47["init"]>[0] {
		return {
			holderId: this.holderId,
		}
	}

	nextTick(deltaTime: number): void {
		if (this.isFiring) {
			this.hookShoot()
		}
	}

	@Server({ skipSync: true })
	startUse(): void {
		this.isFiring = true
		this.hookShoot()
	}

	@Server({ skipSync: true })
	stopUse(): void {
		this.isFiring = false
		this.frameStartFire = this.world.frameCount
	}

	@Server({ skipSync: true })
	hookShoot() {
		const holder = this.world.entities.get(this.holderId) as Gunner
		if (!holder) return

		if (this.world.frameCount - this.frameStartFire > 8) {
			const angle = holder.rotation
			this.frameStartFire = this.world.frameCount
			this.world.addEntity("Bullet", {
				pos: {
					x: holder.pos.x + holder.vel.x * 2 + Math.cos(angle) * 60,
					y: holder.pos.y + holder.vel.y * 2 + Math.sin(angle) * 60,
				},
				vel: {
					x: holder.vel.x + Math.cos(angle) * 40,
					y: holder.vel.y + Math.sin(angle) * 40,
				},
				rotation: angle,
			})
		}
	}
}
