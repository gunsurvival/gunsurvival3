import { Schema } from "@/lib/multiplayer-world/schema/Schema"
import { type } from "@colyseus/schema"

export class Vec2 extends Schema {
	@type("number") x: number = 0
	@type("number") y: number = 0

	len() {
		return Math.sqrt(this.x * this.x + this.y * this.y)
	}
}
