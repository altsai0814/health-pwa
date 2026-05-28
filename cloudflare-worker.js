/**
 * Cloudflare Worker — Claude API CORS Proxy
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
    'Access-Control-Allow-Headers': 'Content-Type, x-claude-api-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request) {
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

    // Get API key from custom header (never expose in URL)
    const apiKey = request.headers.get('x-claude-api-key');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: { message: 'Missing x-claude-api-key header' } }), {
        status: 401,
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

    // Forward request to Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
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
