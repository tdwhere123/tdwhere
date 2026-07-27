import { cubeProjects, type CubeStageId } from "./cube-data";
import type { FaceProgress } from "./exploration-context";

type Props = {
	/** Currently facing face — tints the hall wash. */
	activeId: CubeStageId;
	progress: Record<CubeStageId, FaceProgress>;
	litCount: number;
};

/**
 * 展厅环境光 · Hall ambience.
 *
 * Purely environmental feedback for the exploration state — no counters, no
 * dashboard. Each face owns a soft glow at the hall's edge; exploring a face
 * brings its glow up (dim when seen, full when its mechanism was triggered).
 * A vignette dims the hall at first and lifts as more faces are lit. On
 * mount, a dark veil lifts once — the hall lights on as you walk in.
 *
 * Decorative only: aria-hidden, pointer-events none. Reduced motion is
 * handled globally (transitions collapse); state remains visible statically.
 */
export default function HallAmbience({ activeId, progress, litCount }: Props) {
	return (
		<div className="hall" aria-hidden="true" data-active={activeId}>
			<span className="hall__wash" />
			{cubeProjects.map((p) => {
				const fp = progress[p.id];
				const lit = fp.seen || fp.mechanism;
				const complete = fp.seen && fp.mechanism;
				return (
					<span
						key={p.id}
						className="hall__glow"
						data-face={p.id}
						data-lit={lit || undefined}
						data-complete={complete || undefined}
					/>
				);
			})}
			<span
				className="hall__vignette"
				style={{ opacity: Math.max(0.25, 1 - litCount * 0.14) }}
			/>
			<span className="hall__intro" />
		</div>
	);
}
