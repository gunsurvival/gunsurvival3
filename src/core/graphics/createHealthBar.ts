import { Container, Graphics } from "pixi.js"
import { lerp } from "../utils/common"
import anime from "animejs"

export function createHealthBar({
	width,
	height,
	borderWeight,
	round,
	lowPercent,
}: {
	width: number
	height: number
	borderWeight: number
	round: number
	lowPercent?: number
}) {
	lowPercent = lowPercent || 0.3
	let healthPercent = 1
	let isDestroyed = false
	const container = new Container()
	const healthBarFrame = new Graphics()
	const healthBar = new Graphics()

	healthBarFrame.roundRect(0, 0, width, height, round).stroke({
		width: borderWeight,
		color: "red",
	})

	const update = () => {
		if (isDestroyed) return
		healthBar.width = lerp(healthBar.width, width * healthPercent, 0.07)
	}

	const draw = () => {
		if (isDestroyed) return
		healthBar.clear()
		healthBar.rect(0, 0, width * healthPercent, height).fill("red")
	}

	const setHealth = (percent: number) => {
		if (isDestroyed) return
		if (percent === healthPercent) return
		healthPercent = percent
		if (healthPercent < 0) healthPercent = 0
		if (healthPercent < lowPercent) {
			anime.remove(healthBar)
			anime({
				targets: healthBar,
				alpha: 0.4,
				duration: 500,
				loop: true,
				direction: "alternate",
				easing: "easeInOutSine",
			})
		} else {
			anime.remove(healthBar)
			healthBar.alpha = 1
		}
	}

	const destroy = () => {
		if (isDestroyed) return
		isDestroyed = true
		container.destroy()
	}

	draw()
	container.addChild(healthBarFrame, healthBar)
	return {
		container,
		update,
		draw,
		setHealth,
		destroy,
		isDestroyed: () => {
			return isDestroyed
		},
	}
}
