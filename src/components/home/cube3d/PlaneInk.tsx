import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { Lang } from "@/context/LangContext";
import type { CubeProject } from "../cube-data";
import type { CubeScreenAnchor, CubeScreenRect } from "./cubeScreenAnchor";
import { cn } from "@/lib/utils";
import { ZEN } from "@/lib/motion";


type Phase = "title" | "erasing" | "body";

	type Props = {
		project: CubeProject;
		lang: Lang;
		anchor: CubeScreenAnchor;
		writeKey: string;
		/** Fired when the visitor triggers the face's mechanism (ink title → exhibit note). */
		onExpand?: () => void;
	};

const ERASE_MS = 420;

/** Viewport edge padding as a fraction of width/height. */
const EDGE = 0.045;

function clamp(n: number, min: number, max: number) {
	return Math.min(max, Math.max(min, n));
}

/**
 * Measured AABB pads cobalt / perspective; light inset so gap is vs visible mass.
 */
function layoutCube(cube: CubeScreenRect, insetFrac = 0.06): CubeScreenRect {
	const dx = cube.width * insetFrac;
	const dy = cube.height * insetFrac;
	return {
		left: cube.left + dx,
		right: cube.right - dx,
		top: cube.top + dy,
		bottom: cube.bottom - dy,
		cx: cube.cx,
		cy: cube.cy,
		width: Math.max(0.08, cube.width - 2 * dx),
		height: Math.max(0.08, cube.height - 2 * dy),
	};
}

/** Layout ink at the cube’s lower-right corner. */
function layoutFromCube(
	cubeIn: CubeScreenRect,
	_side: "left" | "right",
	mode: "title" | "body",
) {
	const cube = layoutCube(cubeIn);
	const useRight = true;

	// Gap first — don’t let a wide column eat the clearance.
	const gap = 0.032;
	const leftFrac = clamp(cube.right + gap, EDGE, 0.72);
	const maxWidthFromEdge = Math.max(0.18, 1 - EDGE - leftFrac);
	const widthFrac = clamp(
		mode === "body" ? maxWidthFromEdge : Math.min(maxWidthFromEdge, 0.36),
		0.2,
		mode === "body" ? 0.38 : 0.34,
	);

	const titlePx = clamp(Math.round(widthFrac * 100 * 1.35), 36, 58);

	// Bottom-align to the cube’s lower edge; block grows upward.
	const bottomFrac = clamp(1 - cube.bottom - 0.01, 0.14, 0.42);

	return {
		top: "auto" as const,
		bottom: `${bottomFrac * 100}%`,
		left: `${leftFrac * 100}%`,
		right: "auto" as const,
		width: `${widthFrac * 100}%`,
		maxWidth: `min(${Math.round(widthFrac * 1300)}px, 460px)`,
		titlePx,
		useRight,
	};
}

export default function PlaneInk(props: Props) {
	return <PlaneInkPanel key={props.writeKey} {...props} />;
}

	function PlaneInkPanel({
		project,
		lang,
		anchor,
		writeKey,
		onExpand,
	}: Props) {
		const navigate = useNavigate();
		const [phase, setPhase] = useState<Phase>("title");

		const statement = lang === "zh" ? project.statementZh : project.statementEn;
		const description =
			lang === "zh" ? project.descriptionZh : project.descriptionEn;

		const hint =
			lang === "zh"
				? phase === "title"
					? "点击名称 · 展开介绍"
					: phase === "erasing"
						? "墨迹擦除中…"
						: project.route
							? "再点一次 · 进入项目"
							: project.github
								? "再点一次 · 打开 GitHub"
								: "翻面继续逛"
				: phase === "title"
					? "Click the name · expand"
					: phase === "erasing"
						? "Erasing…"
						: project.route
							? "Click again · open project"
							: project.github
								? "Click again · open GitHub"
								: "Roll to keep exploring";

		useEffect(() => {
			if (phase !== "erasing") return;
			const t = window.setTimeout(() => setPhase("body"), ERASE_MS);
			return () => {
				window.clearTimeout(t);
			};
		}, [phase]);

	const onActivate = () => {
		if (phase === "erasing") return;
		if (phase === "title") {
			onExpand?.();
			setPhase("erasing");
			return;
		}
		if (project.route) {
			navigate(project.route);
			return;
		}
		if (project.github) {
			window.open(project.github, "_blank", "noreferrer");
		}
	};

	const isBody = phase === "body";

	const layout = useMemo(
		() => layoutFromCube(anchor.cube, "right", isBody ? "body" : "title"),
		[anchor.cube, isBody],
	);

	const panelStyle = useMemo(
		() => ({
			top: layout.top,
			bottom: layout.bottom,
			left: layout.left,
			right: layout.right,
			width: layout.width,
			maxWidth: layout.maxWidth,
		}),
		[layout],
	);

	return (
		<div
			className={cn(
				"pointer-events-none absolute z-10 overflow-visible",
				isBody && "z-[12]",
			)}
			style={panelStyle}
			data-testid="plane-ink"
			data-cube-left={anchor.cube.left.toFixed(3)}
			data-cube-right={anchor.cube.right.toFixed(3)}
		>
			<button
				type="button"
				onClick={onActivate}
				data-cursor="hover"
				disabled={phase === "erasing"}
				className="pointer-events-auto block w-full max-w-full cursor-pointer overflow-visible text-left disabled:cursor-wait"
				aria-label={hint}
			>
				<AnimatePresence mode="wait">
					{(phase === "title" || phase === "erasing") && (
						<motion.div
							key={`${writeKey}-title`}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0, transition: { duration: 0.15 } }}
							transition={{ duration: 0.25 }}
							className="overflow-visible"
						>
							<p
								className={cn(
									"plane-ink-title font-hand font-normal leading-[1.2] text-museum-ink",
									phase === "erasing" && "plane-ink-erase",
								)}
								style={{ fontSize: `${layout.titlePx}px` }}
							>
								<span className="plane-ink-write">{project.title}</span>
							</p>
							{phase === "title" && (
								<p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-museum-muted/80">
									{hint}
								</p>
							)}
						</motion.div>
					)}

					{phase === "body" && (
						<motion.div
							key={`${writeKey}-body`}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.45, ease: ZEN }}
							className="space-y-3 overflow-visible"
						>
							<p
								className="font-hand leading-[1.15] text-museum-ink"
								style={{ fontSize: `${Math.max(32, layout.titlePx - 2)}px` }}
							>
								{project.title}
							</p>
							<p className="plane-ink-body font-display text-[clamp(17px,1.7vw,22px)] leading-relaxed text-ink-2">
								{statement}
							</p>
							<p className="plane-ink-body font-display text-[15px] leading-relaxed text-museum-muted md:text-[17px]">
								{description}
							</p>
							<p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-museum-muted/80">
								{hint}
							</p>
						</motion.div>
					)}
				</AnimatePresence>
			</button>
		</div>
	);
}
