import uniqid from "uniqid"
import * as Entities from "@/core/entity"
import { createWorld } from "@/core/utils/createWorld"
import { Room, Client, type ClientArray } from "@colyseus/core"
import { UserData } from "../types/UserData"
import { PixiWorld } from "@/lib/multiplayer-world/world"

export class CasualRoom extends Room<PixiWorld> {
	declare clients: ClientArray<UserData>
	maxClients = 4

	async onCreate(options: any) {
		const world = createWorld(PixiWorld, {
			mode: "server",
			room: this,
			entityClasses: Entities,
		})
		this.setState(world)
		// for (let i = 0; i < 10; i++) {
		// 	world.addEntity("GunnerBot", {
		// 		x: Math.random() * 500,
		// 		y: Math.random() * 500,
		// 	})
		// }
		for (let i = 0; i < 10; i++) {
			world.addEntity("Bush", {
				pos: {
					x: Math.random() * 500,
					y: Math.random() * 500,
				},
			})
		}

		this.onMessage("ready-to-get-snapshot", async (client, message) => {
			client.send("snapshot", this.state.getSnapshot())
		})

		this.onMessage("ready-to-join", async (client, message) => {
			console.log("ready to join")
			const entity = await this.state.addEntity("Gunner", {
				pos: {
					x: 100,
					y: 100,
				},
			})

			//! Nếu xài addController thì khúc "addControllerById" trong hàm đó nó sẽ broadcast rpc tới tất cả client
			//! Nên phải xài addControllerById để chỉ gửi rpc tới client đó
			const controller = entity
				.sync(client)
				.addControllerById(uniqid(), "GunnerController", {})
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
