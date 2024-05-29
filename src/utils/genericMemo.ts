import { memo } from "react"

export const genericMemo: <T>(component: T) => T = memo
// export function genericMemo<T>(component: T): T {
// 	// Wrap the component with memoization logic
// 	// @ts-ignore
// 	const memoizedComponent = memo(component)
// 	return memoizedComponent as T
// }
