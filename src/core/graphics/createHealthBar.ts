import { Graphics } from "pixi.js"

export function createHealthBar({
	width,
	height,
	borderWeight,
}: {
	width: number
	height: number
	borderWeight: number
}) {
	const healthBar = new Graphics()
	healthBar
		.rect(-width / 2, -height / 2, width, height)
		.fill("red")
		.stroke({ width: borderWeight, color: "white" })
	return healthBar
}
