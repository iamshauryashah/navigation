// Serves the single shared navigation component from Cloudflare static assets.
// The implementation and app catalog live exclusively in public/launcher.js.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/launcher.js") {
      return new Response("Not found", { status: 404 });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    const asset = await env.ASSETS.fetch(new Request(new URL("/launcher.js", url), request));
    if (!asset.ok) return asset;
    const headers = new Headers(asset.headers);
    headers.set("Content-Type", "text/javascript; charset=utf-8");
    headers.set("Cache-Control", "no-store, max-age=0");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(request.method === "HEAD" ? null : asset.body, { status: asset.status, headers });
  }
};
