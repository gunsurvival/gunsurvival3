import { World, WorldOptions } from "@/lib/multiplayer-world/World"
import { addWorldRecursive } from "@/lib/multiplayer-world/utils/common"

export async function createWorld<
	WorldClass extends typeof World,
	CreateOptions extends Parameters<InstanceType<WorldClass>["init"]>[0]
>(
	worldClass: WorldClass,
	options: CreateOptions & WorldOptions
): Promise<InstanceType<WorldClass>> {
	const world = new worldClass(options)
	addWorldRecursive(world, world)
	await world.init(options)
	if (options.mode === "server") {
		world.setupClientRPC(options.room)
	} else if (options.mode === "client") {
		world.setupServerRPC(options.room)
	}
	return world as InstanceType<WorldClass>
}
