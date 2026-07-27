import { useCallback, useMemo, useState, type ReactNode } from "react";
import { CUBE_STAGE_IDS, type CubeStageId } from "./cube-data";
import {
	createInitialExploration,
	ExplorationContext,
	type Exploration,
} from "./exploration-context";

/**
 * 展览探索状态 · Exhibition exploration (session-only).
 *
 * The home hall lights up as the visitor explores: dwelling on a cube face
 * marks it `seen` (dim glow), triggering the face's mechanism (expanding the
 * hand-ink exhibit note) marks `mechanism` (full glow). State lives only in
 * React memory — never localStorage — so a refresh returns the hall to dark,
 * mirroring the products themselves (Alaya: this visit's memory is this
 * visit's; Vegetarian-card: explore one, light one).
 */

export function ExplorationProvider({ children }: { children: ReactNode }) {
	const [progress, setProgress] = useState(createInitialExploration);

	const markSeen = useCallback((id: CubeStageId) => {
		setProgress((p) =>
			p[id].seen ? p : { ...p, [id]: { ...p[id], seen: true } },
		);
	}, []);

	const markMechanism = useCallback((id: CubeStageId) => {
		setProgress((p) =>
			p[id].mechanism ? p : { ...p, [id]: { ...p[id], mechanism: true } },
		);
	}, []);

	const value = useMemo<Exploration>(() => {
		let litCount = 0;
		for (const id of CUBE_STAGE_IDS) {
			if (progress[id].seen || progress[id].mechanism) litCount += 1;
		}
		return {
			progress,
			markSeen,
			markMechanism,
			isLit: (id: CubeStageId) => progress[id].seen || progress[id].mechanism,
			litCount,
		};
	}, [progress, markSeen, markMechanism]);

	return (
		<ExplorationContext.Provider value={value}>
			{children}
		</ExplorationContext.Provider>
	);
}
