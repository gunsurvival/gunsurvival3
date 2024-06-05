export {}

declare global {
	interface Window {
		// Below just informs IDE and/or TS-compiler (it's set in `.js` file).
		isSync: boolean
	}
}
