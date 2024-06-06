import { Container } from "pixi.js"
import { Entity } from "./Entity"
import type { PixiWorld } from "../world/PixiWorld"
import { getZIndexByName } from "@/core/settings"
import { Client } from "../decorators"

export abstract class PixiEntity extends Entity<PixiWorld> {
	abstract display: Container | undefined

	async prepare(options: Parameters<this["init"]>[0]): Promise<void> {
		if (this.display) {
			if (options.pos) {
				this.display.x = options.pos.x
				this.display.y = options.pos.y
			}

			if (options.rotation) {
				this.display.rotation = options.rotation
			}

			this.display.zIndex = getZIndexByName(this.constructor.name)
		}
	}

	onAddToWorld(): void {
		if (this.isClient) {
			if (this.display) this.world.app.stage.addChild(this.display)
		}
	}

	onRemoveFromWorld(): void {
		if (this.display) {
			this.world.app.stage.removeChild(this.display)
			this.display.destroy()
		}
	}

	@Client()
	updateDisplay(delta: number): void {
		if (this.display) {
			this.display.x = this.pos.x
			this.display.y = this.pos.y
			this.display.rotation = this.rotation
		}
	}
}
