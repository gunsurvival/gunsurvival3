import type { ServerController } from "@/lib/multiplayer-world/ServerController"

export type UserData = {
	controllers: Map<string, ServerController>
}
