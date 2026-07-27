import { createContext } from "react";
import { CUBE_STAGE_IDS, type CubeStageId } from "./cube-data";

export type FaceProgress = {
	/** Dwelled on the face long enough to read it. */
	seen: boolean;
	/** Triggered the face's mechanism (ink exhibit note). */
	mechanism: boolean;
};

export type Exploration = {
	progress: Record<CubeStageId, FaceProgress>;
	markSeen: (id: CubeStageId) => void;
	markMechanism: (id: CubeStageId) => void;
	/** Glow on — the face has been explored at least one way. */
	isLit: (id: CubeStageId) => boolean;
	litCount: number;
};

/** Creates a fresh visit-only state; no progress is retained across a refresh. */
export function createInitialExploration(): Record<CubeStageId, FaceProgress> {
	return Object.fromEntries(
		CUBE_STAGE_IDS.map((id) => [id, { seen: false, mechanism: false }]),
	) as Record<CubeStageId, FaceProgress>;
}

export const ExplorationContext = createContext<Exploration | null>(null);
