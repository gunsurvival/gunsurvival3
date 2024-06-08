import { Assets, Container, Graphics, MeshRope, Point, Texture } from "pixi.js"
import { Gunner } from "./Gunner"
import { Circle } from "detect-collisions"
import { Client, Server } from "@/lib/multiplayer-world/decorators"
import type { SerializedResponse } from "../../lib/multiplayer-world/utils/dectect-collisions"
import { PixiEntity } from "@/lib/multiplayer-world/entity/PixiEntity"
import { Smooth } from "smooth.ts"
import { Emitter } from "@barvynkoa/particle-emitter"

export class Bullet extends PixiEntity {
	display!: Graphics
	rope!: MeshRope
	body = new Circle({ x: 0, y: 0 }, 4)
	maxTailLength = 20
	accuracy = 0.5
	history = new Array<[number, number]>()
	tails = new Array<Point>()
	friction = 0.97

	async prepare(options: Parameters<this["init"]>[0]): Promise<void> {
		this.display = new Graphics()
		this.display.circle(0, 0, 4).fill("red")

		this.history = Array.from(
			{ length: this.maxTailLength * this.accuracy },
			() => [options.pos?.x ?? 0, options.pos?.y ?? 0]
		)
		this.tails = Array.from(
			{ length: this.maxTailLength },
			() => new Point(options.pos?.x ?? 0, options.pos?.y ?? 0)
		)
		this.rope = new MeshRope({
			texture: await Assets.load("images/trail.png"),
			points: this.tails,
		})
		this.rope.tint = "red"
		this.rope.blendMode = "add"
		this.display.blendMode = "color-dodge"
		await super.prepare(options)
		// this.display.addChild(this.rope)
		this.world.viewport.addChild(this.rope)
		this.display.on("removed", () => {
			this.rope.destroy()
		})
	}

	nextTick(delta: number) {
		if (this.vel.len() < 0.1) {
			this.destroy()
		}
		this.updateDisplay(delta)
		this.drawTail()
	}

	@Client()
	drawTail() {
		const velLen = this.vel.len()
		this.rope.alpha = velLen < 5 ? (velLen / 5) * 1 : 1
		this.display.alpha = velLen < 3 ? (velLen / 3) * 1 : 1

		this.history.pop()
		this.history.unshift([this.pos.x, this.pos.y])
		const tailsSmoother = Smooth(this.history, {
			method: "nearest",
		})
		this.tails.forEach((tail, index) => {
			const smoothed = tailsSmoother(
				(index * this.history.length) / this.tails.length
			)
			tail.x = smoothed[0]
			tail.y = smoothed[1]
		})
	}

	@Server({ allowClient: true })
	onCollisionEnter(otherId: string, response: SerializedResponse): void {
		// @ts-ignore
		const other = this.world.entities.get(otherId)
		if (other instanceof Gunner) {
			this.destroy()
		}
	}
}
