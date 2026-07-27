import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/context/LangContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cubeProjects, cubeRotations, type CubeStageId } from "./cube-data";
import MuseumCubeCanvas from "./cube3d/MuseumCubeCanvas";
import {
	emptyCubeAnchor,
	type CubeScreenAnchor,
} from "./cube3d/cubeScreenAnchor";
import PlaneInk from "./cube3d/PlaneInk";
import HallAmbience from "./HallAmbience";
import { useExploration } from "./useExploration";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";

function SwipeHintMark({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="28"
			height="16"
			viewBox="0 0 28 16"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M2 8h18M5 5l-3 3 3 3M26 8H8M23 5l3 3-3 3"
				stroke="var(--museum-brass)"
				strokeWidth="1"
				strokeLinecap="round"
				strokeLinejoin="round"
				opacity="0.7"
			/>
		</svg>
	);
}

function ProjectExternalLink({
	href,
	className,
	children,
}: {
	href: string;
	className: string;
	children: ReactNode;
}) {
	return (
		<a href={href} target="_blank" rel="noreferrer" className={className}>
			{children}
		</a>
	);
}

function MobileCubeShowcase() {
	const { lang } = useLang();
	const { progress, litCount, isLit, markSeen, markMechanism } =
		useExploration();
	const [activeIndex, setActiveIndex] = useState(0);
	const [hasSwiped, setHasSwiped] = useState(false);
	const [pulseId, setPulseId] = useState<CubeStageId | null>(null);
	const scrollerRef = useRef<HTMLDivElement>(null);
	const slideRefs = useRef<(HTMLElement | null)[]>([]);

	useEffect(() => {
		const root = scrollerRef.current;
		if (!root) return;

		const observers: IntersectionObserver[] = [];
		slideRefs.current.forEach((el, index) => {
			if (!el) return;
			const io = new IntersectionObserver(
				([entry]) => {
					if (entry.isIntersecting) setActiveIndex(index);
				},
				{ root, threshold: 0.55 },
			);
			io.observe(el);
			observers.push(io);
		});
		return () => observers.forEach((o) => o.disconnect());
	}, []);

	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;
		const onScroll = () => {
			if (el.scrollLeft > 8) setHasSwiped(true);
		};
		el.addEventListener("scroll", onScroll, { passive: true });
		return () => el.removeEventListener("scroll", onScroll);
	}, []);

	const scrollToSlide = useCallback((index: number) => {
		slideRefs.current[index]?.scrollIntoView({
			behavior: "smooth",
			inline: "center",
			block: "nearest",
		});
	}, []);

	// Dwelling on a slide lights the hall; tapping the art triggers its mechanism.
	const activeProject = cubeProjects[activeIndex];
	useEffect(() => {
		const t = window.setTimeout(() => markSeen(activeProject.id), 900);
		return () => window.clearTimeout(t);
	}, [activeProject.id, markSeen]);

	const onArtTap = useCallback(
		(id: CubeStageId) => {
			markMechanism(id);
			setPulseId(id);
			window.setTimeout(() => setPulseId((p) => (p === id ? null : p)), 750);
		},
		[markMechanism],
	);

	return (
		<div className="relative h-[100svh] w-full overflow-hidden">
			<HallAmbience
				activeId={activeProject.id}
				progress={progress}
				litCount={litCount}
			/>
			<div
				ref={scrollerRef}
				data-lenis-prevent-touch
				className={cn(
					"relative z-[1] flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden",
					"touch-pan-x overscroll-x-contain overscroll-y-none",
					"[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
				)}
				aria-label={lang === "zh" ? "项目立方体面" : "Project cube faces"}
			>
				{cubeProjects.map((project, index) => {
					const rot = cubeRotations[project.id];
					const category =
						lang === "zh" ? project.categoryZh : project.categoryEn;
					const statement =
						lang === "zh" ? project.statementZh : project.statementEn;
					const description =
						lang === "zh" ? project.descriptionZh : project.descriptionEn;
					const cta = lang === "zh" ? project.ctaZh : project.ctaEn;
					const homeSwipeCta = lang === "zh" ? "左右滑动翻面" : "SWIPE TO ROLL";

					return (
						<section
							key={project.id}
							ref={(el) => {
								slideRefs.current[index] = el;
							}}
							className="flex h-full w-full min-w-full shrink-0 snap-center flex-col justify-center px-10 py-14"
							aria-current={index === activeIndex ? "true" : undefined}
						>
							<div className="mx-auto w-full max-w-[min(300px,78vw)]">
								<p className="font-mono text-[11px] uppercase tracking-[0.16em] text-museum-muted">
									{project.shortName} · {category}
								</p>
								<h2 className="mt-2 font-serif text-[26px] font-semibold leading-[1.15] text-museum-ink">
									{project.title}
								</h2>

								<div className="relative mx-auto mt-3 w-full">
									<button
										type="button"
										onClick={() => onArtTap(project.id)}
										aria-label={
											lang === "zh"
												? `触发 ${project.shortName} 的机关`
												: `Trigger the ${project.shortName} mechanism`
										}
										data-cursor="hover"
										className={cn(
											"relative block w-full transition-transform duration-500 ease-zen",
											pulseId === project.id && "cube-face-pulse",
										)}
										style={{
											transform: `perspective(900px) rotateY(${index === activeIndex ? rot.rotateY * 0.05 : 8}deg)`,
										}}
									>
										<div className="relative aspect-square overflow-hidden bg-[#d6cdc0]">
											<div
												className={cn(
													"cube-face__content",
													(project.fill ?? "rect") === "circle" &&
														"cube-face__content--circle",
												)}
												style={
													{
														"--face-fill-scale":
															project.fillScale ??
															((project.fill ?? "rect") === "circle"
																? 1.42
																: 1.14),
													} as CSSProperties
												}
											>
												<img src={project.image} alt={project.alt} />
											</div>
											<img
												src={asset("cube/shell.png")}
												alt=""
												aria-hidden="true"
												className="cube-face__shell"
												style={{ mixBlendMode: "multiply" }}
											/>
										</div>
									</button>
								</div>

								<p className="mt-5 font-serif text-[17px] leading-snug text-ink-2">
									{statement}
								</p>
								<p className="mt-3 text-[14px] leading-relaxed text-museum-muted">
									{description}
								</p>

								{project.tags.length > 0 && (
									<p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-museum-brass">
										{project.tags.join(" · ")}
									</p>
								)}

								<div className="mt-5 flex flex-wrap items-center gap-4">
									{project.id === "home" ? (
										<div className="flex items-center gap-3 text-museum-muted">
											<SwipeHintMark />
											<div className="font-mono text-[11px] uppercase tracking-[0.14em]">
												{homeSwipeCta}
											</div>
										</div>
									) : project.route ? (
										<>
											<Link
												to={project.route}
												className="font-mono text-xs uppercase tracking-[0.14em] text-museum-ink"
											>
												{cta} ↗
											</Link>
											{project.github && (
												<ProjectExternalLink
													href={project.github}
													className="font-mono text-xs uppercase tracking-[0.14em] text-museum-muted"
												>
													GITHUB ↗
												</ProjectExternalLink>
											)}
										</>
									) : project.github ? (
										<ProjectExternalLink
											href={project.github}
											className="font-mono text-xs uppercase tracking-[0.14em] text-museum-ink"
										>
											{cta} ↗
										</ProjectExternalLink>
									) : null}
								</div>
							</div>
						</section>
					);
				})}
			</div>

			<div
				className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-3"
				aria-hidden="true"
			>
				<div
					className={cn(
						"flex items-center gap-2 transition-opacity duration-500",
						hasSwiped ? "opacity-0" : "opacity-70",
					)}
				>
					<SwipeHintMark className="animate-pulse" />
					<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-museum-muted">
						{lang === "zh" ? "左右滑动" : "Swipe sideways"}
					</span>
				</div>

				<div className="pointer-events-auto flex items-center gap-2">
					{cubeProjects.map((project, index) => (
						<button
							key={project.id}
							type="button"
							aria-label={`${project.shortName} (${index + 1}/${cubeProjects.length})`}
							aria-current={index === activeIndex ? "true" : undefined}
							onClick={() => scrollToSlide(index)}
							className={cn(
								"h-2 rounded-full transition-all duration-300 ease-zen",
								index === activeIndex
									? "w-5 bg-museum-brass"
									: isLit(project.id)
										? "w-2 bg-museum-brass/50 hover:bg-museum-brass"
										: "w-2 bg-museum-line hover:bg-museum-muted",
							)}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function RollDownHint({
	anchor,
	lang,
}: {
	anchor: CubeScreenAnchor;
	lang: "zh" | "en";
}) {
	// Caption only — tracks the floor mark tip in screen space (world +Z).
	// The hand-ink arrow itself lives on the museum floor in the canvas.
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

function DesktopCubeShowcase() {
	const { lang } = useLang();
	const { progress, litCount, markSeen, markMechanism } = useExploration();
	const [activeId, setActiveId] = useState<CubeStageId>("home");
	const [writeKey, setWriteKey] = useState(0);
	const [inkLocked, setInkLocked] = useState(false);
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
		// Wait for the first anchor from the completed face before changing ink.
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

	// The canvas reports a live anchor for the orbit hint. Ink stays parked until
	// a face changes; only a viewport resize may remeasure that parked placement.
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

	const onInkLockChange = useCallback((locked: boolean) => {
		setInkLocked(locked);
	}, []);

	// Dwelling on a face lights the hall; expanding its ink triggers the mechanism.
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

			<MuseumCubeCanvas
				className="absolute inset-0 z-[1] h-[100svh] w-full"
				enabled
				locked={inkLocked}
				ariaLabel={
					lang === "zh"
						? "3D 项目立方体。点击后可用方向键或 W、A、S、D 翻面。"
						: "3D project cube. Click to focus, then use arrow keys or W, A, S, and D to roll it."
				}
				onFaceChange={onFaceChange}
				onAnchor={onAnchor}
			/>

			<RollDownHint anchor={anchor} lang={lang} />

			<PlaneInk
				project={project}
				lang={lang}
				anchor={inkAnchor}
				writeKey={`${activeId}-${writeKey}`}
				onLockChange={onInkLockChange}
				onExpand={onInkExpand}
			/>

			<p className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2 px-6 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-museum-muted">
				{lang === "zh"
					? "点击立方体后，用方向键 / 滚轮翻面 · 拖拽转视角 · 点击手写字"
					: "Click cube, then arrows / wheel roll · drag to orbit · click the ink"}
			</p>
		</div>
	);
}

export default function CubeShowcase() {
	const isMobile = useIsMobile();
	const isCoarsePointer = useMediaQuery("(pointer: coarse)");
	return isMobile || isCoarsePointer ? (
		<MobileCubeShowcase />
	) : (
		<DesktopCubeShowcase />
	);
}

export type { CubeStageId };
