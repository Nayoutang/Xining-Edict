// ai-history.mjs
var PROVIDERS = {
  deepseek: { apiType: "openai", baseUrl: "https://api.deepseek.com", model: "deepseek-v4-flash" },
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
    allowed: ["green-sprouts-trial", "service-reform-preparation", "reduce-redundant-spending", "cross-check-ledgers"],
    actions: ["\u6838\u6E05\u4E09\u53F8\u5C81\u5165\u5E95\u6570\uFF0C\u65EC\u672B\u5177\u62A5\u3002", "\u6309\u8DEF\u6838\u9A8C\u5B9E\u6536\u5DEE\u989D\uFF0C\u6708\u5185\u7ED3\u6848\u3002", "\u6BD4\u8F83\u65B0\u6CD5\u94B1\u8C37\u9996\u8F6E\u5B9E\u6536\uFF0C\u5254\u9664\u865A\u6570\u3002", "\u8FFD\u67E5\u8D26\u5B9E\u4E0D\u7B26\u6B3E\u9879\uFF0C\u8D23\u4E3B\u53F8\u8BF4\u660E\u3002", "\u636E\u4E2D\u671F\u8D26\u6848\u6536\u7A84\u652F\u7528\uFF0C\u4FDD\u7559\u8D48\u5907\u3002", "\u6E05\u7406\u79EF\u6B20\u4E0E\u865A\u5192\uFF0C\u5206\u8DEF\u9500\u8D26\u3002", "\u590D\u6838\u5386\u5E74\u8D22\u8BA1\u6210\u6548\uFF0C\u8865\u8DB3\u7F3A\u53E3\u3002", "\u7ED3\u6E05\u672A\u51B3\u94B1\u8C37\uFF0C\u5C01\u5B58\u7EC8\u5C40\u8D26\u518C\u3002"]
  },
  {
    name: "\u6C11\u751F",
    scope: "\u767E\u59D3\u8D1F\u62C5",
    policyId: "curb-local-exactions",
    indicator: "livelihood",
    allowed: ["green-sprouts-trial", "service-reform-preparation", "water-conservancy", "curb-local-exactions"],
    actions: ["\u6838\u5B9A\u707E\u4F24\u6237\u5B9E\u8D1F\uFF0C\u5206\u7B49\u9020\u518C\u3002", "\u62BD\u67E5\u9752\u82D7\u6291\u914D\uFF0C\u9000\u8FD8\u5F3A\u655B\u94B1\u7269\u3002", "\u6BD4\u8F83\u8BF8\u8DEF\u5F79\u94B1\u8F7B\u91CD\uFF0C\u5148\u7EA0\u504F\u91CD\u53BF\u3002", "\u6838\u9A8C\u6C34\u5229\u53D7\u76CA\u6237\uFF0C\u51CF\u514D\u65E0\u76CA\u4E4B\u8D39\u3002", "\u8FFD\u67E5\u52A0\u6D3E\u540D\u76EE\uFF0C\u8D23\u76D1\u53F8\u9010\u9879\u9500\u9664\u3002", "\u590D\u6838\u8D2B\u6237\u51CF\u8D1F\u5B9E\u6570\uFF0C\u7EA0\u6B63\u6F0F\u514D\u3002", "\u6E05\u7406\u9057\u7559\u5F79\u503A\uFF0C\u7981\u6B62\u91CD\u590D\u50AC\u79D1\u3002", "\u6C47\u603B\u6C11\u6237\u5B9E\u8D1F\uFF0C\u529E\u7ED3\u672A\u6E05\u7533\u8BC9\u3002"]
  },
  {
    name: "\u519B\u4E8B",
    scope: "\u8FB9\u5907\u4E0E\u519B\u50A8",
    policyId: "northwest-defense",
    indicator: "defense",
    allowed: ["northwest-defense"],
    actions: ["\u76D8\u70B9\u9655\u897F\u519B\u50A8\u7F3A\u53E3\uFF0C\u5341\u65E5\u5177\u62A5\u3002", "\u6838\u5BF9\u5BE8\u5821\u89C1\u7CAE\uFF0C\u5148\u8865\u7D27\u8981\u5904\u3002", "\u67E5\u660E\u8F6C\u8FD0\u8FDF\u6EDE\u8DEF\u6BB5\uFF0C\u9650\u671F\u758F\u901A\u3002", "\u6309\u8FB9\u8B66\u8F7B\u91CD\u8C03\u5242\u519B\u7CAE\uFF0C\u4E0D\u53E6\u589E\u989D\u3002", "\u6838\u9A8C\u519B\u9700\u5B9E\u5230\u6570\uFF0C\u8FFD\u67E5\u9014\u4E2D\u4E8F\u8017\u3002", "\u8865\u8DB3\u5173\u952E\u5BE8\u5821\u6708\u7CAE\uFF0C\u6682\u505C\u865A\u9886\u3002", "\u590D\u67E5\u8FB9\u5907\u8584\u5F31\u5904\uFF0C\u96C6\u4E2D\u73B0\u6709\u5175\u529B\u3002", "\u7ED3\u6E05\u519B\u50A8\u7F3A\u989D\uFF0C\u7559\u8DB3\u5584\u540E\u4E4B\u7528\u3002"]
  },
  {
    name: "\u540F\u6CBB",
    scope: "\u8BCF\u4EE4\u80FD\u5426\u843D\u5230\u5DDE\u53BF",
    policyId: "curb-local-exactions",
    indicator: "execution",
    allowed: ["curb-local-exactions", "review-impeachments", "cross-check-ledgers", "discipline-corrupt-officials"],
    actions: ["\u68B3\u7406\u5DDE\u53BF\u6587\u79FB\uFF0C\u5217\u660E\u627F\u529E\u5B98\u3002", "\u62BD\u9A8C\u4E09\u8DEF\u5949\u884C\u5B9E\u51B5\uFF0C\u6708\u5185\u590D\u594F\u3002", "\u5BF9\u7167\u8BCF\u4EE4\u4E0E\u6848\u724D\uFF0C\u67E5\u51FA\u64C5\u6539\u6761\u76EE\u3002", "\u8FFD\u7A76\u79EF\u538B\u516C\u6587\uFF0C\u8D23\u76D1\u53F8\u5B9A\u671F\u9500\u6848\u3002", "\u6309\u6267\u884C\u504F\u5DEE\u5206\u8D23\uFF0C\u4E0D\u4F5C\u6CDB\u5BDF\u3002", "\u590D\u6838\u5DF2\u52BE\u5B98\u540F\u8BC1\u636E\uFF0C\u4F9D\u6CD5\u7ED3\u6848\u3002", "\u6E05\u7406\u5DDE\u53BF\u672A\u7ED3\u4E8B\u9879\uFF0C\u9010\u4EF6\u56DE\u594F\u3002", "\u6C47\u603B\u5949\u884C\u6210\u6548\uFF0C\u5904\u5206\u5931\u804C\u5B98\u540F\u3002"]
  }
];
var pausedReasons = {
  \u8D22\u653F: ["\u56FD\u5E93\u5C1A\u53EF\u652F\u5E94\uFF0C\u672C\u671F\u6025\u52A1\u5728\u522B\u5904\u3002", "\u8D22\u8BA1\u6CE2\u52A8\u6709\u9650\uFF0C\u672C\u671F\u4E3B\u8F85\u53E6\u6709\u77ED\u677F\u3002", "\u4E3B\u8F85\u6210\u672C\u5DF2\u5B9A\uFF0C\u672C\u671F\u8D22\u529B\u4E0D\u5B9C\u5206\u6563\u3002", "\u56FD\u5E93\u5C1A\u987B\u7559\u5907\uFF0C\u672C\u671F\u4E0D\u5B9C\u53E6\u5F00\u8D22\u52A1\u3002", "\u73B0\u6709\u5C81\u5165\u53EF\u627F\uFF0C\u672C\u671F\u8D22\u653F\u5E76\u975E\u6025\u9879\u3002", "\u672C\u671F\u4E3B\u52A1\u8017\u8D44\u8F83\u591A\uFF0C\u8D22\u8BA1\u4F59\u5730\u6709\u9650\u3002", "\u5386\u5E74\u8D22\u8BA1\u8D8B\u7A33\uFF0C\u672C\u671F\u66F4\u6025\u8005\u5728\u4ED6\u9879\u3002", "\u7EC8\u5C40\u8D22\u529B\u5C1A\u8DB3\uFF0C\u672C\u671F\u65E0\u9700\u53E6\u5360\u4F59\u91CF\u3002"],
  \u6C11\u751F: ["\u6C11\u6237\u8D1F\u62C5\u5C1A\u7A33\uFF0C\u672C\u671F\u6025\u52A1\u4E0D\u5728\u6C11\u751F\u3002", "\u524D\u4EE4\u6210\u6548\u672A\u5B9A\uFF0C\u672C\u671F\u4E0D\u5B9C\u518D\u6270\u6C11\u6237\u3002", "\u5DDE\u53BF\u627F\u8F7D\u5DF2\u7D27\uFF0C\u672C\u671F\u6C11\u52A1\u4E0D\u5B9C\u5E76\u4E3E\u3002", "\u6C11\u751F\u6CE2\u52A8\u6709\u9650\uFF0C\u672C\u671F\u5C1A\u975E\u6700\u6025\u77ED\u677F\u3002", "\u5F53\u524D\u5B9E\u8D1F\u672A\u6076\u5316\uFF0C\u672C\u671F\u53EF\u8BA9\u4F4D\u4E3B\u52A1\u3002", "\u4E3B\u8F85\u5DF2\u6709\u66F4\u6025\u65B9\u5411\uFF0C\u672C\u671F\u6C11\u52A1\u5B9C\u7F13\u3002", "\u65E2\u6709\u51CF\u8D1F\u5C1A\u5728\u663E\u6548\uFF0C\u672C\u671F\u65E0\u9700\u53E0\u52A0\u3002", "\u7EC8\u5C40\u6C11\u60C5\u53EF\u6301\uFF0C\u672C\u671F\u4F59\u91CF\u5B9C\u987E\u4ED6\u9879\u3002"],
  \u519B\u4E8B: ["\u8FB9\u8B66\u672A\u81F3\u6025\u8FEB\uFF0C\u672C\u671F\u8D22\u529B\u5B9C\u987E\u4E3B\u52A1\u3002", "\u519B\u50A8\u5C1A\u53EF\u652F\u5E94\uFF0C\u672C\u671F\u8FB9\u52A1\u5E76\u975E\u77ED\u677F\u3002", "\u8FB9\u60C5\u672A\u89C1\u9AA4\u53D8\uFF0C\u672C\u671F\u65E0\u9700\u5360\u7528\u4F59\u91CF\u3002", "\u73B0\u6709\u5BE8\u5821\u53EF\u5B88\uFF0C\u672C\u671F\u6025\u52A1\u53E6\u6709\u6240\u5C5E\u3002", "\u519B\u9700\u538B\u529B\u53EF\u63A7\uFF0C\u672C\u671F\u4E3B\u8F85\u4E0D\u5728\u8FB9\u5907\u3002", "\u672C\u671F\u5185\u653F\u66F4\u6025\uFF0C\u8FB9\u52A1\u6682\u65E0\u8FEB\u5207\u4E4B\u52BF\u3002", "\u8FB9\u5907\u5DF2\u7A0D\u7A33\uFF0C\u672C\u671F\u4E0D\u5B9C\u5206\u6563\u56FD\u529B\u3002", "\u7EC8\u5C40\u8FB9\u60C5\u53EF\u6301\uFF0C\u672C\u671F\u65E0\u9700\u53E6\u5217\u5B9E\u52A1\u3002"],
  \u540F\u6CBB: ["\u5730\u65B9\u627F\u8F7D\u5C1A\u53EF\uFF0C\u672C\u671F\u4E0D\u5B9C\u53E0\u52A0\u4E8B\u52A1\u3002", "\u6709\u53F8\u4F59\u529B\u5DF2\u7D27\uFF0C\u672C\u671F\u5E94\u7559\u4E3B\u52A1\u3002", "\u524D\u4EE4\u5C1A\u5728\u6D88\u5316\uFF0C\u672C\u671F\u540F\u6CBB\u5E76\u975E\u9996\u6025\u3002", "\u5730\u65B9\u672A\u89C1\u65B0\u58C5\uFF0C\u672C\u671F\u65E0\u9700\u53E6\u5360\u4F59\u91CF\u3002", "\u73B0\u6709\u627F\u529E\u5C1A\u7A33\uFF0C\u672C\u671F\u6025\u52A1\u5728\u522B\u9879\u3002", "\u5DDE\u53BF\u538B\u529B\u53EF\u63A7\uFF0C\u672C\u671F\u4E0D\u5B9C\u518D\u6DFB\u4E8B\u52A1\u3002", "\u6267\u884C\u5DF2\u89C1\u6539\u5584\uFF0C\u672C\u671F\u53EF\u8BA9\u4F4D\u66F4\u5F31\u56FD\u52BF\u3002", "\u7EC8\u5C40\u627F\u8F7D\u5C1A\u8DB3\uFF0C\u672C\u671F\u65E0\u9700\u53E6\u5217\u540F\u52A1\u3002"]
};
function conciseSentence(value, fallback, maxLength = 24) {
  const cleaned = localizeInternalTerms(value).replace(/[\r\n|]+/g, "\uFF0C").replace(/【(?:主|辅|暂缓)】/g, "").replace(/^(?:财政|民生|军事|吏治)[：:]?/, "").replace(/(?:宜稳妥推进|酌情办理|视情况而定|统筹兼顾)/g, "").trim() || fallback;
  const firstSentence = cleaned.split(/(?<=[。！？])/u)[0] || cleaned;
  const clipped = firstSentence.length > maxLength ? `${firstSentence.slice(0, maxLength - 1).replace(/[，、；：]$/, "")}\u3002` : firstSentence;
  return /[。！？]$/.test(clipped) ? clipped : `${clipped}\u3002`;
}
function stageForTurn(turn, maxTurns) {
  const ratio = turn / Math.max(1, maxTurns);
  return ratio <= 0.3 ? "\u524D\u671F" : ratio <= 0.7 ? "\u4E2D\u671F" : "\u540E\u671F";
}
function pausedSentence(value, definition, turn, indicators = {}) {
  void value;
  void indicators;
  const choices = pausedReasons[definition.name];
  return choices[(turn - 1) % choices.length];
}
function normalizeAdvisorOutline(parsed, current, capacity, state = {}) {
  const source = Array.isArray(parsed.dimensions) ? parsed.dimensions : [];
  const byName = new Map(source.map((item) => [localizeInternalTerms(item?.name), item]));
  let mainName = advisorDimensions.find(({ name }) => localizeInternalTerms(byName.get(name)?.role).replace(/[【】]/g, "") === "\u4E3B")?.name;
  if (!mainName) mainName = advisorDimensions[0].name;
  let supportName = advisorDimensions.find(({ name }) => name !== mainName && localizeInternalTerms(byName.get(name)?.role).replace(/[【】]/g, "") === "\u8F85")?.name;
  if (!supportName) supportName = advisorDimensions.find(({ name }) => name !== mainName)?.name;
  const turn = Math.max(1, Math.min(8, Math.round(Number(state?.turn) || 1)));
  const previousPolicyIds = new Set((state?.history || []).flatMap((record) => record?.policyIds || []));
  const previousAdvice = (state?.advisorHistory || []).join("\n");
  const dimensions = advisorDimensions.map((definition) => {
    const item = byName.get(definition.name) || {};
    const role = definition.name === mainName ? "\u4E3B" : definition.name === supportName ? "\u8F85" : "\u6682\u7F13";
    const requestedPolicyId = String(item?.policyId || "");
    const policyId = definition.allowed.includes(requestedPolicyId) ? requestedPolicyId : definition.policyId;
    const fallback = definition.actions[turn - 1] || definition.actions.at(-1);
    let advice = role === "\u6682\u7F13" ? pausedSentence(item?.advice, definition, turn, state?.indicators) : conciseSentence(item?.advice, fallback);
    const repeatedSuggestion = role !== "\u6682\u7F13" && previousAdvice.includes(advice.replace(/[。！？]$/, ""));
    if (role !== "\u6682\u7F13" && (previousPolicyIds.has(policyId) || repeatedSuggestion)) {
      advice = conciseSentence(previousPolicyIds.has(policyId) ? `\u7EED\u529E\uFF0C${fallback}` : fallback, fallback);
    }
    return {
      name: definition.name,
      scope: definition.scope,
      role,
      advice,
      policyId
    };
  });
  const personnel = conciseSentence(parsed.personnel, "\u6682\u65E0\u8C03\u4EFB\u5EFA\u8BAE\u3002", 20);
  const render = (items, personnelText) => [
    `\u884C\u653F\u4F59\u91CF:${current}/${capacity}`,
    "",
    ...items.map((item) => `${item.name}|(${item.scope})\u3010${item.role}\u3011${item.advice}`),
    "",
    `\u4EBA\u4E8B:${personnelText}`
  ].join("\n");
  let outline = render(dimensions, personnel);
  if (outline.length > 200) {
    for (const item of dimensions) item.advice = conciseSentence(item.advice, item.advice, 18);
    outline = render(dimensions, conciseSentence(personnel, "\u6682\u65E0\u8C03\u4EFB\u5EFA\u8BAE\u3002", 14));
  }
  return {
    outline,
    dimensions,
    personnel,
    policyIds: dimensions.filter((item) => item.role !== "\u6682\u7F13").map((item) => item.policyId)
  };
}
var outputLanguageRule = `\u8F93\u5165\u4E2D\u7684\u82F1\u6587\u952E\u540D\u548C\u8FDE\u5B57\u7B26ID\u90FD\u662F\u7A0B\u5E8F\u5185\u90E8\u6807\u8BC6\uFF0C\u53EA\u4F9B\u4F60\u7406\u89E3\uFF0C\u7EDD\u4E0D\u80FD\u539F\u6837\u5199\u8FDB\u9762\u5411\u73A9\u5BB6\u7684\u6587\u5B57\u3002
\u5FC5\u987B\u4F7F\u7528\u4E2D\u6587\u79F0\u547C\uFF1Atreasury=\u56FD\u5E93\uFF0CpoliticalCapital=\u653F\u7565\uFF0Cadministration=\u884C\u653F\uFF0Cfinance=\u8D22\u7528\uFF0Clivelihood=\u6C11\u751F\uFF0Cdefense=\u8FB9\u5907\uFF0CcourtSupport=\u58EB\u8BBA\uFF0Cexecution=\u6267\u884C\uFF0Cseverity=\u4E25\u91CD\u5EA6\u3002\u4E0D\u8981\u8F93\u51FA\u7C7B\u4F3C courtSupport-3\u3001severity66\u3001executionBonus+2 \u7684\u8C03\u8BD5\u5F0F\u8868\u8FBE\u3002`;
async function interpretEdictWithAI({ edict, context = {}, config = {}, fetchImpl = fetch } = {}) {
  const sourceEdict = String(edict || "").trim();
  const outlineLines = sourceEdict.split(/\r?\n/).filter((line) => /^(?:财政|民生|军事|吏治)\s*\|/.test(line.trim()));
  const edictForInterpretation = outlineLines.length >= 2 ? outlineLines.filter((line) => /【(?:主|辅)】/.test(line)).join("\n") : sourceEdict;
  const prompt = `\u4F60\u662F\u5317\u5B8B\u7199\u5B81\u53D8\u6CD5\u7B56\u7565\u6E38\u620F\u7684\u4E2D\u4E66\u820D\u4EBA\u3002\u5C06\u73A9\u5BB6\u81EA\u7531\u8BCF\u4E66\u6620\u5C04\u4E3A\u5168\u90E8\u76F8\u5173\u7684\u6E38\u620F\u89C4\u5219\u653F\u52A1\uFF0C\u4E0D\u8BBE\u7F6E\u4EBA\u4E3A\u6570\u91CF\u4E0A\u9650\uFF1B\u4E00\u4EFD\u8BCF\u4E66\u53EF\u4EE5\u540C\u65F6\u6D89\u53CA\u8D22\u653F\u3001\u6C11\u751F\u3001\u519B\u4E8B\u3001\u4EFB\u514D\u3001\u5236\u5EA6\u548C\u5730\u65B9\u6CBB\u7406\u3002\u4E0D\u5F97\u521B\u9020ID\uFF0C\u4E0D\u5F97\u4FEE\u6539\u6570\u503C\uFF0C\u6267\u884C\u80FD\u529B\u4E0D\u8DB3\u7531\u7A0B\u5E8F\u7ED3\u7B97\u4E3A\u884C\u653F\u8D85\u8F7D\u3002

\u5141\u8BB8\u7684\u653F\u52A1\uFF1A
${allowedPolicies.map(([id, name]) => `- ${id}: ${name}`).join("\n")}

\u5141\u8BB8\u7684\u6267\u884C\u5B98\uFF1A
${allowedOfficers.map(([id, name]) => `- ${id}: ${name}`).join("\n")}

\u5F53\u524D\u80CC\u666F\uFF1A${JSON.stringify(context)}
\u73A9\u5BB6\u8BCF\u4E66\uFF1A${edictForInterpretation}

\u82E5\u8F93\u5165\u6765\u81EA\u8F85\u653F\u5B98\u63D0\u7EB2\uFF0C\u53EA\u89E3\u6790\u3010\u4E3B\u3011\u4E0E\u3010\u8F85\u3011\u4E24\u884C\uFF0C\u4E25\u7981\u628A\u3010\u6682\u7F13\u3011\u884C\u6620\u5C04\u4E3A\u653F\u52A1\u3002

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
\u5F53\u524D\u51C6\u5907\u4EFB\u7528\u7684\u6267\u884C\u5B98\uFF1A${JSON.stringify(officer)}
\u53EF\u6267\u884C\u653F\u52A1\u53CA\u5176\u672C\u56DE\u5408\u6210\u672C\uFF1A${JSON.stringify(policyBudget)}
\u6B64\u524D\u5404\u56DE\u8BCF\u4EE4\u4E0E\u7ED3\u7B97\uFF08\u4E0D\u5F97\u5FFD\u7565\uFF09\uFF1A
${formatHistory(state?.history || [])}
\u6B64\u524D\u8F85\u653F\u5B98\u5DF2\u63D0\u65B9\u5411\uFF08\u4E0D\u5F97\u539F\u53E5\u91CD\u63D0\uFF09\uFF1A${(state?.advisorHistory || []).slice(-6).join("\n") || "\u65E0\u3002"}
\u73A9\u5BB6\u6848\u524D\u5DF2\u6709\u6587\u5B57\uFF1A${String(currentEdict || "").trim() || "\u5C1A\u672A\u843D\u7B14"}
\u73A9\u5BB6\u5411\u8F85\u653F\u5B98\u8BE2\u95EE\uFF1A${String(question || "").trim() || "\u8BF7\u5206\u6790\u5F53\u524D\u683C\u5C40\u5E76\u63D0\u51FA\u51E0\u6761\u53EF\u884C\u8DEF\u7EBF"}

\u6700\u7EC8\u663E\u793A\u6587\u672C\u5FC5\u987B\u4E25\u683C\u7B49\u4EF7\u4E8E\u4EE5\u4E0B\u683C\u5F0F\uFF0C\u884C\u653F\u4F59\u91CF\u4F7F\u7528\u5F53\u524D\u5B9E\u6570 ${administrativeRemaining}/${administrativeCapacity}\uFF1A
\u884C\u653F\u4F59\u91CF:${administrativeRemaining}/${administrativeCapacity}

\u8D22\u653F|(\u56FD\u5E93\u4E0E\u5C81\u5165)\u3010\u4E3B\u3011\u5177\u4F53\u5EFA\u8BAE\uFF0C\u4E00\u53E5\u8BDD
\u6C11\u751F|(\u767E\u59D3\u8D1F\u62C5)\u3010\u8F85\u3011\u5177\u4F53\u5EFA\u8BAE\uFF0C\u4E00\u53E5\u8BDD
\u519B\u4E8B|(\u8FB9\u5907\u4E0E\u519B\u50A8)\u3010\u6682\u7F13\u3011\u6682\u7F13\u7406\u7531\uFF0C\u4E00\u53E5\u8BDD
\u540F\u6CBB|(\u8BCF\u4EE4\u80FD\u5426\u843D\u5230\u5DDE\u53BF)\u3010\u6682\u7F13\u3011\u6682\u7F13\u7406\u7531\uFF0C\u4E00\u53E5\u8BDD

\u4EBA\u4E8B:\u4E00\u53E5\u8BDD\u4EBA\u4E8B\u5EFA\u8BAE

\u56DB\u4E2A\u7EF4\u5EA6\u5FC5\u987B\u5168\u90E8\u5217\u51FA\uFF0C\u987A\u5E8F\u56FA\u5B9A\u4E3A\u8D22\u653F\u3001\u6C11\u751F\u3001\u519B\u4E8B\u3001\u540F\u6CBB\u3002\u3010\u4E3B\u3011\u548C\u3010\u8F85\u3011\u5404\u4E14\u4EC5\u51FA\u73B0\u4E00\u6B21\uFF0C\u5176\u4F59\u4E24\u9879\u5FC5\u987B\u6807\u3010\u6682\u7F13\u3011\u3002\u6BCF\u4E2A\u7EF4\u5EA6\u6700\u591A\u4E00\u6761\u5EFA\u8BAE\uFF0C\u4E25\u7981\u9762\u9762\u4FF1\u5230\u3002\u5EFA\u8BAE\u5FC5\u987B\u5177\u4F53\u5230\u52A8\u4F5C\u3001\u5BF9\u8C61\u6216\u671F\u9650\uFF0C\u4F8B\u5982\u201C\u6838\u5BF9\u4E09\u53F8\u8D26\u7C3F\uFF0C\u9650\u671F\u4E00\u6708\u201D\uFF0C\u4E0D\u5F97\u5199\u201C\u5B9C\u7A33\u59A5\u63A8\u8FDB\u201D\u201C\u914C\u60C5\u529E\u7406\u201D\u201C\u89C6\u60C5\u51B5\u800C\u5B9A\u201D\u7B49\u7A7A\u8BDD\u3002\u4EBA\u4E8B\u5EFA\u8BAE\u5355\u72EC\u4E00\u884C\uFF0C\u4E0D\u5360\u7EF4\u5EA6\u540D\u989D\uFF1B\u65E0\u987B\u8C03\u6574\u4EBA\u4E8B\u65F6\u5199\u201C\u6682\u65E0\u8C03\u4EFB\u5EFA\u8BAE\u201D\u3002\u663E\u793A\u6587\u672C\u603B\u957F\u5EA6\u4E0D\u5F97\u8D85\u8FC7\u4E8C\u767E\u5B57\u3002\u4FDD\u7559\u514B\u5236\u7684\u6587\u8A00\u8BED\u611F\uFF0C\u4F46\u63D0\u7EB2\u4EE5\u7B80\u6D01\u4E3A\u5148\uFF0C\u4E0D\u5199\u9A88\u53E5\u3002

\u4E0D\u5F97\u91CD\u590D\u6B64\u524D\u56DE\u5408\u5DF2\u7ECF\u63D0\u51FA\u6216\u9881\u884C\u7684\u5EFA\u8BAE\u65B9\u5411\u3002\u82E5\u540C\u4E00\u4E8B\u52A1\u786E\u987B\u5EF6\u7EED\uFF0C\u5FC5\u987B\u4EE5\u201C\u7EED\u529E\u201D\u5F00\u5934\uFF0C\u5E76\u660E\u786E\u672C\u671F\u65B0\u589E\u7740\u529B\u70B9\uFF0C\u4E0D\u5F97\u539F\u53E5\u91CD\u8FF0\u3002\u5EFA\u8BAE\u5FC5\u987B\u9488\u5BF9\u672C\u671F\u6570\u503C\u77ED\u677F\u4E0E\u56F0\u5883\uFF1B\u58EB\u8BBA\u504F\u4F4E\u65F6\u987B\u8003\u8651\u7F13\u548C\u671D\u8BAE\u6216\u6536\u7A84\u63A8\u884C\u529B\u5EA6\u3002${stage === "\u524D\u671F" ? "\u5F53\u524D\u4E3A\u524D\u671F\uFF0C\u91CD\u5728\u6838\u6E05\u5E95\u6570\u4E0E\u5C0F\u8303\u56F4\u8BD5\u529E\u3002" : stage === "\u4E2D\u671F" ? "\u5F53\u524D\u4E3A\u4E2D\u671F\uFF0C\u91CD\u5728\u63A8\u884C\u3001\u6838\u9A8C\u4E0E\u7EA0\u504F\u3002" : "\u5F53\u524D\u4E3A\u540E\u671F\uFF0C\u91CD\u5728\u5DE9\u56FA\u6210\u679C\u3001\u7ED3\u6E05\u9057\u7559\u4E0E\u5584\u540E\u3002"}\u3010\u6682\u7F13\u3011\u9879\u53EA\u51C6\u8BF4\u660E\u201C\u4E3A\u4F55\u672C\u671F\u4E0D\u505A\u201D\uFF0C\u4E25\u7981\u5199\u4EFB\u4F55\u52A8\u4F5C\u3001\u5BF9\u8C61\u6216\u671F\u9650\u3002

\u4F60\u987B\u5728\u5185\u90E8\u6838\u7B97\u653F\u7565\u3001\u884C\u653F\u4E0E\u56FD\u5E93\u6210\u672C\uFF1A\u603B\u653F\u7565\u6210\u672C\u8FD8\u8981\u52A0\u4E0A\u6267\u884C\u5B98\u4E00\u6B21\u6027\u7684\u653F\u7565\u6D88\u8017\u4FEE\u6B63\uFF1B\u7ED3\u7B97\u540E\u987B\u81F3\u5C11\u4FDD\u7559 12 \u70B9\u653F\u7565\u300110 \u70B9\u884C\u653F\u548C 800 \u4E07\u8D2F\u56FD\u5E93\u3002\u8D44\u6E90\u4E0D\u8DB3\u65F6\uFF0C\u5C06\u9AD8\u6210\u672C\u65B9\u5411\u5217\u4E3A\u3010\u6682\u7F13\u3011\uFF0C\u4E0D\u5F97\u5806\u53E0\u653F\u52A1\u4F2A\u88C5\u5468\u5168\u3002\u53EA\u63D0\u51FA\u811A\u624B\u67B6\uFF0C\u4E0D\u5F97\u8F93\u51FA\u8BCF\u4E66\u6B63\u6587\u3001\u5236\u66F0\u3001\u5949\u8BCF\u3001\u94A6\u6B64\u7B49\u6210\u7A3F\u63AA\u8F9E\u3002

\u53EA\u8FD4\u56DEJSON\uFF1A
{
  "dimensions":[
    {"name":"\u8D22\u653F","role":"\u4E3B\u6216\u8F85\u6216\u6682\u7F13","advice":"\u4E00\u6761\u5177\u4F53\u5EFA\u8BAE\u6216\u6682\u7F13\u7406\u7531","policyId":"\u5BF9\u5E94\u7684\u4E00\u9879\u653F\u52A1ID"},
    {"name":"\u6C11\u751F","role":"\u4E3B\u6216\u8F85\u6216\u6682\u7F13","advice":"\u4E00\u6761\u5177\u4F53\u5EFA\u8BAE\u6216\u6682\u7F13\u7406\u7531","policyId":"\u5BF9\u5E94\u7684\u4E00\u9879\u653F\u52A1ID"},
    {"name":"\u519B\u4E8B","role":"\u4E3B\u6216\u8F85\u6216\u6682\u7F13","advice":"\u4E00\u6761\u5177\u4F53\u5EFA\u8BAE\u6216\u6682\u7F13\u7406\u7531","policyId":"\u5BF9\u5E94\u7684\u4E00\u9879\u653F\u52A1ID"},
    {"name":"\u540F\u6CBB","role":"\u4E3B\u6216\u8F85\u6216\u6682\u7F13","advice":"\u4E00\u6761\u5177\u4F53\u5EFA\u8BAE\u6216\u6682\u7F13\u7406\u7531","policyId":"\u5BF9\u5E94\u7684\u4E00\u9879\u653F\u52A1ID"}
  ],
  "personnel":"\u4E00\u53E5\u53EF\u9009\u4EBA\u4E8B\u5EFA\u8BAE\uFF1B\u6CA1\u6709\u5219\u5199\u6682\u65E0\u8C03\u4EFB\u5EFA\u8BAE"
}`;
  const system = `\u4F60\u662F\u5386\u53F2\u7B56\u7565\u6E38\u620F\u300A\u7199\u5B81\u6289\u62E9\u300B\u7684\u8F85\u653F\u5B98\uFF0C\u4E0D\u662F\u63A8\u6F14\u53F2\u5B98\u3002
1. \u4F60\u53EA\u80FD\u5728\u9881\u8BCF\u524D\u63D0\u4F9B\u63D0\u7EB2\uFF0C\u4E25\u7981\u751F\u6210\u53EF\u76F4\u63A5\u9881\u884C\u7684\u5B8C\u6574\u8BCF\u4E66\uFF0C\u4E0D\u80FD\u58F0\u79F0\u653F\u7B56\u5DF2\u7ECF\u5B9E\u65BD\u3002
2. \u5FC5\u987B\u4F5C\u51FA\u53D6\u820D\uFF1A\u6070\u597D\u4E00\u9879\u3010\u4E3B\u3011\u3001\u4E00\u9879\u3010\u8F85\u3011\u3001\u4E24\u9879\u3010\u6682\u7F13\u3011\u3002
3. \u5C0A\u91CD\u7199\u5B81\u3001\u5143\u4E30\u65F6\u671F\u7684\u673A\u6784\u3001\u8D44\u6E90\u548C\u653F\u6CBB\u8BED\u8A00\u3002
4. \u56FA\u5B9A\u5217\u51FA\u8D22\u653F\u3001\u6C11\u751F\u3001\u519B\u4E8B\u3001\u540F\u6CBB\u56DB\u9879\u4E14\u987A\u5E8F\u4E0D\u53EF\u6539\u53D8\uFF0C\u4E0D\u65B0\u589E\u5236\u5EA6\u3001\u4EFB\u514D\u3001\u5916\u4EA4\u7B49\u7EF4\u5EA6\u3002
5. \u53EF\u5F15\u7528\u4EBA\u7269\u7ACB\u573A\uFF0C\u4F46\u4E0D\u5F97\u628A\u4EBA\u7269\u7B80\u5355\u5224\u4E3A\u5FE0\u81E3\u6216\u5978\u81E3\u3002
6. \u5FC5\u987B\u4F18\u5148\u4FDD\u8BC1\u4E3B\u8F85\u4E24\u9879\u5728\u5F53\u524D\u653F\u7565\u3001\u884C\u653F\u4E0E\u56FD\u5E93\u9884\u7B97\u5185\u53EF\u6301\u7EED\u6267\u884C\u3002
7. \u6BCF\u9879\u53EA\u6709\u4E00\u53E5\u5177\u4F53\u53EF\u6267\u884C\u5EFA\u8BAE\uFF1B\u6682\u7F13\u9879\u53EA\u5199\u6682\u7F13\u7406\u7531\uFF0C\u4E0D\u5F97\u5939\u5E26\u63AA\u65BD\u3002
8. \u4EBA\u4E8B\u5EFA\u8BAE\u72EC\u7ACB\uFF0C\u4E0D\u8BA1\u5165\u56DB\u7EF4\u4E3B\u8F85\u540D\u989D\uFF1B\u603B\u663E\u793A\u6587\u672C\u4E0D\u5F97\u8D85\u8FC7\u4E8C\u767E\u5B57\u3002
9. \u8F93\u51FA\u5FC5\u987B\u4E3AJSON\u3002
10. ${outputLanguageRule}`;
  const output = await callModel(config, system, prompt, fetchImpl);
  const parsed = parseJsonOutput(output);
  return {
    ok: true,
    advice: normalizeAdvisorOutline(parsed, administrativeRemaining, administrativeCapacity, state)
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

\u4F60\u7684\u4EFB\u52A1\u4E0D\u662F\u518D\u6B21\u8BA1\u7B97\u8F93\u8D62\uFF0C\u800C\u662F\u89E3\u91CA\u8FD9\u4E9B\u65E2\u5B9A\u53D8\u5316\u5982\u4F55\u5728\u5317\u5B8B\u56FD\u5BB6\u673A\u5668\u4E2D\u53D1\u751F\u3002\u5FC5\u987B\u4F53\u73B0\u8BCF\u4EE4\u7531\u5FA1\u524D\u53D1\u51FA\u540E\uFF0C\u7ECF\u8FC7\u4E2D\u4E66\u95E8\u4E0B\u3001\u4E09\u53F8\u6216\u67A2\u5BC6\u9662\u3001\u76D1\u53F8\u3001\u5DDE\u53BF\u548C\u80E5\u540F\u7684\u4F20\u9012\u4E0E\u53D8\u5F62\uFF1B\u7ED3\u5408\u6267\u884C\u5B98\u7684\u6027\u683C\u3001\u884C\u4E8B\u65B9\u5F0F\u3001\u653F\u6CBB\u5E95\u7EBF\u548C\u8BED\u8A00\u98CE\u683C\u3002\u5B98\u5458\u4E4B\u95F4\u5B58\u5728\u5236\u5EA6\u5224\u65AD\u4E0E\u5229\u76CA\u51B2\u7A81\uFF0C\u4E0D\u5F97\u5199\u6210\u5FE0\u81E3\u4E0E\u5978\u81E3\u7684\u7B80\u5355\u5BF9\u7ACB\u3002

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
7. AI\u53EA\u6709\u53D9\u4E8B\u89E3\u91CA\u6743\uFF1B\u89C4\u5219\u5F15\u64CE\u662F\u6570\u503C\u548C\u56F0\u5883\u72B6\u6001\u7684\u552F\u4E00\u88C1\u5224\u3002
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
    return `\u7B2C${turn.turn}\u56DE\uFF1A\u6838\u5FC3\u8BCF\u4EE4\u201C${turn.edictText || "\u672A\u5F55\u539F\u6587"}\u201D\uFF1B\u65BD\u884C\u653F\u52A1\u201C${policies}\u201D\uFF1B\u56FD\u52BF\u53D8\u5316${indicatorChanges}\uFF1B\u4F59\u91CF\u53D8\u5316${resourceChanges}\uFF1B\u884C\u653F\u8D85\u8F7D${turn.administrativeOverload || 0}\u3001\u653F\u7565\u900F\u652F${turn.politicalOverdraft || 0}\uFF1B\u7ED3\u7B97\u201C${turn.aiSummary || turn.eventTitle || "\u672A\u5F55"}\u201D`;
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
        model: "deepseek-v4-flash"
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
