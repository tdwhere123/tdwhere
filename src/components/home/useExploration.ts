import { useContext } from "react";
import { ExplorationContext, type Exploration } from "./exploration-context";

export function useExploration(): Exploration {
	const ctx = useContext(ExplorationContext);
	if (!ctx)
		throw new Error("useExploration must be used inside <ExplorationProvider>");
	return ctx;
}
