import { Schema } from "@/lib/multiplayer-world/schema"

export class Entity extends Schema {
	@type(Vec2) pos = new Vec2()

	@Server()
	moveTo(x: number, y: number) {
		this.backpack.sync().addGold(10)
		this.log("Moving entity to", x, y)
		this.pos.x = x
		this.pos.y = y
	}

	@Client()
	addBloodEffect() {
		console.log("add blood gore effect here")
	}
}
