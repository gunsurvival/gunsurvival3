import { ArraySchema, MapSchema, Schema } from "../schema"
import { World } from "../World"
import { waitFor } from "./waitFor"

export const reservedKeys = ["id", "world", "___"]

export function isSchemaType(value: any): value is SchemaType {
	return (
		value instanceof Schema ||
		value instanceof MapSchema ||
		value instanceof ArraySchema
	)
}

export function findSchemaRecursive(
	schema: SchemaType,
	result: SchemaType[] = [],
	skipRoot = false
): SchemaType[] {
	if (!skipRoot) {
		if (
			schema instanceof Schema ||
			schema instanceof MapSchema ||
			schema instanceof ArraySchema
		) {
			result.push(schema)
		}
	}

	if (schema instanceof Schema) {
		// @ts-ignore
		Object.keys(schema.constructor._definition.schema)
			.filter((key) => !reservedKeys.includes(key))
			.forEach((childField) => {
				// @ts-ignore
				findSchemaRecursive(schema[childField], result)
			})
	}

	if (schema instanceof MapSchema) {
		;(schema as MapSchema<Schema>).forEach((mapItem) => {
			findSchemaRecursive(mapItem, result)
		})
	}

	if (schema instanceof ArraySchema) {
		;(schema as ArraySchema<any>).forEach((arrayItem) => {
			findSchemaRecursive(arrayItem, result)
		})
	}

	return result
}

export function findStateRecursive(
	state: any,
	result: any[] = [],
	skipRoot = false
) {
	if (!skipRoot) {
		if (state instanceof Schema) {
			result.push(state)
		}
	}

	if (state instanceof MapSchema || state instanceof ArraySchema) {
		state.forEach((value, key) => {
			findStateRecursive(value, result)
		})
	} else if (typeof state === "object") {
		Object.keys(state).forEach((key) => {
			if (reservedKeys.includes(key)) {
				return
			}

			findStateRecursive(state[key], result)
		})
	}

	return result
}

export function addWorldRecursive(schema: SchemaType, world: World) {
	const schemas = findSchemaRecursive(schema, [])

	schemas.forEach((schema) => {
		schema.___.world = world
	})
}

export function pairClientServer(
	clientObject: any,
	serverObject: any,
	holderMap: Map<string, Schema>
) {
	setTimeout(() => {
		// wait to see if any max exceed error
		if (clientObject instanceof MapSchema) {
			;(serverObject as MapSchema).onAdd((item, key) => {
				waitFor(() => clientObject.has(key), {
					waitForWhat: `clientObject#${clientObject?.constructor?.name}.has(${key})`,
					timeoutMs: 5000,
				})
					.then(() => {
						// TODO: should implement onAdd for clientObject for O(1)
						pairClientServer(clientObject.get(key), item, holderMap)
					})
					.catch(console.error)
			})
			clientObject.forEach((value, key) => {
				pairClientServer(value, serverObject.get(key), holderMap)
			})
		} else if (clientObject instanceof ArraySchema) {
			;(serverObject as ArraySchema).onAdd((item, index) => {
				waitFor(() => clientObject[index], {
					waitForWhat: `clientObject#${clientObject?.constructor?.name}[${index}]`,
					timeoutMs: 5000,
				})
					.then(() => {
						pairClientServer(clientObject[index], item, holderMap)
					})
					.catch(console.error)
			})

			clientObject.forEach((value, index) => {
				pairClientServer(value, serverObject[index], holderMap)
			})
		} else if (clientObject instanceof Schema) {
			Object.keys(clientObject)
				.filter((k) => !reservedKeys.includes(k))
				.forEach((key) => {
					// @ts-ignore
					pairClientServer(clientObject[key], serverObject[key], holderMap)
				})
		} else if (typeof clientObject === "object") {
			Object.keys(clientObject)
				.filter((k) => !reservedKeys.includes(k))
				.forEach((key) => {
					pairClientServer(clientObject[key], serverObject[key], holderMap)
				})
		}

		if (clientObject?.id && serverObject?.id) {
			holderMap.set(serverObject.id, clientObject)
			;(serverObject as Schema).listen("id", (value) => {
				clientObject.id = value
			})
		}
	})
}

export type SchemaType = Schema | MapSchema | ArraySchema
export type MethodKeys<T> = {
	[K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]
