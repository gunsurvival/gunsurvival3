import { UserData } from "@/server/types/UserData"
import { Schema } from "./schema"
import { Client as ClientOnServer } from "@colyseus/core"

export class ServerController<T extends Schema = Schema> {
	controllerHandlers!: Map<string, Function>

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
