import { useGameStore } from '../../state/useGameStore';
import { useProgressStore } from '../../state/useProgressStore';
import { EraId } from '../../data/eras';

export function useEraCompletion() {
  return (eraId: EraId) => {
    const results = useGameStore.getState().results;
    const correct = results.filter(r => r.correct).length;
    const points = results.reduce((sum, r) => sum + r.pointsEarned, 0);
    useProgressStore.getState().completeEra(eraId, { correct, points });
    return { correct, points };
  };
}
