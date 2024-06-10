import uniqid from "uniqid"
import { MapSchema, Schema, type } from "@/lib/multiplayer-world/schema"
import { Server } from "@/lib/multiplayer-world/decorators"
import { Item } from "../item/Item"
import { AsyncEE } from "@/lib/AsyncEE"

export class Backpack extends Schema {
	declare ee: AsyncEE<{
		add: (item: Item) => void
		remove: (item: Item) => void
		"*": () => void
	}>
	@type({ map: Item }) items = new MapSchema<Item>()
	arr = new Array<Item>()

	@Server()
	add(entityId: string): void {
		const item = this.world.entities.get(entityId)
		if (item instanceof Item) {
			this.arr.push(item)
			this.items.set(entityId, item)
			this.ee.emit("add", item)
		}
	}

	@Server()
	remove(entityId: string): void {
		const item = this.items.get(entityId)
		if (item instanceof Item) {
			this.items.delete(entityId)

			const index = this.arr.indexOf(item)
			if (index !== -1) {
				this.arr.splice(index, 1)
				this.ee.emit("remove", item)
			}
		}
	}

	index(index: number) {
		return this.arr[index]
	}

	getById(id: string) {
		return this.items.get(id)
	}
}
