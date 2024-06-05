import { Schema } from "./schema"
import { getHandlers } from "./decorators"

export class ServerController<T extends Schema = Schema> {
	get controllerHandlers() {
		return getHandlers(this.constructor, "controller")
	}

	constructor(
		public id: string,
		public target: T // public clientOnServer?: ClientOnServer<UserData>
	) {}

	get world() {
		return this.target.world
	}

	get isClient() {
		return this.world.isClient
	}

	get isServer() {
		return this.world.isServer
	}

	async init(options: {}) {}

	setupClient() {}

	setTarget(target: T) {
		this.target = target
	}

	nextTick(deltaTime: number) {}
}
