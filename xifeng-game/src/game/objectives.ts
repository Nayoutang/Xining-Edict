import type { GameState, ObjectiveProgress } from './types';

export function evaluateObjectives(state: GameState): ObjectiveProgress[] {
  const enactedPolicies = new Set([
    ...state.activePolicies.map((item) => item.policyId),
    ...state.history.flatMap((record) => record.policyIds),
  ]);

  return [
    {
      id: 'reform-foundation',
      title: '新法初建',
      description: '在八回合内推行至少四项不同政务。',
      current: enactedPolicies.size,
      target: 4,
      completed: enactedPolicies.size >= 4,
    },
    {
      id: 'protect-people',
      title: '不以伤民求富',
      description: '民生维持在三十分以上。',
      current: state.indicators.livelihood,
      target: 30,
      completed: state.indicators.livelihood >= 30,
    },
    {
      id: 'working-government',
      title: '政令可达州县',
      description: '执行力提升至四十五。',
      current: state.indicators.execution,
      target: 45,
      completed: state.indicators.execution >= 45,
    },
    {
      id: 'solvent-treasury',
      title: '国用不竭',
      description: '国库保持两千万贯以上。',
      current: state.resources.treasury,
      target: 2000,
      completed: state.resources.treasury >= 2000,
    },
    {
      id: 'clean-administration',
      title: '辨奸而不兴冤狱',
      description: '完成弹章复核与账簿对勘，以证据整饬吏治。',
      current: ['censorial-dossier', 'verified-misconduct', 'disciplined-corruption'].filter((flag) => state.flags.includes(flag)).length,
      target: 3,
      completed: state.flags.includes('disciplined-corruption'),
    },
  ];
}
