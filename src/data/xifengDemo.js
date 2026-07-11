export const statOrder = ['国用', '民生', '边防', '士论', '法度', '党争'];

export const statDescriptions = {
  国用: '朝廷财政、仓储与调度资源的能力。',
  民生: '农户、商民与基层社会的承受程度。',
  边防: '军费、训练、边境防御与外部安全。',
  士论: '士大夫舆论与官僚系统的支持程度。',
  法度: '制度条文、监察执行和政令稳定性。',
  党争: '新旧政治冲突的烈度，越高越危险。',
};

const openingCrisis =
  '治平既往，熙丰将启。三司言国用不足，枢密院报边费日增，诸路又有青苗借贷、差役不均、市井物价与州县催科之患。台谏争论祖宗法度，朝廷内外皆待御前裁断。';

const crisisCycle = [
  '奏报：河北、京东州县请增常平钱谷，以救青黄不接；台谏同时弹劾部分县令已有抑配苗头。',
  '奏报：西夏边境军费渐急，枢密院请议保甲训练；民户则诉农时被夺，乡里不安。',
  '奏报：汴京物价起落，三司请设市易以平准；商贾疑官府夺利，士论渐有异声。',
  '奏报：诸路新旧官员互相攻讦，御史台请明定考课与弹劾尺度，以免政令皆入党争。',
];

export function clampStat(value) {
  return Math.max(0, Math.min(100, value));
}

export function createInitialCourtState() {
  return {
    round: 1,
    year: '治平四年至熙宁初，1067-1069',
    crisis: openingCrisis,
    stats: {
      国用: 44,
      民生: 52,
      边防: 46,
      士论: 50,
      法度: 48,
      党争: 38,
    },
    history: [],
  };
}

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
}

function inferPolicy(intent) {
  const normalized = intent.trim();
  return {
    intent: normalized || '整顿朝政，兼顾国用、民生与法度',
    fiscal: hasAny(normalized, ['国用', '财政', '钱', '粮', '三司', '理财', '增收']),
    welfare: hasAny(normalized, ['民生', '百姓', '农', '青苗', '借贷', '扰民', '抑配']),
    military: hasAny(normalized, ['军', '边', '西夏', '辽', '保甲', '训练']),
    market: hasAny(normalized, ['商', '市易', '物价', '市场', '商贾']),
    official: hasAny(normalized, ['吏', '地方', '州县', '官', '考课', '贪']),
    law: hasAny(normalized, ['法', '监察', '御史', '禁', '严', '制度']),
    moderate: hasAny(normalized, ['稳', '暂不', '缓', '试行', '禁止', '不得', '限制']),
    forceful: hasAny(normalized, ['全面', '强力', '大力', '立刻', '严惩', '扩张']),
  };
}

function draftTitle(policy) {
  if (policy.welfare && policy.fiscal) return '抚民理财诏';
  if (policy.military) return '经边整军诏';
  if (policy.market) return '平市通商诏';
  if (policy.official || policy.law) return '饬吏明法诏';
  return '熙丰万机诏';
}

export function generateEdictDraft(intent, state) {
  const policy = inferPolicy(intent);
  const clauses = [
    '诸路转运、提点刑狱与州县官，须以民力可承为先，不得抑配、科扰以求速效。',
    '三司具钱谷出入之数，月终上闻，中书、枢密同议缓急，不许以虚额充功。',
    '御史台按察州县执行，凡借政令为催科、侵渔、邀功者，具名弹奏。',
    '其法先行于事急州县，三月一报，岁终较其国用、民生、边备与士论之得失。',
  ];

  if (policy.military) {
    clauses.push('枢密院核边费与训练之实，保甲不得夺农时，边地先行，腹里从缓。');
  }

  if (policy.market) {
    clauses.push('市易之设重在平准物价，不得纵官吏逐利，与商民争细故之利。');
  }

  if (policy.forceful) {
    clauses.push('若有废格诏令、隐匿簿籍者，从重黜责，以明朝廷纪纲。');
  }

  const text = `诏曰：朕承祖宗之业，念国用未裕、民力未舒、边备未固。今据御前所陈“${policy.intent}”，可令有司审户等、核钱谷、明赏罚、严按察。${clauses.join('')}`;

  return {
    id: `edict-${state.round}`,
    round: state.round,
    year: state.year,
    title: draftTitle(policy),
    intent: policy.intent,
    text,
    clauses,
    policy,
    advisers: [
      {
        name: '王安石',
        stance: policy.fiscal || policy.law ? '赞其能立制度，惟请勿因循太过。' : '以为治国须有定法，不可徒守旧习。',
      },
      {
        name: '司马光',
        stance: policy.moderate ? '谓能顾惜民力，尚可观其成效。' : '忧其扰动州县，恐名为理财而实伤百姓。',
      },
      {
        name: '苏轼',
        stance: '请朝廷详察地方实情，勿使良法在州县化为扰民之具。',
      },
    ],
  };
}

function calculateDeltas(policy) {
  const deltas = {
    国用: 0,
    民生: 0,
    边防: 0,
    士论: 0,
    法度: 0,
    党争: 0,
  };

  if (policy.fiscal) {
    deltas.国用 += policy.forceful ? 9 : 5;
    deltas.民生 += policy.moderate ? 1 : -3;
    deltas.士论 -= 2;
  }
  if (policy.welfare) {
    deltas.民生 += policy.moderate ? 6 : 3;
    deltas.国用 -= policy.moderate ? 1 : 0;
    deltas.士论 += 1;
  }
  if (policy.military) {
    deltas.边防 += policy.forceful ? 9 : 5;
    deltas.民生 += policy.moderate ? -1 : -4;
  }
  if (policy.market) {
    deltas.国用 += 4;
    deltas.民生 += policy.moderate ? 2 : -2;
    deltas.士论 -= policy.moderate ? 1 : 4;
  }
  if (policy.official || policy.law) {
    deltas.法度 += policy.forceful ? 6 : 8;
    deltas.民生 += 2;
    deltas.士论 += policy.forceful ? -2 : 2;
  }
  if (policy.moderate) {
    deltas.法度 += 3;
    deltas.党争 -= 2;
  }
  if (policy.forceful) {
    deltas.国用 += 2;
    deltas.党争 += 6;
    deltas.士论 -= 3;
  }

  if (Object.values(deltas).every((value) => value === 0)) {
    deltas.法度 += 2;
    deltas.士论 += 1;
  }

  return deltas;
}

function nextYear(round) {
  const years = ['熙宁二年，1069', '熙宁三年，1070', '熙宁四年，1071', '熙宁五年，1072', '元丰初年，1078'];
  return years[Math.min(round - 1, years.length - 1)];
}

export function evaluateEdict(draft, state) {
  const rawDeltas = calculateDeltas(draft.policy);
  const nextStats = Object.fromEntries(
    statOrder.map((name) => [name, clampStat(state.stats[name] + rawDeltas[name])]),
  );
  const deltas = statOrder
    .map((name) => ({ name, value: nextStats[name] - state.stats[name] }))
    .filter((delta) => delta.value !== 0);
  const nextCrisis = crisisCycle[(state.round - 1) % crisisCycle.length];

  const report = [
    {
      title: '诏令本意',
      body: `此诏以“${draft.intent}”为旨，意在于国用、民生、边备与法度之间求一可行之局。其文虽由朝廷发出，实际成败仍系于三司核算、州县执行与御史按察。`,
    },
    {
      title: '中枢反应',
      body: `王安石重其可立制度，司马光忧其或扰民力，苏轼则请详察州县实情。中书欲见成效，台谏先观其是否越出祖宗法度，朝廷议论尚未决裂。`,
    },
    {
      title: '地方执行',
      body: draft.policy.law || draft.policy.official
        ? '御史台条款使部分州县不敢明目加码，簿籍与户等开始重新核定。但亦有官员观望，恐考课不利，暗中以劝谕代替强逼。'
        : '州县奉诏后多先看中枢风向。勤谨者按户等施行，急功者仍试图以政绩为名加快摊派，地方执行已有分化。',
    },
    {
      title: '民间后果',
      body: draft.policy.welfare || draft.policy.moderate
        ? '农户得一时喘息，青黄不接之家尤感宽缓；富户与胥吏因旧有利益受限，开始在乡里传播官府夺利之议。'
        : '政令见效较快，但基层不易分辨朝廷本意与州县催科，部分民户仍疑新政终将化为额外负担。',
    },
    {
      title: '朝野舆论',
      body: `士论对新政仍有疑惧，然因诏中明示监察与边界，反对之声暂未一概归于党争。当前变化为：${deltas.map((delta) => `${delta.name}${delta.value > 0 ? '+' : ''}${delta.value}`).join('，')}。`,
    },
    {
      title: '下一轮困境',
      body: nextCrisis,
    },
  ];

  return {
    draft,
    report,
    deltas,
    nextCrisis,
    nextState: {
      ...state,
      round: state.round + 1,
      year: nextYear(state.round + 1),
      crisis: nextCrisis,
      stats: nextStats,
      history: [
        ...state.history,
        {
          title: draft.title,
          intent: draft.intent,
          deltas,
          report,
        },
      ],
    },
  };
}
