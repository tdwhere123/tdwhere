import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "@/context/LangContext";
import { cubeProjects, type CubeStageId } from "./cube-data";
import {
	emptyCubeAnchor,
	type CubeScreenAnchor,
} from "./cube3d/cubeScreenAnchor";
import PlaneInk from "./cube3d/PlaneInk";
import HallAmbience from "./HallAmbience";
import { useExploration } from "./useExploration";
import { asset } from "@/lib/asset";

const MuseumCubeCanvas = lazy(() => import("./cube3d/MuseumCubeCanvas"));

function CubeCanvasPlaceholder({ className }: { className?: string }) {
	return (
		<div
			className={`${className ?? ""} flex items-center justify-center bg-[radial-gradient(ellipse_at_50%_42%,#f4f4f2_0%,#ececea_55%,#e2e2de_100%)]`}
			aria-hidden="true"
		>
			<div className="h-14 w-14 animate-pulse rounded-sm bg-museum-stone/70 shadow-sm" />
		</div>
	);
}

/**
 * Caption glued to the floor S-mark tip (screen-projected, world +Z).
 * NOTE: scripts/e2e-s-arrow.mjs hard-depends on data-testid="roll-s-label"
 * existing and tracking the tip. Keep the testid and the "S" text.
 */
function RollWayCaption({
	anchor,
	lang,
}: {
	anchor: CubeScreenAnchor;
	lang: "zh" | "en";
}) {
	return (
		<div
			className="pointer-events-none absolute z-[5] -translate-x-1/2 -translate-y-1/2"
			style={{
				left: `${anchor.rollHintX * 100}%`,
				top: `${anchor.rollHintY * 100}%`,
			}}
			aria-hidden="true"
			data-testid="roll-s-label"
		>
			<span className="font-hand text-[13px] leading-none tracking-[0.04em] text-museum-ink/60">
				{lang === "zh" ? "S · 此向滚" : "S · this way"}
			</span>
		</div>
	);
}

export default function DesktopCubeShowcase() {
	const { lang } = useLang();
	const { progress, litCount, markSeen, markMechanism } = useExploration();
	const [activeId, setActiveId] = useState<CubeStageId>("home");
	const [writeKey, setWriteKey] = useState(0);
	const [anchor, setAnchor] = useState<CubeScreenAnchor>(() =>
		emptyCubeAnchor(),
	);
	const [inkAnchor, setInkAnchor] = useState<CubeScreenAnchor>(() =>
		emptyCubeAnchor(),
	);
	const activeIdRef = useRef<CubeStageId>("home");
	const pendingFaceRef = useRef<CubeStageId | null>(null);
	const hasInkAnchorRef = useRef(false);
	const latestAnchorRef = useRef<CubeScreenAnchor>(emptyCubeAnchor());

	const project =
		cubeProjects.find((p) => p.id === activeId) ?? cubeProjects[0];

	// Warm every catalogued face JPEG as early as possible (tiny vs old PNGs).
	useEffect(() => {
		const links: HTMLLinkElement[] = [];
		for (const { face } of cubeProjects) {
			const link = document.createElement("link");
			link.rel = "preload";
			link.as = "image";
			link.href = asset(`cube/faces/${face}.jpg`);
			document.head.appendChild(link);
			links.push(link);
		}
		return () => links.forEach((l) => l.remove());
	}, []);

	const onFaceChange = useCallback((id: CubeStageId) => {
		if (id === activeIdRef.current) return;
		pendingFaceRef.current = id;
	}, []);

	const onAnchor = useCallback((nextAnchor: CubeScreenAnchor) => {
		latestAnchorRef.current = nextAnchor;
		setAnchor(nextAnchor);

		const pendingId = pendingFaceRef.current;
		if (!hasInkAnchorRef.current || pendingId) {
			hasInkAnchorRef.current = true;
			setInkAnchor(nextAnchor);
		}
		if (!pendingId) return;

		pendingFaceRef.current = null;
		activeIdRef.current = pendingId;
		setActiveId(pendingId);
		setWriteKey((key) => key + 1);
	}, []);

	useEffect(() => {
		let frame = 0;
		const syncInkAnchor = () => {
			window.cancelAnimationFrame(frame);
			frame = window.requestAnimationFrame(() => {
				if (hasInkAnchorRef.current) setInkAnchor(latestAnchorRef.current);
			});
		};
		window.addEventListener("resize", syncInkAnchor);
		return () => {
			window.cancelAnimationFrame(frame);
			window.removeEventListener("resize", syncInkAnchor);
		};
	}, []);

		useEffect(() => {
			const t = window.setTimeout(() => markSeen(activeId), 1400);
			return () => window.clearTimeout(t);
		}, [activeId, markSeen]);

		const onInkExpand = useCallback(() => {
			markMechanism(activeId);
		}, [activeId, markMechanism]);

		return (
			<div className="relative min-h-[100svh] w-full touch-pan-y">
				<HallAmbience
					activeId={activeId}
					progress={progress}
					litCount={litCount}
				/>

				<Suspense
					fallback={
						<CubeCanvasPlaceholder className="absolute inset-0 z-[1] h-[100svh] w-full" />
					}
				>
					<MuseumCubeCanvas
						className="absolute inset-0 z-[1] h-[100svh] w-full"
						enabled
						ariaLabel={
							lang === "zh"
								? "3D 项目立方体。点击后可用方向键或 W、A、S、D 翻面。"
								: "3D project cube. Click to focus, then use arrow keys or W, A, S, and D to roll it."
						}
						onFaceChange={onFaceChange}
						onAnchor={onAnchor}
					/>
				</Suspense>

				<RollWayCaption anchor={anchor} lang={lang} />

				<PlaneInk
					project={project}
					lang={lang}
					anchor={inkAnchor}
					writeKey={`${activeId}-${writeKey}`}
					onExpand={onInkExpand}
				/>

			<div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-2 px-6 text-center">
				<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-museum-muted">
					{lang === "zh"
						? "点击聚焦 · 方向键翻面 · 拖拽转视角 · 点击手写字"
						: "Click to focus · arrows roll · drag to orbit · click the ink"}
				</p>
			</div>
		</div>
	);
}
