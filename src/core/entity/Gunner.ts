import { Assets, Container, Graphics, Sprite } from "pixi.js"
import { Circle } from "detect-collisions"
import type { SerializedResponse } from "@/lib/multiplayer-world/utils/dectect-collisions"
import { PixiEntity } from "@/lib/multiplayer-world/entity/PixiEntity"
import { lerp, lerpAngle } from "../utils/common"
import anime from "animejs"

export class Gunner extends PixiEntity {
	declare display: Container
	hands!: [Graphics, Graphics]
	handsPos!: [[number, number], [number, number]]
	body = new Circle({ x: 0, y: 0 }, 40)

	async prepare(options: Parameters<this["init"]>[0]): Promise<void> {
		this.display = new Container()

		// For gunner head
		const sprite = new Sprite(await Assets.load("images/terrorist.png"))
		sprite.width = 80
		sprite.height = 80
		sprite.anchor.x = 0.5
		sprite.anchor.y = 0.5
		this.display.addChild(sprite)

		// For gunner hands
		this.hands = [new Graphics(), new Graphics()]
		for (const hand of this.hands) {
			hand.circle(0, 0, 8).fill("white")
		}
		const wideX = 30
		const wideY = -28
		this.hands[0].x = wideX
		this.hands[0].y = -wideY
		this.hands[1].x = wideX
		this.hands[1].y = wideY

		this.handsPos = [
			[wideX, -wideY],
			[wideX, wideY],
		]
		const wY = 20
		const wX = 10
		anime({
			targets: this.hands[0],
			x: this.handsPos[0][0] + 5,
			y: this.handsPos[0][1] + 10,
			direction: "alternate",
			loop: true,
			easing: "easeOutSine",
		})
		anime({
			targets: this.hands[1],
			x: this.handsPos[1][0] + 5,
			y: this.handsPos[1][1] - 10,
			direction: "alternate",
			loop: true,
			easing: "easeOutSine",
		})

		this.display.addChild(this.hands[0], this.hands[1])
		super.prepare(options)
	}

	nextTick(delta: number) {
		// this.rotation = lerpAngle(
		// 	this.rotation,
		// 	Math.atan2(this.vel.y, this.vel.x),
		// 	0.3
		// )
		this.updateDisplay(delta)
	}

	reconcileServerState(serverState: this): void {
		this.pos.x = lerp(this.pos.x, serverState.pos.x, 0.1)
		this.pos.y = lerp(this.pos.y, serverState.pos.y, 0.1)
		this.vel.x = lerp(this.vel.x, serverState.vel.x, 0.3)
		this.vel.y = lerp(this.vel.y, serverState.vel.y, 0.3)
		if (!this.isControlling) {
			this.rotation = lerpAngle(this.rotation, serverState.rotation, 0.1)
		}
	}

	onCollisionStay(otherId: string, response: SerializedResponse): void {
		// @ts-ignore
		const other = this.world.entities.get(otherId)
		if (other instanceof Gunner) {
			this.pos.x -= response.overlapV.x / 2
			this.pos.y -= response.overlapV.y / 2
		}
	}
}

function easeOutCubic(x: number): number {
	return x * x * x
}

console.log("gunner class name", Gunner.name, Gunner)
