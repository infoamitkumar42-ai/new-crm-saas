export async function onRequest(context: any) {
  const VERCEL_URL = 'https://new-crm-saas-git-main-amits-projects-e2ae9fcd.vercel.app';

  const url = new URL(context.request.url);
  const targetUrl = VERCEL_URL + url.pathname + url.search;

  const headers = new Headers(context.request.headers);
  headers.delete('host');

  let body = null;
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    body = await context.request.text();
  }

  const response = await fetch(targetUrl, {
    method: context.request.method,
    headers: headers,
    body: body,
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('Access-Control-Allow-Origin', 'https://www.leadflowcrm.in');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: responseHeaders,
    });
  }

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
