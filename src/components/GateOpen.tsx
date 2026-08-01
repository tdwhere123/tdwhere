import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ZEN } from "@/lib/motion";


/**
 * 门开 Gate Open — two vertical lines slide apart (0.7s, stagger 0.08s)
 * over the entering block; children should ink-reveal right after.
 * Shared by do-it and Write-Right heroes; do-it passes cobalt lineClassName.
 */
export default function GateOpen({
	children,
	className,
	lineClassName = "bg-ink/35",
}: {
	children: ReactNode;
	className?: string;
	lineClassName?: string;
}) {
	return (
		<div className={cn("relative", className)}>
			{children}
			<motion.span
				aria-hidden="true"
				className={cn(
					"pointer-events-none absolute left-1/2 top-2 h-[calc(100%-1rem)] w-px",
					lineClassName,
				)}
				initial={{ x: 0, opacity: 1 }}
				animate={{ x: -56, opacity: 0 }}
				transition={{ duration: 0.7, ease: ZEN }}
			/>
			<motion.span
				aria-hidden="true"
				className={cn(
					"pointer-events-none absolute left-1/2 top-2 h-[calc(100%-1rem)] w-px",
					lineClassName,
				)}
				initial={{ x: 0, opacity: 1 }}
				animate={{ x: 56, opacity: 0 }}
				transition={{ duration: 0.7, ease: ZEN, delay: 0.08 }}
			/>
		</div>
	);
}
