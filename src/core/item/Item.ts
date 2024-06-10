import { PixiEntity } from "@/lib/multiplayer-world/entity/PixiEntity"
import { Sprite } from "pixi.js"

export abstract class Item extends PixiEntity {
	sprite!: Sprite
	init(options: {}): void {}

	getSnapshot(): Parameters<this["init"]>[0] {
		return {}
	}

	startUse(): void {}

	stopUse(): void {}
}
