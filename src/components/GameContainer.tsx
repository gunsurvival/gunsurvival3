import { CasualWorld } from "@/core/world/CasualWorld"
import { useMemo } from "react"

export function GameContainer() {
	const world = useMemo(() => {
		const w = new CasualWorld({
			mode: "both",
		})
		w.initialize()
		return w
	}, [])

	return <div></div>
}
