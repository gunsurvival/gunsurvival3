import type * as Entities from "./entity"

const layer: Array<string> = [
	"background",
	"Bullet",
	"Gunner",
	"GunnerBot",
	"Spider",
	"Wolf",
	"Rock",
	"Bush",
]

export function getZIndexByName(name: string) {
	return layer.indexOf(name as keyof typeof Entities)
}
