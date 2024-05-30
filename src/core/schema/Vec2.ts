import { Schema, type } from "@/lib/multiplayer-world/schema"

export class Vec2 extends Schema {
	@type("number") x: number = 0
	@type("number") y: number = 0
}