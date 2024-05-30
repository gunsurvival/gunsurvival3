import { Schema } from "./schema"
import { World } from "./World"

export class Controller<T = any> extends Schema {
	enableBidirectional = true
	target: T | undefined

	constructor(public world: World) {
		super()
	}

	async init(options: {}) {}

	initClient() {}

	setTarget(target: T) {
		this.target = target
	}

	nextTick(deltaTime: number) {}
}
