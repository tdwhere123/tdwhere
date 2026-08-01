import { lazy, useEffect, type ComponentType } from "react";
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

/**
 * Lazy route chunks are content-hashed. A tab that outlives a deploy (or a
 * rebuilt preview) still references the old hashes, so the import 404s and
 * the ErrorBoundary shows "出了点问题…刷新试试" — dead until a manual reload.
 * Detect that failure and reload once automatically; the fresh document
 * points at the current chunks. Cooldown guards against reload loops when
 * the chunk genuinely cannot load (offline, broken deploy).
 */
const CHUNK_RELOAD_KEY = "tdwhere:chunk-reload-at";
const CHUNK_RELOAD_COOLDOWN_MS = 30_000;

function recoverFromChunkError(): boolean {
	try {
		const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0);
		if (Date.now() - last < CHUNK_RELOAD_COOLDOWN_MS) return false;
		sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
	} catch {
		// sessionStorage unavailable (privacy mode) — fall through to the
		// ErrorBoundary instead of risking an unguarded reload loop.
		return false;
	}
	window.location.reload();
	return true;
}

function lazyWithRetry<T extends ComponentType<object>>(
	factory: () => Promise<{ default: T }>,
) {
	return lazy(async () => {
		try {
			return await factory();
		} catch (error) {
			if (recoverFromChunkError()) {
				// Suspend forever: the reload replaces this document anyway.
				return new Promise<{ default: T }>(() => {});
			}
			throw error;
		}
	});
}

const DoIt = lazyWithRetry(() => import("@/pages/DoIt"));
const Alaya = lazyWithRetry(() => import("@/pages/Alaya"));
const WriteRight = lazyWithRetry(() => import("@/pages/WriteRight"));
const Playground = lazyWithRetry(() => import("@/pages/Playground"));
const About = lazyWithRetry(() => import("@/pages/About"));

function isHomePath(pathname: string) {
	return pathname === "/" || pathname === "";
}

function ScrollManager() {
	const { pathname } = useLocation();
	useEffect(() => {
		if ("scrollRestoration" in window.history) {
			window.history.scrollRestoration = "manual";
		}
		scrollToTop(true);
		// Home is short — native scroll; other pages keep Lenis smoothing.
		setSmoothScrollActive(!isHomePath(pathname));
		// let the new page paint before ScrollTrigger re-measures; a second pass
		// covers late-loading fonts / images shifting section offsets
		const ids = [
			window.setTimeout(() => ScrollTrigger.refresh(), 60),
			window.setTimeout(() => ScrollTrigger.refresh(), 450),
		];
		return () => ids.forEach((id) => window.clearTimeout(id));
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

	/* Vite raises this when a dynamic import's preload fails (stale tab after
	   a deploy). Prevent the throw and recover with one guarded reload. */
	useEffect(() => {
		const onPreloadError = (event: Event) => {
			event.preventDefault();
			recoverFromChunkError();
		};
		window.addEventListener("vite:preloadError", onPreloadError);
		return () => window.removeEventListener("vite:preloadError", onPreloadError);
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
					</ErrorBoundary>
				</BrowserRouter>
			</ExplorationProvider>
		</LangProvider>
	);
}
