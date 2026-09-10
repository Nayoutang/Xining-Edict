import { getOfficer } from '../data/officers';
import type { CourtOfficeKey, CourtPostKey, GameState, PolicyTag } from './types';

const policyOffice: Record<string, CourtOfficeKey> = {
  'green-sprouts-trial': 'finance',
  'service-reform-preparation': 'transport',
  'water-conservancy': 'transport',
  'curb-local-exactions': 'transport',
  'reduce-redundant-spending': 'finance',
  'northwest-defense': 'military',
  'review-impeachments': 'censorate',
  'cross-check-ledgers': 'finance',
  'discipline-corrupt-officials': 'censorate',
  'open-ended-directive': 'secretariat',
};

export const courtOfficeFocusTags: Record<CourtOfficeKey, PolicyTag[]> = {
  secretariat: ['reform', 'administration'],
  military: ['military'],
  finance: ['finance'],
  censorate: ['administration'],
  transport: ['relief', 'administration'],
};

export interface CourtPolicySupport {
  officeKey: CourtOfficeKey;
  officeName: string;
  administrationModifier: number;
  executionModifier: number;
  message: string;
}

export function getCourtPolicySupport(state: GameState, policyId: string): CourtPolicySupport {
  const officeKey = policyOffice[policyId] ?? 'secretariat';
  const office = state.polity.offices.find((item) => item.key === officeKey);
  if (!office) return { officeKey, officeName: '有司', administrationModifier: 0, executionModifier: 0, message: '' };

  const appointees = office.posts
    .map((post) => post.appointeeId ? getOfficer(post.appointeeId) : undefined)
    .filter((officer): officer is NonNullable<typeof officer> => Boolean(officer));
  const focusTags = courtOfficeFocusTags[officeKey];
  const hasSpecialist = appointees.some((officer) => officer.specialtyTags.some((tag) => focusTags.includes(tag)));
  const principalVacant = !office.posts[0]?.appointeeId;
  const administrationModifier = (principalVacant ? 1 : 0) + (hasSpecialist ? -1 : 0);
  const executionModifier = hasSpecialist ? 1 : principalVacant ? -1 : 0;
  const details = [
    principalVacant ? '主官虚位，文移协调多耗一点行政' : '',
    hasSpecialist ? '任官与职掌相合，执行增益一点' : '',
  ].filter(Boolean);
  return {
    officeKey,
    officeName: office.name,
    administrationModifier,
    executionModifier,
    message: details.length ? `${office.name}：${details.join('；')}。` : `${office.name}：现任可按常规承办。`,
  };
}

export function describeCourtCandidateFit(officeKey: CourtOfficeKey, officerId: string): { level: '高' | '中' | '低'; text: string } {
  const officer = getOfficer(officerId);
  if (!officer) return { level: '低', text: '无法核实此人的履历。' };
  const matched = officer.specialtyTags.filter((tag) => courtOfficeFocusTags[officeKey].includes(tag));
  if (matched.length) return { level: '高', text: `所长与本署职掌相合，承办相关政务可节省行政并增进执行。` };
  if (officer.specialtyTags.includes('reform')) return { level: '中', text: '长于议法推行，但与本署日常职掌并非完全相合。' };
  return { level: '低', text: '履历与本署职掌不合，相关政务不会获得岗位加成。' };
}

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
