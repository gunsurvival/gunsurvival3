import { createWorld } from "multiplayer-world"
import { genericMemo } from "@/utils/genericMemo"
import { useCallback, useEffect, useState } from "react"
import { Client as ColyseusClient } from "colyseus.js"
import { Checkbox } from "./ui/checkbox"
import * as Entities from "@/core/entity"
import * as Items from "@/core/item"
import * as Controllers from "@/core/controller"
import { CasualWorld } from "@/core/world/CasualWorld"
import { World } from "multiplayer-world"

async function connect() {
  const wsEndpoint = `ws://${new URL(process.env.DOMAIN).hostname}:${process.env.WS_PORT}`
  console.log(`Connecting to ${wsEndpoint}...`)
	const client = new ColyseusClient(wsEndpoint)
	// const client = new ColyseusClient("ws://localhost:2567")
	const room = await client.joinOrCreate("casual")
	console.log("joined room", room.roomId)
	return { client, room }
}

async function createClientWorld() {
	const { room } = await connect()
	const world = createWorld(CasualWorld, {
		mode: "client",
		room,
    entityClasses: { ...Entities, ...Items },
    controllerClasses: {
      ...Controllers
    }
	})
	return world
}

export const GameContainer = genericMemo(() => {
	console.log("GameContainer rendered")

	const [world, setWorld] = useState<World | undefined>()
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

        {/* <HealthBar className="fixed left-[50%] bottom-5"></HealthBar> */}
			</div>
		</div>
	)
})
