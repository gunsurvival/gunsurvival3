export function lerp(start: number, end: number, alpha: number) {
	return start * (1 - alpha) + end * alpha
}

export function lerpAngle(start: number, end: number, amt: number) {
	start %= 2 * Math.PI
	const alpha = start
	const beta = end
	const rotates = [
		// Tất cả trường hợp quay
		{
			result: Math.abs(alpha - beta),
			beta,
		},
		{
			result: Math.abs(alpha - (beta + 2 * Math.PI)),
			beta: beta + 2 * Math.PI,
		},
		{
			result: Math.abs(alpha - (beta - 2 * Math.PI)),
			beta: beta - 2 * Math.PI,
		},
	]
	rotates.sort((a, b) => a.result - b.result)
	return lerp(start, rotates[0].beta, amt) // Lấy giá trị nhỏ nhất của góc quay
}
