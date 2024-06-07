/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	swcMinify: false,
	experimental: {
		serverMinification: false,
		swcMinify: false,
	},
}

export default nextConfig
