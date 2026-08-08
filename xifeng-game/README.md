# 熙丰万机：规则引擎原型

这是《熙丰万机》的可玩原型，包含固定半年回合规则、官员与历史事件、自由诏书、AI 辅政官和 AI 推演史官。

## 命令

```bash
npm install
npm run dev
npm test
npm run typecheck
```

`npm run dev` 会同时启动本地 AI API 和 Vite 页面。只有在需要分别调试时，才使用 `npm run dev:api` 与 `npm run dev:web`。

## AI 推演配置

- AI 辅政官与推演史官固定共用 `deepseek-v4-flash`，Base URL 为 `https://api.deepseek.com`；两种职责由不同系统提示词区分。
- 从百炼配置迁移时会清空旧 Key，避免把百炼 Key 误用于 DeepSeek；需要在设置页重新填写 DeepSeek API Key。

## 内容入口

- `src/data/policies.ts`：政策成本、效果、风险与持续时间
- `src/data/officers.ts`：官员专长和政治代价
- `src/data/events.ts`：八回合历史压力
- `src/game/turn-engine.ts`：半年结算规则
- `src/game/objectives.ts`：阶段目标
- `src/game/endings.ts`：失败与结局评价
