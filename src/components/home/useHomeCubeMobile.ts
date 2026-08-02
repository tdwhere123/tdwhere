import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * True when the home cube should use the mobile/swipe experience —
 * narrow viewport OR coarse pointer (touch tablets ≥768px included).
 */
export function useHomeCubeMobile() {
	const isMobile = useIsMobile();
	const isCoarsePointer = useMediaQuery("(pointer: coarse)");
	return isMobile || isCoarsePointer;
}
