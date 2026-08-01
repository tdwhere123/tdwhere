import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LangProvider } from "@/context/LangProvider";
import { ExplorationProvider } from "@/components/home/exploration";
import Layout from "@/components/Layout";
import Cursor from "@/components/Cursor";
import ErrorBoundary from "@/components/ErrorBoundary";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import {
	initSmoothScroll,
	scrollToTop,
	setSmoothScrollActive,
} from "@/lib/smooth-scroll";

const DoIt = lazy(() => import("@/pages/DoIt"));
const Alaya = lazy(() => import("@/pages/Alaya"));
const WriteRight = lazy(() => import("@/pages/WriteRight"));
const Playground = lazy(() => import("@/pages/Playground"));
const About = lazy(() => import("@/pages/About"));

function PageFallback() {
	return (
		<div className="flex min-h-[60vh] items-center justify-center">
			<span
				className="h-2 w-2 animate-pulse rounded-full bg-cobalt"
				aria-hidden="true"
			/>
			<span className="sr-only">Loading…</span>
		</div>
	);
}

function isHomePath(pathname: string) {
	return pathname === "/" || pathname === "";
}

function ScrollManager() {
	const { pathname } = useLocation();
	useEffect(() => {
		scrollToTop(true);
		// Home is short — native scroll; other pages keep Lenis smoothing.
		setSmoothScrollActive(!isHomePath(pathname));
		// let the new page paint before ScrollTrigger re-measures
		const id = window.setTimeout(() => ScrollTrigger.refresh(), 60);
		return () => window.clearTimeout(id);
	}, [pathname]);
	return null;
}

function deferUntilIdle(fn: () => void): () => void {
	const ric = window.requestIdleCallback?.bind(window);
	if (ric) {
		const id = ric(() => fn(), { timeout: 1200 });
		return () => window.cancelIdleCallback?.(id);
	}
	let cancelled = false;
	const timeoutId = window.setTimeout(() => {
		requestAnimationFrame(() => {
			if (!cancelled) fn();
		});
	}, 0);
	return () => {
		cancelled = true;
		window.clearTimeout(timeoutId);
	};
}

export default function App() {
	useEffect(() => {
		let cleanup: (() => void) | undefined;
		const cancelDefer = deferUntilIdle(() => {
			cleanup = initSmoothScroll();
		});
		return () => {
			cancelDefer();
			cleanup?.();
		};
	}, []);

	return (
		<LangProvider>
			<ExplorationProvider>
				<BrowserRouter
					basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}
				>
					<ScrollManager />
					<Cursor />
					<ErrorBoundary>
						<Suspense fallback={<PageFallback />}>
							<Routes>
								<Route element={<Layout />}>
									<Route index element={<Home />} />
									<Route path="do-it" element={<DoIt />} />
									<Route path="alaya" element={<Alaya />} />
									<Route path="write-right" element={<WriteRight />} />
									<Route path="playground" element={<Playground />} />
									<Route path="about" element={<About />} />
									<Route path="*" element={<NotFound />} />
								</Route>
							</Routes>
						</Suspense>
					</ErrorBoundary>
				</BrowserRouter>
			</ExplorationProvider>
		</LangProvider>
	);
}
