import { Application } from "pixi.js"
import { CasualWorld } from "./CasualWorld"
import { Delayed } from "colyseus"

export class PixiWorld extends CasualWorld {
	app = this.clientOnly(() => new Application())

	async prepare(options: Parameters<this["init"]>[0]): Promise<void> {
		await this.app.init({
			width: window.innerWidth,
			height: window.innerHeight,
			resizeTo: window,
		})
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
				nextTick(1000 / 60)
			}
		}

		let delayed: Delayed | undefined

		if (this.isClient) {
			this.app.ticker.add(tickerCallback)
		} else if (this.isServerOnly()) {
			delayed = this.room.clock.setInterval(() => {
				const deltaMS = this.room.clock.deltaTime
				internal.accumulator += deltaMS
				while (internal.accumulator >= internal.targetDelta) {
					internal.elapseTick++
					internal.accumulator -= internal.targetDelta
					nextTick(1000 / 60)
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
