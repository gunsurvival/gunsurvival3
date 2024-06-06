export class AsyncEE<Events extends EventsMap> {
	private readonly eventHandlers = new Map<string, DefaultHandler[]>()
	private readonly concurrent: boolean

	constructor({ concurrent = true }: { concurrent?: boolean } = {}) {
		this.concurrent = concurrent
	}

	addListener<Ev extends EventNames<Events>>(event: Ev, handler: Events[Ev]) {
		const eventHandlers = this.eventHandlers.get(event) ?? []
		eventHandlers.push(handler as DefaultHandler)
		this.eventHandlers.set(event, eventHandlers)
		return () => {
			this.removeListener(event, handler)
		}
	}

	removeListener<Ev extends EventNames<Events>>(
		event: Ev,
		handler: Events[Ev]
	) {
		const eventHandlers = this.eventHandlers.get(event)
		if (!eventHandlers) {
			return
		}

		const index = eventHandlers.indexOf(handler as DefaultHandler)
		if (index !== -1) {
			eventHandlers.splice(index, 1)
			if (eventHandlers.length === 0) {
				this.eventHandlers.delete(event)
			}
		}
	}

	once<Ev extends EventNames<Events>>(event: Ev, handler: Events[Ev]) {
		const onceHandler = async (...args: Parameters<Events[Ev]>) => {
			await handler(...args)
			this.removeListener(event, onceHandler as Events[Ev])
		}

		this.addListener(event, onceHandler as Events[Ev])
	}

	async emit<Ev extends EventNames<Events>>(
		event: Ev,
		...args: Parameters<Events[Ev]>
	) {
		const eventHandlers = (
			this.eventHandlers.get(event) ?? this.eventHandlers.get("*")
		)?.slice() // slice to prevent mutation while iterating (because we are running async)

		if (eventHandlers?.length) {
			if (this.concurrent) {
				return Promise.all(eventHandlers.map((handler) => handler(...args)))
			} else {
				for (const handler of eventHandlers) {
					// eslint-disable-next-line no-await-in-loop
					try {
						await handler(...args)
					} catch (e) {
						console.error(`Error in event handler for ${event}:`, e)
					}
				}
			}
		}
	}
}

export type DefaultHandler = EventHandler<any[]>

/**
 * An events map is an interface that maps event names to their value, which
 * represents the type of the `on` listener.
 */
export type EventsMap = {
	[key: string]: DefaultHandler
	"*": (message: string, ...args: any[]) => unknown
}

/**
 * Returns a union type containing all the keys of an event map.
 */
export type EventNames<Map extends EventsMap> = keyof Map & string

/** The tuple type representing the handler of an event listener */
export type EventHandler<Params extends any[]> = (...args: Params) => unknown
