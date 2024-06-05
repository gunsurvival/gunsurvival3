import { Assets, Sprite } from "pixi.js"
import { Entity } from "./Entity"
import { Circle } from "detect-collisions"
import { type } from "@colyseus/schema"
import { SerializedResponse } from "../world/CasualWorld"
import { Gunner } from "./Gunner"
import { getZIndexByName } from "../settings"
import { Server } from "@/lib/multiplayer-world/decorators"

enum LOUDNESS {
	QUIET,
	NOISE,
	LOUD,
}

export class Bush extends Entity {
	body = new Circle({ x: 0, y: 0 }, 100)
	display = this.clientOnly<Sprite>()
	@type("number") loudness = LOUDNESS.QUIET
	_loudness: LOUDNESS = LOUDNESS.QUIET

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
		if (this.serverState) {
			this.loudness = this.serverState.loudness
		}

		if (this.isClient) {
			if (this.loudness === LOUDNESS.LOUD) {
				this.display.alpha = 0.5
			} else {
				this.display.alpha = 1
			}
		}
	}

	finalizeTick(deltaTime: number): void {
		this.setLoudness(LOUDNESS.LOUD)
	}

	onCollisionStay(otherId: string, response: SerializedResponse): void {
		// @ts-ignore
		const other = this.world.entities.get(otherId)
		if (other instanceof Gunner) {
			if (other.vel.len() > 2) {
				this._loudness = LOUDNESS.LOUD
			} else if (other.vel.len() > 0.5) {
				this._loudness = LOUDNESS.NOISE
			}
		}
	}

	@Server({ skipSync: true })
	setLoudness(loudness: LOUDNESS) {
		if (this.loudness !== loudness) this.loudness = loudness
	}
}
