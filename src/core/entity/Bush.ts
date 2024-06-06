import { Assets, Sprite } from "pixi.js"
import { Circle } from "detect-collisions"
import { Gunner } from "./Gunner"
import { Server } from "@/lib/multiplayer-world/decorators"
import { type } from "@/lib/multiplayer-world/schema"
import { lerpAngle } from "../utils/common"
import { PixiEntity } from "@/lib/multiplayer-world/entity/PixiEntity"
import type { SerializedResponse } from "@/lib/multiplayer-world/utils/dectect-collisions"
import debounce from "lodash/debounce"

enum LOUDNESS {
	QUIET,
	NOISE,
	LOUD,
}

export class Bush extends PixiEntity {
	declare display: Sprite
	@type("number") loudness: number = LOUDNESS.QUIET

	body = new Circle({ x: 0, y: 0 }, 100)
	__loudness: LOUDNESS = LOUDNESS.QUIET

	async prepare(options: Parameters<this["init"]>[0]): Promise<void> {
		this.display = new Sprite(await Assets.load("images/Bush.png"))
		super.prepare(options)
		this.display.width = 200
		this.display.height = 200
		this.display.anchor.x = 0.5
		this.display.anchor.y = 0.5
	}

	nextTick(delta: number) {
		if (this.isClient) {
			// shaking the tree
			let targetRotation =
				Math.sin(this.world.frameCount / 10) * (0.1 * this.loudness)
			this.rotation = lerpAngle(this.rotation, targetRotation, 0.1)
		}

		this.__loudness = LOUDNESS.QUIET
		this.updateDisplay(delta)
	}

	finalizeTick(deltaTime: number): void {
		this.setLoudness(this.__loudness)
	}

	reconcileServerState(serverState: this): void {
		// super.reconcileServerState(serverState)
		this.loudness = serverState.loudness
	}

	// @Server()
	// onCollisionEnter(otherId: string, response: SerializedResponse): void {
	// 	// @ts-ignore
	// 	const other = this.world.entities.get(otherId)

	// 	if (this.isClient) {

	// 		// this.lastEnterTime = this.world.frameCount
	// 	}
	// }

	onCollisionStay(otherId: string, response: SerializedResponse): void {
		// @ts-ignore
		const other = this.world.entities.get(otherId)

		if (other) {
			if (other.vel.len() > 2) {
				this.__loudness = Math.max(this.__loudness, LOUDNESS.LOUD)
			} else if (other.vel.len() > 0.5) {
				this.__loudness = Math.max(this.__loudness, LOUDNESS.NOISE)
			}

			if (other instanceof Gunner) {
				if (this.isClient && other.isControlling) {
					this.display.alpha = 0.5
					this.normalBush()
				}
			}
		}
	}

	@Server()
	onCollisionExit(otherId: string, response: SerializedResponse): void {
		// @ts-ignore
		const other = this.world.entities.get(otherId)
		if (other instanceof Gunner && this.isClient && other.isControlling) {
			// this.display.alpha = 1
		}
	}

	@Server({ skipSync: true })
	setLoudness(loudness: LOUDNESS) {
		// console.log("loudless", this._loudness)
		if (this.loudness !== loudness) {
			this.loudness = loudness
		}
	}

	normalBush = debounce(() => {
		this.display.alpha = 1
	}, 100)
}
