import { createWorld } from "@/core/utils/createWorld"
import { CasualWorld } from "@/core/world/CasualWorld"
import { genericMemo } from "@/utils/genericMemo"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Client as ColyseusClient } from "colyseus.js"
import { Checkbox } from "./ui/checkbox"

async function connect() {
	const client = new ColyseusClient("ws://khoakomlem-internal.ddns.net:2567")
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

	const onCheckedChange = useCallback((checked: boolean) => {
		window.isSync = checked
	}, [])

	useEffect(() => {
		createClientWorld().then(setWorld)
		window.isSync = true
	}, [])

	return (
		<div className="fixed top-0 left-0 w-full h-full bg-white">
			<div id="game-root" className="absolute w-full h-full z-0"></div>
			<div className="absolute z-10">
				<div className="flex flex-row gap-x-1">
					<Checkbox
						defaultChecked
						onCheckedChange={onCheckedChange}
						className="z-10 h-6 w-6 stroke-white border-white text-white"
					/>
					<p className="text-white">ENABLE SYNC</p>
				</div>
			</div>
		</div>
	)
})
