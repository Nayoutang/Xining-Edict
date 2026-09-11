// ai-history.mjs
var PROVIDERS = {
  deepseek: { apiType: "openai", baseUrl: "https://api.deepseek.com", model: "deepseek-flash" },
  openai: { apiType: "openai", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  anthropic: { apiType: "anthropic", baseUrl: "https://api.anthropic.com/v1", model: "claude-3-5-sonnet-latest" },
  qwen: { apiType: "openai", baseUrl: "https://ws-esx5vi3vpbs2mg95.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", model: "qwen3.7-plus" },
  kimi: { apiType: "openai", baseUrl: "https://api.moonshot.cn/v1", model: "moonshot-v1-32k" },
  zhipu: { apiType: "openai", baseUrl: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-plus" },
  custom: { apiType: "openai", baseUrl: "", model: "" }
};
var allowedPolicies = [
  ["green-sprouts-trial", "\u9752\u82D7\u6CD5\u8BD5\u884C"],
  ["service-reform-preparation", "\u52DF\u5F79\u6CD5\u51C6\u5907"],
  ["water-conservancy", "\u5174\u4FEE\u519C\u7530\u6C34\u5229"],
  ["curb-local-exactions", "\u6574\u987F\u5DDE\u53BF\u644A\u6D3E"],
  ["reduce-redundant-spending", "\u88C1\u51CF\u5197\u8D39"],
  ["northwest-defense", "\u52A0\u5F3A\u897F\u5317\u8FB9\u5907"],
  ["review-impeachments", "\u590D\u6838\u53F0\u8C0F\u5F39\u7AE0"],
  ["cross-check-ledgers", "\u5BF9\u52D8\u5B98\u7F72\u8D26\u7C3F"],
  ["discipline-corrupt-officials", "\u4F9D\u6CD5\u9EDC\u965F\u5978\u8839"],
  ["open-ended-directive", "\u5FA1\u524D\u4E13\u9879\u653F\u52A1"]
];
var allowedOfficers = [
  ["wang-anshi", "\u738B\u5B89\u77F3"],
  ["sima-guang", "\u53F8\u9A6C\u5149"],
  ["han-qi", "\u97E9\u7426"],
  ["lv-huiqing", "\u5415\u60E0\u537F"],
  ["zeng-bu", "\u66FE\u5E03"],
  ["zhang-dun", "\u7AE0\u60C7"],
  ["han-jiang", "\u97E9\u7EDB"],
  ["cai-que", "\u8521\u786E"],
  ["wen-yanbo", "\u6587\u5F66\u535A"],
  ["fu-bi", "\u5BCC\u5F3C"],
  ["lv-gongzhu", "\u5415\u516C\u8457"],
  ["fan-chunren", "\u8303\u7EAF\u4EC1"],
  ["su-shi", "\u82CF\u8F7C"],
  ["su-zhe", "\u82CF\u8F99"],
  ["cheng-hao", "\u7A0B\u98A2"],
  ["zheng-xia", "\u90D1\u4FA0"],
  ["shen-kuo", "\u6C88\u62EC"],
  ["wang-shao", "\u738B\u97F6"],
  ["guo-kui", "\u90ED\u9035"],
  ["wang-gui", "\u738B\u73EA"],
  ["feng-jing", "\u51AF\u4EAC"],
  ["deng-wan", "\u9093\u7EFE"],
  ["li-ding", "\u674E\u5B9A"],
  ["shu-dan", "\u8212\u4EB6"],
  ["lv-jiawen", "\u5415\u5609\u95EE"],
  ["cheng-fang", "\u7A0B\u6609"]
];
var internalTermLabels = [
  ["politicalCostModifier", "\u653F\u7565\u6D88\u8017\u4FEE\u6B63"],
  ["politicalOverdraft", "\u653F\u7565\u900F\u652F"],
  ["administrativeOverload", "\u884C\u653F\u8D85\u8F7D"],
  ["politicalCapital", "\u653F\u7565"],
  ["executionBonus", "\u6267\u884C\u4FEE\u6B63"],
  ["courtSupport", "\u58EB\u8BBA"],
  ["livelihood", "\u6C11\u751F"],
  ["administration", "\u884C\u653F"],
  ["treasury", "\u56FD\u5E93"],
  ["execution", "\u6267\u884C"],
  ["severity", "\u4E25\u91CD\u5EA6"],
  ["finance", "\u8D22\u7528"],
  ["defense", "\u8FB9\u5907"],
  ["censorial-dossier", "\u53F0\u8C0F\u5F39\u7AE0\u590D\u6838"],
  ["verified-misconduct", "\u8D26\u8BC1\u6838\u5B9E"],
  ["disciplined-corruption", "\u5978\u8839\u5904\u7F6E"],
  ["fiscal-imbalance", "\u56FD\u7528\u532E\u4E4F"],
  ["weak-administration", "\u653F\u4EE4\u58C5\u6EDE"],
  ["border-pressure", "\u897F\u5317\u8FB9\u5907\u7A7A\u865A"],
  ["livelihood-strain", "\u6C11\u529B\u56F0\u655D"],
  ["forced-loans", "\u9752\u82D7\u6291\u914D"],
  ["factional-politics", "\u65B0\u65E7\u515A\u8BAE"],
  ["concealed-corruption", "\u7C3F\u7C4D\u771F\u4F2A\u96BE\u660E"],
  ["administrative-overload", "\u6709\u53F8\u58C5\u6EDE"],
  ...allowedPolicies,
  ...allowedOfficers
].sort(([left], [right]) => right.length - left.length);
function localizeInternalTerms(value) {
  let text = String(value ?? "");
  for (const [internal, label] of internalTermLabels) {
    text = text.replace(new RegExp(internal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), label);
  }
  return text.trim();
}
var plainReactionLeads = /* @__PURE__ */ new Map([
  ["\u671D\u8BAE", "\u671D\u81E3\u6700\u5173\u5FC3\u65B0\u6CD5\u4F1A\u4E0D\u4F1A\u5931\u63A7\u3002"],
  ["\u4E09\u53F8", "\u4E09\u53F8\u5148\u770B\u94B1\u4ECE\u54EA\u91CC\u6765\u3001\u591F\u4E0D\u591F\u82B1\u3002"],
  ["\u53F0\u8C0F", "\u53F0\u8C0F\u6700\u6015\u653F\u4EE4\u6270\u6C11\u53C8\u65E0\u4EBA\u62C5\u8D23\u3002"],
  ["\u5DDE\u53BF", "\u5DDE\u53BF\u5728\u610F\u4EBA\u624B\u548C\u671F\u9650\u80FD\u5426\u6491\u4F4F\u3002"],
  ["\u8C6A\u5F3A", "\u5730\u65B9\u8C6A\u5F3A\u5148\u7B97\u81EA\u5DF1\u635F\u5931\u591A\u5C11\u3002"],
  ["\u767E\u59D3", "\u767E\u59D3\u53EA\u770B\u8D1F\u62C5\u662F\u5426\u771F\u7684\u51CF\u8F7B\u3002"]
]);
function addPlainReactionLead(label, value) {
  const text = localizeInternalTerms(value).replace(/^(?:直白说|简单说|说白了)[，,:：]?\s*/, "");
  const lead = plainReactionLeads.get(label) || `${label}\u5148\u770B\u8FD9\u9053\u653F\u4EE4\u5982\u4F55\u5F71\u54CD\u81EA\u8EAB\u3002`;
  if (text.startsWith(lead)) return text;
  return `${lead}${text}`;
}
var advisorDimensions = [
  {
    name: "\u8D22\u653F",
    scope: "\u56FD\u5E93\u4E0E\u5C81\u5165",
    policyId: "cross-check-ledgers",
    indicator: "finance",
    allowed: ["green-sprouts-trial", "service-reform-preparation", "reduce-redundant-spending", "cross-check-ledgers"]
  },
  {
    name: "\u6C11\u751F",
    scope: "\u767E\u59D3\u8D1F\u62C5",
    policyId: "curb-local-exactions",
    indicator: "livelihood",
    allowed: ["green-sprouts-trial", "service-reform-preparation", "water-conservancy", "curb-local-exactions"]
  },
  {
    name: "\u519B\u4E8B",
    scope: "\u8FB9\u5907\u4E0E\u519B\u50A8",
    policyId: "northwest-defense",
    indicator: "defense",
    allowed: ["northwest-defense"]
  },
  {
    name: "\u540F\u6CBB",
    scope: "\u8BCF\u4EE4\u80FD\u5426\u843D\u5230\u5DDE\u53BF",
    policyId: "curb-local-exactions",
    indicator: "execution",
    allowed: ["curb-local-exactions", "review-impeachments", "cross-check-ledgers", "discipline-corrupt-officials"]
  }
];
function modernizeAdvisorText(value) {
  return localizeInternalTerms(value).replace(/具报|复奏/g, "\u62A5\u544A\u7ED3\u679C").replace(/奉行/g, "\u6267\u884C").replace(/文移/g, "\u516C\u6587").replace(/案牍/g, "\u529E\u6848\u8BB0\u5F55").replace(/实负/g, "\u5B9E\u9645\u8D1F\u62C5").replace(/催科/g, "\u50AC\u6536").replace(/诸路/g, "\u5404\u5730").replace(/旬末/g, "\u5341\u5929\u5185").replace(/核清/g, "\u6838\u67E5\u6E05\u695A").replace(/有司/g, "\u8D1F\u8D23\u5B98\u7F72").replace(/主司/g, "\u8D1F\u8D23\u5B98\u7F72").replace(/^差/g, "\u5B89\u6392").replace(/^命/g, "\u8BA9").replace(/差([^，。]+?)专领/g, "\u5B89\u6392$1\u8D1F\u8D23").replace(/专领/g, "\u8D1F\u8D23").replace(/选三路/g, "\u9009\u62E9\u4E09\u4E2A\u5730\u533A").replace(/诸路/g, "\u5404\u5730").replace(/上供定额/g, "\u89C4\u5B9A\u4E0A\u4EA4\u671D\u5EF7\u7684\u6570\u989D").replace(/支移折变/g, "\u4E34\u65F6\u8C03\u62E8\u548C\u6298\u7B97").replace(/对勘/g, "\u6838\u5BF9").replace(/实额/g, "\u5B9E\u9645\u6570\u989D").replace(/督责/g, "\u7763\u4FC3\u5E76\u8FFD\u8D23").replace(/具册/g, "\u6574\u7406\u6210\u518C").replace(/正赋/g, "\u89C4\u5B9A\u7A0E\u989D").replace(/私行摊派/g, "\u79C1\u81EA\u989D\u5916\u6536\u8D39").replace(/先择/g, "\u5148\u9009\u62E9").replace(/限一季/g, "\u4E09\u4E2A\u6708\u5185").replace(/查禁/g, "\u68C0\u67E5\u5E76\u7981\u6B62").replace(/厘清/g, "\u67E5\u6E05").replace(/冗费/g, "\u4E0D\u5FC5\u8981\u7684\u5F00\u652F").replace(/隐漏/g, "\u9690\u7792\u548C\u9057\u6F0F").replace(/岁入不敷/g, "\u6536\u5165\u4E0D\u591F\u652F\u51FA").replace(/灾伤州军/g, "\u53D7\u707E\u5730\u533A").replace(/赋重州军/g, "\u7A0E\u8D1F\u8F83\u91CD\u7684\u5730\u533A").replace(/州军/g, "\u5730\u533A").replace(/盐铁、度支、户部三案账簿/g, "\u76D0\u94C1\u3001\u8D22\u653F\u652F\u51FA\u548C\u6237\u7C4D\u7A0E\u6536\u4E09\u7C7B\u8D26\u76EE").replace(/可缓支项/g, "\u53EF\u4EE5\u5EF6\u540E\u652F\u51FA\u7684\u9879\u76EE").replace(/浮支/g, "\u4E0D\u5FC5\u8981\u7684\u5F00\u652F").replace(/簿籍未立/g, "\u57FA\u7840\u8D26\u518C\u8FD8\u6CA1\u5EFA\u7ACB").replace(/只宜/g, "\u53EA\u80FD").replace(/，然/g, "\uFF0C\u4F46").replace(/故本期/g, "\u6240\u4EE5\u672C\u671F").replace(/若/g, "\u5982\u679C").replace(/亦/g, "\u4E5F").replace(/稍纾民力/g, "\u7A0D\u5FAE\u51CF\u8F7B\u767E\u59D3\u8D1F\u62C5").replace(/加派之权/g, "\u989D\u5916\u6536\u8D39\u7684\u6743\u529B").replace(/须待/g, "\u8981\u7B49").replace(/底数既明/g, "\u5E95\u6570\u67E5\u6E05").replace(/执行稍复/g, "\u6267\u884C\u80FD\u529B\u6709\u6240\u6062\u590D").replace(/再议/g, "\u518D\u51B3\u5B9A").replace(/岁入岁支实数/g, "\u5B9E\u9645\u6536\u5165\u548C\u652F\u51FA").replace(/隐没羡余/g, "\u9690\u7792\u6216\u591A\u51FA\u7684\u6B3E\u9879").replace(/径行加赋/g, "\u76F4\u63A5\u52A0\u7A0E").replace(/登记造册/g, "\u767B\u8BB0\u6210\u518C").replace(/限期裁撤/g, "\u5728\u89C4\u5B9A\u671F\u9650\u5185\u53D6\u6D88").replace(/专责/g, "\u4E13\u95E8\u8D1F\u8D23").replace(/一季内/g, "\u4E09\u4E2A\u6708\u5185").replace(/报中书/g, "\u5411\u4E2D\u4E66\u7701\u62A5\u544A").replace(/开查/g, "\u5F00\u59CB\u68C0\u67E5").replace(/富庶/g, "\u5BCC\u88D5").replace(/核出/g, "\u67E5\u51FA").replace(/督核/g, "\u76D1\u7763\u6838\u67E5").replace(/不得/g, "\u4E0D\u80FD").replace(/号令反易壅滞/g, "\u547D\u4EE4\u53CD\u800C\u66F4\u5BB9\u6613\u88AB\u803D\u6401").replace(/民力困敝/g, "\u767E\u59D3\u8D1F\u62C5\u6C89\u91CD").replace(/政令壅滞/g, "\u653F\u4EE4\u6267\u884C\u53D7\u963B").replace(/实支/g, "\u5B9E\u9645\u652F\u51FA").replace(/虚估/g, "\u865A\u62A5\u4F30\u7B97").replace(/之数/g, "\u7684\u6570\u989D").replace(/上供/g, "\u4E0A\u4EA4\u671D\u5EF7").replace(/^令/g, "\u8BA9").replace(/逐项开列榜示/g, "\u9010\u9879\u5217\u51FA\u5E76\u516C\u5F00").replace(/由监司抽验两路/g, "\u7531\u76D1\u53F8\u62BD\u67E5\u4E24\u4E2A\u5730\u533A").replace(/凡无朝廷明文者即行停征/g, "\u6CA1\u6709\u671D\u5EF7\u6B63\u5F0F\u6587\u4EF6\u4F9D\u636E\u7684\u9879\u76EE\u7ACB\u5373\u505C\u6B62\u5F81\u6536").replace(/一律/g, "\u5168\u90E8").replace(/开列后择重处置/g, "\u5217\u51FA\u540E\u4F18\u5148\u5904\u7406\u95EE\u9898\u6700\u4E25\u91CD\u7684\u5730\u533A").replace(/正额/g, "\u89C4\u5B9A\u6570\u989D").replace(/停罢无度者/g, "\u505C\u6B62\u6CA1\u6709\u5408\u7406\u4F9D\u636E\u7684\u9879\u76EE").replace(/边警未至急迫/g, "\u8FB9\u5883\u8B66\u60C5\u8FD8\u4E0D\u7D27\u6025").replace(/宜顾主务/g, "\u5E94\u5148\u4FDD\u969C\u4E3B\u8981\u4EFB\u52A1").replace(/地方承载尚可/g, "\u5730\u65B9\u76EE\u524D\u8FD8\u80FD\u627F\u53D7").replace(/本期不宜叠加事务/g, "\u672C\u671F\u4E0D\u518D\u589E\u52A0\u4EFB\u52A1").replace(/不宜叠加事务/g, "\u4E0D\u518D\u589E\u52A0\u4EFB\u52A1").replace(/故以/g, "\u6240\u4EE5\u628A");
}
function conciseSentence(value, fallback, maxLength = 72) {
  const cleaned = modernizeAdvisorText(value).replace(/[\r\n|]+/g, "\uFF0C").replace(/【(?:主|辅|暂缓)】/g, "").replace(/^(?:财政|民生|军事|吏治)[：:]?/, "").replace(/(?:宜稳妥推进|酌情办理|视情况而定|统筹兼顾)/g, "").trim() || fallback;
  const firstSentence = cleaned.split(/(?<=[。！？])/u)[0] || cleaned;
  const clipped = firstSentence.length > maxLength ? `${firstSentence.slice(0, maxLength - 1).replace(/[，、；：]$/, "")}\u3002` : firstSentence;
  return /[。！？]$/.test(clipped) ? clipped : `${clipped}\u3002`;
}
function qualitative(value) {
  const number = Number(value);
  if (number < 30) return "\u5371\u6025";
  if (number < 45) return "\u504F\u4F4E";
  if (number < 60) return "\u5C1A\u53EF";
  return "\u7A33\u56FA";
}
var advisorIndicatorLabels = { finance: "\u8D22\u7528", livelihood: "\u6C11\u751F", defense: "\u8FB9\u5907", courtSupport: "\u58EB\u8BBA", execution: "\u6267\u884C" };
var advisorPersonnelTargets = {
  "\u8D22\u653F": { officeKey: "finance", officerIds: ["zeng-bu", "su-zhe", "lv-huiqing"] },
  "\u6C11\u751F": { officeKey: "transport", officerIds: ["fan-chunren", "su-shi", "cheng-hao"] },
  "\u519B\u4E8B": { officeKey: "military", officerIds: ["wang-shao", "shen-kuo", "guo-kui"] },
  "\u540F\u6CBB": { officeKey: "censorate", officerIds: ["sima-guang", "han-jiang", "lv-gongzhu"] }
};
function fallbackSituation(state, mainName, supportName, event) {
  const indicators = state?.indicators || {};
  const ranked = Object.entries(advisorIndicatorLabels).map(([key, label]) => ({ key, label, value: Number(indicators[key] ?? 0) })).sort((left, right) => left.value - right.value);
  const weakest = ranked.slice(0, 2).map((item) => `${item.label}${item.value}\uFF08${qualitative(item.value)}\uFF09`).join("\u3001");
  const previous = state?.history?.at?.(-1);
  const trend = previous ? ranked.slice(0, 2).map((item) => {
    const delta = Number(previous?.indicatorChanges?.[item.key] || 0);
    return `${item.label}${delta > 0 ? "\u56DE\u5347" : delta < 0 ? "\u4E0B\u6ED1" : "\u6301\u5E73"}${delta ? Math.abs(delta) : ""}`;
  }).join("\u3001") : "\u5C1A\u65E0\u4E0A\u671F\u7ED3\u7B97\u53EF\u4F9B\u6BD4\u8F83";
  const turn = Math.max(1, Number(state?.turn || 1));
  const maxTurns = Math.max(turn, Number(state?.maxTurns || 8));
  const eventText = event?.title ? `\u672C\u56DE\u6025\u52A1\u662F\u201C${event.title}\u201D\uFF1A${event.description || "\u8BE6\u60C5\u672A\u8F7D"}` : "\u672C\u56DE\u6025\u52A1\u5C1A\u5F85\u7ED3\u5408\u5FA1\u6848\u4E8B\u4EF6\u5224\u65AD";
  return `\u73B0\u5904\u7B2C${turn}/${maxTurns}\u56DE\u7684${stageForTurn(turn, maxTurns)}\u3002\u56FD\u52BF\u6700\u8584\u4E4B\u5904\u662F${weakest}\uFF1B${trend}\u3002${eventText}\u3002\u56FD\u5E93${state?.resources?.treasury ?? "\u672A\u77E5"}\u4E07\u8D2F\u3001\u653F\u7565${state?.resources?.politicalCapital ?? "\u672A\u77E5"}\u3001\u884C\u653F${state?.resources?.administration ?? "\u672A\u77E5"}/50\uFF0C\u672C\u671F\u4E3B\u9879\uFF1A${mainName || "\u65E0"}\uFF1B\u8F85\u9879\uFF1A${supportName || "\u65E0"}\u3002\u5177\u4F53\u80FD\u5426\u627F\u62C5\u987B\u7ED3\u5408\u653F\u52A1\u6210\u672C\u5224\u65AD\u3002`;
}
function normalizeSituation(value, state, mainName, supportName, event) {
  const cleaned = modernizeAdvisorText(value).replace(/[\r\n|]+/g, "\uFF0C").trim();
  return (cleaned || fallbackSituation(state, mainName, supportName, event)).slice(0, 320);
}
function decisionFor(name, role, value) {
  if (role === "\u6682\u7F13") return "";
  const fallbacks = {
    "\u8D22\u653F": "\u9700\u8981\u51B3\u5B9A\uFF1A\u5148\u51BB\u7ED3\u6709\u4E89\u8BAE\u7684\u8D26\u76EE\uFF0C\u8FD8\u662F\u5148\u8BA9\u4E09\u53F8\u81EA\u884C\u6838\u67E5\u518D\u8FFD\u8D23\u3002",
    "\u6C11\u751F": "\u9700\u8981\u51B3\u5B9A\uFF1A\u5148\u7ED9\u5DF2\u7ECF\u67E5\u6E05\u7684\u91CD\u707E\u6237\u51CF\u514D\uFF0C\u8FD8\u662F\u7B49\u5168\u90E8\u540D\u5355\u5B8C\u6210\u540E\u7EDF\u4E00\u5904\u7406\u3002",
    "\u519B\u4E8B": "\u9700\u8981\u51B3\u5B9A\uFF1A\u672C\u671F\u4F18\u5148\u8865\u519B\u7CAE\uFF0C\u8FD8\u662F\u4F18\u5148\u4FEE\u5BE8\u5821\uFF0C\u53EA\u80FD\u5148\u9009\u4E00\u9879\u3002",
    "\u540F\u6CBB": "\u9700\u8981\u51B3\u5B9A\uFF1A\u5148\u8BA9\u5DDE\u53BF\u81EA\u884C\u7EA0\u6B63\uFF0C\u8FD8\u662F\u76F4\u63A5\u8FFD\u7A76\u8D1F\u8D23\u5B98\u5458\u3002"
  };
  const decision = conciseSentence(value, fallbacks[name], 76).replace(/^须裁定[：:]?/, "\u9700\u8981\u51B3\u5B9A\uFF1A");
  return /^需要决定[：:]/.test(decision) ? decision : `\u9700\u8981\u51B3\u5B9A\uFF1A${decision}`;
}
function recommendCourtPersonnel(state, mainName) {
  const target = advisorPersonnelTargets[mainName];
  const office = state?.polity?.offices?.find((item) => item?.key === target?.officeKey);
  if (!target || !office) return null;
  const appointed = new Set((state?.polity?.offices || []).flatMap((item) => (item?.posts || []).map((post2) => post2?.appointeeId).filter(Boolean)));
  const officerId = target.officerIds.find((id) => !appointed.has(id));
  const post = office.posts?.find((item) => !item?.appointeeId);
  const officerName = allowedOfficers.find(([id]) => id === officerId)?.[1];
  if (!officerId || !officerName || !post) return null;
  return {
    officeKey: office.key,
    postKey: post.key,
    officeName: office.name,
    postTitle: post.title,
    officerId,
    officerName,
    reason: `${officerName}\u5C65\u5386\u4E0E${office.name}\u804C\u638C\u76F8\u5408\uFF0C\u53EF\u4F7F${mainName}\u653F\u52A1\u5C11\u8017\u884C\u653F\u3001\u66F4\u6613\u843D\u5B9E\u3002`,
    risk: "\u6539\u6388\u4F1A\u6539\u53D8\u5B98\u7F72\u7ACB\u573A\uFF0C\u987B\u540C\u65F6\u7559\u610F\u58EB\u8BBA\u4E0E\u65B0\u4EFB\u4E3B\u5B98\u7684\u65BD\u653F\u504F\u597D\u3002"
  };
}
function stageForTurn(turn, maxTurns) {
  const ratio = turn / Math.max(1, maxTurns);
  return ratio <= 0.3 ? "\u524D\u671F" : ratio <= 0.7 ? "\u4E2D\u671F" : "\u540E\u671F";
}
function normalizeAdvisorOutline(parsed, current, capacity, state = {}, event = {}) {
  const source = Array.isArray(parsed.dimensions) ? parsed.dimensions : [];
  const byName = new Map(source.map((item) => [localizeInternalTerms(item?.name), item]));
  const mainName = advisorDimensions.filter(({ name }) => byName.get(name)?.role === "\u4E3B").map(({ name }) => name).join("\u3001");
  const supportName = advisorDimensions.filter(({ name }) => byName.get(name)?.role === "\u8F85").map(({ name }) => name).join("\u3001");
  const dimensions = advisorDimensions.map((definition) => {
    const item = byName.get(definition.name) || {};
    const requestedRole = localizeInternalTerms(item?.role).replace(/[【】]/g, "").trim();
    const role = ["\u4E3B", "\u8F85", "\u6682\u7F13"].includes(requestedRole) ? requestedRole : "\u6682\u7F13";
    const requestedPolicyId = String(item?.policyId || "");
    const policyId = definition.allowed.includes(requestedPolicyId) ? requestedPolicyId : definition.policyId;
    const advice = modernizeAdvisorText(item?.advice).trim() || "\u6A21\u578B\u672A\u63D0\u4F9B\u672C\u9879\u5EFA\u8BAE\u6216\u7406\u7531\uFF0C\u8BF7\u91CD\u65B0\u53C2\u8BE6\u3002";
    return {
      name: definition.name,
      scope: definition.scope,
      role,
      advice,
      decision: decisionFor(definition.name, role, item?.decision),
      policyId
    };
  });
  const situation = normalizeSituation(parsed.situation, state, mainName, supportName, event);
  const personnelRecommendation = mainName ? recommendCourtPersonnel(state, mainName.split("\u3001")[0]) : void 0;
  const personnel = personnelRecommendation ? `${personnelRecommendation.officeName}${personnelRecommendation.postTitle}\uFF0C\u8350${personnelRecommendation.officerName}\u3002` : conciseSentence(parsed.personnel, "\u672C\u671F\u65E0\u5408\u9002\u7684\u672A\u4EFB\u5019\u9009\u4EBA\u3002", 72);
  const render = (items) => [
    "\u5C40\u52BF\u7814\u5224:",
    situation,
    "",
    `\u884C\u653F\u4F59\u91CF:${current}/${capacity}`,
    "",
    ...items.flatMap((item) => [`${item.name}|(${item.scope})\u3010${item.role}\u3011${item.advice}`, ...item.decision ? [`  ${item.decision}`] : []]),
    "",
    ...personnelRecommendation ? ["\u94E8\u9009\u5EFA\u8BAE:", `\u5C97\u4F4D:${personnelRecommendation.officeName}\xB7${personnelRecommendation.postTitle}`, `\u63A8\u8350:${personnelRecommendation.officerName}`, `\u7406\u7531:${personnelRecommendation.reason}`, `\u98CE\u9669:${personnelRecommendation.risk}`] : [`\u94E8\u9009\u5EFA\u8BAE:${personnel}`]
  ].join("\n");
  const outline = render(dimensions).slice(0, 900);
  return {
    outline,
    situation,
    dimensions,
    personnel,
    personnelRecommendation,
    policyIds: dimensions.filter((item) => item.role !== "\u6682\u7F13").map((item) => item.policyId)
  };
}
var outputLanguageRule = `\u8F93\u5165\u4E2D\u7684\u82F1\u6587\u952E\u540D\u548C\u8FDE\u5B57\u7B26ID\u90FD\u662F\u7A0B\u5E8F\u5185\u90E8\u6807\u8BC6\uFF0C\u53EA\u4F9B\u4F60\u7406\u89E3\uFF0C\u7EDD\u4E0D\u80FD\u539F\u6837\u5199\u8FDB\u9762\u5411\u73A9\u5BB6\u7684\u6587\u5B57\u3002
\u5FC5\u987B\u4F7F\u7528\u4E2D\u6587\u79F0\u547C\uFF1Atreasury=\u56FD\u5E93\uFF0CpoliticalCapital=\u653F\u7565\uFF0Cadministration=\u884C\u653F\uFF0Cfinance=\u8D22\u7528\uFF0Clivelihood=\u6C11\u751F\uFF0Cdefense=\u8FB9\u5907\uFF0CcourtSupport=\u58EB\u8BBA\uFF0Cexecution=\u6267\u884C\uFF0Cseverity=\u4E25\u91CD\u5EA6\u3002\u4E0D\u8981\u8F93\u51FA\u7C7B\u4F3C courtSupport-3\u3001severity66\u3001executionBonus+2 \u7684\u8C03\u8BD5\u5F0F\u8868\u8FBE\u3002`;
async function interpretEdictWithAI({ edict, context = {}, config = {}, fetchImpl = fetch } = {}) {
  const sourceEdict = String(edict || "").trim();
  const prompt = `\u4F60\u662F\u5317\u5B8B\u7199\u5B81\u53D8\u6CD5\u7B56\u7565\u6E38\u620F\u7684\u4E2D\u4E66\u820D\u4EBA\u3002\u5C06\u73A9\u5BB6\u81EA\u7531\u8BCF\u4E66\u6620\u5C04\u4E3A\u5168\u90E8\u76F8\u5173\u7684\u6E38\u620F\u89C4\u5219\u653F\u52A1\uFF0C\u4E0D\u8BBE\u7F6E\u4EBA\u4E3A\u6570\u91CF\u4E0A\u9650\uFF1B\u4E00\u4EFD\u8BCF\u4E66\u53EF\u4EE5\u540C\u65F6\u6D89\u53CA\u8D22\u653F\u3001\u6C11\u751F\u3001\u519B\u4E8B\u3001\u4EFB\u514D\u3001\u5236\u5EA6\u548C\u5730\u65B9\u6CBB\u7406\u3002\u4E0D\u5F97\u521B\u9020ID\uFF0C\u4E0D\u5F97\u4FEE\u6539\u6570\u503C\uFF0C\u6267\u884C\u80FD\u529B\u4E0D\u8DB3\u7531\u7A0B\u5E8F\u7ED3\u7B97\u4E3A\u884C\u653F\u8D85\u8F7D\u3002

\u5141\u8BB8\u7684\u653F\u52A1\uFF1A
${allowedPolicies.map(([id, name]) => `- ${id}: ${name}`).join("\n")}

\u5141\u8BB8\u7684\u6267\u884C\u5B98\uFF1A
${allowedOfficers.map(([id, name]) => `- ${id}: ${name}`).join("\n")}

\u5F53\u524D\u80CC\u666F\uFF1A${JSON.stringify(context)}
\u73A9\u5BB6\u8BCF\u4E66\uFF1A${sourceEdict}

\u53EA\u8FD4\u56DEJSON\uFF1A{"policyIds":["id"],"officerId":"id\u6216null","summary":"\u4E2D\u4E66\u5982\u4F55\u7406\u89E3\u8BCF\u610F","warnings":["\u9700\u8981\u73A9\u5BB6\u6CE8\u610F\u4E4B\u5904"]}`;
  const output = await callModel(config, `\u4F60\u53EA\u505A\u53D7\u53F2\u5B9E\u4E0E\u89C4\u5219\u7EA6\u675F\u7684\u653F\u4EE4\u89E3\u6790\uFF0C\u5E76\u4E25\u683C\u8FD4\u56DEJSON\u3002
${outputLanguageRule}`, prompt, fetchImpl);
  const parsed = parseJsonOutput(output);
  const policyIds = Array.isArray(parsed.policyIds) ? [...new Set(parsed.policyIds.filter((id) => allowedPolicies.some(([allowed]) => allowed === id)))] : [];
  if (!policyIds.length && sourceEdict) policyIds.push("open-ended-directive");
  const officerId = allowedOfficers.some(([id]) => id === parsed.officerId) ? parsed.officerId : null;
  return {
    ok: true,
    interpretation: {
      sourceText: sourceEdict,
      policyIds,
      officerId,
      summary: localizeInternalTerms(parsed.summary),
      warnings: parseStringList(parsed.warnings, 4)
    }
  };
}
async function adviseWithAI({ question, currentEdict = "", state = {}, event = {}, officer = {}, policies = [], config = {}, fetchImpl = fetch } = {}) {
  const administrativeRemaining = Math.max(0, Math.round(Number(state?.resources?.administration) || 0));
  const administrativeCapacity = 50;
  const policyBudget = policies.map((policy) => ({
    id: policy?.id,
    name: policy?.name,
    tags: policy?.tags,
    politicalCapital: policy?.cost?.politicalCapital ?? 0,
    administration: policy?.cost?.administration ?? 0,
    treasury: policy?.cost?.treasury ?? 0
  }));
  const currentTurn = Math.max(1, Number(state?.turn || 1));
  const maxTurns = Math.max(currentTurn, Number(state?.maxTurns || 8));
  const remainingTurns = Math.max(0, maxTurns - currentTurn + 1);
  const stage = stageForTurn(currentTurn, maxTurns);
  const completedObjectives = (state?.objectives || []).filter((item) => item?.completed).map((item) => item.title);
  const activeItems = (state?.activePolicies || []).map((item) => ({
    \u653F\u52A1: allowedPolicies.find(([id]) => id === item?.policyId)?.[1] || item?.policyId,
    \u627F\u529E: allowedOfficers.find(([id]) => id === item?.officerId)?.[1] || item?.officerId,
    \u5C1A\u4F59\u56DE\u5408: item?.remainingTurns
  }));
  const prompt = `\u4F60\u5728\u5B8B\u795E\u5B97\u7199\u5B81\u671D\u62C5\u4EFB\u5FA1\u524D\u8F85\u653F\u5B98\u3002\u73A9\u5BB6\u5C1A\u672A\u9881\u8BCF\uFF0C\u4F60\u53EA\u8D1F\u8D23\u63D0\u4F9B\u5206\u7EF4\u5EA6\u65BD\u653F\u63D0\u7EB2\uFF0C\u7EDD\u4E0D\u80FD\u4EE3\u5199\u5B8C\u6574\u8BCF\u4E66\uFF0C\u4E5F\u4E0D\u80FD\u66FF\u73A9\u5BB6\u4F5C\u6700\u7EC8\u51B3\u5B9A\u3002

\u5F53\u524D\u65F6\u95F4\uFF1A${formatDate(state?.date)}
\u5F53\u524D\u56DE\u5408\uFF1A\u7B2C${currentTurn}/${maxTurns}\u56DE\uFF1B\u8DDD\u7EC8\u5C40\u5C1A\u4F59${remainingTurns}\u56DE\uFF1B\u9636\u6BB5\uFF1A${stage}
\u4E94\u9879\u56FD\u52BF\uFF1A\u8D22\u7528${state?.indicators?.finance ?? "\u672A\u77E5"}\uFF0C\u6C11\u751F${state?.indicators?.livelihood ?? "\u672A\u77E5"}\uFF0C\u8FB9\u5907${state?.indicators?.defense ?? "\u672A\u77E5"}\uFF0C\u58EB\u8BBA${state?.indicators?.courtSupport ?? "\u672A\u77E5"}\uFF0C\u6267\u884C${state?.indicators?.execution ?? "\u672A\u77E5"}
\u5F53\u524D\u4F59\u91CF\uFF1A\u884C\u653F${administrativeRemaining}/${administrativeCapacity}\uFF0C\u653F\u7565${state?.resources?.politicalCapital ?? "\u672A\u77E5"}\uFF0C\u56FD\u5E93${state?.resources?.treasury ?? "\u672A\u77E5"}\u4E07\u8D2F
\u5F53\u524D\u56FD\u7B56\u6210\u679C\uFF08\u5DF2\u5B8C\u6210\uFF09\uFF1A${completedObjectives.length ? completedObjectives.join("\u3001") : "\u6682\u65E0"}
\u8FDB\u884C\u4E2D\u4E8B\u9879\uFF1A${activeItems.length ? JSON.stringify(activeItems) : "\u6682\u65E0"}
\u672C\u56DE\u5408\u56F0\u5883\u4E8B\u4EF6\uFF1A${event?.title || "\u672A\u8F7D"}\u2014\u2014${event?.description || "\u672A\u8F7D"}\uFF1B\u5373\u65F6\u5F71\u54CD${JSON.stringify(event?.effects || {})}
\u5F53\u524D\u5176\u4ED6\u56F0\u5883\uFF1A${JSON.stringify(state?.dilemmas || [])}
\u5F53\u524D\u56FA\u5B9A\u5B98\u7F72\u4E0E\u4EFB\u804C\uFF08\u94E8\u9009\u5EFA\u8BAE\u53EA\u53EF\u586B\u8865\u7A7A\u7F3A\uFF1B\u4E0D\u5F97\u5EFA\u8BAE\u66FF\u6362\u5DF2\u6709\u4EFB\u5B98\uFF0C\u4E5F\u4E0D\u5F97\u6539\u8BBE\u673A\u6784\uFF09\uFF1A${JSON.stringify(state?.polity || {})}
\u5F53\u524D\u51C6\u5907\u4EFB\u7528\u7684\u6267\u884C\u5B98\uFF1A${JSON.stringify(officer)}
\u53EF\u6267\u884C\u653F\u52A1\u53CA\u5176\u672C\u56DE\u5408\u6210\u672C\uFF1A${JSON.stringify(policyBudget)}
\u6B64\u524D\u5404\u56DE\u65BD\u653F\u6863\u6848\uFF08\u8FD9\u662F\u5224\u65AD\u4E0B\u4E00\u6B65\u7684\u4E3B\u8981\u4F9D\u636E\uFF0C\u4E0D\u5F97\u5FFD\u7565\uFF09\uFF1A
${formatHistory(state?.history || [])}
\u6B64\u524D\u8F85\u653F\u5B98\u5DF2\u63D0\u65B9\u5411\uFF08\u7ED3\u5408\u6267\u884C\u7ED3\u679C\u5224\u65AD\u662F\u5426\u7EED\u529E\uFF09\uFF1A${(state?.advisorHistory || []).slice(-6).join("\n") || "\u65E0\u3002"}
\u73A9\u5BB6\u6848\u524D\u5DF2\u6709\u6587\u5B57\uFF1A${String(currentEdict || "").trim() || "\u5C1A\u672A\u843D\u7B14"}
\u73A9\u5BB6\u5411\u8F85\u653F\u5B98\u8BE2\u95EE\uFF1A${String(question || "").trim() || "\u8BF7\u5206\u6790\u5F53\u524D\u683C\u5C40\u5E76\u63D0\u51FA\u51E0\u6761\u53EF\u884C\u8DEF\u7EBF"}

\u6700\u7EC8\u663E\u793A\u6587\u672C\u5FC5\u987B\u4E25\u683C\u7B49\u4EF7\u4E8E\u4EE5\u4E0B\u683C\u5F0F\uFF0C\u884C\u653F\u4F59\u91CF\u4F7F\u7528\u5F53\u524D\u5B9E\u6570 ${administrativeRemaining}/${administrativeCapacity}\uFF1A
\u5C40\u52BF\u7814\u5224:
\u7528\u4E09\u81F3\u56DB\u53E5\u73B0\u4EE3\u767D\u8BDD\u8BF4\u660E\u6700\u7D27\u8FEB\u56F0\u5883\u53CA\u4E25\u91CD\u5EA6\u3001\u76F8\u5173\u56FD\u52BF\u5B9E\u6570\u3001\u4E0A\u671F\u8D8B\u52BF\u3001\u672C\u671F\u4E8B\u4EF6\u3001\u8D44\u6E90\u80FD\u627F\u62C5\u4EC0\u4E48\uFF0C\u4EE5\u53CA\u5404\u9879\u4F18\u5148\u7EA7\u7684\u4F9D\u636E\u3002\u56F0\u5883\u4E25\u91CD\u5EA6\u8D8A\u9AD8\u8D8A\u5371\u9669\uFF0C\u56FD\u52BF\u6570\u503C\u8D8A\u4F4E\u8D8A\u8584\u5F31\uFF0C\u4E0D\u5F97\u6DF7\u6DC6\u3002

\u884C\u653F\u4F59\u91CF:${administrativeRemaining}/${administrativeCapacity}

\u7EF4\u5EA6\u540D|(\u7EF4\u5EA6\u8BF4\u660E)\u3010\u4E3B\u6216\u8F85\u6216\u6682\u7F13\u3011\u57FA\u4E8E\u5B9E\u9645\u56F0\u5883\u548C\u6570\u503C\u7684\u5EFA\u8BAE\u6216\u6682\u7F13\u7406\u7531
  \u9700\u8981\u51B3\u5B9A\uFF1A\u4EC5\u5728\u4E3B\u8F85\u9879\u5199\u9700\u8981\u73A9\u5BB6\u88C1\u5B9A\u7684\u6267\u884C\u5C3A\u5EA6\u6216\u5148\u540E\u987A\u5E8F
\u4EE5\u4E0A\u4E3A\u5B57\u6BB5\u8BF4\u660E\uFF0C\u4E0D\u9884\u8BBE\u4EFB\u4F55\u7EF4\u5EA6\u7684\u4F18\u5148\u7EA7\u3002

\u94E8\u9009\u5EFA\u8BAE:
\u5C97\u4F4D:\u73B0\u6709\u5B98\u7F72\xB7\u5F53\u524D\u7A7A\u7F3A\u5B98\u804C
\u63A8\u8350:\u672A\u5728\u5176\u4ED6\u6838\u5FC3\u5C97\u4F4D\u4EFB\u804C\u7684\u5B98\u5458
\u7406\u7531:\u5176\u5C65\u5386\u5982\u4F55\u6539\u5584\u672C\u671F\u4E3B\u52A1
\u98CE\u9669:\u6539\u6388\u53EF\u80FD\u5E26\u6765\u7684\u58EB\u8BBA\u6216\u65BD\u653F\u504F\u597D\u98CE\u9669

\u56DB\u4E2A\u7EF4\u5EA6\u5FC5\u987B\u5168\u90E8\u5217\u51FA\uFF0C\u987A\u5E8F\u56FA\u5B9A\u4E3A\u8D22\u653F\u3001\u6C11\u751F\u3001\u519B\u4E8B\u3001\u540F\u6CBB\u3002\u4E3B\u8F85\u6570\u91CF\u4E0D\u56FA\u5B9A\uFF1A\u5141\u8BB8\u591A\u4E2A\u4E3B\u9879\u3001\u96F6\u4E2A\u6216\u591A\u4E2A\u8F85\u9879\uFF0C\u4E5F\u5141\u8BB8\u8D44\u6E90\u4E0D\u8DB3\u65F6\u5168\u90E8\u6682\u7F13\u3002\u6309\u56F0\u5883\u4E25\u91CD\u5EA6\u3001\u8D8B\u52BF\u4E0E\u9884\u7B97\u51B3\u5B9A\u4F18\u5148\u7EA7\uFF0C\u4E0D\u9884\u8BBE\u8D22\u653F\u4F18\u5148\u3002\u6BCF\u4E2A\u7EF4\u5EA6\u6700\u591A\u4E00\u6761\u65BD\u653F\u5EFA\u8BAE\uFF0C\u4E25\u7981\u9762\u9762\u4FF1\u5230\u3002\u5C40\u52BF\u7814\u5224\u3001\u56DB\u7EF4\u5EFA\u8BAE\u3001\u6682\u7F13\u7406\u7531\u548C\u987B\u88C1\u5B9A\u5185\u5BB9\u90FD\u5FC5\u987B\u4F7F\u7528\u73B0\u4EE3\u767D\u8BDD\uFF0C\u50CF\u5411\u6CA1\u6709\u53E4\u4EE3\u5B98\u5236\u77E5\u8BC6\u7684\u73A9\u5BB6\u89E3\u91CA\u4E00\u6837\u76F4\u767D\uFF1B\u7EF4\u5EA6\u540D\u3001\u62EC\u53F7\u8BF4\u660E\u4E0E\u3010\u4E3B\u3011\u3010\u8F85\u3011\u3010\u6682\u7F13\u3011\u6807\u8BB0\u4FDD\u6301\u4E0D\u53D8\u3002\u4E3B\u8F85\u9879\u5FC5\u987B\u540C\u65F6\u5199\u660E\u201C\u95EE\u9898\u5728\u54EA\u91CC\u201D\u201C\u8C01\u53BB\u505A\u4EC0\u4E48\u201D\u201C\u591A\u4E45\u56DE\u62A5\u201D\u548C\u201C\u73A9\u5BB6\u9700\u88C1\u5B9A\u4EC0\u4E48\u201D\uFF1B\u4E0D\u5F97\u4F7F\u7528\u201C\u5177\u62A5\u3001\u590D\u594F\u3001\u5949\u884C\u3001\u6587\u79FB\u3001\u6848\u724D\u3001\u5B9E\u8D1F\u3001\u50AC\u79D1\u201D\u7B49\u9700\u8981\u73A9\u5BB6\u81EA\u884C\u7FFB\u8BD1\u7684\u516C\u6587\u8BCD\u3002\u4E0D\u5F97\u53EA\u5199\u201C\u62BD\u9A8C\u4E09\u8DEF\u201D\u201C\u8C03\u67E5\u5B9E\u51B5\u201D\u7B49\u65E0\u4ECE\u4E0B\u624B\u7684\u7F29\u5199\uFF0C\u4E5F\u4E0D\u5F97\u5199\u201C\u5B9C\u7A33\u59A5\u63A8\u8FDB\u201D\u201C\u914C\u60C5\u529E\u7406\u201D\u201C\u89C6\u60C5\u51B5\u800C\u5B9A\u201D\u7B49\u7A7A\u8BDD\u3002\u94E8\u9009\u5EFA\u8BAE\u53EA\u80FD\u6307\u5411\u5DF2\u6709\u5B98\u7F72\u548C\u5B98\u804C\uFF0C\u4E0D\u5F97\u65B0\u5EFA\u3001\u64A4\u5E76\u6216\u6539\u9020\u653F\u6CBB\u67B6\u6784\uFF1B\u4EFB\u514D\u4EC5\u662F\u5EFA\u8BAE\uFF0C\u7531\u73A9\u5BB6\u5728\u94E8\u9009\u754C\u9762\u4EB2\u81EA\u64CD\u4F5C\u3002\u663E\u793A\u6587\u672C\u603B\u957F\u5EA6\u63A7\u5236\u5728\u4E5D\u767E\u5B57\u4EE5\u5185\uFF0C\u4E0D\u5199\u9A88\u53E5\u3002

\u5148\u9605\u8BFB\u65BD\u653F\u6863\u6848\u4E2D\u7684\u201C\u6267\u884C\u72B6\u6001\u3001\u5DF2\u89C1\u7ED3\u679C\u3001\u963B\u529B\u3001\u9057\u7559\u4E0E\u4E0B\u4E00\u6B65\u201D\uFF0C\u518D\u51B3\u5B9A\u672C\u56DE\u5EFA\u8BAE\u3002\u5DF2\u7ECF\u987A\u5229\u63A8\u8FDB\u7684\u63AA\u65BD\u4E0D\u5F97\u539F\u6837\u518D\u63D0\uFF1B\u90E8\u5206\u843D\u5B9E\u6216\u6267\u884C\u53D7\u963B\u7684\u4E8B\u9879\u5982\u9700\u7EE7\u7EED\uFF0C\u5FC5\u987B\u4EE5\u201C\u7EED\u529E\u201D\u5F00\u5934\uFF0C\u76F4\u63A5\u5904\u7406\u6863\u6848\u4E2D\u7684\u9057\u7559\u6216\u963B\u529B\uFF0C\u5E76\u660E\u786E\u672C\u671F\u65B0\u589E\u7740\u529B\u70B9\u3002\u6B64\u65B9\u5411\u4E0A\u671F\u5DF2\u63D0\u65F6\uFF0C\u8BF7\u7ED9\u51FA\u65B0\u7740\u529B\u70B9\u6216\u660E\u786E\u6807\u4E3A\u7EED\u529E\uFF1B\u95EE\u9898\u672A\u89E3\u51B3\u53EF\u4EE5\u91CD\u590D\u5EFA\u8BAE\u5E76\u8BF4\u660E\u539F\u56E0\uFF0C\u4E0D\u5F97\u4E3A\u6C42\u4E0D\u540C\u800C\u7F16\u9020\u63AA\u65BD\u6216\u628A\u6362\u540C\u4E49\u8BCD\u5F53\u4F5C\u65B0\u5EFA\u8BAE\u3002\u5EFA\u8BAE\u8FD8\u987B\u7ED3\u5408\u672C\u671F\u6570\u503C\u77ED\u677F\u4E0E\u56F0\u5883\uFF1B\u58EB\u8BBA\u504F\u4F4E\u65F6\u987B\u8003\u8651\u7F13\u548C\u671D\u8BAE\u6216\u6536\u7A84\u63A8\u884C\u529B\u5EA6\u3002${stage === "\u524D\u671F" ? "\u5F53\u524D\u4E3A\u524D\u671F\uFF0C\u91CD\u5728\u6838\u6E05\u5E95\u6570\u4E0E\u5C0F\u8303\u56F4\u8BD5\u529E\u3002" : stage === "\u4E2D\u671F" ? "\u5F53\u524D\u4E3A\u4E2D\u671F\uFF0C\u91CD\u5728\u63A8\u884C\u3001\u6838\u9A8C\u4E0E\u7EA0\u504F\u3002" : "\u5F53\u524D\u4E3A\u540E\u671F\uFF0C\u91CD\u5728\u5DE9\u56FA\u6210\u679C\u3001\u7ED3\u6E05\u9057\u7559\u4E0E\u5584\u540E\u3002"}\u3010\u6682\u7F13\u3011\u9879\u53EA\u51C6\u8BF4\u660E\u201C\u4E3A\u4F55\u672C\u671F\u4E0D\u505A\u201D\uFF0C\u4E25\u7981\u5199\u4EFB\u4F55\u52A8\u4F5C\u3001\u5BF9\u8C61\u6216\u671F\u9650\u3002

\u4F60\u987B\u5728\u5185\u90E8\u6838\u7B97\u653F\u7565\u3001\u884C\u653F\u4E0E\u56FD\u5E93\u6210\u672C\uFF1A\u603B\u653F\u7565\u6210\u672C\u8FD8\u8981\u52A0\u4E0A\u6267\u884C\u5B98\u4E00\u6B21\u6027\u7684\u653F\u7565\u6D88\u8017\u4FEE\u6B63\uFF1B\u7ED3\u7B97\u540E\u987B\u81F3\u5C11\u4FDD\u7559 12 \u70B9\u653F\u7565\u300110 \u70B9\u884C\u653F\u548C 800 \u4E07\u8D2F\u56FD\u5E93\u3002\u8D44\u6E90\u4E0D\u8DB3\u65F6\uFF0C\u5C06\u9AD8\u6210\u672C\u65B9\u5411\u5217\u4E3A\u3010\u6682\u7F13\u3011\uFF0C\u4E0D\u5F97\u5806\u53E0\u653F\u52A1\u4F2A\u88C5\u5468\u5168\u3002\u53EA\u63D0\u51FA\u811A\u624B\u67B6\uFF0C\u4E0D\u5F97\u8F93\u51FA\u8BCF\u4E66\u6B63\u6587\u3001\u5236\u66F0\u3001\u5949\u8BCF\u3001\u94A6\u6B64\u7B49\u6210\u7A3F\u63AA\u8F9E\u3002

\u53EA\u8FD4\u56DEJSON\uFF1A
{
  "dimensions":[
    {"name":"\u8D22\u653F","role":"\u4E3B\u6216\u8F85\u6216\u6682\u7F13","advice":"\u4E00\u6761\u5177\u4F53\u5EFA\u8BAE\u6216\u6682\u7F13\u7406\u7531","decision":"\u4E3B\u8F85\u9879\u7684\u4E8C\u9009\u4E00\u88C1\u5B9A\uFF0C\u6682\u7F13\u9879\u7559\u7A7A","policyId":"\u5BF9\u5E94\u7684\u4E00\u9879\u653F\u52A1ID"},
    {"name":"\u6C11\u751F","role":"\u4E3B\u6216\u8F85\u6216\u6682\u7F13","advice":"\u4E00\u6761\u5177\u4F53\u5EFA\u8BAE\u6216\u6682\u7F13\u7406\u7531","decision":"\u4E3B\u8F85\u9879\u7684\u4E8C\u9009\u4E00\u88C1\u5B9A\uFF0C\u6682\u7F13\u9879\u7559\u7A7A","policyId":"\u5BF9\u5E94\u7684\u4E00\u9879\u653F\u52A1ID"},
    {"name":"\u519B\u4E8B","role":"\u4E3B\u6216\u8F85\u6216\u6682\u7F13","advice":"\u4E00\u6761\u5177\u4F53\u5EFA\u8BAE\u6216\u6682\u7F13\u7406\u7531","decision":"\u4E3B\u8F85\u9879\u7684\u4E8C\u9009\u4E00\u88C1\u5B9A\uFF0C\u6682\u7F13\u9879\u7559\u7A7A","policyId":"\u5BF9\u5E94\u7684\u4E00\u9879\u653F\u52A1ID"},
    {"name":"\u540F\u6CBB","role":"\u4E3B\u6216\u8F85\u6216\u6682\u7F13","advice":"\u4E00\u6761\u5177\u4F53\u5EFA\u8BAE\u6216\u6682\u7F13\u7406\u7531","decision":"\u4E3B\u8F85\u9879\u7684\u4E8C\u9009\u4E00\u88C1\u5B9A\uFF0C\u6682\u7F13\u9879\u7559\u7A7A","policyId":"\u5BF9\u5E94\u7684\u4E00\u9879\u653F\u52A1ID"}
  ],
  "situation":"\u4E09\u81F3\u56DB\u53E5\u767D\u8BDD\u5C40\u52BF\u7814\u5224",
  "personnel":"\u5BF9\u73B0\u6709\u5B98\u7F72\u548C\u5C97\u4F4D\u7684\u4E00\u6761\u94E8\u9009\u5EFA\u8BAE"
}`;
  const system = `\u4F60\u662F\u5386\u53F2\u7B56\u7565\u6E38\u620F\u300A\u7199\u5B81\u6289\u62E9\u300B\u7684\u8F85\u653F\u5B98\uFF0C\u4E0D\u662F\u63A8\u6F14\u53F2\u5B98\u3002
1. \u4F60\u53EA\u80FD\u5728\u9881\u8BCF\u524D\u63D0\u4F9B\u63D0\u7EB2\uFF0C\u4E25\u7981\u751F\u6210\u53EF\u76F4\u63A5\u9881\u884C\u7684\u5B8C\u6574\u8BCF\u4E66\uFF0C\u4E0D\u80FD\u58F0\u79F0\u653F\u7B56\u5DF2\u7ECF\u5B9E\u65BD\u3002
2. \u6309\u56F0\u5883\u4E25\u91CD\u5EA6\u4E0E\u53EF\u7528\u9884\u7B97\u4F5C\u51FA\u53D6\u820D\uFF0C\u4E3B\u8F85\u6570\u91CF\u4E0D\u56FA\u5B9A\uFF0C\u5141\u8BB8\u591A\u4E2A\u4E3B\u9879\u3001\u6CA1\u6709\u8F85\u9879\u6216\u5168\u90E8\u6682\u7F13\u3002
3. \u5C0A\u91CD\u7199\u5B81\u3001\u5143\u4E30\u65F6\u671F\u7684\u673A\u6784\u3001\u8D44\u6E90\u548C\u653F\u6CBB\u8BED\u8A00\u3002
4. \u56FA\u5B9A\u5217\u51FA\u8D22\u653F\u3001\u6C11\u751F\u3001\u519B\u4E8B\u3001\u540F\u6CBB\u56DB\u9879\u4E14\u987A\u5E8F\u4E0D\u53EF\u6539\u53D8\uFF0C\u4E0D\u65B0\u589E\u5236\u5EA6\u3001\u4EFB\u514D\u3001\u5916\u4EA4\u7B49\u7EF4\u5EA6\u3002
5. \u53EF\u5F15\u7528\u4EBA\u7269\u7ACB\u573A\uFF0C\u4F46\u4E0D\u5F97\u628A\u4EBA\u7269\u7B80\u5355\u5224\u4E3A\u5FE0\u81E3\u6216\u5978\u81E3\u3002
6. \u5FC5\u987B\u4F18\u5148\u4FDD\u8BC1\u6240\u6709\u4E3B\u8F85\u9879\u5728\u5F53\u524D\u653F\u7565\u3001\u884C\u653F\u4E0E\u56FD\u5E93\u9884\u7B97\u5185\u53EF\u6301\u7EED\u6267\u884C\u3002
7. \u6BCF\u9879\u53EA\u6709\u4E00\u53E5\u5177\u4F53\u53EF\u6267\u884C\u5EFA\u8BAE\uFF1B\u6682\u7F13\u9879\u53EA\u5199\u6682\u7F13\u7406\u7531\uFF0C\u4E0D\u5F97\u5939\u5E26\u63AA\u65BD\u3002
8. \u5C40\u52BF\u5206\u6790\u548C\u5168\u90E8\u63D0\u7EB2\u6587\u5B57\u90FD\u5FC5\u987B\u4F7F\u7528\u73B0\u4EE3\u767D\u8BDD\uFF0C\u4E3B\u8F85\u9879\u5404\u7ED9\u4E00\u4E2A\u9700\u8981\u73A9\u5BB6\u88C1\u5B9A\u7684\u4E8C\u9009\u4E00\u95EE\u9898\uFF1B\u603B\u663E\u793A\u6587\u672C\u4E0D\u5F97\u8D85\u8FC7\u4E5D\u767E\u5B57\u3002
9. \u94E8\u9009\u5EFA\u8BAE\u4EC5\u80FD\u586B\u8865\u73B0\u6709\u7A7A\u7F3A\u5C97\u4F4D\uFF0C\u4E0D\u5F97\u66FF\u6362\u73B0\u4EFB\u3001\u6539\u9769\u5B98\u5236\u67B6\u6784\u6216\u81EA\u52A8\u4EFB\u514D\uFF1B\u6CA1\u6709\u5408\u9002\u7A7A\u7F3A\u65F6\u660E\u786E\u4E0D\u8C03\u6574\u4EBA\u4E8B\u3002
10. \u8F93\u51FA\u5FC5\u987B\u4E3AJSON\u3002
11. ${outputLanguageRule}`;
  const output = await callModel(config, system, prompt, fetchImpl);
  const parsed = parseJsonOutput(output);
  return {
    ok: true,
    advice: normalizeAdvisorOutline(parsed, administrativeRemaining, administrativeCapacity, state, event)
  };
}
async function narrateSettlementWithAI({ edict, stateBefore, stateAfter, event, officer, policies, record, history = [], config = {}, fetchImpl = fetch } = {}) {
  const prompt = `\u8BF7\u57FA\u4E8E\u4EE5\u4E0B\u5B8C\u6574\u5C40\u52BF\uFF0C\u63A8\u6F14\u8FD9\u9053\u8BCF\u4E66\u5728\u672A\u6765\u534A\u5E74\u4E2D\u7684\u771F\u5B9E\u6267\u884C\u8FC7\u7A0B\u3002

\u5F53\u524D\u65F6\u95F4\uFF1A${formatDate(stateBefore?.date)}
\u73A9\u5BB6\u539F\u8BCF\uFF1A${String(edict || "").trim()}
\u672C\u671F\u6025\u52A1\uFF1A${JSON.stringify(event)}
\u6267\u884C\u5B98\u5B8C\u6574\u4EBA\u8BBE\uFF1A${JSON.stringify(officer)}
\u4E2D\u4E66\u8BC6\u522B\u7684\u653F\u52A1\uFF1A${JSON.stringify(policies)}
\u6539\u9769\u524D\u56F0\u5883\uFF1A${JSON.stringify(stateBefore?.dilemmas || [])}
\u6539\u9769\u540E\u56F0\u5883\uFF1A${JSON.stringify(stateAfter?.dilemmas || [])}
\u6539\u9769\u524D\u56FD\u52BF\uFF1A${JSON.stringify({ indicators: stateBefore?.indicators, resources: stateBefore?.resources, polity: stateBefore?.polity })}
\u7A0B\u5E8F\u5DF2\u7ECF\u88C1\u5B9A\u7684\u6539\u9769\u540E\u56FD\u52BF\uFF1A${JSON.stringify({ indicators: stateAfter?.indicators, resources: stateAfter?.resources, polity: stateAfter?.polity })}
\u7A0B\u5E8F\u786E\u8BA4\u7684\u5168\u90E8\u53D8\u5316\uFF1A${JSON.stringify(record)}
\u6B64\u524D\u516D\u56DE\u5408\u6863\u6848\uFF1A${formatHistory(history)}

\u4F60\u7684\u4EFB\u52A1\u4E0D\u662F\u518D\u6B21\u8BA1\u7B97\u8F93\u8D62\uFF0C\u800C\u662F\u89E3\u91CA\u8FD9\u4E9B\u65E2\u5B9A\u53D8\u5316\u5982\u4F55\u5728\u5317\u5B8B\u56FD\u5BB6\u673A\u5668\u4E2D\u53D1\u751F\u3002\u201C\u7A0B\u5E8F\u786E\u8BA4\u7684\u5168\u90E8\u53D8\u5316\u201D\u5185\u6BCF\u9879\u653F\u52A1\u7684\u6267\u884C\u72B6\u6001\u3001\u76F4\u63A5\u5F71\u54CD\u548C\u963B\u529B\u90FD\u662F\u4E0D\u53EF\u63A8\u7FFB\u7684\u4E8B\u5B9E\uFF1Breport \u4E0E implementation \u5FC5\u987B\u9010\u9879\u544A\u77E5\u73A9\u5BB6\u8BE5\u653F\u52A1\u529E\u6210\u4E86\u4EC0\u4E48\u3001\u4E3A\u4F55\u53D7\u963B\u3001\u8FD8\u7559\u4E0B\u4EC0\u4E48\uFF0C\u4E0D\u5F97\u628A\u3010\u90E8\u5206\u843D\u5B9E\u3011\u6216\u3010\u6267\u884C\u53D7\u963B\u3011\u5199\u6210\u5706\u6EE1\u5B8C\u6210\u3002\u5FC5\u987B\u4F53\u73B0\u8BCF\u4EE4\u7531\u5FA1\u524D\u53D1\u51FA\u540E\uFF0C\u7ECF\u8FC7\u4E2D\u4E66\u95E8\u4E0B\u3001\u4E09\u53F8\u6216\u67A2\u5BC6\u9662\u3001\u76D1\u53F8\u3001\u5DDE\u53BF\u548C\u80E5\u540F\u7684\u4F20\u9012\u4E0E\u53D8\u5F62\uFF1B\u7ED3\u5408\u6267\u884C\u5B98\u7684\u6027\u683C\u3001\u884C\u4E8B\u65B9\u5F0F\u3001\u653F\u6CBB\u5E95\u7EBF\u548C\u8BED\u8A00\u98CE\u683C\u3002\u5B98\u5458\u4E4B\u95F4\u5B58\u5728\u5236\u5EA6\u5224\u65AD\u4E0E\u5229\u76CA\u51B2\u7A81\uFF0C\u4E0D\u5F97\u5199\u6210\u5FE0\u81E3\u4E0E\u5978\u81E3\u7684\u7B80\u5355\u5BF9\u7ACB\u3002

\u6BCF\u6761\u5404\u65B9\u56DE\u594F\u7684 text \u7B2C\u4E00\u884C\u5FC5\u987B\u5148\u7528\u4E00\u53E5\u4E0D\u8D85\u8FC7\u4E8C\u5341\u4E8C\u5B57\u7684\u73B0\u4EE3\u767D\u8BDD\u76F4\u63A5\u8BF4\u6E05\u201C\u8FD9\u5BF9\u8BE5\u65B9\u610F\u5473\u7740\u4EC0\u4E48\u201D\uFF0C\u518D\u63A5\u5236\u5EA6\u7EC6\u8282\uFF1B\u4E0D\u5F97\u4F7F\u7528\u201C\u76F4\u767D\u8BF4\u201D\u201C\u7B80\u5355\u8BF4\u201D\u201C\u8BF4\u767D\u4E86\u201D\u7B49\u5F15\u5BFC\u8BCD\uFF0C\u4E5F\u4E0D\u8981\u4E00\u4E0A\u6765\u5C31\u5199\u516C\u6587\u8154\u3002

\u53EA\u8FD4\u56DEJSON\uFF0C\u4E0D\u5F97\u9644\u52A0Markdown\uFF1A
{
  "report":"\u56DB\u81F3\u516D\u6BB5\u8FDE\u8D2F\u7684\u53F2\u5B98\u594F\u62A5\uFF0C\u5177\u4F53\u63CF\u8FF0\u653F\u7B56\u600E\u6837\u5B9E\u65BD",
  "situationUpdate":"\u4E00\u6BB5\u8BDD\u6982\u62EC\u8D22\u653F\u3001\u8FB9\u9632\u3001\u540F\u6CBB\u3001\u6C11\u751F\u548C\u515A\u4E89\u4E2D\u54EA\u4E9B\u56F0\u5883\u53D1\u751F\u53D8\u5316",
  "implementation":[{"stage":"\u4E2D\u4E66\u8986\u594F/\u90E8\u53F8\u627F\u529E/\u76D1\u53F8\u7763\u5BDF/\u5DDE\u53BF\u843D\u5B9E","text":"\u8BE5\u5C42\u7EA7\u5B9E\u9645\u505A\u4E86\u4EC0\u4E48\u4EE5\u53CA\u5982\u4F55\u53D8\u5F62"}],
  "reactions":[{"label":"\u671D\u8BAE/\u4E09\u53F8/\u53F0\u8C0F/\u5DDE\u53BF/\u8C6A\u5F3A/\u767E\u59D3\u7B49","text":"\u5177\u4F53\u800C\u4E92\u4E0D\u91CD\u590D\u7684\u53CD\u5E94"}],
  "nominations":[{"name":"\u5F53\u65F6\u771F\u5B9E\u5B58\u5728\u7684\u5B98\u5458\u59D3\u540D","role":"\u53EF\u627F\u62C5\u7684\u8EAB\u4EFD\u804C\u8D23","stance":"\u653F\u6CBB\u7ACB\u573A","assessment":"\u80FD\u529B\u4E0E\u4EFB\u7528\u98CE\u9669"}],
  "institutionalChanges":["\u53EA\u6709\u8BCF\u4E66\u786E\u5B9E\u6D89\u53CA\u673A\u6784\u6743\u8D23\u6216\u4EFB\u514D\u65F6\u624D\u586B\u5199\uFF0C\u5426\u5219\u4E3A\u7A7A\u6570\u7EC4"],
  "nextWarnings":["\u4E0B\u4E00\u56DE\u5408\u503C\u5F97\u8B66\u60D5\u7684\u5177\u4F53\u9690\u60A3"],
  "historicalNote":"\u53F2\u5B9E\u4F9D\u636E\u4E0E\u53CD\u4E8B\u5B9E\u8FB9\u754C"
}`;
  const system = `\u4F60\u662F\u5386\u53F2\u7B56\u7565\u6E38\u620F\u300A\u7199\u5B81\u6289\u62E9\u300B\u7684\u5B9E\u65F6\u63A8\u6F14\u53F2\u5B98\u3002

\u5386\u53F2\u5E95\u7EBF\uFF1A
1. \u5C0A\u91CD\u5317\u5B8B\u7199\u5B81\u3001\u5143\u4E30\u65F6\u671F\u8BED\u5883\uFF0C\u4E0D\u5199\u73B0\u4EE3\u5236\u5EA6\u3001\u8D85\u65F6\u4EE3\u6280\u672F\u6216\u7384\u5E7B\u5185\u5BB9\u3002
2. \u4E0D\u66FF\u73A9\u5BB6\u51B3\u7B56\uFF0C\u4E0D\u4FEE\u6539\u7A0B\u5E8F\u5DF2\u7ECF\u7ED3\u7B97\u7684\u4EFB\u4F55\u6570\u503C\uFF0C\u4E5F\u4E0D\u8F93\u51FA\u65B0\u7684\u6570\u503C\u5956\u60E9\u3002
3. \u5FC5\u987B\u56F4\u7ED5\u73A9\u5BB6\u539F\u8BCF\u3001\u672C\u671F\u6267\u884C\u5B98\u3001\u5F53\u524D\u56F0\u5883\u4E0E\u6B64\u524D\u56DE\u5408\u8FDE\u7EED\u63A8\u6F14\uFF0C\u4E0D\u80FD\u628A\u8F93\u5165\u5F53\u6210\u5B64\u7ACB\u804A\u5929\u3002
4. \u5177\u4F53\u4F53\u73B0\u4E2D\u4E66\u95E8\u4E0B\u3001\u4E09\u53F8\u3001\u67A2\u5BC6\u9662\u3001\u53F0\u8C0F\u3001\u76D1\u53F8\u3001\u5DDE\u53BF\u3001\u80E5\u540F\u3001\u8C6A\u5F3A\u4E0E\u767E\u59D3\u7684\u4E0D\u540C\u53CD\u5E94\u3002
5. \u5982\u4EA7\u751F\u7528\u4EBA\u9700\u6C42\uFF0C\u53EA\u80FD\u4E3E\u8350\u4E00\u81F3\u4E24\u540D\u5F53\u65F6\u771F\u5B9E\u5B58\u5728\u4E14\u4E0E\u653F\u52A1\u76F8\u5173\u7684\u4EBA\u7269\uFF1B\u6CA1\u6709\u5408\u9002\u4EBA\u9009\u65F6\u8FD4\u56DE\u7A7A\u6570\u7EC4\u3002
6. \u5C11\u4F5C\u7A7A\u6CDB\u8912\u8D2C\uFF0C\u591A\u5199\u653F\u4EE4\u4F20\u9012\u3001\u8D44\u6E90\u8C03\u5EA6\u3001\u5730\u65B9\u53D8\u901A\u3001\u53D7\u76CA\u8005\u3001\u53D7\u635F\u8005\u4E0E\u957F\u671F\u9690\u60A3\u3002
7. AI\u53EA\u6709\u53D9\u4E8B\u89E3\u91CA\u6743\uFF1B\u89C4\u5219\u5F15\u64CE\u662F\u6570\u503C\u3001\u56F0\u5883\u4E0E\u5206\u9879\u6267\u884C\u72B6\u6001\u7684\u552F\u4E00\u88C1\u5224\u3002
8. ${outputLanguageRule}`;
  const output = await callModel(config, system, prompt, fetchImpl);
  const parsed = parseJsonOutput(output);
  return {
    ok: true,
    narrative: {
      report: localizeInternalTerms(parsed.report),
      situationUpdate: localizeInternalTerms(parsed.situationUpdate),
      implementation: parsePairs(parsed.implementation, "stage"),
      reactions: Array.isArray(parsed.reactions) ? parsed.reactions.map((item) => {
        const label = localizeInternalTerms(item?.label);
        return { label, text: addPlainReactionLead(label, item?.text) };
      }).filter((item) => item.label && item.text).slice(0, 8) : [],
      nominations: Array.isArray(parsed.nominations) ? parsed.nominations.map((item) => ({ name: localizeInternalTerms(item?.name), role: localizeInternalTerms(item?.role), stance: localizeInternalTerms(item?.stance), assessment: localizeInternalTerms(item?.assessment) })).filter((item) => item.name && item.role && item.assessment).slice(0, 2) : [],
      institutionalChanges: parseStringList(parsed.institutionalChanges, 6),
      nextWarnings: parseStringList(parsed.nextWarnings, 5),
      historicalNote: localizeInternalTerms(parsed.historicalNote)
    }
  };
}
async function testAIConnection({ config = {}, fetchImpl = fetch } = {}) {
  const output = await callModel(config, "\u4F60\u662F\u63A5\u53E3\u8FDE\u901A\u6027\u6D4B\u8BD5\u52A9\u624B\uFF0C\u53EA\u8FD4\u56DEJSON\u3002", '\u53EA\u8FD4\u56DEJSON\uFF1A{"message":"\u5343\u95EE\u53F2\u5B98\u5DF2\u5C31\u7EEA"}', fetchImpl);
  const parsed = parseJsonOutput(output);
  return { ok: true, message: String(parsed.message || "\u5343\u95EE\u53F2\u5B98\u5DF2\u5C31\u7EEA") };
}
async function callModel(config, system, user, fetchImpl) {
  const runtime = normalizeConfig(config);
  if (!runtime.apiKey) throw new Error("\u5C1A\u672A\u586B\u5199\u5B8C\u6574\u7684 DeepSeek API Key\u3002");
  if (/[＊*…]/.test(runtime.apiKey)) throw new Error("\u5F53\u524D\u586B\u5199\u7684\u662F\u8131\u654F Key\uFF08\u542B\u661F\u53F7\u6216\u7701\u7565\u53F7\uFF09\uFF0C\u8BF7\u4ECE DeepSeek \u5F00\u653E\u5E73\u53F0\u521B\u5EFA\u6216\u590D\u5236\u5B8C\u6574 API Key\u3002");
  if (!/^[\x21-\x7e]+$/.test(runtime.apiKey)) throw new Error("API Key \u542B\u6709\u4E2D\u6587\u6216\u5176\u4ED6\u975E\u6CD5\u5B57\u7B26\uFF0C\u8BF7\u91CD\u65B0\u590D\u5236\u5B8C\u6574 Key\u3002");
  if (!runtime.baseUrl || !runtime.model) throw new Error("AI Base URL\u6216\u6A21\u578B\u540D\u79F0\u4E3A\u7A7A\u3002");
  if (runtime.provider === "qwen" && runtime.apiKey.startsWith("sk-sp-")) {
    throw new Error("\u5F53\u524D\u586B\u5199\u7684\u662F\u767E\u70BC Coding Plan Key\uFF08sk-sp-\uFF09\uFF1B\u8BE5\u5957\u9910\u4E0D\u5141\u8BB8\u7528\u4E8E\u81EA\u5B9A\u4E49\u5E94\u7528\u540E\u7AEF\uFF0C\u8BF7\u6539\u7528\u767E\u70BC\u6309\u91CF\u4ED8\u8D39 API Key\u3002");
  }
  if (/\{?workspaceid\}?/i.test(runtime.baseUrl)) {
    throw new Error("\u767E\u70BC Base URL \u4E2D\u7684 WorkspaceId \u4ECD\u662F\u5360\u4F4D\u7B26\uFF0C\u8BF7\u66FF\u6362\u4E3A\u771F\u5B9E\u4E1A\u52A1\u7A7A\u95F4 ID\u3002");
  }
  const baseUrl = normalizeBaseUrl(runtime.baseUrl, runtime.apiType);
  const url = runtime.apiType === "anthropic" ? `${baseUrl}/messages` : `${baseUrl}/chat/completions`;
  const options = runtime.apiType === "anthropic" ? {
    method: "POST",
    headers: { "x-api-key": runtime.apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: runtime.model, max_tokens: 3e3, system, messages: [{ role: "user", content: user }] })
  } : {
    method: "POST",
    headers: {
      Authorization: `Bearer ${runtime.apiKey}`,
      "Content-Type": "application/json",
      ...runtime.provider === "qwen" ? { "X-DashScope-Wait-Timeout": "30" } : {}
    },
    body: JSON.stringify(runtime.provider === "qwen" ? { model: runtime.model, messages: [{ role: "system", content: system }, { role: "user", content: user }], response_format: { type: "json_object" }, enable_thinking: false, temperature: 0.65, max_completion_tokens: 3500 } : runtime.provider === "deepseek" ? { model: runtime.model, messages: [{ role: "system", content: system }, { role: "user", content: user }], response_format: { type: "json_object" }, thinking: { type: "disabled" }, temperature: 0.65, max_tokens: 3500 } : { model: runtime.model, messages: [{ role: "system", content: system }, { role: "user", content: user }], response_format: { type: "json_object" }, temperature: 0.65, max_tokens: 3500 })
  };
  let response;
  let data;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    response = await fetchImpl(url, options);
    data = await readResponseBody(response);
    if (response.ok) break;
    if (!isRetryableRateLimit(response.status, data) || attempt === 3) {
      throw new Error(formatProviderError(data, response.status, runtime, baseUrl));
    }
    await waitForRetry(response, attempt);
  }
  const output = runtime.apiType === "anthropic" ? data?.content?.map((part) => part?.text || "").join("\n") : data?.choices?.[0]?.message?.content;
  if (!output) throw new Error("AI\u6CA1\u6709\u8FD4\u56DE\u53EF\u7528\u6587\u672C\u3002");
  return output;
}
function normalizeConfig(config) {
  const provider = PROVIDERS[config.provider] || PROVIDERS.deepseek;
  return {
    provider: PROVIDERS[config.provider] ? config.provider : "deepseek",
    apiType: provider.apiType,
    apiKey: String(config.apiKey || "").replace(/\s+/g, ""),
    baseUrl: String(config.baseUrl || provider.baseUrl).trim(),
    model: String(config.model || provider.model).trim()
  };
}
function normalizeBaseUrl(value, apiType) {
  const baseUrl = String(value).trim().replace(/\/+$/, "");
  const endpoint = apiType === "anthropic" ? "/messages" : "/chat/completions";
  return baseUrl.toLowerCase().endsWith(endpoint) ? baseUrl.slice(0, -endpoint.length) : baseUrl;
}
async function readResponseBody(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}
function formatProviderError(data, status, runtime, baseUrl) {
  const message = data?.error?.message || data?.message || data?.error?.code || data?.code || `AI\u8BF7\u6C42\u5931\u8D25\uFF1AHTTP ${status}`;
  const requestId = data?.request_id || data?.requestId;
  const suffix = requestId ? `\uFF08Request ID: ${requestId}\uFF09` : "";
  if (runtime?.provider === "qwen" && /model access denied/i.test(String(message))) {
    return `\u767E\u70BC\u62D2\u7EDD\u8BBF\u95EE\u6A21\u578B\u201C${runtime.model}\u201D\u3002\u5F53\u524D\u5730\u5740\uFF1A${baseUrl}\u3002\u8BF7\u786E\u8BA4 API Key \u4E0E\u8BE5\u5730\u5740\u5C5E\u4E8E\u540C\u4E00\u5730\u57DF\u548C\u4E1A\u52A1\u7A7A\u95F4\uFF0C\u5E76\u5728\u767E\u70BC\u63A7\u5236\u53F0\u786E\u8BA4\u8BE5\u7A7A\u95F4\u53EF\u8C03\u7528\u6B64\u6A21\u578B${suffix}`;
  }
  if (runtime?.provider === "qwen" && isRateLimitMessage(message)) {
    return `\u767E\u70BC\u5F53\u524D\u7E41\u5FD9\u6216\u89E6\u53D1\u77AC\u65F6\u9650\u6D41\uFF0C\u7CFB\u7EDF\u5DF2\u81EA\u52A8\u91CD\u8BD5 3 \u6B21\uFF1B\u8BF7\u7B49\u5F85\u7EA6\u4E00\u5206\u949F\u540E\u518D\u8BD5${suffix}`;
  }
  return `${String(message)}${suffix}`;
}
function isRetryableRateLimit(status, data) {
  const message = data?.error?.message || data?.message || data?.error?.code || data?.code || "";
  return status === 429 || isRateLimitMessage(message);
}
function isRateLimitMessage(message) {
  return /rate limit|too many requests|throttl|request rate|quota exceeded/i.test(String(message));
}
function waitForRetry(response, attempt) {
  const retryAfterSeconds = Number(response?.headers?.get?.("retry-after"));
  const fallbackDelays = [1e3, 2500, 5e3];
  const delay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0 ? retryAfterSeconds * 1e3 : fallbackDelays[attempt];
  return new Promise((resolve) => setTimeout(resolve, delay));
}
function parseJsonOutput(text) {
  const clean = String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("AI\u8FD4\u56DE\u5185\u5BB9\u4E0D\u662F\u6709\u6548JSON\u3002");
  return JSON.parse(clean.slice(start, end + 1));
}
function formatDate(date) {
  if (!date) return "\u7199\u5B81\u521D\u5E74";
  return `\u7199\u5B81${date.reignYear}\u5E74${date.half === 1 ? "\u4E0A\u534A\u5E74" : "\u4E0B\u534A\u5E74"}`;
}
function formatHistory(history) {
  if (!Array.isArray(history) || !history.length) return "\u65E0\u3002";
  return history.slice(-6).map((turn) => {
    const policies = (turn.policyIds || []).map((id) => allowedPolicies.find(([allowed]) => allowed === id)?.[1] || id).join("\u3001") || "\u672A\u8BC6\u522B";
    const indicatorChanges = localizeInternalTerms(JSON.stringify(turn.indicatorChanges || {}));
    const resourceChanges = localizeInternalTerms(JSON.stringify(turn.resourceChanges || {}));
    const outcomes = Array.isArray(turn.policyOutcomes) && turn.policyOutcomes.length ? turn.policyOutcomes.map((outcome) => `${outcome.policyName || outcome.policyId}\u3010${outcome.status || "\u672A\u5224"}\u3011\uFF1A\u5DF2\u89C1\u7ED3\u679C\u201C${outcome.result || "\u672A\u5F55"}\u201D\uFF1B\u963B\u529B\u201C${(outcome.blockers || []).join("\uFF1B") || "\u65E0\u663E\u8457\u963B\u529B"}\u201D\uFF1B\u9057\u7559\u201C${outcome.unresolved || "\u672A\u5F55"}\u201D\uFF1B\u540E\u7EED\u201C${outcome.nextStep || "\u672A\u5F55"}\u201D`).join("\uFF1B") : "\u65E7\u6863\u6848\u672A\u5206\u9879\u8BB0\u5F55\u6267\u884C\u7ED3\u679C";
    const narrative = turn.narrative ? `\u53F2\u5B98\u8BE6\u62A5\u201C${turn.narrative.report || ""}\u201D\uFF1B\u5404\u7EA7\u65BD\u884C\u201C${(turn.narrative.implementation || []).map((item) => `${item.stage}:${item.text}`).join("\uFF1B")}\u201D\uFF1B\u540E\u7EED\u8B66\u8BAF\u201C${(turn.narrative.nextWarnings || []).join("\uFF1B") || "\u65E0"}\u201D` : `\u7ED3\u7B97\u6458\u8981\u201C${turn.aiSummary || turn.eventTitle || "\u672A\u5F55"}\u201D`;
    return `\u7B2C${turn.turn}\u56DE\uFF1A\u6838\u5FC3\u8BCF\u4EE4\u201C${turn.edictText || "\u672A\u5F55\u539F\u6587"}\u201D\uFF1B\u65BD\u884C\u653F\u52A1\u201C${policies}\u201D\uFF1B\u5206\u9879\u6267\u884C\u6863\u6848\uFF1A${outcomes}\uFF1B\u56FD\u52BF\u53D8\u5316${indicatorChanges}\uFF1B\u4F59\u91CF\u53D8\u5316${resourceChanges}\uFF1B\u884C\u653F\u8D85\u8F7D${turn.administrativeOverload || 0}\u3001\u653F\u7565\u900F\u652F${turn.politicalOverdraft || 0}\uFF1B${narrative}`;
  }).join("\n");
}
function parsePairs(value, labelKey) {
  return Array.isArray(value) ? value.map((item) => ({ stage: localizeInternalTerms(item?.[labelKey]), text: localizeInternalTerms(item?.text) })).filter((item) => item.stage && item.text).slice(0, 6) : [];
}
function parseStringList(value, limit) {
  return Array.isArray(value) ? value.map(localizeInternalTerms).filter(Boolean).slice(0, limit) : [];
}

// cloudflare/worker.mjs
var ALLOWED_ORIGINS = /* @__PURE__ */ new Set([
  "https://nayoutang.github.io",
  "null"
]);
var requestBuckets = /* @__PURE__ */ new Map();
var WINDOW_MS = 10 * 60 * 1e3;
var MAX_REQUESTS_PER_WINDOW = 60;
var worker_default = {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method === "GET") {
      return json({ ok: true, service: "\u7199\u5B81\u6289\u62E9\u63A8\u6F14\u670D\u52A1" }, 200, cors);
    }
    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405, cors);
    }
    if (!ALLOWED_ORIGINS.has(origin) && !isLocalOrigin(origin)) {
      return json({ ok: false, error: "\u5F53\u524D\u6765\u6E90\u4E0D\u5141\u8BB8\u8C03\u7528\u63A8\u6F14\u670D\u52A1\u3002" }, 403, cors);
    }
    if (!env.DEEPSEEK_API_KEY) {
      return json({ ok: false, error: "\u63A8\u6F14\u670D\u52A1\u5C1A\u672A\u914D\u7F6E\u5BC6\u94A5\u3002" }, 503, cors);
    }
    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
    if (!consumeRequest(clientIp)) {
      return json({ ok: false, error: "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002" }, 429, cors);
    }
    try {
      const length = Number(request.headers.get("Content-Length") || 0);
      if (length > 75e4) throw new Error("\u8BF7\u6C42\u5185\u5BB9\u8FC7\u957F\u3002");
      const input = await request.json();
      input.config = {
        provider: "deepseek",
        apiKey: env.DEEPSEEK_API_KEY,
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-flash"
      };
      const path = new URL(request.url).pathname;
      let result;
      if (path === "/api/interpret") result = await interpretEdictWithAI(input);
      else if (path === "/api/narrate") result = await narrateSettlementWithAI(input);
      else if (path === "/api/advise") result = await adviseWithAI(input);
      else if (path === "/api/test") result = await testAIConnection(input);
      else return json({ ok: false, error: "Not found" }, 404, cors);
      return json(result, 200, cors);
    } catch (error) {
      return json({ ok: false, error: error instanceof Error ? error.message : "\u63A8\u6F14\u8BF7\u6C42\u5931\u8D25" }, 400, cors);
    }
  }
};
function consumeRequest(clientIp) {
  const now = Date.now();
  const current = requestBuckets.get(clientIp);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    requestBuckets.set(clientIp, { startedAt: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= MAX_REQUESTS_PER_WINDOW;
}
function isLocalOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}
function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) || isLocalOrigin(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://nayoutang.github.io",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function json(payload, status, cors) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
export {
  worker_default as default
};
