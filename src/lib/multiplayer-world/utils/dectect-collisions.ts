import type { Body, Response } from "detect-collisions"
import type { Entity } from "../entity/Entity"

export function serializeResponse(
	response: ResponseBodyRefEntity
): SerializedResponse {
	const { a, b, ...serializedResponse } = response
	return serializedResponse
}

export type BodyRefEntity = Body & { entitiyRef: Entity }
export type ResponseBodyRefEntity = Omit<Response, "a" | "b"> & {
	a: BodyRefEntity
	b: BodyRefEntity
}
export type SerializedResponse = Omit<Response, "a" | "b" | "clear">
