/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	swcMinify: false,
	experimental: {
		serverMinification: false,
		swcMinify: false,
	},
	env: {
		DOMAIN: process.env.DOMAIN,
		WS_PORT: process.env.WS_PORT,
	},
}

export default nextConfig
