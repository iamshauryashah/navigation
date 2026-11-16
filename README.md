# Shaurya's Websites — Navigation

One shared app launcher for the entire Shaurya's Websites platform.

## Cloudflare Worker

Cloudflare auto-deploys this repository using `npx wrangler deploy`.

- `wrangler.jsonc` — Worker and asset configuration
- `worker.js` — serves the asset with short-lived/no-store response headers
- `public/launcher.js` — **only canonical copy** of the launcher, including catalog, CSS, and behavior

Assign the Worker the custom domain `navigation.shauryaswebsites.com` in Cloudflare Workers & Pages → navigation → Settings → Domains & Routes.

After a successful deployment and domain setup, verify:
`https://navigation.shauryaswebsites.com/launcher.js`

It should return JavaScript with `Content-Type: text/javascript` and `Cache-Control: no-store, max-age=0`.

## Integration

Each participating website adds only:

```html
<script defer src="https://navigation.shauryaswebsites.com/launcher.js"></script>
```

The landing page loads the Cloudflare-hosted script directly.

## Shared behavior

- Launcher positioned at top-right of every site
- Theme-adaptive frosted glass: dark/light presets with app-specific accents
- Automatically configured themes for Landing Page, Gerry, Midterm-UJ, Road to 270, Soccer Sim, Soccer Manager, Army Game, and QED; unknown pages receive a light/dark fallback
- Optional per-site attributes: `data-nav-theme="light"` or `data-nav-theme="dark"`, plus `data-nav-accent="#rrggbb"` on the loader script
- Home tile has no persistent highlight; borders emphasize hover and keyboard focus only
- App icons and labels match the landing page; the hub uses the ✨ sparkle
- Main hub is always listed first, with a small Home label
- Every destination opens in a separate tab
- Keyboard Escape and outside-click dismissal
- Shadow DOM isolates component styling from each site's CSS
- Repeated loads are ignored

Update the app catalog **only** in `public/launcher.js`. Never copy the UI implementation into a consumer project.
