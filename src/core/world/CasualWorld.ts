import { PixiWorld } from "@/lib/multiplayer-world/world"

export class CasualWorld extends PixiWorld {
	async prepare(options: Parameters<this["init"]>[0]): Promise<void> {
		await super.prepare(options)
		this.app.renderer.background.color = "#133a2b"
	}
}
