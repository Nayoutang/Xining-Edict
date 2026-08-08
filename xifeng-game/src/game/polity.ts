import { getOfficer } from '../data/officers';
import type { CourtOfficeKey, CourtPostKey, GameState } from './types';

export function isCourtOfficerAppointed(state: GameState, officerId: string): boolean {
  return state.polity.offices.some((office) => office.posts.some((post) => post.appointeeId === officerId));
}

export function appointCourtOfficer(state: GameState, officeKey: CourtOfficeKey, postKey: CourtPostKey, officerId: string): GameState {
  if (!getOfficer(officerId)) throw new Error('待任官员不存在。');
  if (isCourtOfficerAppointed(state, officerId)) throw new Error('该官员已有职任，请先罢免原职。');
  const office = state.polity.offices.find((item) => item.key === officeKey);
  if (!office) throw new Error('朝廷机构不存在。');
  if (!office.posts.some((post) => post.key === postKey)) throw new Error('核心官职不存在。');
  return {
    ...state,
    polity: {
      offices: state.polity.offices.map((item) => ({
        ...item,
        posts: item.posts.map((post) => ({
          ...post,
          appointeeId: post.key === postKey && item.key === officeKey ? officerId : post.appointeeId,
        })),
      })),
    },
  };
}

export function dismissCourtOfficer(state: GameState, officeKey: CourtOfficeKey, postKey: CourtPostKey): GameState {
  const office = state.polity.offices.find((item) => item.key === officeKey);
  if (!office) throw new Error('朝廷机构不存在。');
  if (!office.posts.some((post) => post.key === postKey)) throw new Error('核心官职不存在。');
  return {
    ...state,
    polity: {
      offices: state.polity.offices.map((item) => item.key === officeKey
        ? { ...item, posts: item.posts.map((post) => post.key === postKey ? { ...post, appointeeId: null } : post) }
        : item),
    },
  };
}
