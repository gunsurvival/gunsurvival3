import Image from "next/image"
import { Inter } from "next/font/google"
import { GameContainer } from "@/components/GameContainer"

const inter = Inter({ subsets: ["latin"] })

export default function Home() {
	return (
		<div>
			<GameContainer />
		</div>
	)
}
