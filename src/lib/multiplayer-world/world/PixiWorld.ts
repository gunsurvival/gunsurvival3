import { Application } from "pixi.js"
import { CasualWorld } from "./CasualWorld"
import { Delayed } from "colyseus"
import { Viewport } from "pixi-viewport"
import { Camera } from "../utils/Camera"

export class PixiWorld extends CasualWorld {
	app = this.clientOnly(() => new Application())
	viewport!: Viewport
	camera!: Camera

	async prepare(options: Parameters<this["init"]>[0]): Promise<void> {
		await this.app.init({
			antialias: true,
			width: window.innerWidth,
			height: window.innerHeight,
			resizeTo: window,
		})
		// @ts-ignore
		globalThis.__PIXI_APP__ = this.app
		this.viewport = new Viewport({
			events: this.app.renderer.events,
			passiveWheel: false,
			stopPropagation: true,
		})
		this.camera = new Camera(this.viewport)
		this.app.stage.addChild(this.viewport)

		const gameRoot = document.getElementById("game-root")
		if (gameRoot) {
			gameRoot.innerHTML = ""
			gameRoot.appendChild(this.app.canvas)
		} else {
			throw new Error("node game-root not found!")
		}
	}

	start() {
		const nextTick = this.nextTick.bind(this)
		const internal: {
			accumulator: number
			elapsedMs: number
			targetDelta: number
			elapseTick: number
		} = {
			accumulator: 0,
			elapsedMs: 0,
			targetDelta: 1000 / 60,
			elapseTick: 0,
		}

		const tickerCallback = () => {
			const deltaMS = this.app.ticker.deltaMS
			internal.accumulator += deltaMS
			while (internal.accumulator >= internal.targetDelta) {
				internal.elapseTick++
				internal.accumulator -= internal.targetDelta
				this.camera.nextTick(this.app.ticker.deltaTime)
				nextTick(this.app.ticker.deltaTime)
			}
		}

		let delayed: Delayed | undefined

		if (this.isClient) {
			this.app.ticker.add(tickerCallback)
			// this.app.ticker.add((ticker) => {
			// 	this.camera.nextTick(ticker.deltaTime)
			// 	nextTick(ticker.deltaTime)
			// })
			// setInterval(() => {
			// 	nextTick(1000 / 60)
			// }, 1000 / 20)
		} else if (this.isServerOnly()) {
			delayed = this.room.clock.setInterval(() => {
				const deltaMS = this.room.clock.deltaTime
				internal.accumulator += deltaMS
				while (internal.accumulator >= internal.targetDelta) {
					internal.elapseTick++
					internal.accumulator -= internal.targetDelta
					// console.time("nextTick")
					nextTick(1000 / 60)
					// console.timeEnd("nextTick")
				}
			}, 1000 / 60)
		}

		return () => {
			if (this.isClient) {
				this.app.ticker.remove(tickerCallback)
			} else if (this.isServerOnly()) {
				delayed?.clear()
			}
		}
	}
}
