export const initialStats = {
  国用: 50,
  民生: 50,
  边防: 50,
  士论: 50,
  法度: 50,
  党争: 50,
};

export const statMeta = {
  国用: '国家财政能力与朝廷调度资源的水平。',
  民生: '百姓负担、基层生活与社会稳定程度。',
  边防: '军事组织、边境防御与强兵成效。',
  士论: '士大夫舆论、官僚系统支持程度。',
  法度: '政策执行规范性与制度稳定程度。',
  党争: '新旧两派政治冲突与朝局撕裂程度。',
};

export const backgroundCards = [
  {
    title: '国用日窘',
    description: '冗官、冗兵、冗费使财政压力长期存在。',
    scene: '国库空虚',
  },
  {
    title: '边患未息',
    description: '辽与西夏带来长期边防压力。',
    scene: '边关烽烟',
  },
  {
    title: '民力承压',
    description: '政策最终会落到基层百姓身上。',
    scene: '百姓负担',
  },
  {
    title: '士论分歧',
    description: '改革必须面对士大夫舆论和官僚系统阻力。',
    scene: '朝堂分歧',
  },
];

export const sceneImages = {
  汴京城远景: new URL('../assets/scenes/1.png', import.meta.url).href,
  国库空虚: new URL('../assets/scenes/2.png', import.meta.url).href,
  边关烽烟: new URL('../assets/scenes/3.png', import.meta.url).href,
  百姓负担: new URL('../assets/scenes/4.png', import.meta.url).href,
  朝堂分歧: new URL('../assets/scenes/5.png', import.meta.url).href,
  王安石入政: new URL('../assets/scenes/6.png', import.meta.url).href,
  青苗法: new URL('../assets/scenes/7.png', import.meta.url).href,
  募役法: new URL('../assets/scenes/8.png', import.meta.url).href,
  市易法: new URL('../assets/scenes/9.png', import.meta.url).href,
  保甲法: new URL('../assets/scenes/10.png', import.meta.url).href,
  新旧党争: new URL('../assets/scenes/11.png', import.meta.url).href,
  熙宁改良: new URL('../assets/scenes/12.png', import.meta.url).href,
};

export const introText =
  '治平之后，国用日窘，边患未息，朝廷冗费积重。年轻的皇帝面对祖宗之法与现实危局，开始思考变革之道。王安石上书言政，主张理财、强兵、变更旧制。此时的你，是大宋皇帝赵顼。你要如何选择？';

const rawDecisionNodes = [
  {
    id: 'appointment',
    title: '熙宁入政：是否重用王安石',
    year: '熙宁二年，1069年',
    scene: '王安石入政',
    background:
      '北宋中期，冗官、冗兵、冗费使国家财政压力加重，辽与西夏带来的边防压力也长期存在。宋神宗即位后，希望改变积贫积弱之势。王安石主张理财、强兵、变更旧制，此时朝廷需要决定是否赋予其改革权力。',
    question: '面对积弊已久的朝政，你将如何任用王安石？',
    options: [
      {
        label: 'A',
        text: '大力任用王安石主持变法',
        effects: { 国用: 10, 边防: 5, 士论: -10, 党争: 12, 法度: 4 },
        feedback:
          '你给予王安石充分支持，新法推进速度明显加快。朝廷获得解决财政与军事问题的机会，但旧臣与部分士大夫的疑虑也迅速增加。',
      },
      {
        label: 'B',
        text: '让王安石参与政事，先局部试行',
        effects: { 国用: 5, 边防: 2, 士论: -3, 党争: 4, 法度: 8 },
        feedback:
          '你选择较稳妥的改革节奏。新法可以开始试验，但不会立刻激化朝廷矛盾，制度执行也有更多调整空间。',
      },
      {
        label: 'C',
        text: '维持旧臣主导，暂缓大规模改革',
        effects: { 国用: -8, 边防: -4, 士论: 8, 党争: -5, 民生: 3 },
        feedback:
          '朝廷暂时保持稳定，士大夫集团的不安得到缓和。但财政与边防压力没有被真正解决，积弊仍在延续。',
      },
    ],
  },
  {
    id: 'green-sprouts',
    title: '青苗法：国家是否介入民间借贷',
    year: '熙宁二年至三年',
    scene: '青苗法',
    background:
      '青苗法试图在农民青黄不接时由政府发放钱粮，收成后归还，以抑制民间高利贷并增加国家收入。但政策一旦层层下压，也可能被地方官吏扭曲为强制摊派，引发民怨。',
    question: '青苗法应如何推行？',
    options: [
      {
        label: 'A',
        text: '全国推行，以尽快增加财政收入',
        effects: { 国用: 16, 民生: -12, 士论: -8, 党争: 10, 法度: -5 },
        feedback:
          '朝廷财政收入提升较快，但地方执行压力随之加大。一些官员可能为了政绩强制放贷，使原本的救助政策变成新的负担。',
      },
      {
        label: 'B',
        text: '先在部分州县试行，观察成效',
        effects: { 国用: 7, 民生: -3, 士论: -2, 党争: 3, 法度: 6 },
        feedback:
          '试点推行降低了政策风险，也为朝廷观察地方差异提供空间。但财政改善速度较慢，改革派可能认为力度不足。',
      },
      {
        label: 'C',
        text: '推行青苗法，但严禁强制摊派',
        effects: { 国用: 9, 民生: 4, 士论: 2, 党争: -2, 法度: 12 },
        feedback:
          '你保留青苗法的理财目标，同时加强监督。政策收益不如强推明显，但更有利于减少基层扭曲。',
      },
      {
        label: 'D',
        text: '暂缓青苗法，避免扰民争议',
        effects: { 国用: -6, 民生: 7, 士论: 6, 党争: -5, 法度: 2 },
        feedback:
          '你避免了青苗法引发的争议，民间压力暂时较小。但朝廷财政困境仍难改善，变法开局趋于保守。',
      },
    ],
  },
  {
    id: 'labor-service',
    title: '募役法：如何处理差役负担',
    year: '熙宁四年前后',
    scene: '募役法',
    background:
      '旧制下，百姓需要轮流承担差役，容易影响生产，也可能因负担不均引发不满。募役法试图以缴纳役钱的方式代替部分亲身服役，再由政府雇人承担差役。它有助于制度化役务，却也可能带来新的征收压力。',
    question: '你将如何推进募役法？',
    options: [
      {
        label: 'A',
        text: '全面推行募役法，替代旧有差役',
        effects: { 国用: 11, 民生: -5, 士论: -6, 党争: 7, 法度: 4 },
        feedback:
          '募役法提升了行政效率，也使役务负担更容易被财政化管理。但若役钱征收过重，百姓仍会感到压力。',
      },
      {
        label: 'B',
        text: '按地区和户等分步执行',
        effects: { 国用: 6, 民生: 4, 士论: 2, 党争: -1, 法度: 10 },
        feedback:
          '分步执行更符合地方差异，降低了政策冲击。改革效果不算迅猛，但制度稳定性明显增强。',
      },
      {
        label: 'C',
        text: '保留部分旧制，减少争议',
        effects: { 国用: -2, 民生: 2, 士论: 7, 党争: -5, 法度: -2 },
        feedback:
          '你通过保留旧制换取政治阻力下降，但旧有差役不均的问题仍然存在，改革力度明显缩水。',
      },
    ],
  },
  {
    id: 'market-exchange',
    title: '市易法：朝廷是否加强市场调控',
    year: '熙宁五年前后',
    scene: '市易法',
    background:
      '市易法意在通过官府机构调节市场流通、平抑物价，并增加国家财政收入。它体现了王安石希望增强国家经济调控能力的思路，但也容易引发官府与商民争利的批评。',
    question: '面对市场与财政问题，市易法应如何实施？',
    options: [
      {
        label: 'A',
        text: '设立市易机构，加强官府调控',
        effects: { 国用: 14, 民生: -6, 士论: -8, 党争: 8, 法度: -2 },
        feedback:
          '国家对市场的调控能力增强，财政收益上升。但官府介入过深，容易被批评为与民争利。',
      },
      {
        label: 'B',
        text: '只在都城与重要商贸地区试行',
        effects: { 国用: 7, 民生: -2, 士论: -2, 党争: 2, 法度: 6 },
        feedback:
          '有限试行使朝廷能够观察市场反应，避免过度扩张。但政策收益相对有限，改革派期待更大力度。',
      },
      {
        label: 'C',
        text: '限制官府逐利，重在平抑物价',
        effects: { 国用: 5, 民生: 6, 士论: 3, 党争: -3, 法度: 10 },
        feedback:
          '你将市易法重点放在平抑物价和规范市场上，而非单纯增收。财政收益不算最高，但社会接受度更好。',
      },
      {
        label: 'D',
        text: '放弃市易法，避免经济争议',
        effects: { 国用: -8, 民生: 3, 士论: 5, 党争: -4, 法度: 1 },
        feedback:
          '你减少了朝廷介入市场的争议，但也失去了一项增强财政与市场调控能力的工具。',
      },
    ],
  },
  {
    id: 'baojia',
    title: '保甲法：如何强兵与治安',
    year: '熙宁三年至六年间逐步推行',
    scene: '保甲法',
    background:
      '保甲法将民户组织起来，承担基层治安与军事训练功能，意在改善募兵制下军费高昂、战斗力不足等问题。它有助于加强基层控制和军事动员，但若推行过急，也可能增加民间负担。',
    question: '保甲法应偏向强兵，还是偏向稳民？',
    options: [
      {
        label: 'A',
        text: '全面组织保甲，加强军事训练',
        effects: { 边防: 16, 民生: -10, 士论: -4, 党争: 5, 法度: 2 },
        feedback:
          '基层军事组织能力提高，边防与治安得到加强。但民户训练与组织压力上升，扰民风险也随之增加。',
      },
      {
        label: 'B',
        text: '先在边境与重点地区推行',
        effects: { 边防: 9, 民生: -3, 士论: 1, 党争: 0, 法度: 7 },
        feedback:
          '重点地区试行更符合边防需求，也减少了全国推行的扰动。军事收益较稳，社会压力可控。',
      },
      {
        label: 'C',
        text: '降低军事化程度，偏重基层治安',
        effects: { 边防: 4, 民生: 5, 士论: 4, 党争: -2, 法度: 8 },
        feedback:
          '你弱化保甲法的军事色彩，转向基层治理。边防提升有限，但社会接受度与执行稳定性提高。',
      },
    ],
  },
  {
    id: 'factionalism',
    title: '新旧党争：如何处理反对意见',
    year: '变法中后期',
    scene: '新旧党争',
    background:
      '随着新法深入推行，司马光、苏轼等士大夫对政策目标、执行方式及政治后果提出批评。改革逐渐不只是政策问题，也成为新旧两派之间的政治分歧。宋神宗必须决定如何处理反对意见。',
    question: '面对反对派，你将采取怎样的政治策略？',
    options: [
      {
        label: 'A',
        text: '坚定支持新法，压制反对派',
        effects: { 国用: 8, 边防: 5, 士论: -15, 党争: 20, 法度: -4 },
        feedback:
          '新法推进阻力短期下降，但士大夫集团裂痕扩大。改革开始被政治立场化，朝局撕裂风险急剧上升。',
      },
      {
        label: 'B',
        text: '吸纳部分旧党官员参与修订',
        effects: { 国用: 3, 民生: 4, 士论: 10, 党争: -12, 法度: 12 },
        feedback:
          '你降低了政治对立，把部分争论转化为制度修订。改革速度放缓，但更有可能留下稳定成果。',
      },
      {
        label: 'C',
        text: '允许公开争论，并调整执行细节',
        effects: { 民生: 6, 士论: 8, 党争: -8, 法度: 8, 国用: -2 },
        feedback:
          '政策争论得到一定释放，执行偏差也有调整空间。但改革派可能认为妥协过多，财政收益有所下降。',
      },
      {
        label: 'D',
        text: '大幅妥协，停止争议政策',
        effects: { 国用: -12, 边防: -6, 民生: 8, 士论: 13, 党争: -15, 法度: -2 },
        feedback:
          '朝局冲突明显缓和，民间压力下降。但变法核心政策被削弱，积贫积弱问题仍难根治。',
      },
    ],
  },
];

const feedbackOptionMeta = {
  appointment: {
    A: {
      image: 'images/feedback/xining-strong.jpg',
      imageTitle: '熙宁强启反馈图',
      imageDescription: '后续可替换为王安石入政、朝堂议政等历史场景图片。',
      summary: '改革中枢迅速成形，但士大夫疑虑也开始积累。',
    },
    B: {
      image: 'images/feedback/xining-gradual.jpg',
      imageTitle: '熙宁缓启反馈图',
      imageDescription: '后续可替换为局部试行、群臣观望等历史场景图片。',
      summary: '改革获得试行空间，朝局仍保留回旋余地。',
    },
    C: {
      image: 'images/feedback/xining-delay.jpg',
      imageTitle: '熙宁暂缓反馈图',
      imageDescription: '后续可替换为旧臣主政、案牍积压等历史场景图片。',
      summary: '朝局暂得安稳，但财政与边防压力继续累积。',
    },
  },
  'green-sprouts': {
    A: {
      image: 'images/feedback/qingmiao-force.jpg',
      imageTitle: '青苗强推反馈图',
      imageDescription: '后续可替换为青苗钱下发、乡里催科等历史场景图片。',
      summary: '财政收益正在上升，但基层压力与士论阻力也在积累。',
    },
    B: {
      image: 'images/feedback/qingmiao-trial.jpg',
      imageTitle: '青苗试行反馈图',
      imageDescription: '后续可替换为州县试点、农户观望等历史场景图片。',
      summary: '改革推进速度放慢，但政策风险有所降低。',
    },
    C: {
      image: 'images/feedback/qingmiao-supervised.jpg',
      imageTitle: '青苗督察反馈图',
      imageDescription: '后续可替换为官吏核账、严禁摊派等历史场景图片。',
      summary: '理财目标得以保留，基层扭曲被明显压低。',
    },
    D: {
      image: 'images/feedback/qingmiao-delay.jpg',
      imageTitle: '青苗缓议反馈图',
      imageDescription: '后续可替换为诏令暂缓、民间喘息等历史场景图片。',
      summary: '民生压力有所缓和，但财政突破被推迟。',
    },
  },
  'labor-service': {
    A: {
      image: 'images/feedback/muyi-full.jpg',
      imageTitle: '募役全面反馈图',
      imageDescription: '后续可替换为役钱征收、差役改制等历史场景图片。',
      summary: '行政效率有所提升，但役钱压力会落到基层。',
    },
    B: {
      image: 'images/feedback/muyi-gradual.jpg',
      imageTitle: '募役分步反馈图',
      imageDescription: '后续可替换为分户定役、州县核定等历史场景图片。',
      summary: '制度改革稳步推进，民生与法度保持较好平衡。',
    },
    C: {
      image: 'images/feedback/muyi-conservative.jpg',
      imageTitle: '募役守旧反馈图',
      imageDescription: '后续可替换为旧役保留、士论暂安等历史场景图片。',
      summary: '政治阻力下降，但差役积弊仍难根除。',
    },
  },
  'market-exchange': {
    A: {
      image: 'images/feedback/shiyi-strong.jpg',
      imageTitle: '市易强设反馈图',
      imageDescription: '后续可替换为市易司设立、官府入市等历史场景图片。',
      summary: '国家调控能力增强，商民与士论的反弹也随之上升。',
    },
    B: {
      image: 'images/feedback/shiyi-trial.jpg',
      imageTitle: '市易试行反馈图',
      imageDescription: '后续可替换为都城试办、商贾交易等历史场景图片。',
      summary: '政策收益较为有限，但市场震荡被压低。',
    },
    C: {
      image: 'images/feedback/shiyi-balance.jpg',
      imageTitle: '市易平准反馈图',
      imageDescription: '后续可替换为平抑物价、官商折冲等历史场景图片。',
      summary: '民生与法度得到照顾，财政增益不再是唯一目标。',
    },
    D: {
      image: 'images/feedback/shiyi-cancel.jpg',
      imageTitle: '市易罢议反馈图',
      imageDescription: '后续可替换为市井复常、朝议缓和等历史场景图片。',
      summary: '经济争议减少，但国家调控工具随之削弱。',
    },
  },
  baojia: {
    A: {
      image: 'images/feedback/baojia-strong.jpg',
      imageTitle: '保甲强兵反馈图',
      imageDescription: '后续可替换为乡兵操练、保甲编组等历史场景图片。',
      summary: '边防能力增强，然而基层承受力正在下降。',
    },
    B: {
      image: 'images/feedback/baojia-border.jpg',
      imageTitle: '保甲边防反馈图',
      imageDescription: '后续可替换为边地训练、烽燧守备等历史场景图片。',
      summary: '军事收益集中在边地，社会扰动相对可控。',
    },
    C: {
      image: 'images/feedback/baojia-governance.jpg',
      imageTitle: '保甲治安反馈图',
      imageDescription: '后续可替换为乡里巡防、基层治安等历史场景图片。',
      summary: '基层秩序更稳，但强兵目标只能有限推进。',
    },
  },
  factionalism: {
    A: {
      image: 'images/feedback/party-suppress.jpg',
      imageTitle: '党争压制反馈图',
      imageDescription: '后续可替换为朝堂廷争、贬黜旧臣等历史场景图片。',
      summary: '改革阻力短期下降，但政治裂痕迅速扩大。',
    },
    B: {
      image: 'images/feedback/party-revise.jpg',
      imageTitle: '党争修订反馈图',
      imageDescription: '后续可替换为旧臣参议、制度修订等历史场景图片。',
      summary: '朝局趋于稳定，制度成果更有机会留存。',
    },
    C: {
      image: 'images/feedback/party-debate.jpg',
      imageTitle: '党争公议反馈图',
      imageDescription: '后续可替换为公开论辩、诏令修正等历史场景图片。',
      summary: '反对声音被纳入制度调整，改革速度因此放缓。',
    },
    D: {
      image: 'images/feedback/party-compromise.jpg',
      imageTitle: '党争妥协反馈图',
      imageDescription: '后续可替换为罢议新法、朝局暂安等历史场景图片。',
      summary: '朝局趋于稳定，但制度突破空间也随之缩小。',
    },
  },
};

export const decisionNodes = rawDecisionNodes.map((node) => ({
  ...node,
  options: node.options.map((option) => ({
    ...option,
    ...(feedbackOptionMeta[node.id]?.[option.label] ?? {}),
  })),
}));

const rawEndings = [
  {
    id: 'rupture',
    name: '新旧决裂',
    imageScene: '新旧党争',
    imageCaption: '新旧两派的政治裂痕，成为改革最沉重的余波。',
    type: '合理架空：强推成功但政治撕裂',
    comment: '新法似胜，朝局已裂。',
    test: (stats) => stats.党争 >= 78 && stats.士论 <= 38,
    explanation:
      '宋神宗坚定支持王安石，并持续压制反对派。新法在短期内获得较高推行力度，国用与边防有所改善，国家行政能力明显增强。然而，士大夫集团的裂痕被迅速放大，政策讨论逐渐变成政治站队。改革虽然在表面上取得胜利，却为后续朝局留下深层撕裂。',
  },
  {
    id: 'wealth-without-people',
    name: '富国失民',
    imageScene: '百姓负担',
    imageCaption: '财政账册上的增长，落到乡里则可能成为新的压力。',
    type: '合理架空：财政成功但民生受损',
    comment: '仓廪稍实，民心渐远。',
    test: (stats) => stats.国用 >= 72 && stats.民生 <= 42,
    explanation:
      '新法强力推行后，朝廷财政收入明显提高，市易、青苗、募役等政策增强了国家对社会经济的调控能力。但地方官吏层层加码，百姓实际负担加重。改革实现了富国目标，却没有充分安民，社会信任随之下降。',
  },
  {
    id: 'reformist-balance',
    name: '熙宁改良',
    imageScene: '熙宁改良',
    imageCaption: '制度留下痕迹，改革在妥协中获得较稳的可能。',
    type: '合理架空：温和成功线',
    comment: '变法未尽其志，而制度已有留痕。',
    test: (stats) =>
      stats.国用 >= 65 &&
      stats.民生 >= 50 &&
      stats.士论 >= 45 &&
      stats.法度 >= 62 &&
      stats.党争 <= 62,
    explanation:
      '宋神宗继续支持王安石变法，但没有单纯追求速度，而是加强地方监督，限制强制摊派，并吸纳部分旧党官员参与制度修订。新法没有完全实现王安石的全部理想，却避免了严重政治撕裂。北宋财政有所改善，部分制度成果得以延续，形成较为温和的改革局面。',
  },
  {
    id: 'conservative-peace',
    name: '守成之局',
    imageScene: '朝堂分歧',
    imageCaption: '朝堂暂得安稳，旧有困局却仍在台阁之外延续。',
    type: '合理架空：政治稳定但改革缩水',
    comment: '朝局暂安，积弊仍在。',
    test: (stats) => stats.士论 >= 62 && stats.党争 <= 42 && stats.国用 <= 58,
    explanation:
      '面对士大夫集团的持续反对，宋神宗选择放缓改革，部分争议政策被缩小范围或暂时搁置。朝廷政治气氛趋于缓和，民间压力有所下降，但财政困境与边防问题没有得到根本解决。改革理念被部分吸收，却失去了原本的制度力度。',
  },
  {
    id: 'historical-friction',
    name: '新法受挫',
    imageScene: '新旧党争',
    imageCaption: '富国强兵的志向，最终被执行偏差与党争牵扯。',
    type: '史实线：改革受阻，党争加剧',
    comment: '志在富国强兵，终陷新旧之争。',
    test: () => true,
    explanation:
      '新法在宋神宗支持下持续推进，一度改善财政与行政效率。但由于基层执行偏差、士大夫反对和新旧党争加剧，改革逐渐被卷入政治斗争。宋神宗去世后，旧党重新掌权，部分新法被废改，变法未能按王安石理想长期延续。',
  },
];

const endingCauseMeta = {
  rupture: {
    causeTitle: '何以至此',
    causeText:
      '你在多次决策中更倾向于强力推进新法，并在关键时刻选择压制反对意见。这使国家财政与行政推进能力在短期内得到提升，但也让士大夫支持度持续下降，新旧两派的政治裂痕迅速扩大。当党争长期维持在高位、士论持续走低时，改革不再只是制度调整，而被不断政治立场化。最终，你触发了“新旧决裂”结局：新法表面上得以推进，朝局却因此深度撕裂。',
    causeBullets: ['党争过高', '士论过低', '改革推进强，但政治协调不足'],
    systemReason: '你强化了改革推行力度，却未能维持士大夫支持与政治平衡，因此触发“新旧决裂”。',
  },
  'wealth-without-people': {
    causeTitle: '何以至此',
    causeText:
      '你在决策中多次优先考虑理财增收、加强国家调控与行政效率，使朝廷的财政能力明显增强。然而，这些政策在基层层面带来了更高的执行压力，百姓负担不断上升，民生状态随之恶化。当国用明显提高而民生明显下降时，系统判定你实现了“富国”，却未能真正“安民”。因此，你触发了“富国失民”结局：财政见效，但社会承受力被削弱，改革失去了更广泛的民意基础。',
    causeBullets: ['国用较高', '民生较低', '变法偏重效率与增收，忽略基层承受力'],
    systemReason: '你提升了国家财政与行政能力，却让基层负担持续加重，因此触发“富国失民”。',
  },
  'reformist-balance': {
    causeTitle: '何以至此',
    causeText:
      '你在改革过程中保持了较强的推进意愿，但并未一味求快，而是通过监督执行、限制扰民、吸纳反对意见、平衡财政与民生等方式，尽量减轻了新法带来的副作用。因此，国家财政有所改善，政策执行的规范性增强，民生并未出现明显恶化，党争也被控制在相对可承受的范围内。正因为你在“推进改革”与“稳定朝局”之间取得了较好的平衡，最终触发了“熙宁改良”结局：变法未尽理想，却留下了较稳固的制度成果。',
    causeBullets: ['国用较高', '民生保持稳定', '法度较高', '士论未严重崩坏', '党争控制较好'],
    systemReason: '你在推进新法的同时兼顾了民生、法度与政治协调，因此进入“熙宁改良”。',
  },
  'conservative-peace': {
    causeTitle: '何以至此',
    causeText:
      '你在多次关键节点中更倾向于缓行、保留、妥协与减轻争议。这使士大夫舆论逐步趋于稳定，党争显著下降，朝局整体比激进变法路线更平和。但与此同时，国家财政与制度改革的力度也被不断削弱，许多原本可能推进的变法措施只留下有限痕迹。于是，系统判定你保住了政治稳定，却未能真正解决北宋积弊，最终触发“守成之局”结局：局势暂安，但改革的锋芒也随之退去。',
    causeBullets: ['士论较高', '党争较低', '国用偏低', '改革力度不足，制度突破有限'],
    systemReason: '你优先维持朝局稳定与政治和缓，但削弱了改革力度，因此进入“守成之局”。',
  },
  'historical-friction': {
    causeTitle: '何以至此',
    causeText:
      '你在变法过程中虽然尝试推进改革，但整体路线未能形成稳定平衡：一方面，政策推进受到基层执行偏差、士大夫反对和政治分歧的持续影响；另一方面，改革成果又不足以建立长期稳定的支持基础。因此，你的选择既未完全实现“温和改良”，也未彻底形成“强推成功”的格局，而是落入更接近史实的结果：新法曾一度推进，却最终被复杂的政治与制度环境所牵制，难以长期延续。',
    causeBullets: [
      '国用、法度、士论、党争等指标未形成稳定优势',
      '改革推进与政治协调均未达到理想状态',
      '最终回到“改革受阻、党争加剧”的史实线',
    ],
    systemReason: '你的改革路线未能在财政、民生、执行与政治协调之间形成稳定平衡，因此进入“新法受挫”。',
  },
};

export const endings = rawEndings.map((ending) => ({
  ...ending,
  ...(endingCauseMeta[ending.id] ?? {}),
}));

export const designRules = [
  {
    title: '历史背景',
    detail: '熙宁变法发生在北宋神宗熙宁年间。面对冗官、冗兵、冗费造成的财政压力，以及辽、西夏带来的边防压力，宋神宗任用王安石推行新法，希望通过理财、强兵和制度改革改变积贫积弱的局面。',
  },
  {
    title: '你的身份',
    detail: '玩家将扮演宋神宗赵顼。你不是旁观者，而是坐在御前做决断的人：是否重用王安石，如何推行青苗法、募役法、市易法和保甲法，又如何处理新旧党争。',
  },
  {
    title: '玩法方式',
    detail: '每一章都会给出一段历史局势和数个政策选项。不同选择会改变朝局指标，并最终导向不同结局。游戏不是寻找唯一正确答案，而是在真实历史约束中权衡改革的速度、代价和后果。',
  },
  {
    title: '国用',
    detail: '国用衡量朝廷财赋、仓储和资源调度能力。数值高，说明富国理财有力，军政、赈恤与新法推行都有余地；数值低，则国库困窘，许多政令虽有其名，却难以长期支撑。',
  },
  {
    title: '民生',
    detail: '民生衡量百姓负担、乡里秩序和基层安定。数值高，说明政策较能安民，赋役与征收尚可承受；数值低，则地方执行偏差和财政压力会压向百姓，改革容易失去民心。',
  },
  {
    title: '边防',
    detail: '边防衡量军政组织、边境防御和强兵成效。数值高，说明保甲、训练和军费调度能让边塞更稳；数值低，则辽与西夏带来的外部压力仍难缓解。',
  },
  {
    title: '士论',
    detail: '士论衡量士大夫舆论和官僚系统的支持程度。数值高，朝廷更容易获得政治协作；数值低，反对声音渐盛，政令会在奏疏、台谏与地方执行中遭遇阻力。',
  },
  {
    title: '法度',
    detail: '法度衡量制度执行的规范性和稳定性。数值高，新法更能按章落地；数值低，地方官吏容易走样加码，原本的改革目标可能被扭曲成扰民之政。',
  },
  {
    title: '党争',
    detail: '党争衡量新旧两派的政治冲突。它与其他指标不同，越高越危险；一旦过高，改革就会从政策得失变成阵营站队，朝局也会被撕裂。',
  },
];

export const imageStoryItems = [
  {
    title: '北宋熙宁，风起汴京',
    scene: '汴京城远景',
    description: '年轻的皇帝望向繁华京城，也看见繁华背后的财政与边防压力。',
  },
  {
    title: '国用日窘',
    scene: '国库空虚',
    description: '冗官、冗兵、冗费积重，朝廷调度资源的余地越来越窄。',
  },
  {
    title: '边患未息',
    scene: '边关烽烟',
    description: '辽与西夏的长期压力，使强兵成为无法回避的议题。',
  },
  {
    title: '民力承压',
    scene: '百姓负担',
    description: '任何宏大的制度方案，最终都会成为基层百姓身上的轻重。',
  },
  {
    title: '士论分歧',
    scene: '朝堂分歧',
    description: '改革触动祖宗之法，也触动士大夫政治中的信任与边界。',
  },
  {
    title: '熙宁入政',
    scene: '王安石入政',
    description: '王安石进入权力核心，新法从奏章走向朝廷日程。',
  },
  {
    title: '青苗法',
    scene: '青苗法',
    description: '国家介入民间借贷，救助与增收之间暗含执行风险。',
  },
  {
    title: '募役法',
    scene: '募役法',
    description: '旧有差役被财政化改造，制度效率与征收压力并行。',
  },
  {
    title: '市易法',
    scene: '市易法',
    description: '官府试图调节市场，平抑物价，也面对与民争利的批评。',
  },
  {
    title: '保甲法',
    scene: '保甲法',
    description: '基层组织承担治安与军事训练，强兵之路贴近乡里日常。',
  },
  {
    title: '新旧党争',
    scene: '新旧党争',
    description: '政策争论逐渐变成政治阵营，改革成本随之改变。',
  },
  {
    title: '熙宁改良',
    scene: '熙宁改良',
    description: '在史实边界内想象一种更稳的制度留痕。',
  },
];

export const getEnding = (stats) => endings.find((ending) => ending.test(stats));

export const clampStat = (value) => Math.max(0, Math.min(100, value));
