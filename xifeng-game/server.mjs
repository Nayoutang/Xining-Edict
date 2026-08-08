import http from 'node:http';
import { adviseWithAI, interpretEdictWithAI, narrateSettlementWithAI, testAIConnection } from './ai-history.mjs';

const port = Number(process.env.API_PORT || 5191);

export function createApiServer() {
  return http.createServer(async (request, response) => {
    try {
      if (request.method === 'OPTIONS') {
        response.writeHead(204, corsHeaders());
        response.end();
        return;
      }
      if (request.method === 'POST' && request.url === '/api/interpret') {
        sendJson(response, 200, await interpretEdictWithAI({ ...(await readJson(request)) }));
        return;
      }
      if (request.method === 'POST' && request.url === '/api/narrate') {
        sendJson(response, 200, await narrateSettlementWithAI({ ...(await readJson(request)) }));
        return;
      }
      if (request.method === 'POST' && request.url === '/api/advise') {
        sendJson(response, 200, await adviseWithAI({ ...(await readJson(request)) }));
        return;
      }
      if (request.method === 'POST' && request.url === '/api/test') {
        sendJson(response, 200, await testAIConnection({ ...(await readJson(request)) }));
        return;
      }
      sendJson(response, 404, { ok: false, error: 'Not found' });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : 'AI请求失败' });
    }
  });
}

if (process.argv[1]?.endsWith('server.mjs')) {
  createApiServer().listen(port, '127.0.0.1', () => console.log(`AI API: http://127.0.0.1:${port}`));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => { body += chunk; if (body.length > 100_000) reject(new Error('请求内容过长')); });
    request.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('请求JSON无效')); } });
    request.on('error', reject);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { ...corsHeaders(), 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
