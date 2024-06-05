import type * as Entities from "./entity"

const layer: Array<keyof typeof Entities> = [
	"Bullet",
	"Gunner",
	"GunnerBot",
	"Rock",
	"Bush",
]

export function getZIndexByName(name: string) {
	return layer.indexOf(name as keyof typeof Entities)
}