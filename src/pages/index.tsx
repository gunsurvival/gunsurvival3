import dynamic from "next/dynamic"
import Image from "next/image"
import { Inter } from "next/font/google"
import { GameContainer } from "@/components/GameContainer"

const inter = Inter({ subsets: ["latin"] })

function Home() {
	return (
		<div>
			<GameContainer />
		</div>
	)
}

export default dynamic(() => Promise.resolve(Home), { ssr: false })
