import { Assets, Container, Mesh, MeshRope, Point, Sprite } from "pixi.js"
import { Gunner } from "./Gunner"
import { Circle } from "detect-collisions"
import { Client, Server } from "@/lib/multiplayer-world/decorators"
import type { SerializedResponse } from "../../lib/multiplayer-world/utils/dectect-collisions"
import { PixiEntity } from "@/lib/multiplayer-world/entity/PixiEntity"
import { Smooth } from "smooth.ts"

export class Bullet extends PixiEntity {
	display: MeshRope | undefined
	body = new Circle({ x: 0, y: 0 }, 4)
	maxTailLength = 10
	accuracy = 0.5
	history = new Array<[number, number]>()
	tails = new Array<Point>()

	async prepare(options: Parameters<this["init"]>[0]): Promise<void> {
		this.history = Array.from(
			{ length: this.maxTailLength * this.accuracy },
			() => [options.pos?.x ?? 0, options.pos?.y ?? 0]
		)
		this.tails = Array.from(
			{ length: this.maxTailLength },
			() => new Point(options.pos?.x ?? 0, options.pos?.y ?? 0)
		)
		this.display = new MeshRope({
			texture: await Assets.load("images/Bullet2.png"),
			points: this.tails,
		})
		this.display.blendMode = "add"
		// await super.prepare(options)
	}

	nextTick(delta: number) {
		if (this.vel.len() < 0.1) {
			this.destroy()
		}
		// this.updateDisplay(delta)
		this.drawTail()
	}

	@Client()
	drawTail() {
		this.history.pop()
		this.history.unshift([this.pos.x, this.pos.y])
		const tailsSmoother = Smooth(this.history)
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
			other.applyForceByVelocity(this.vel, 0.1)
			this.destroy()
		}
	}
}
