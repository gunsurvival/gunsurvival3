import { PixiEntity } from "@/lib/multiplayer-world/entity/PixiEntity"
import { Assets, Container, Graphics, Sprite } from "pixi.js"
import { createHealthBar } from "../graphics/createHealthBar"
import { getZIndexByName } from "../settings"
import { Mob } from "./Mob"

export class Spider extends Mob {
	display!: Container
	healthBar!: Graphics
	sprite!: Sprite

	async prepare(options: Parameters<PixiEntity["init"]>[0]): Promise<void> {
		this.display = new Container()

		// spider sprite
		this.sprite = new Sprite(await Assets.load("images/spider.png"))
		this.sprite.anchor.x = 0.5
		this.sprite.anchor.y = 0.5
		this.sprite.width = 320
		this.sprite.height = 320
		this.display.addChild(this.sprite)

		// // health bar
		// this.healthBar = createHealthBar({
		// 	width: 150,
		// 	height: 10,
		// 	borderWeight: 3,
		// })
		// this.healthBar.y -= 100
		// this.healthBar.zIndex = this.sprite.zIndex + 1
		// this.display.addChild(this.healthBar)

		super.prepare(options)
	}
}
