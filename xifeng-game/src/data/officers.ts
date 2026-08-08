import type { Officer, PolicyTag } from '../game/types';

type OfficerSeed = Omit<Officer, 'priorities' | 'redLines' | 'voice' | 'historicalSignificance' | 'whyImportant' | 'majorContributions' | 'timeline' | 'sources'> & {
  priorities?: string[];
  redLines?: string[];
  voice?: string;
  historicalSignificance?: string;
  whyImportant?: string[];
  majorContributions?: string[];
  timeline?: Officer['timeline'];
  sources?: Officer['sources'];
};

const makeOfficer = (seed: OfficerSeed): Officer => ({
  priorities: seed.priorities ?? ['奉行诏令', '维持政务'],
  redLines: seed.redLines ?? ['无据兴狱', '因私废公'],
  voice: seed.voice ?? '言辞随其经历与政见而异，须结合奏议与实际施政判断。',
  historicalSignificance: seed.historicalSignificance ?? seed.description,
  whyImportant: seed.whyImportant ?? [seed.description],
  majorContributions: seed.majorContributions ?? [`以${seed.role}身份参与熙宁时期政务。`],
  timeline: seed.timeline ?? [
    /^\d{4}/.test(seed.lifespan)
      ? { year: seed.lifespan.slice(0, 4), event: `生于${seed.origin}` }
      : { year: '生年未详', event: `籍贯${seed.origin}` },
    { year: '熙宁', event: `以${seed.role}参与朝政` },
  ],
  sources: seed.sources ?? [],
  ...seed,
});

export const officers: Officer[] = [
  makeOfficer({
    id: 'wang-anshi', name: '王安石', courtesyName: '介甫', lifespan: '1021—1086', origin: '抚州临川',
    role: '参知政事', stance: '新法核心', group: 'reform', specialtyTags: ['finance', 'reform'], executionBonus: 2, politicalCostModifier: 2,
    description: '长于制度设计与理财，但强推新法容易扩大朝议冲突。', personality: '坚毅自负，重原则而轻人情。',
    verdict: '一纸新经筹国计，半生毁誉付苍生。',
    governingStyle: '先立法度，再以考课督促州县；容忍试行失误，不容因循拖延。', priorities: ['富国强兵', '整顿财政', '建立长期制度'], redLines: ['因士论压力尽罢新法', '以姑息换取短期安稳'],
    voice: '言辞简峻，善从经义与国家长远财计立论。', biography: '历任地方官，熟悉州县财政与民间疾苦。熙宁二年入参大政，主持制置三司条例司，成为新法的主要设计者。',
    publicReputation: '支持者称其有经世之志，反对者指其执拗急进。', historiography: '评价长期分裂，不能用“贤相”或“乱法者”单一概括。', sourceNote: '《宋史》卷三二七；《续资治通鉴长编》熙宁诸卷。',
    historicalSignificance: '北宋政治家、思想家与文学家，熙宁变法的核心设计者。',
    whyImportant: ['主持熙宁变法，重塑北宋财政、军政与教育制度。', '改革争论长期影响后世国家治理思想。'],
    majorContributions: ['推动青苗、募役、保甲等新法。', '改革学校与科举内容，强调经义和经世能力。'],
    timeline: [
      { year: '1021', event: '生于抚州临川' },
      { year: '1058', event: '上万言书' },
      { year: '1069', event: '入中枢主持变法' },
      { year: '1076', event: '罢相退居江宁' },
    ],
    sources: [
      {
        type: '本人文章', title: '答司马谏议书', context: '王安石回应司马光对新法“侵官、生事、征利、拒谏”等批评。',
        excerpt: '某则以谓受命于人主，议法度而修之于朝廷，以授之于有司，不为侵官；举先王之政，以兴利除弊，不为生事；为天下理财，不为征利；辟邪说，难壬人，不为拒谏。',
        fullText: '某启：昨日蒙教，窃以为与君实游处相好之日久，而议事每不合，所操之术多异故也。虽欲强聒，终必不蒙见察，故略上报，不复一一自辨。重念蒙君实视遇厚，于反覆不宜卤莽，故今具道所以，冀君实或见恕也。\n\n盖儒者所争，尤在于名实。名实已明，而天下之理得矣。今君实所以见教者，以为侵官、生事、征利、拒谏，以致天下怨谤也。某则以谓受命于人主，议法度而修之于朝廷，以授之于有司，不为侵官；举先王之政，以兴利除弊，不为生事；为天下理财，不为征利；辟邪说，难壬人，不为拒谏。至于怨谤之多，则固前知其如此也。\n\n人习于苟且非一日，士大夫多以不恤国事、同俗自媚于众为善。上乃欲变此，而某不量敌之众寡，欲出力助上以抗之，则众何为而不汹汹然？盘庚之迁，胥怨者民也，非特朝廷士大夫而已；盘庚不为怨者故改其度，度义而后动，是而不见可悔故也。如君实责我以在位久，未能助上大有为，以膏泽斯民，则某知罪矣；如曰今日当一切不事事，守前所为而已，则非某之所敢知。\n\n无由会晤，不任区区向往之至。',
        translation: '王安石认为，受皇帝之命在朝廷讨论并制定法度，再交有关官署执行，不算侵犯官职；推行先王之政、兴利除弊，不算无故生事；替天下治理财政，不等于与民争利。',
        significance: '这段文字集中说明了王安石如何为变法的合法性、财政目标与政治执行方式辩护。',
        citation: '王安石《答司马谏议书》，《王临川集》卷七十三。',
      },
      {
        type: '本人文章', title: '乞制置三司条例', context: '熙宁初年讨论设置制置三司条例司时，王安石说明财政制度与义理的关系。',
        excerpt: '盖聚天下之人，不可以无财；理天下之财，不可以无义。',
        fullText: '窃观先王之法，自畿之内，赋入精粗，以百里为之差，而畿外邦国，各以所有为贡，又为经用通财之法，以懋迁之。其治市之货财，则亡者使有，害者使除；市之不售，货之滞于民用，则吏为敛之，以待不时而买者。凡此非专利也。盖聚天下之人，不可以无财；理天下之财，不可以无义。夫以义理天下之财，则转输之劳逸，不可以不均，用度之多寡，不可以不通，货贿之有无，不可以不制，而轻重敛散之权，不可以无术。今天下财用，窘急无余，典领之官，拘于弊法，内外不以相知，盈虚不以相补。诸路上供，岁有定额，丰年便道，可以多致，而不敢不赢；年俭物贵，难于供备，而不敢不足。远方有倍蓰之输，中都有半价之鬻。三司发运使按簿书、促期会而已，无所可否增损于其间。至遇军国郊祀之大费，则遣使铲刷，殆无余藏，诸司财用事，往往为伏匿，不敢实言，以备缓急。又忧年计之不足，则多为支移折变，以取之民，纳租税数，至或倍其本数。而朝廷所用之物，多求于不产，责于非时，富商大贾，因时乘公私之急，以擅轻重敛散之权。\n\n臣等以谓发运使总六路之赋入，而其职以制置茶盐矾税为事，军储国用，多所仰给，宜假以钱货，继其用之不给，使周知六路财赋之有无，而移用之。凡籴买税敛上供之物，皆得徙贵就贱，用近易远，令在京库藏年支见在之定数所当供办者，得以从便变卖，以待上令。稍收轻重敛散之权，归之公上，而制其有无，以便转输，省劳费，去重敛，宽农民，庶几国用可足，民财不匮矣。所有本司合置官属，许令辟举，及有合行事件，令依条例以闻，奏下制置司参议施行。',
        translation: '治理天下众人离不开财政，但治理天下财用也不能脱离合宜的原则。',
        significance: '它表明王安石并不把理财单纯理解为增加收入，而是强调财政制度必须与公共秩序和政治原则相联系。',
        citation: '王安石《乞制置三司条例》，《王临川集》相关奏议。',
      },
    ],
  }),
  makeOfficer({
    id: 'sima-guang', name: '司马光', courtesyName: '君实', lifespan: '1019—1086', origin: '陕州夏县',
    role: '翰林学士', stance: '新法批评者', group: 'critic', specialtyTags: ['administration', 'relief'], executionBonus: 0, politicalCostModifier: -2,
    description: '声望深厚，重视秩序与民力，但不赞成激进理财。', personality: '谨慎克制，重名分与经验。', governingStyle: '先查旧弊与地方承受能力，再作渐进调整。', priorities: ['保存民力', '维持法度', '降低政策反复'], redLines: ['以理财之名强制取利', '绕过台谏与常规议政'],
    verdict: '鉴里兴亡明似水，阶前新旧各成霜。',
    voice: '语气沉稳而锋利，常从祖宗成法、民间实际和长期后果反驳。', biography: '历仕仁宗、英宗、神宗三朝，主持编纂《资治通鉴》。熙宁年间多次与王安石论辩新法，后退居洛阳。',
    publicReputation: '以名节、史学和守成声望著称，也被批评缺乏应对财政危机的新工具。', historiography: '其反对新法并非否认全部积弊，而是质疑国营理财和急速推行。', sourceNote: '《宋史》卷三三六；《续资治通鉴长编》。',
    historicalSignificance: '北宋政治家与史学家，《资治通鉴》的主持编纂者，也是新法最重要的批评者之一。',
    whyImportant: ['以历史经验和民力承受能力检验改革得失。', '主持编纂《资治通鉴》，深刻影响后世政治史学。'],
    majorContributions: ['主持编纂《资治通鉴》。', '持续上疏讨论青苗法、财政与言路问题。'],
    timeline: [
      { year: '1019', event: '生于光州光山' },
      { year: '1066', event: '进呈《通志》八卷' },
      { year: '1070', event: '反对新法并辞枢密副使' },
      { year: '1084', event: '完成《资治通鉴》' },
    ],
  }),
  makeOfficer({
    id: 'han-qi', name: '韩琦', courtesyName: '稚圭', lifespan: '1008—1075', origin: '相州安阳',
    role: '枢密重臣', stance: '元老稳健', group: 'moderate', specialtyTags: ['military', 'administration'], executionBonus: 1, politicalCostModifier: -1,
    description: '熟悉边务并能稳定朝局，改革锐度相对有限。', personality: '老成务实，重视可执行性。', governingStyle: '先保边防、财政和朝局基本稳定，再作制度调整。',
    verdict: '三朝柱石扶危局，一片持衡老将心。',
    biography: '庆历名臣，长期主持军政与地方事务。神宗初年位望极高，对青苗等新法持批评态度。', publicReputation: '朝野视为元老，声望可稳定局势，也可能牵制急进改革。', historiography: '其政治选择常以稳定国家基本盘为先。', sourceNote: '《宋史》卷三一二。',
  }),
  makeOfficer({
    id: 'lv-huiqing', name: '吕惠卿', courtesyName: '吉甫', lifespan: '1032—1111', origin: '泉州晋江',
    role: '条例司检详文字', stance: '新法执行派', group: 'contested', specialtyTags: ['finance', 'administration'], executionBonus: 3, politicalCostModifier: 3,
    description: '执行和技术能力突出，但急切奉行与权力斗争风险较高。', personality: '精明敏锐，进取心强。', governingStyle: '细化指标、强化核验并快速推广。', priorities: ['提高执行效率', '精确核算财赋', '扩大新法覆盖'], redLines: ['州县因循抵制', '没有考核标准的空泛诏令'],
    verdict: '算尽新章通利柄，机关深处失知音。',
    biography: '深度参与新法条文制定，王安石首次罢相后曾主持政务，后来二人决裂。', publicReputation: '既被视为能办事的改革官僚，也长期背负倾轧与操守争议。', historiography: '《宋史》列入奸臣传，但这一后世分类不能替代对具体政绩和案件的核验。', sourceNote: '《宋史》卷四七一；《续资治通鉴长编》。',
  }),
  makeOfficer({
    id: 'zeng-bu', name: '曾布', courtesyName: '子宣', lifespan: '1036—1107', origin: '建昌南丰', role: '条例司官', stance: '新法实务派', group: 'contested',
    specialtyTags: ['finance', 'reform'], executionBonus: 2, politicalCostModifier: 2, description: '熟悉财赋与新法条目，敢于核查同党的执行问题。', personality: '机敏务实，政治判断随局势变化。', governingStyle: '以账目和成效衡量政策，必要时纠正新法机构。',
    verdict: '账底能窥新法病，局中难辨进退心。',
    biography: '参与青苗、免役、保甲等法的讨论和实施，后曾核查市易务弊端。', publicReputation: '才具得到承认，但政治进退与党派关系多受争议。', historiography: '《宋史》列入奸臣传，后世亦有为其才能与操守辩护者。', sourceNote: '《宋史》卷四七一。',
  }),
  makeOfficer({
    id: 'zhang-dun', name: '章惇', courtesyName: '子厚', lifespan: '1035—1105', origin: '建州浦城', role: '编修三司条例官', stance: '进取新党', group: 'contested',
    specialtyTags: ['reform', 'military'], executionBonus: 3, politicalCostModifier: 3, description: '才干强、敢冒险，擅长开边与强力行政，政治代价也高。', personality: '强悍果决，好胜而少退让。', governingStyle: '倾向以集中权力和高压执行突破阻力。',
    verdict: '铁腕开疆惊世路，孤峰回首尽风霜。',
    biography: '熙宁时期参与改革并经营南方边事，后来成为新党重要领袖。', publicReputation: '有卓越行政能力，也以手段强硬和党争报复著称。', historiography: '后世评价受元祐、绍圣党争影响尤深。', sourceNote: '《宋史》卷四七一。',
  }),
  makeOfficer({
    id: 'han-jiang', name: '韩绛', courtesyName: '子华', lifespan: '1012—1088', origin: '开封雍丘', role: '参知政事', stance: '温和新法', group: 'reform',
    specialtyTags: ['administration', 'reform'], executionBonus: 1, politicalCostModifier: 1, description: '能够协调朝政与新法，但独立主持改革的力度有限。', personality: '持重而有政治协调能力。', governingStyle: '在既有官僚体系内推进新政，偏好折中。',
    verdict: '缓引新章调众议，持衡终未作潮头。',
    biography: '历任枢密、宰执，支持变法并在王安石罢相时主持朝政。', publicReputation: '常被视为新法与元老政治之间的协调者。', historiography: '其作用更多体现在维持制度连续性，而非创制新法。', sourceNote: '《宋史》卷三一五。',
  }),
  makeOfficer({
    id: 'cai-que', name: '蔡确', courtesyName: '持正', lifespan: '1037—1093', origin: '泉州晋江', role: '监察御史里行', stance: '新党御史', group: 'contested',
    specialtyTags: ['administration', 'reform'], executionBonus: 2, politicalCostModifier: 3, description: '精于察言与司法政务，但迎合上意、兴狱倾向值得警惕。', personality: '敏锐善变，权力嗅觉极强。', governingStyle: '利用台谏和司法迅速排除阻力。',
    verdict: '台端善识风云意，狱底难逃毁誉名。',
    biography: '因邓绾举荐进入御史系统，熙丰时期逐步升迁，后来官至宰相。', publicReputation: '能断事，也被指善观人主意旨、借案件求进。', historiography: '《宋史》列入奸臣传；游戏应让其具体行为形成评价，而非预置结论。', sourceNote: '《宋史》卷四七一。',
  }),
  makeOfficer({
    id: 'wen-yanbo', name: '文彦博', courtesyName: '宽夫', lifespan: '1006—1097', origin: '汾州介休', role: '枢密使', stance: '元老旧臣', group: 'moderate',
    specialtyTags: ['administration', 'military'], executionBonus: 1, politicalCostModifier: -1, description: '资历深厚、善持大体，对新法和基层组织军事化多有保留。', personality: '沉稳有权略，重朝廷体统。', governingStyle: '依靠成熟官僚与旧制维持秩序。',
    verdict: '四朝勋望安邦重，一席旧章拒浪高。',
    biography: '历仕多朝，长期居枢要。熙宁时期反对部分新法，后出判地方。', publicReputation: '元老名望极高，也可能被视为维护既有官僚利益。', historiography: '应区分其制度保守、集团利益与实际治绩。', sourceNote: '《宋史》卷三一三。',
  }),
  makeOfficer({
    id: 'fu-bi', name: '富弼', courtesyName: '彦国', lifespan: '1004—1083', origin: '河南洛阳', role: '同中书门下平章事', stance: '元老批评者', group: 'critic',
    specialtyTags: ['relief', 'administration'], executionBonus: 1, politicalCostModifier: -1, description: '善于外交和赈济，反对以国家信用强取民财。', personality: '持正宽厚，临大事有决断。', governingStyle: '重视灾情、民力和社会信用。',
    verdict: '使节曾纾边上难，青苗不肯损民生。',
    biography: '庆历名臣，处理外交与河北赈灾颇有声誉。神宗朝因反对青苗法而退。', publicReputation: '以德望和赈济能力著称。', historiography: '其反对意见适合用于检验改革是否越过救民底线。', sourceNote: '《宋史》卷三一三。',
  }),
  makeOfficer({
    id: 'lv-gongzhu', name: '吕公著', courtesyName: '晦叔', lifespan: '1018—1089', origin: '寿州', role: '御史中丞', stance: '稳健批评者', group: 'critic',
    specialtyTags: ['administration', 'relief'], executionBonus: 1, politicalCostModifier: -1, description: '重名节与制度监督，能够稳定士论。', personality: '谨厚寡言，持守原则。', governingStyle: '强调台谏监督和政策反复论证。',
    verdict: '清议一身持国是，沉言半世守朝纲。',
    biography: '出身名门，熙宁时期对新法多有异议，后成为旧党重要人物。', publicReputation: '清望甚高，但政治影响与家族网络同样不可忽视。', historiography: '适合表现名望既能护持法度，也能形成政治阵营。', sourceNote: '《宋史》卷三三六。',
  }),
  makeOfficer({
    id: 'fan-chunren', name: '范纯仁', courtesyName: '尧夫', lifespan: '1027—1101', origin: '苏州吴县', role: '知谏院', stance: '恤民批评者', group: 'critic',
    specialtyTags: ['relief', 'administration'], executionBonus: 0, politicalCostModifier: -1, description: '重民生与宽政，敢于批评新旧两党的过激做法。', personality: '宽厚持正，不以党派废人。', governingStyle: '优先减轻基层负担，避免报复性政治。',
    verdict: '宁宽一寸全民命，不以新旧定贤愚。',
    biography: '范仲淹之子，熙宁间多次上言新法扰民，亦反对以党论人。', publicReputation: '清正宽厚，实际推进速度较慢。', historiography: '其价值在于跨越新旧标签的政治伦理。', sourceNote: '《宋史》卷三一四。',
  }),
  makeOfficer({
    id: 'su-shi', name: '苏轼', courtesyName: '子瞻', lifespan: '1037—1101', origin: '眉州眉山', role: '开封府推官', stance: '地方批评者', group: 'critic',
    specialtyTags: ['relief', 'administration'], executionBonus: 1, politicalCostModifier: 0, description: '善察地方实际与百姓感受，言辞锋利，容易触怒权力中心。', personality: '旷达敏锐，敢言而不善自晦。', governingStyle: '重视因地制宜，反对指标化强推。',
    verdict: '笔挟江山忧世病，身随风雨问苍生。',
    biography: '文学家与地方官。并非反对一切改革，但持续批评新法执行与言路问题。', publicReputation: '文名极盛，政治上既受敬重也易成为攻击目标。', historiography: '人物文化价值不应遮蔽其具体行政经验。', sourceNote: '《宋史》卷三三八；《苏轼文集》。',
  }),
  makeOfficer({
    id: 'su-zhe', name: '苏辙', courtesyName: '子由', lifespan: '1039—1112', origin: '眉州眉山', role: '制置三司条例司属官', stance: '审慎批评者', group: 'critic',
    specialtyTags: ['finance', 'relief'], executionBonus: 1, politicalCostModifier: 0, description: '熟悉新法早期讨论，重财政现实，也警惕官府与民争利。', personality: '沉静周密，议论较苏轼克制。', governingStyle: '先核算长期成本，再决定政策规模。',
    verdict: '曾入新司知利病，退从冷眼算民财。',
    biography: '曾进入条例司，后因意见不合离开，具有从改革机构内部观察新法的经历。', publicReputation: '议论详实，党争中常与兄长共同进退。', historiography: '适合呈现“参与过改革的批评者”这一复杂位置。', sourceNote: '《宋史》卷三三九；《栾城集》。',
  }),
  makeOfficer({
    id: 'cheng-hao', name: '程颢', courtesyName: '伯淳', lifespan: '1032—1085', origin: '河南洛阳', role: '监察御史里行', stance: '儒学批评者', group: 'critic',
    specialtyTags: ['administration', 'relief'], executionBonus: 0, politicalCostModifier: -1, description: '重教化、民情与官员责任，反对严密考课导致的扰民。', personality: '温厚自持，重道德教化。', governingStyle: '依赖贤吏与地方教化，不尚急迫刑名。',
    verdict: '一腔仁恕观民瘼，半卷儒风拒急功。',
    biography: '曾任地方官和御史，与王安石有旧交而在新法问题上分歧。', publicReputation: '以学问与仁政见称。', historiography: '其制度主张需与后世理学形象区分。', sourceNote: '《宋史》卷四二七。',
  }),
  makeOfficer({
    id: 'zheng-xia', name: '郑侠', courtesyName: '介夫', lifespan: '1041—1119', origin: '福州福清', role: '监安上门', stance: '民情谏诤', group: 'critic',
    specialtyTags: ['relief', 'administration'], executionBonus: -1, politicalCostModifier: 0, description: '敢以流民图直达天听，行政资历有限，但能揭示被遮蔽的灾情。', personality: '激烈执着，不计个人进退。', governingStyle: '重现场见闻与百姓申诉，轻官僚层层文书。',
    verdict: '一图流民惊帝座，孤臣寸纸赌生平。',
    biography: '熙宁七年绘《流民图》上呈，借灾民困苦批评新法执行。', publicReputation: '有人称其忠直，也有人认为其借灾情作政治攻击。', historiography: '其材料应同时接受事实核查与政治语境分析。', sourceNote: '《宋史》卷三二一。',
  }),
  makeOfficer({
    id: 'shen-kuo', name: '沈括', courtesyName: '存中', lifespan: '1031—1095', origin: '杭州钱塘', role: '检正中书刑房公事', stance: '技术官僚', group: 'statecraft',
    specialtyTags: ['military', 'administration'], executionBonus: 2, politicalCostModifier: 1, description: '长于测绘、水利、军政和财政技术，政治判断并非没有争议。', personality: '博学精细，重实测与技术方案。', governingStyle: '调查数据、制作图籍，再据实调整。',
    verdict: '格物能穷天地理，临边未免庙堂争。',
    biography: '参与水利、使辽、军需和西北边事，后来著《梦溪笔谈》。', publicReputation: '以博学和技术能力著称，也卷入边事与党争责任。', historiography: '不能只作为“科学家”展示，应呈现其官僚与军事活动。', sourceNote: '《宋史》卷三三一；《梦溪笔谈》。',
  }),
  makeOfficer({
    id: 'wang-shao', name: '王韶', courtesyName: '子纯', lifespan: '1030—1081', origin: '江州德安', role: '秦凤路经略安抚司干当公事', stance: '开边实务派', group: 'statecraft',
    specialtyTags: ['military', 'reform'], executionBonus: 3, politicalCostModifier: 2, description: '熟悉河湟形势，能开拓边防，但军费、冒险和治理成本极高。', personality: '有谋略而进取，善抓边地机会。', governingStyle: '军事、招抚、贸易和行政建置并用。',
    verdict: '河湟一策开千里，功业还从饷道量。',
    biography: '提出经营河湟方略，成为熙河开边的关键人物。', publicReputation: '被赞为边功之臣，也因借贷军费和战争代价受弹劾。', historiography: '边功、族群治理与财政代价必须同时呈现。', sourceNote: '《宋史》卷三二八。',
  }),
  makeOfficer({
    id: 'guo-kui', name: '郭逵', courtesyName: '仲通', lifespan: '1022—1088', origin: '洛阳', role: '秦凤路经略安抚使', stance: '宿将', group: 'statecraft',
    specialtyTags: ['military', 'administration'], executionBonus: 2, politicalCostModifier: 0, description: '久经边事，重军纪和后勤，对冒进开边较为警惕。', personality: '严整持重，有宿将威望。', governingStyle: '先核军需与地势，再议出兵。',
    verdict: '百战老成知进退，一军持重辨虚实。',
    biography: '长期任职西北，曾参与对王韶相关军费问题的核查，后统军南征。', publicReputation: '军中资历深厚，也可能与新进边臣发生冲突。', historiography: '适合表现专业分歧如何被党争重新解释。', sourceNote: '《宋史》卷三四九。',
  }),
  makeOfficer({
    id: 'wang-gui', name: '王珪', courtesyName: '禹玉', lifespan: '1019—1085', origin: '成都华阳', role: '翰林学士承旨', stance: '中枢持衡', group: 'moderate',
    specialtyTags: ['administration', 'reform'], executionBonus: 1, politicalCostModifier: 0, description: '熟悉制诰与中枢程序，善于顺应上意，但主动担当常受质疑。', personality: '谨慎圆熟，极少公开冒险。', governingStyle: '重诏令程序和中枢协调，避免独担政治风险。',
    verdict: '制诰文章承帝意，持衡岁月少锋芒。',
    biography: '长期掌制诰，神宗朝后期官至宰相，是中枢运转的重要人物。', publicReputation: '文辞与资历受认可，也被讥为少有建明。', historiography: '其“无作为”可能是自保，也可能是维持制度连续性的方式。', sourceNote: '《宋史》卷三一二。',
  }),
  makeOfficer({
    id: 'feng-jing', name: '冯京', courtesyName: '当世', lifespan: '1021—1094', origin: '鄂州江夏', role: '参知政事', stance: '中间派', group: 'moderate',
    specialtyTags: ['administration', 'relief'], executionBonus: 1, politicalCostModifier: 0, description: '立场较独立，能在新旧之间提出保留意见。', personality: '沉着审慎，不轻附和。', governingStyle: '维持中枢程序，逐项评估新法得失。',
    verdict: '不逐两端争赤帜，独将持正立中流。',
    biography: '状元出身，神宗朝进入执政，既不完全依附新党，也与旧臣保持距离。', publicReputation: '被视为持正，也可能因缺乏党援而施展有限。', historiography: '适合体现二元党派之外的政治空间。', sourceNote: '《宋史》卷三一七。',
  }),
  makeOfficer({
    id: 'deng-wan', name: '邓绾', courtesyName: '文约', lifespan: '1028—1080', origin: '成都双流', role: '御史中丞', stance: '趋附新进', group: 'contested',
    specialtyTags: ['administration', 'reform'], executionBonus: 1, politicalCostModifier: 3, description: '善于揣摩政治风向和组织弹劾，可能迅速清除阻力，也可能伤害法度。', personality: '机巧趋进，政治依附性强。', governingStyle: '倚台谏声势推进人事更替。',
    verdict: '风向才回身已转，台章写尽进身心。',
    biography: '因支持新法获召入朝，参与御史人事与政治攻防，王安石亦曾批评其为宰臣求恩伤国体。', publicReputation: '被视为善迎合权势的典型，但具体指控仍应逐案核验。', historiography: '《宋史》传文明显带有贬笔，适合设计“清议是否可靠”的案件。', sourceNote: '《宋史》卷三二九。',
  }),
  makeOfficer({
    id: 'li-ding', name: '李定', courtesyName: '资深', lifespan: '1027—1087', origin: '扬州', role: '监察御史里行', stance: '新法御史', group: 'contested',
    specialtyTags: ['administration', 'reform'], executionBonus: 1, politicalCostModifier: 3, description: '执法强硬、敢攻大臣，孝制争议与乌台诗案使其名声复杂。', personality: '峻急好进，善于罗列罪状。', governingStyle: '强调法令威慑和台谏纠察。',
    verdict: '法网高张称敢击，是非深处问公心。',
    biography: '获王安石赏识进入御史台，因母丧服制争议受到攻击，元丰时参与追究苏轼。', publicReputation: '支持者称其敢言，反对者视其为罗织之吏。', historiography: '应把服制、政见和具体办案行为分开判断。', sourceNote: '《宋史》卷三二九。',
  }),
  makeOfficer({
    id: 'shu-dan', name: '舒亶', courtesyName: '信道', lifespan: '1041—1103', origin: '明州慈溪', role: '御史台官', stance: '强硬御史', group: 'contested',
    specialtyTags: ['administration', 'reform'], executionBonus: 2, politicalCostModifier: 3, description: '办案和文字能力强，攻击政敌时容易扩大罪名。', personality: '锐利峻刻，政治进取心强。', governingStyle: '从文书言辞中追索政治责任。',
    verdict: '字里寻愆成利刃，台中执法亦成名。',
    biography: '神宗朝进入御史系统，元丰时期参与乌台诗案。', publicReputation: '以能吏和酷刻两种形象并存。', historiography: '游戏应通过证据充分度决定其监察行为是纠奸还是罗织。', sourceNote: '《宋史》卷三二九。',
  }),
  makeOfficer({
    id: 'lv-jiawen', name: '吕嘉问', courtesyName: '望之', lifespan: '生卒年待考', origin: '淮南下蔡', role: '提举市易务', stance: '市易执行官', group: 'contested',
    specialtyTags: ['finance', 'administration'], executionBonus: 3, politicalCostModifier: 2, description: '熟悉市场与官营周转，容易越过平准边界形成官府争利。', personality: '精于营办，重收益和执行规模。', governingStyle: '以官府资本快速介入市场流通。',
    verdict: '市易能回天下货，官商一线最难量。',
    biography: '受任主持京师市易务，是市易法实际执行的重要人物。其经营方式在新法内部也引起争议。', publicReputation: '既可被视为经济制度创新者，也被指多取息钱、凭公权兼并。', historiography: '应通过账簿、利率与商户申诉呈现争议，而非预设贪吏标签。', sourceNote: '《续资治通鉴长编》熙宁市易法相关记载。',
  }),
  makeOfficer({
    id: 'cheng-fang', name: '程昉', courtesyName: '生平资料从略', lifespan: '？—1076', origin: '开封府', role: '都水监官', stance: '河工近臣', group: 'contested',
    specialtyTags: ['administration', 'finance'], executionBonus: 2, politicalCostModifier: 3, description: '擅长组织大型河工，但工程扰民、虚功与倚势问题风险突出。', personality: '强势急进，善借内廷支持办事。', governingStyle: '集中夫役和钱粮追求工程进度。',
    verdict: '欲引长河成治绩，却教夫役泣堤旁。',
    biography: '神宗朝主持河防与水利工程，因宦者身份、工程效果及役民问题屡受争议。', publicReputation: '治河能力与扰民指控并存。', historiography: '适合成为河工账目、强征夫役和监察失灵案件的中心。', sourceNote: '《宋史·宦者传》及《续资治通鉴长编》。',
  }),
];

export const officerGroups: Record<Officer['group'], string> = {
  reform: '新法政务', critic: '异议清议', moderate: '中枢持衡', statecraft: '边事实务', contested: '争议人物',
};

export const officerTagLabels: Record<PolicyTag, string> = {
  finance: '理财', relief: '恤民', military: '边务', administration: '吏治', reform: '变法',
};

export function getOfficer(id: string): Officer | undefined {
  return officers.find((officer) => officer.id === id);
}
