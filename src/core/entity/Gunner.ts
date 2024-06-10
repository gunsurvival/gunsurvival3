import { Assets, Container, Graphics, Sprite } from "pixi.js"
import { Circle } from "detect-collisions"
import type { SerializedResponse } from "@/lib/multiplayer-world/utils/dectect-collisions"
import { type } from "@/lib/multiplayer-world/schema"
import { PixiEntity } from "@/lib/multiplayer-world/entity/PixiEntity"
import { lerp, lerpAngle } from "../utils/common"
import anime from "animejs"
import { Bush } from "./Bush"
import { Rock } from "./Rock"
import { Client, Server } from "@/lib/multiplayer-world/decorators"
import { Bullet } from "./Bullet"
import { Backpack } from "../schema/Backpack"

export class Gunner extends PixiEntity {
	@type("number") health = 100
	@type("number") currentItemIndex = 0
	@type(Backpack) backpack = new Backpack()
	@type("boolean") isDied = false

	declare display: Container
	hands!: [Graphics, Graphics]
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
		this.hands[0].y = wideY
		this.hands[1].x = wideX
		this.hands[1].y = -wideY
		const wY = 20
		const wX = 10
		anime({
			targets: this.hands[0],
			x: this.hands[0].x + 20,
			y: this.hands[0].y + 25,
			direction: "alternate",
			loop: true,
			easing: "easeOutSine",
		})
		anime({
			targets: this.hands[1],
			x: this.hands[1].x + 20,
			y: this.hands[1].y - 25,
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
		this.health = serverState.health
		if (!this.isControlling) {
			this.rotation = lerpAngle(this.rotation, serverState.rotation, 0.1)
		}
	}

	@Server()
	onCollisionEnter(otherId: string, response: SerializedResponse): void {
		const other = this.world.entities.get(otherId)
		if (other instanceof Bullet) {
			this.injure(other.vel.len())
		}
	}

	onCollisionStay(otherId: string, response: SerializedResponse): void {
		// @ts-ignore
		const other = this.world.entities.get(otherId)
		if (other instanceof Gunner) {
			this.pos.x -= response.overlapV.x / 2
			this.pos.y -= response.overlapV.y / 2
		} else if (
			!(other instanceof Bush) &&
			!(other instanceof Rock) &&
			!(other instanceof Bullet)
		) {
			this.pos.x -= response.overlapV.x
			this.pos.y -= response.overlapV.y
		}
	}

	@Server()
	injure(damage: number): void {
		this.health -= damage
		this.emitInjury()
	}

	@Client()
	emitInjury() {
		this.display.tint = 0x990000
		anime.remove(this.display)
		anime.remove(this.display.scale)
		anime({
			targets: this.display,
			alpha: 0.5,
			duration: 150,
			direction: "alternate",
			loop: 2,
			easing: "easeOutSine",
		}).complete = () => {
			this.display.tint = 0xffffff
			this.display.alpha = 1
		}
		anime({
			targets: this.display.scale,
			x: 1.1,
			y: 1.1,
			duration: 150,
			direction: "alternate",
			loop: 2,
			easing: "easeOutSine",
		}).complete = () => {
			this.display.scale = 1
		}
	}

	@Server()
	startUse() {
		const item = this.backpack.index(this.currentItemIndex)
		if (item) {
			item.startUse()
		}
	}

	stopUse() {
		const item = this.backpack.index(this.currentItemIndex)
		if (item) {
			item.stopUse()
		}
	}
}

// console.log("gunner class name", Gunner.name, Gunner)
