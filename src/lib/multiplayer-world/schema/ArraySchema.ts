import { ArraySchema as ColyArraySchema } from "@colyseus/schema"

import { addWorldRecursive } from "../utils/common"
import type { World } from "../world/World"
import { Schema } from "./Schema"

export class ArraySchema<T = any> extends ColyArraySchema<T> {
	___: {
		world: World
	} = {} as any

	push(...values: T[]): number {
		values.forEach((value) => {
			if (value instanceof Schema) {
				addWorldRecursive(value, this.___.world)
			}
		})
		return super.push(...values)
	}
}
