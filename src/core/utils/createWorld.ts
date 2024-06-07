import { addWorldRecursive } from "@/lib/multiplayer-world/utils/common"
import { World, WorldOptions } from "@/lib/multiplayer-world/world"

export function createWorld<
	WorldClass extends typeof World,
	CreateOptions extends Parameters<InstanceType<WorldClass>["init"]>[0]
>(
	worldClass: WorldClass,
	options: CreateOptions &
		WorldOptions & {
			autoStart?: boolean
		}
): InstanceType<WorldClass> {
	const autoStart = options.autoStart ?? true

	// @ts-ignore
	const world = new worldClass(options) as World
	addWorldRecursive(world, world)

	// FOLLOW PATTERN CREATE SCHEMA AT WORLD.addEntityById

	const afterPrepare = () => {
		world.init({})
		if (autoStart) {
			setTimeout(() => {
				world.start()
				console.log("start")
			}, 1000)
		}
	}

	if (options.mode === "client" || options.mode === "both") {
		world
			.prepare(options)
			.then(() => {
				afterPrepare()
			})
			.catch((e) => {
				console.error(
					`Error while preparing world ${world.constructor.name}:`,
					e
				)
			})
	} else {
		// server only
		afterPrepare()
	}

	if (options.mode === "server") {
		world.setupClientRPC(options.room)
	} else if (options.mode === "client") {
		world.setupServerRPC(options.room).catch((e) => {
			console.error(
				`Error while setting up RPC for world ${world.constructor.name}:`,
				e
			)
		})
	}

	// @ts-ignore
	globalThis.world = world
	return world as InstanceType<WorldClass>
}
