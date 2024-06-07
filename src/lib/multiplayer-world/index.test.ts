import { Room, Server as ColyServer } from "@colyseus/core"
import { type } from "@colyseus/schema"
import { WebSocketTransport } from "@colyseus/ws-transport"
import { Client as ColyClient } from "colyseus.js"
import uniqid from "uniqid"

import { Client, Server } from "./decorators"
import { ArraySchema, MapSchema, Schema } from "./schema"
import { World } from "./World"

export class Vec2 extends Schema {
	@type("number") x: number = 0
	@type("number") y: number = 0
}

export class Backpack extends Schema {
	@type("number") gold: number = 0
	@type(Vec2) posBag = new Vec2()
	@type({ map: "number" }) items = new MapSchema<number>()
	@type([Vec2]) positions = new ArraySchema<Vec2>()

	@Server()
	addGold(amount: number) {
		this.log(`Adding ${amount} gold!`)
		this.gold += amount
	}
}

export class Entity extends Schema {
	@type(Vec2) pos = new Vec2()
	@type(Backpack) backpack = new Backpack()

	@Server()
	moveTo(x: number, y: number) {
		this.backpack.sync().addGold(10)
		this.log("Moving entity to", x, y)
		this.pos.x = x
		this.pos.y = y
	}

	@Client()
	addBloodEffect() {
		console.log("add blood gore effect here")
	}
}

class MyWorld extends World {
	entityClassMap = new Map<string, typeof Entity>()
	@type({ map: Schema }) entities = new MapSchema<Entity>()

	@Server()
	addEntity(classID: string, id: string) {
		this.log(`Adding entity ${classID}#${id}`)
		const theClass = this.entityClassMap.get(classID)
		if (!theClass) {
			throw new Error(
				`Entity class "${classID}" not found in world "${this.constructor.name}"!`
			)
		}

		const entity = new theClass().assign({ id })
		this.entities.set(entity.id, entity)
	}
}

export class PlaygroundColy extends Room<MyWorld> {
	onCreate() {
		const world = new MyWorld({
			mode: "server",
			room: this,
		})
		world.entityClassMap.set("Player", Entity)

		this.setState(world)
		console.log("Playground room created!")
	}

	onJoin() {
		this.state.sync().addEntity("Player", uniqid())
		this.state.entities.forEach((entity) => {
			entity.sync().moveTo(10, 10)
			entity.backpack.sync().addGold(100)
		})
	}

	onLeave() {
		console.log("Player left!")
	}

	onDispose() {
		console.log("Room disposed!")
	}
}

const server = new ColyServer({
	transport: new WebSocketTransport(),
})

server.define("playground", PlaygroundColy)
server.listen(2567).then(() => {
	console.log("Server started! 2567")
})

setTimeout(() => {
	const client = new ColyClient("ws://localhost:2567")
	client.joinOrCreate<MyWorld>("playground").then((room) => {
		const worldClient = new MyWorld({
			mode: "client",
		})
		worldClient.initialize()
		worldClient.setupRPC(room)
		worldClient.entityClassMap.set("Player", Entity)
	})
}, 1000)
