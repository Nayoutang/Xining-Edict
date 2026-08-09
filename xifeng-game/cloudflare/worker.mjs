import {
  adviseWithAI,
  interpretEdictWithAI,
  narrateSettlementWithAI,
  testAIConnection,
} from '../ai-history.mjs';

const ALLOWED_ORIGINS = new Set([
  'https://nayoutang.github.io',
  'null',
]);

const requestBuckets = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === 'GET') {
      return json({ ok: true, service: '熙宁抉择推演服务' }, 200, cors);
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, 405, cors);
    }

    if (!ALLOWED_ORIGINS.has(origin) && !isLocalOrigin(origin)) {
      return json({ ok: false, error: '当前来源不允许调用推演服务。' }, 403, cors);
    }

    if (!env.DEEPSEEK_API_KEY) {
      return json({ ok: false, error: '推演服务尚未配置密钥。' }, 503, cors);
    }

    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!consumeRequest(clientIp)) {
      return json({ ok: false, error: '请求过于频繁，请稍后再试。' }, 429, cors);
    }

    try {
      const length = Number(request.headers.get('Content-Length') || 0);
      if (length > 750_000) throw new Error('请求内容过长。');
      const input = await request.json();
      input.config = {
        provider: 'deepseek',
        apiKey: env.DEEPSEEK_API_KEY,
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-v4-flash',
      };

      const path = new URL(request.url).pathname;
      let result;
      if (path === '/api/interpret') result = await interpretEdictWithAI(input);
      else if (path === '/api/narrate') result = await narrateSettlementWithAI(input);
      else if (path === '/api/advise') result = await adviseWithAI(input);
      else if (path === '/api/test') result = await testAIConnection(input);
      else return json({ ok: false, error: 'Not found' }, 404, cors);

      return json(result, 200, cors);
    } catch (error) {
      return json({ ok: false, error: error instanceof Error ? error.message : '推演请求失败' }, 400, cors);
    }
  },
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
    'Access-Control-Allow-Origin': allowed ? origin : 'https://nayoutang.github.io',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(payload, status, cors) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
