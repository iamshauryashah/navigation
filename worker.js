// Serves one shared launcher, maintained only in public/launcher.js.
// Cross-origin access is limited to Shaurya's Websites on both legacy and future domains.
const ALLOWED_DOMAINS = ["shauryaswebsite.com", "shauryaswebsites.com"];

function allowedOrigin(value) {
  if (!value) return null;
  try {
    const origin = new URL(value);
    if (origin.protocol !== "https:" || origin.username || origin.password || origin.port) return null;
    const hostname = origin.hostname.toLowerCase();
    if (!ALLOWED_DOMAINS.some(domain => hostname === domain || hostname.endsWith("." + domain))) return null;
    return origin.origin;
  } catch {
    return null;
  }
}

function corsHeaders(request) {
  const headers = new Headers({ "Vary": "Origin" });
  const origin = allowedOrigin(request.headers.get("Origin"));
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = corsHeaders(request);
    if (url.pathname !== "/launcher.js") {
      return new Response("Not found", { status: 404, headers });
    }
    if (request.method === "OPTIONS") {
      if (!headers.has("Access-Control-Allow-Origin")) {
        return new Response(null, { status: 403, headers });
      }
      headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type");
      headers.set("Access-Control-Max-Age", "600");
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      headers.set("Allow", "GET, HEAD, OPTIONS");
      return new Response("Method not allowed", { status: 405, headers });
    }
    const asset = await env.ASSETS.fetch(new Request(new URL("/launcher.js", url), request));
    if (!asset.ok) return new Response("Launcher unavailable", { status: asset.status, headers });
    headers.set("Content-Type", "text/javascript; charset=utf-8");
    headers.set("Cache-Control", "no-store, max-age=0");
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(request.method === "HEAD" ? null : asset.body, { status: asset.status, headers });
  }
};
