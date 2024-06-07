import uniqid from "uniqid"
import * as Entities from "@/core/entity"
import { createWorld } from "@/core/utils/createWorld"
import { Room, Client, type ClientArray } from "@colyseus/core"
import { UserData } from "../types/UserData"
import { CasualWorld } from "@/core/world/CasualWorld"

export class CasualRoom extends Room<CasualWorld> {
	declare clients: ClientArray<UserData>
	maxClients = 4

	async onCreate(options: any) {
		const world = createWorld(CasualWorld, {
			mode: "server",
			room: this,
			entityClasses: Entities,
		})
		this.setState(world)
		for (let i = 0; i < 100; i++) {
			world.addEntity("GunnerBot", {
				x: Math.random() * 500,
				y: Math.random() * 500,
			})
		}

		const wideX = 1920
		const wideY = 1080
		const objects = ["Bush", "Rock", "Spider", "Wolf"]
		for (let i = 0; i < 30; i++) {
			world.addEntity(objects[Math.floor(Math.random() * objects.length)], {
				pos: {
					x: -wideX / 2 + Math.random() * wideX,
					y: -wideY / 2 + Math.random() * wideY,
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
