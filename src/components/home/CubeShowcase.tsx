import {
	Suspense,
	lazy,
	useCallback,
	useEffect,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/context/LangContext";
import { cubeProjects, cubeRotations, type CubeStageId } from "./cube-data";
import HallAmbience from "./HallAmbience";
import AssociativeField from "./field/AssociativeField";
import { useExploration } from "./useExploration";
import { useHomeCubeMobile } from "./useHomeCubeMobile";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";

const DesktopCubeShowcase = lazy(() => import("./DesktopCubeShowcase"));

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
				stroke="var(--cobalt)"
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

function DesktopFallback() {
	return (
		<div
			className="relative flex min-h-[100svh] w-full items-center justify-center bg-[radial-gradient(ellipse_at_50%_42%,#f6f2e9_0%,#efe9db_55%,#e6ddc9_100%)]"
			aria-hidden="true"
		>
			<div className="h-14 w-14 animate-pulse rounded-sm bg-museum-stone/70 shadow-sm" />
		</div>
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
			<AssociativeField
				variant="hero"
				className="pointer-events-none absolute inset-0 z-0 h-full w-full"
			/>
			{/* X-only scroller: keep overflow-y clipped so vertical pans scroll the page to coda. */}
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
								<h2 className="mt-2 font-display text-[26px] font-semibold leading-[1.15] text-museum-ink">
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
										<div className="relative aspect-square overflow-hidden bg-museum-stone">
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
												<img
													src={project.image}
													alt={project.alt}
													loading={index === 0 ? "eager" : "lazy"}
													decoding="async"
												/>
											</div>
											<img
												src={asset("cube/shell.png")}
												alt=""
												aria-hidden="true"
												className="cube-face__shell"
												style={{ mixBlendMode: "multiply" }}
												loading={index === 0 ? "eager" : "lazy"}
												decoding="async"
											/>
										</div>
									</button>
								</div>

								<p className="mt-5 font-display text-[17px] leading-snug text-ink-2">
									{statement}
								</p>
								<p className="mt-3 text-[14px] leading-relaxed text-museum-muted">
									{description}
								</p>

								{project.tags.length > 0 && (
									<p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-cobalt">
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
				className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex flex-col items-center gap-2.5"
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
									? "w-5 bg-cobalt"
									: isLit(project.id)
										? "w-2 bg-cobalt/50 hover:bg-cobalt"
										: "w-2 bg-museum-line hover:bg-museum-muted",
							)}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

export default function CubeShowcase() {
	const isCubeMobile = useHomeCubeMobile();
	return isCubeMobile ? (
		<MobileCubeShowcase />
	) : (
		<Suspense fallback={<DesktopFallback />}>
			<DesktopCubeShowcase />
		</Suspense>
	);
}

export type { CubeStageId };
