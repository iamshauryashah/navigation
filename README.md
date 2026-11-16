# Shaurya's Websites — Shared Navigation

Central source of truth for the app launcher used across Shaurya's Websites.

## Integration

Include the single shared script just before the closing body tag:

```html
<script defer src="https://cdn.jsdelivr.net/gh/iamshauryashah/navigation@main/launcher.js"></script>
```

The landing page is the first consumer. Other sites should use the **same loader**, without copying the app catalog, styles, or behavior into their codebases.

## Behavior

- Fixed 3×3-dots launcher button in the top-right
- Minimal dark popover; no "opens in a new tab" instructional text
- Uses the landing page's app names, emoji icons, and destinations
- Shaurya's Websites remains the first item
- Every app opens in a new tab
- Closes on Escape or an outside click
- Shadow DOM isolates styles from each host website
- Duplicate loads are ignored

## Updating the app catalog

Edit the `apps` array in `launcher.js` only. This controls every website using the shared script.

## Hosting note

The initial consumer uses jsDelivr to serve the shared GitHub file, avoiding a separate Cloudflare deployment prerequisite. CDN caches can delay updates. For tighter cache control and first-party hosting later, serve this same shared file from a dedicated Cloudflare Worker route; do not copy its implementation to consumers.
