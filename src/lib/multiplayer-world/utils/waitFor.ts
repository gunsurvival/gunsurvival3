export type WaitForOptions = {
	/**
	 * A description of what the function is waiting for.
	 * This will be included in the error message if a timeout occurs.
	 */
	waitForWhat: string

	/**
	 * The interval (in milliseconds) at which the function will be repeatedly called.
	 * Default value is 200ms.
	 */
	intervalMs?: number

	/**
	 * The maximum amount of time (in milliseconds) to wait for the function to return a truthy value.
	 * If not specified, the function will continue to be called until a truthy value is returned.
	 */
	timeoutMs?: number

	/**
	 * Whether to call the function immediately before starting the interval.
	 * Default value is false.
	 */
	immediate?: boolean

	/**
	 * Whether to skip throwing an error if the function throws an exception.
	 * Default value is false.
	 */
	skipTestThrow?: boolean

	/**
	 * Whether to skip throwing an error if a timeout occurs.
	 * Default value is false.
	 */
	skipTimeoutThrow?: boolean
}

export async function waitFor<
	Func extends () => any,
	Options extends WaitForOptions,
	Return extends Options extends { skipTimeoutThrow: true }
		? Truthy<Awaited<ReturnType<Func>>> | undefined
		: Truthy<Awaited<ReturnType<Func>>>
>(func: Func, options: Options & WaitForOptions): Promise<Return> {
	const error = new Error(
		`waitFor "${options.waitForWhat}" failed: timeout ${options.timeoutMs}ms!`
	)
	let interval: ReturnType<typeof setInterval>
	let timeout: ReturnType<typeof setTimeout> | undefined

	const defaultOptions = {
		intervalMs: 200,
		immediate: false,
		skipTestThrow: false,
		skipTimeoutThrow: false,
	}
	options = Object.assign(defaultOptions, options)

	return new Promise<Return>((resolve, reject) => {
		const amogus = async () => {
			try {
				const test = await func()
				if (test) {
					resolve(test as Return)
				}
			} catch (e) {
				if (options.skipTestThrow) {
					return
				}

				if (e instanceof Error) {
					reject(
						new Error(`waitFor "${options.waitForWhat}" failed: ${e.message}`)
					)
				} else {
					reject(e)
				}
			}
		}

		interval = setInterval(() => {
			amogus().catch(() => {})
		}, options.intervalMs ?? defaultOptions.intervalMs)

		if (options.timeoutMs) {
			timeout = setTimeout(() => {
				if (options.skipTimeoutThrow) {
					resolve(undefined as Return)
				} else {
					reject(error)
				}
			}, options.timeoutMs)
		}

		if (options.immediate) {
			amogus().catch(() => {})
		}
	}).finally(() => {
		clearInterval(interval)
		clearTimeout(timeout)
	})
}

export type Truthy<T> = T extends null | undefined | false | "" | 0 | never
	? never
	: T
