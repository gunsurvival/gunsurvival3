import { Container, Graphics } from "pixi.js"
import { Item } from "../item/Item"

export function createSlot() {
	const container = new Container()
	const slot = new Graphics()
	let item: Item | undefined = undefined

	const width = 55
	const height = 55
	slot.roundRect(0, 0, width, height, 10).fill(0x266c4f).alpha = 0.5
	container.addChild(slot)

	const updateItem = (newItem: Item | undefined) => {
		if (item?.sprite) {
			container.removeChild(item.sprite)
		}

		item = newItem
		if (item?.sprite) {
			container.addChild(item.sprite)
			const scale = width / item.sprite.width
			item.sprite.scale.x = 0.1
			item.sprite.scale.y = 0.1
			item.sprite.rotation = -Math.PI / 5
			item.sprite.x = width / 2
			item.sprite.y = height / 2
		}
	}

	const isEmpty = () => item === undefined

	return { container, updateItem, isEmpty }
}
