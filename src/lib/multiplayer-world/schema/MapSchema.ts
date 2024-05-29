import { MapSchema as ColyMapSchema } from "@colyseus/schema"

import { addWorldRecursive, isSchemaType } from "../utils/common"
import type { World } from "../World"

export class MapSchema<T = any> extends ColyMapSchema<T> {
	___: {
		world: World
	} = {} as any

	set(key: string, value: T): this {
		if (isSchemaType(value)) {
			addWorldRecursive(value, this.___.world)
		}

		return super.set(key, value)
	}
}
