/**
 * Cloudflare Worker — Gemini API CORS Proxy
 *
 * Deploy Steps:
 * 1. Go to https://workers.cloudflare.com/
 * 2. Create a new Worker
 * 3. Paste this code
 * 4. Deploy and copy the Worker URL
 * 5. Paste the URL into the app's Settings → Proxy URL field
 */

// 只允許以下來源，部署前請更新為你自己的域名
const ALLOWED_ORIGINS = [
  'https://altsai0814.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // 拒絕非白名單來源
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // API key 存在 Worker Secret，前端不需要傳
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: { message: 'GEMINI_API_KEY not configured in Worker' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: { message: 'Invalid JSON body' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract model from body, forward the rest to Gemini API
    const { model, ...geminiBody } = body;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiBody),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  },
};
