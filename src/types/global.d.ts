export {}

declare global {
	interface Window {
		// Below just informs IDE and/or TS-compiler (it's set in `.js` file).
		isSync: boolean
	}

	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: "development" | "production"
			DOMAIN: string
			WS_PORT: string
		}
	}
}
