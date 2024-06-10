import uniqid from "uniqid"
import * as Entities from "@/core/entity"
import * as Items from "@/core/item"
import { createWorld } from "@/core/utils/createWorld"
import { Room, Client, type ClientArray } from "@colyseus/core"
import { UserData } from "../types/UserData"
import { CasualWorld } from "@/core/world/CasualWorld"
import WorldmapGenerator from "worldmap-generator"

export class CasualRoom extends Room<CasualWorld> {
	declare clients: ClientArray<UserData>
	maxClients = 4

	genWorld() {
		const wideX = 1920 // Width of the world
		const wideY = 1080 // Height of the world
		const objects = ["Bush", "Rock", "Spider", "Wolf"]
		const numBushes = 10
		const bushRadius = 5 // Radius of the bush group
		const numSpiders = 10
		const numWolves = 5

		// Spawn the bushes and rocks in groups
		for (let i = 0; i < numBushes; i++) {
			// Use a normal distribution to get the x and y coordinates for the center of the bush group
			const bushX = -wideX / 2 + wideX * Math.random()
			const bushY = -wideY / 2 + wideY * Math.random()

			// Spawn the bush at the center
			this.state.addEntity("Bush", { pos: { x: bushX, y: bushY } })
		}

		// Spawn the rocks randomly
		for (let i = 0; i < numBushes; i++) {
			const rockX = -wideX / 2 + wideX * Math.random()
			const rockY = -wideY / 2 + wideY * Math.random()
			this.state.addEntity("Rock", { pos: { x: rockX, y: rockY } })
		}

		// Spawn the spiders randomly
		for (let i = 0; i < numSpiders; i++) {
			const spiderX = -wideX / 2 + wideX * Math.random()
			const spiderY = -wideY / 2 + wideY * Math.random()
			this.state.addEntity("Spider", { pos: { x: spiderX, y: spiderY } })
		}

		// Spawn the wolves randomly
		for (let i = 0; i < numWolves; i++) {
			const wolfX = -wideX / 2 + wideX * Math.random()
			const wolfY = -wideY / 2 + wideY * Math.random()
			this.state.addEntity("Wolf", { pos: { x: wolfX, y: wolfY } })
		}
	}

	async onCreate(options: any) {
		const world = createWorld(CasualWorld, {
			mode: "server",
			room: this,
			// TODO: làm generic cho entityClasses
			// @ts-ignore
			entityClasses: { ...Entities, ...Items },
		})
		this.setState(world)
		for (let i = 0; i < 1; i++) {
			world.addEntity("GunnerBot", {
				x: Math.random() * 500,
				y: Math.random() * 500,
			})
		}

		this.genWorld()

		this.onMessage("ready-to-get-snapshot", async (client, message) => {
			client.send("snapshot", this.state.getSnapshot())
		})

		this.onMessage("ping", async (client, message) => {
			client.send("pong", message)
		})

		this.onMessage("ready-to-join", async (client, message) => {
			console.log("ready to join")
			const entity = await this.state.addEntity("Gunner", {
				pos: {
					x: 100,
					y: 100,
				},
			})
			const ak47 = await this.state.addEntity("Ak47", {
				holderId: entity.id,
			})
			setTimeout(() => {
				;(entity as Entities.Gunner).backpack.add(ak47.id)
			}, 2000)

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
