import { Container, Graphics } from "pixi.js"
import { createSlot } from "./createSlot"
import { Item } from "../item/Item"

export function createSlotBar({ amount }: { amount: number }) {
	const container = new Container()
	const currentSlots = new Array<ReturnType<typeof createSlot>>()

	for (let i = 0; i < amount; i++) {
		const slot = createSlot()
		currentSlots.push(slot)
		slot.container.x = i * (slot.container.width + 20)
		slot.container.y = 0
		container.addChild(slot.container)
	}

	const add = (item: Item) => {
		for (const slot of currentSlots) {
			if (slot.isEmpty()) {
				console.log("Adding item to slot")
				slot.updateItem(item)
				break
			}
		}
	}

	return { container, add }
}
