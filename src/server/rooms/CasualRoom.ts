import * as Entities from "@/core/entity"
import { createWorld } from "@/core/utils/createWorld"
import { CasualWorld } from "@/core/world/CasualWorld"
import { Room, Client, type ClientArray } from "@colyseus/core"
import { UserData } from "../types/UserData"

export class CasualRoom extends Room<CasualWorld> {
	declare clients: ClientArray<UserData>
	maxClients = 4

	async onCreate(options: any) {
		const world = await createWorld(CasualWorld, {
			mode: "server",
			room: this,
		})
		Object.entries(Entities).forEach(([name, Entity]) => {
			world.registerEntityClass(Entity)
		})
		this.setState(world)

		this.onMessage("ready-to-get-snapshot", async (client, message) => {
			client.send("snapshot", this.state.getSnapshot())
		})

		this.onMessage("ready-to-join", async (client, message) => {
			const entity = await this.state.addEntity("Gunner", {
				x: 100,
				y: 100,
			})
			const controller = entity
				.sync(client)
				.addController("GunnerController", {})
			client.userData?.controllers.set(controller.id, controller)
		})
	}

	async onJoin(client: Client<UserData>, options: any) {
		client.userData = {
			controllers: new Map(),
		}

		console.log(client.sessionId, "joined!")
	}

	onLeave(client: Client<UserData>, consented: boolean) {
		const ids: string[] = []
		client.userData?.controllers.forEach((controller) => {
			if (controller.target?.id) {
				ids.push(controller.target.id)
			}
		})
		this.state.removeEntityById(ids)
	}

	onDispose() {
		console.log("room", this.roomId, "disposing...")
	}
}
