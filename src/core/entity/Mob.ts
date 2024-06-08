import { PixiEntity } from "@/lib/multiplayer-world/entity/PixiEntity"
import { Assets, Container, Graphics, Sprite } from "pixi.js"
import { createHealthBar } from "../graphics/createMobHealthBar"
import { Server } from "@/lib/multiplayer-world/decorators"
import { type } from "@/lib/multiplayer-world/schema"
import { deg2rad } from "detect-collisions"

export class Mob extends PixiEntity {
	@type("number") health: number = 100

	randomSeed = Math.floor(Math.random() * 1000)
	display!: Container
	lastMoveFrame = 0
	speed = 5
	friction = 0.96

	nextTick(deltaTime: number): void {
		this.updateDisplay(deltaTime)
		this.calculateMovement(deltaTime)

		if (this.isClient) {
			const bubbleScale = Math.sin((Date.now() + this.randomSeed) / 400) * 0.05
			const scale = this.health / 100 + bubbleScale
			this.display.scale = scale
		}
	}

	@Server({ skipSync: true })
	calculateMovement(deltaTime: number): void {
		if (this.world.frameCount - this.lastMoveFrame > Math.random() * 100 + 80) {
			this.vel.x = 0
			this.vel.y = 0
			switch (Math.floor(Math.random() * 5)) {
				case 0: // Only change angle
					this.rotation = Math.random() * Math.PI * 2
					break

				case 1: {
					// Change angle and move
					this.rotation = Math.random() * Math.PI * 2
					this.vel.x = Math.cos(this.rotation) * this.speed
					this.vel.y = Math.sin(this.rotation) * this.speed
					break
				}

				case 2: {
					// Only move
					this.vel.x = Math.cos(this.rotation) * this.speed
					this.vel.y = Math.sin(this.rotation) * this.speed
					break
				}

				default:
					break
			}

			this.lastMoveFrame = this.world.frameCount
		}
	}
}
