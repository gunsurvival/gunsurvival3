import { Assets, Sprite } from "pixi.js"
import { Entity } from "./Entity"
import { Circle } from "detect-collisions"
import { type } from "@colyseus/schema"
import type { SerializedResponse } from "../world/CasualWorld"
import { Gunner } from "./Gunner"
import { getZIndexByName } from "../settings"
import { Server } from "@/lib/multiplayer-world/decorators"
import { lerpAngle } from "../utils/common"

enum LOUDNESS {
	QUIET,
	NOISE,
	LOUD,
}

export class Bush extends Entity {
	body = new Circle({ x: 0, y: 0 }, 100)
	display = this.clientOnly<Sprite>()
	__loudness: LOUDNESS = LOUDNESS.QUIET

	@type("number") loudness: number = LOUDNESS.QUIET

	async init(options: { x: number; y: number }) {
		this.pos.x = options.x
		this.pos.y = options.y

		if (this.isClient) {
			this.display = new Sprite(await Assets.load("images/Bush.png"))
			this.display.width = 200
			this.display.height = 200
			this.display.anchor.x = 0.5
			this.display.anchor.y = 0.5
			this.display.x = options.x
			this.display.y = options.y
			this.display.zIndex = getZIndexByName(this.constructor.name)
		}
	}

	nextTick() {
		if (this.isClient && this.serverState) {
			this.loudness = this.serverState.loudness
		}

		if (this.isClient) {
			// shaking the tree
			let targetRotation =
				Math.sin(this.world.frameCount / 10) * (0.1 * this.loudness)
			this.display.rotation = lerpAngle(
				this.display.rotation,
				targetRotation,
				0.1
			)
		}

		this.__loudness = LOUDNESS.QUIET
	}

	finalizeTick(deltaTime: number): void {
		this.setLoudness(this.__loudness)
	}

	@Server()
	onCollisionEnter(otherId: string, response: SerializedResponse): void {
		// @ts-ignore
		const other = this.world.entities.get(otherId)

		if (other instanceof Gunner && this.isClient && other.isControlling) {
			this.display.alpha = 0.5
		}
	}

	@Server({ skipSync: true })
	onCollisionStay(otherId: string, response: SerializedResponse): void {
		// @ts-ignore
		const other = this.world.entities.get(otherId)
		if (other instanceof Gunner) {
			if (other.vel.len() > 2) {
				this.__loudness = Math.max(this.__loudness, LOUDNESS.LOUD)
			} else if (other.vel.len() > 0.5) {
				this.__loudness = Math.max(this.__loudness, LOUDNESS.NOISE)
			}
		}
	}

	@Server()
	onCollisionExit(otherId: string, response: SerializedResponse): void {
		// @ts-ignore
		const other = this.world.entities.get(otherId)
		if (other instanceof Gunner && this.isClient && other.isControlling) {
			this.display.alpha = 1
		}
	}

	@Server({ skipSync: true })
	setLoudness(loudness: LOUDNESS) {
		// console.log("loudless", this._loudness)
		if (this.loudness !== loudness) {
			this.loudness = loudness
		}
	}
}
