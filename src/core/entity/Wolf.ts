import { PixiEntity } from "@/lib/multiplayer-world/entity/PixiEntity"
import { Assets, Container, Graphics, Sprite } from "pixi.js"
// import { createHealthBar } from "../graphics/createMobHealthBar"
import { Mob } from "./Mob"
import { Circle } from "detect-collisions"

export class Wolf extends Mob {
	body = new Circle({ x: 0, y: 0 }, 50)
	display!: Container
	sprite!: Sprite

	async prepare(options: Parameters<PixiEntity["init"]>[0]): Promise<void> {
		this.display = new Container()

		// health bar
		// this.healthBar = createHealthBar({
		// 	width: 100,
		// 	height: 10,
		// 	borderWeight: 3,
		// })
		// this.healthBar.y -= 180
		// this.display.addChild(this.healthBar)

		// spider sprite
		this.sprite = new Sprite(await Assets.load("images/wolf.png"))
		this.sprite.width = 200
		this.sprite.height = 200
		this.sprite.anchor.x = 0.5
		this.sprite.anchor.y = 0.5
		this.display.addChild(this.sprite)

		// this.display.addChild(new Graphics().circle(0, 0, 1).fill(0xff0000))

		super.prepare(options)
	}
}
