import { createWorld } from "@/core/utils/createWorld"
import { CasualWorld } from "@/core/world/CasualWorld"
import { genericMemo } from "@/utils/genericMemo"
import { useMemo } from "react"

export const GameContainer = genericMemo(() => {
	console.log("GameContainer rendered")
	const world = useMemo(() => {
		createWorld(CasualWorld, {
			mode: "both",
		}).then(async (w) => {
			if (w.isServer) {
				const entity = await w.addEntity("Gunner", {
					x: 100,
					y: 100,
				})
				const controller = await entity.addController("GunnerController", {})
				controller.setTarget(entity)
			}
		})
	}, [])

	return (
		<div
			id="game-root"
			className="fixed top-0 left-0 w-full h-full bg-white"
		></div>
	)
})
