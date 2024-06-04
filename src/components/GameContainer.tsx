import { createWorld } from "@/core/utils/createWorld"
import { CasualWorld } from "@/core/world/CasualWorld"
import { genericMemo } from "@/utils/genericMemo"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Client as ColyseusClient } from "colyseus.js"

async function connect() {
	const client = new ColyseusClient("ws://localhost:2567")
	const room = await client.joinOrCreate("casual")
	console.log("joined room", room.roomId)
	return { client, room }
}

async function createClientWorld() {
	const { room } = await connect()
	const world = await createWorld(CasualWorld, {
		mode: "client",
		room,
	})
	return world
}

export const GameContainer = genericMemo(() => {
	console.log("GameContainer rendered")

	const [world, setWorld] = useState<CasualWorld | undefined>()

	const test = useCallback(async () => {
		// if (w.isServer) {
		//   const entity = await w.addEntity("Gunner", {
		//     x: 100,
		//     y: 100,
		//   })
		//   const controller = await entity.addController("GunnerController", {})
		//   controller.setTarget(entity)
		// }
	}, [])

	useEffect(() => {
		createClientWorld().then(setWorld)
	}, [])

	return (
		<div
			id="game-root"
			className="fixed top-0 left-0 w-full h-full bg-white"
		></div>
	)
})
