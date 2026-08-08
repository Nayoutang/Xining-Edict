import type { DilemmaCategory, DilemmaProgress } from '../game/types';

export type CrisisMarkerStatus = 'active' | 'critical' | 'resolved' | 'hidden';

export interface CrisisMarkerModel {
  id: string;
  title: string;
  location: string;
  severity: number;
  x: number;
  y: number;
  status: CrisisMarkerStatus;
  category: DilemmaCategory;
  description: string;
  reformDirection: string;
}

type CrisisPlacement = { location: string; x: number; y: number };

const fixedPlacements: Partial<Record<string, CrisisPlacement>> = {
  'border-pressure': { location: '陕西沿边', x: 18, y: 30 },
  'fiscal-imbalance': { location: '三司财计', x: 64, y: 24 },
  'weak-administration': { location: '诸路州县', x: 48, y: 48 },
  'livelihood-strain': { location: '京东民户', x: 79, y: 56 },
  'forced-loans': { location: '青苗诸路', x: 70, y: 42 },
  'factional-politics': { location: '汴京朝堂', x: 57, y: 34 },
  'concealed-corruption': { location: '监司官署', x: 42, y: 37 },
  'verified-misconduct': { location: '御史台', x: 55, y: 27 },
  'administrative-overload': { location: '中书有司', x: 51, y: 57 },
};

const fallbackPlacements: CrisisPlacement[] = [
  { location: '本期奏报', x: 34, y: 22 },
  { location: '河北诸路', x: 35, y: 42 },
  { location: '东南诸路', x: 84, y: 38 },
  { location: '京畿诸县', x: 61, y: 52 },
  { location: '河东诸州', x: 26, y: 54 },
  { location: '两浙路', x: 88, y: 60 },
];

export function getCrisisPlacement(dilemma: DilemmaProgress, index: number): CrisisPlacement {
  const fixed = fixedPlacements[dilemma.id];
  if (fixed) return fixed;
  if (dilemma.id.startsWith('urgent-')) return fallbackPlacements[0]!;
  return fallbackPlacements[(index % (fallbackPlacements.length - 1)) + 1]!;
}

export function buildCrisisMarkers(
  dilemmas: readonly DilemmaProgress[],
  hiddenIds: ReadonlySet<string> = new Set(),
): CrisisMarkerModel[] {
  return dilemmas.map((dilemma, index) => {
    const placement = getCrisisPlacement(dilemma, index);
    const status: CrisisMarkerStatus = hiddenIds.has(dilemma.id)
      ? 'hidden'
      : dilemma.severity <= 0
        ? 'resolved'
        : dilemma.severity >= 70
          ? 'critical'
          : 'active';
    return {
      ...dilemma,
      ...placement,
      status,
    };
  });
}
