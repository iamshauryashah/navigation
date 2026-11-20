/* Shaurya's Websites shared app launcher. Loaded once per page. */
(() => {
  if (window.__shauryaLauncherLoaded) return;
  window.__shauryaLauncherLoaded = true;

  // Shared appearance profiles for our public sites. One implementation, no per-app CSS.
  // Hosts can override with data-nav-theme="light|dark" and data-nav-accent="#rrggbb".
  const script = document.currentScript;
  const siteThemes = {
    "www.shauryaswebsites.com": ["dark", "#c4b5fd"],
    "shauryaswebsites.com": ["dark", "#c4b5fd"],
    "gerry.shauryaswebsites.com": ["light", "#0f766e"],
    "midterm-uj.shauryaswebsites.com": ["light", "#798969"],
    "presidentialsim.shauryaswebsites.com": ["light", "#15786e"],
    "soccersim.shauryaswebsites.com": ["dark", "#cdf879"],
    "soccermanager.shauryaswebsites.com": ["light", "#205a43"],
    "army.shauryaswebsites.com": ["light", "#4a5568"],
    "qed.shauryaswebsites.com": ["light", "#285b42"],
    "feedback.shauryaswebsites.com": ["light", "#8b6ee1"],
    "secret.shauryaswebsites.com": ["light", "#5879b5"]
  };
  const selected = siteThemes[location.hostname] || null;
  const overrideTheme = script?.getAttribute("data-nav-theme");
  const overrideAccent = script?.getAttribute("data-nav-accent");
  const validAccent = value => /^#[0-9a-fA-F]{6}$/.test(value || "");
  function appearance() {
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const rootBg = getComputedStyle(document.documentElement).backgroundColor;
    const candidates = [bodyBg, rootBg];
    let inferred = "light";
    for (const color of candidates) {
      const match = /^rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/.exec(color);
      if (!match) continue;
      const brightness = (+match[1] * 299 + +match[2] * 587 + +match[3] * 114) / 1000;
      inferred = brightness < 135 ? "dark" : "light";
      break;
    }
    const mode = ["dark", "light"].includes(overrideTheme) ? overrideTheme : selected?.[0] || inferred;
    const accent = validAccent(overrideAccent) ? overrideAccent : selected?.[1] || (mode === "dark" ? "#c4b5fd" : "#0f766e");
    return { mode, accent };
  }

  // Shared catalog: edit only here to update every participating website.
  const apps = [
    { key: "landing", name: "Shaurya's Websites", icon: "✨", url: "https://www.shauryaswebsites.com/" },
    { key: "midterm", name: "Midterm-UJ", icon: "🎓", url: "https://midterm-uj.shauryaswebsites.com/" },
    { key: "gerry", name: "Gerry the Salamander", icon: "🦎", url: "https://gerry.shauryaswebsites.com/" },
    { key: "race", name: "Race to Whitehouse", icon: "🏁", url: "https://race.shauryaswebsites.com/" },
    { key: "about", name: "About Me", icon: "👋", url: "https://hello.shauryaswebsites.com/" },
    { key: "qed", name: "QED Project", icon: "🧩", url: "https://qed.shauryaswebsites.com/" },
    { key: "road-to-270", name: "Road to 270", icon: "🗳️", url: "https://presidentialsim.shauryaswebsites.com/" },
    { key: "soccer-sim", name: "Soccer Sim", icon: "⚽", url: "https://soccersim.shauryaswebsites.com/" },
    { key: "army", name: "Army Game", icon: "🛡️", url: "https://army.shauryaswebsites.com/" },
    { key: "touchline", name: "Soccer Manager", icon: "📋", url: "https://soccermanager.shauryaswebsites.com/" },
    { key: "admin", name: "Admin Dashboard", icon: "🎛️", url: "https://auth.shauryaswebsites.com/admin" }
  ];

  // BEGIN PLACEMENT CORE (tested independently in tests/placement.test.cjs)
  function choosePlacement(candidates, obstacles, previous) {
    let winner = candidates[0], best = Infinity;
    for (const candidate of candidates) {
      let score = candidate.preference;
      for (const obstacle of obstacles) {
        const overlapWidth = Math.max(0, Math.min(candidate.right, obstacle.right) - Math.max(candidate.left, obstacle.left));
        const overlapHeight = Math.max(0, Math.min(candidate.bottom, obstacle.bottom) - Math.max(candidate.top, obstacle.top));
        if (overlapWidth && overlapHeight) {
          const portion = overlapWidth * overlapHeight / ((candidate.right - candidate.left) * (candidate.bottom - candidate.top));
          score += obstacle.weight * portion;
        }
      }
      // Avoid jumping between comparably safe positions as scrolling changes the page.
      if (candidate.id === previous) score -= 5;
      if (score < best) { best = score; winner = candidate; }
    }
    return winner;
  }
  // END PLACEMENT CORE

  function positions(width, height) {
    const mobile = width <= 480;
    const margin = mobile ? 12 : 24;
    const button = 46;
    const xRight = Math.max(margin, width - margin - button);
    const xLeft = margin;
    const top = mobile ? 12 : 18;
    const bottom = Math.max(top, height - margin - button);
    const middle = Math.max(top, Math.round((height - button) / 2));
    const rect = (id, x, y, preference, horizontal, vertical) =>
      ({ id, left:x, top:y, right:x+button, bottom:y+button, preference, horizontal, vertical });
    return [
      rect("top-right",xRight,top,0,"right","top"),
      rect("top-left",xLeft,top,9,"left","top"),
      rect("mid-right",xRight,middle,15,"right","middle"),
      rect("mid-left",xLeft,middle,19,"left","middle"),
      rect("bottom-right",xRight,bottom,24,"right","bottom"),
      rect("bottom-left",xLeft,bottom,28,"left","bottom")
    ];
  }

  function visibleObstacles(host) {
    const result = [];
    // Inspect only meaningful foreground content, not full-page layout wrappers.
    const targets = document.querySelectorAll(
      'button,a,input,select,textarea,summary,[role="button"],[role="link"],[tabindex],canvas,iframe,video,[contenteditable="true"],h1,h2,h3'
    );
    for (const el of Array.from(targets).slice(0,600)) {
      if (el === host || host.contains(el)) continue;
      if (el.closest('#shaurya-app-launcher')) continue;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none" || Number(style.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || r.bottom <= 0 || r.right <= 0 || r.top >= innerHeight || r.left >= innerWidth) continue;
      const canvas = el.matches('canvas,iframe,video');
      const heading = el.matches('h1,h2,h3');
      // Leave 10px of breathing room around important targets.
      result.push({left:r.left-10,top:r.top-10,right:r.right+10,bottom:r.bottom+10,weight:canvas?125:heading?100:160});
    }
    // Feedback uses Shadow DOM; its floating button is invisible to ordinary selectors.
    const feedback = document.getElementById("shaurya-feedback-root");
    const feedbackButton = feedback?.shadowRoot?.querySelector(".launch");
    if (feedbackButton) {
      const r = feedbackButton.getBoundingClientRect();
      if (r.width && r.height) result.push({left:r.left-12,top:r.top-12,right:r.right+12,bottom:r.bottom+12,weight:230});
    }
    return result;
  }

  function mount() {
    if (document.getElementById("shaurya-app-launcher")) return;
    const host = document.createElement("div");
    host.id = "shaurya-app-launcher";
    const { mode, accent } = appearance();
    host.dataset.theme = mode;
    host.style.setProperty("--nav-accent", accent);
    // Custom tinted glass remains centralized; only palette tokens vary by host.
    if (location.hostname === "gerry.shauryaswebsites.com") {
      host.dataset.palette = "gerry";
    }
    const shadow = host.attachShadow({mode: "open"});
    shadow.innerHTML = `
      <style>
        :host {
          all: initial; position: fixed; top: 18px; right: 24px; z-index: 2147483000;
          font-family: system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
          color-scheme: dark;
          --nav-panel: rgba(17,25,46,.48); --nav-edge: rgba(196,181,253,.35);
          --nav-text: #f0f2fa; --nav-card: rgba(23,31,51,.36);
          --nav-card-edge: rgba(169,178,201,.28); --nav-hover: rgba(70,62,100,.55);
          --nav-shadow: 0 18px 60px rgba(0,0,0,.48);
          --nav-trigger: rgba(23,31,51,.58); --nav-emoji: rgba(47,57,83,.40);
          --nav-tag-bg: rgba(196,181,253,.16);
        }
        :host([data-theme="light"]) {
          color-scheme: light;
          --nav-panel: rgba(255,255,255,.38); --nav-edge: rgba(29,36,51,.24);
          --nav-text: #1d2433; --nav-card: rgba(255,255,255,.26);
          --nav-card-edge: rgba(29,36,51,.18); --nav-hover: rgba(225,236,231,.70);
          --nav-shadow: 0 18px 60px rgba(29,36,51,.2);
          --nav-trigger: rgba(255,255,255,.53); --nav-emoji: rgba(235,239,237,.42);
          --nav-tag-bg: rgba(15,118,110,.1);
        }
        :host([data-palette="gerry"]) {
          --nav-panel: rgba(245,242,234,.40);
          --nav-edge: rgba(15,118,110,.32);
          --nav-card: rgba(255,255,255,.27);
          --nav-card-edge: rgba(15,118,110,.22);
          --nav-hover: rgba(226,243,240,.68);
          --nav-emoji: rgba(226,243,240,.45);
          --nav-tag-bg: rgba(15,118,110,.14);
        }
        *, *::before, *::after { box-sizing: border-box; }
        button, a { -webkit-tap-highlight-color: transparent; }
        .trigger { display:grid;place-items:center;width:46px;height:46px;padding:0;border:1px solid var(--nav-edge);border-radius:14px;background:var(--nav-trigger);color:var(--nav-accent);cursor:pointer;box-shadow:0 6px 22px #0003;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px); }
        .trigger:hover,.trigger[aria-expanded="true"] { background:var(--nav-hover);border-color:var(--nav-accent); }
        :is(button,a,input):focus-visible { outline:3px solid var(--nav-accent);outline-offset:3px; }
        /* Shared widgets inherit the host site's appearance. The icon's face and
           four-tile silhouette stay constant; Login supplies its exact colors. */
        .trigger .smiley-app-icon { display:block;width:44px;height:44px;overflow:visible;border-radius:12px; }
        .trigger { border-color:var(--nav-login-edge,var(--nav-edge));background:var(--nav-login-trigger,var(--nav-trigger));box-shadow:0 6px 22px #0003; }
        .trigger:hover,.trigger[aria-expanded="true"] { background:var(--nav-login-hover,var(--nav-hover));border-color:var(--nav-accent); }
        .smiley-app-icon .sw-neon { display:none; }
        /* The enclosing Login-matched button provides the only outline. */
        .smiley-app-icon .sw-glass { fill:var(--nav-login-trigger,var(--nav-trigger));stroke:none; }
        .smiley-app-icon .sw-tile { fill:var(--nav-accent);fill-opacity:.22; }
        .smiley-app-icon .sw-tile-alt { fill-opacity:.36; }
        .smiley-app-icon .sw-face { stroke:var(--nav-login-text,var(--nav-text)); }
        .smiley-app-icon .sw-sparkle { fill:var(--nav-accent); }
        .smiley-app-icon .sw-sparkle-glow { opacity:.32; }
        .panel { position:absolute;top:56px;right:0;width:min(390px,calc(100vw - 24px));max-height:min(620px,calc(100dvh - 92px));overflow:auto;padding:20px;border:1px solid var(--nav-edge);border-radius:18px;background:var(--nav-panel);box-shadow:var(--nav-shadow);backdrop-filter:blur(11px) saturate(120%);-webkit-backdrop-filter:blur(11px) saturate(120%); }
        .panel[hidden], .app[hidden] { display:none; }
        h2 { margin:0 0 16px;font-size:22px;line-height:1.2;color:var(--nav-text);font-weight:700; }
        .grid { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px; }
        .app { min-width:0;min-height:112px;padding:13px 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;text-align:center;text-decoration:none;border:1px solid var(--nav-card-edge);border-radius:13px;background:var(--nav-card);color:var(--nav-text);transition:background .15s,border-color .15s; }
         .app:hover, .app:focus-visible { background:var(--nav-hover);border-color:var(--nav-accent); }
        .home-tag { display:inline-block;padding:2px 9px;border-radius:999px;background:var(--nav-tag-bg);color:var(--nav-text);font-size:11px;font-weight:650;line-height:1.3; }
        .emoji { display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:var(--nav-emoji);font-size:27px; }
        .name { font-size:12px;font-weight:650;line-height:1.3;overflow-wrap:anywhere; }
        @media (max-width: 480px) { .panel { padding:15px; } .app { min-height:99px; } }
        @media (prefers-reduced-motion:reduce) { .app { transition:none; } }
      </style>
      <button type="button" class="trigger" aria-label="Open app launcher" aria-haspopup="true" aria-expanded="false" aria-controls="shaurya-apps">
        <svg class="smiley-app-icon" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="sw-rim" x1="0" y1="0" x2="1" y2="1">
              <stop stop-color="#54ffff"/><stop offset=".25" stop-color="#00d8db"/><stop offset=".55" stop-color="#4686ff"/><stop offset=".82" stop-color="#9d48ff"/><stop offset="1" stop-color="#f34deb"/>
            </linearGradient>
            <linearGradient id="sw-glass" x1=".05" y1=".08" x2=".94" y2=".93">
              <stop stop-color="#067b92"/><stop offset=".25" stop-color="#043c65"/><stop offset=".58" stop-color="#0a1e63"/><stop offset=".82" stop-color="#202075"/><stop offset="1" stop-color="#681ca8"/>
            </linearGradient>
            <linearGradient id="sw-blue" x1=".1" y1=".1" x2=".9" y2=".95">
              <stop stop-color="#10e7f6"/><stop offset=".43" stop-color="#008be9"/><stop offset="1" stop-color="#09348e"/>
            </linearGradient>
            <linearGradient id="sw-pink" x1=".05" y1="0" x2=".95" y2="1">
              <stop stop-color="#9266ff"/><stop offset=".5" stop-color="#5729a3"/><stop offset="1" stop-color="#8624b8"/>
            </linearGradient>
            <linearGradient id="sw-teal" x1="0" y1="1" x2=".95" y2="0">
              <stop stop-color="#00f2d6"/><stop offset=".48" stop-color="#00b9c9"/><stop offset="1" stop-color="#07507c"/>
            </linearGradient>
            <linearGradient id="sw-purple" x1="0" y1="0" x2="1" y2="1">
              <stop stop-color="#182a97"/><stop offset=".55" stop-color="#5120c6"/><stop offset="1" stop-color="#b23bec"/>
            </linearGradient>
            <radialGradient id="sw-star" cx=".45" cy=".3" r=".75">
              <stop stop-color="#fff9bc"/><stop offset=".43" stop-color="#ffe34e"/><stop offset=".85" stop-color="#ffc619"/><stop offset="1" stop-color="#ff9d13"/>
            </radialGradient>
            <filter id="sw-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.3"/>
            </filter>
            <filter id="sw-star-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.3"/>
            </filter>
          </defs>
          <rect class="sw-neon" x="7" y="7" width="114" height="114" rx="34" fill="#0036a4" opacity=".45"/>
          <rect class="sw-neon" x="8" y="8" width="112" height="112" rx="34" fill="none" stroke="url(#sw-rim)" stroke-width="6" opacity=".8" filter="url(#sw-glow)"/>
          <rect class="sw-glass" x="9" y="9" width="110" height="110" rx="33" fill="url(#sw-glass)" stroke="url(#sw-rim)" stroke-width="3.5"/>
          <rect class="sw-tile" x="24" y="25" width="39" height="38" rx="11.5" fill="url(#sw-blue)"/>
          <rect class="sw-tile sw-tile-alt" x="65" y="25" width="39" height="38" rx="11.5" fill="url(#sw-pink)"/>
          <rect class="sw-tile sw-tile-alt" x="24" y="65" width="39" height="38" rx="11.5" fill="url(#sw-teal)"/>
          <rect class="sw-tile" x="65" y="65" width="39" height="38" rx="11.5" fill="url(#sw-purple)"/>
          <path class="sw-face" d="M35.5 50.5 Q43.5 39.2 53 50.5" fill="none" stroke="#fff" stroke-width="5.7" stroke-linecap="round"/>
          <path class="sw-face" d="M49 76.6 Q64 94.8 79.3 76.6" fill="none" stroke="#fff" stroke-width="6.1" stroke-linecap="round"/>
          <path d="M84.6 34 Q89 45 99.4 48.7 Q89 52.1 84.6 63 Q80.9 52.1 70.4 48.7 Q80.9 45 84.6 34 Z" class="sw-sparkle sw-sparkle-glow" fill="#ffdb44" filter="url(#sw-star-glow)"/>
          <path d="M84.6 34 Q89 45 99.4 48.7 Q89 52.1 84.6 63 Q80.9 52.1 70.4 48.7 Q80.9 45 84.6 34 Z" class="sw-sparkle" fill="url(#sw-star)"/>
        </svg>
      </button>
      <section class="panel" id="shaurya-apps" aria-label="Apps" hidden>
        <h2>Apps</h2>
        <nav class="grid" aria-label="Shaurya's Websites apps"></nav>
      </section>`;
    // Read the Login widget's effective palette without changing Login or the host app.
    // A late-loading Login widget is discovered through the document observer.
    let loginObserver = null;
    let paletteSignature = "";
    const syncLoginPalette = () => {
      const login = document.getElementById("shaurya-account-widget");
      const button = login?.shadowRoot?.querySelector(".trigger");
      const panel = login?.shadowRoot?.querySelector(".panel");
      if (!login || !button || !panel) return false;
      const loginStyle = getComputedStyle(login);
      const buttonStyle = getComputedStyle(button);
      const panelStyle = getComputedStyle(panel);
      const theme = login.dataset.theme;
      const palette = {
        "--nav-accent": loginStyle.getPropertyValue("--accent").trim() || buttonStyle.color,
        "--nav-login-trigger": buttonStyle.backgroundColor,
        "--nav-login-edge": buttonStyle.borderTopColor,
        "--nav-login-hover": loginStyle.getPropertyValue("--hover").trim(),
        "--nav-login-text": loginStyle.getPropertyValue("--text").trim(),
        "--nav-panel": panelStyle.backgroundColor,
        "--nav-edge": loginStyle.getPropertyValue("--edge").trim(),
        "--nav-hover": loginStyle.getPropertyValue("--hover").trim(),
        "--nav-text": loginStyle.getPropertyValue("--text").trim(),
        "--nav-card": loginStyle.getPropertyValue("--field").trim()
      };
      const signature = JSON.stringify([theme,palette]);
      if (signature !== paletteSignature) {
        paletteSignature = signature;
        if (theme === "dark" || theme === "light") host.dataset.theme = theme;
        for (const [name,value] of Object.entries(palette)) if (value) host.style.setProperty(name,value);
      }
      return true;
    };
    const attachLoginObserver = () => {
      const login = document.getElementById("shaurya-account-widget");
      if (!login?.shadowRoot?.querySelector(".trigger")) return false;
      syncLoginPalette();
      if (!loginObserver) {
        loginObserver = new MutationObserver(syncLoginPalette);
        loginObserver.observe(login,{attributes:true,attributeFilter:["style","data-theme","data-palette","class"]});
      }
      return true;
    };
    if (!attachLoginObserver()) {
      const startupObserver = new MutationObserver(() => {
        if (attachLoginObserver()) startupObserver.disconnect();
      });
      startupObserver.observe(document.body,{childList:true});
      window.addEventListener("load", () => attachLoginObserver(),{once:true});
    }
    window.addEventListener("shaurya:auth-changed", syncLoginPalette);
    window.addEventListener("pageshow", syncLoginPalette);
    const trigger = shadow.querySelector(".trigger");
    const panel = shadow.querySelector(".panel");
    const nav = shadow.querySelector(".grid");
    const appLinks = new Map();
    for (const app of apps) {
      const a = document.createElement("a");
      a.className = "app";
      a.href = app.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.hidden = app.key !== "landing"; // Never flash restricted destinations before access is checked.
      appLinks.set(app.key, a);
      if (new URL(app.url).hostname === location.hostname) {
        a.classList.add("current");
        a.setAttribute("aria-current", "page");
      }
      const emoji = document.createElement("span");
      emoji.className = "emoji";
      emoji.textContent = app.icon;
      emoji.setAttribute("aria-hidden", "true");
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = app.name;
      a.append(emoji, name);
      if (app === apps[0]) {
        const homeTag = document.createElement("span");
        homeTag.className = "home-tag";
        homeTag.textContent = "Home";
        a.append(homeTag);
      }
      nav.append(a);
    }

    // The authentication service owns every site's access rules. Do not infer permissions
    // from user flags or duplicate the admin's role-to-page policy in this widget.
    let accessGeneration = 0;
    async function refreshAccess() {
      const generation = ++accessGeneration;
      for (const [key, link] of appLinks) if (key !== "landing") link.hidden = true;
      const checks = apps.filter(app => app.key !== "landing").map(async app => {
        try {
          const response = await fetch("https://auth.shauryaswebsites.com/api/page-access/" + encodeURIComponent(app.key), {
            credentials: "include", cache: "no-store"
          });
          if (!response.ok) return false;
          const access = await response.json();
          return access.page === app.key && access.allowed === true;
        } catch {
          return false; // Fail closed if the permissions service is unavailable.
        }
      });
      const allowed = await Promise.all(checks);
      if (generation !== accessGeneration) return; // Ignore stale responses after a login/logout.
      let index = 0;
      for (const app of apps) {
        if (app.key !== "landing") appLinks.get(app.key).hidden = !allowed[index++];
      }
    }
    window.addEventListener("shaurya:auth-changed", refreshAccess);
    void refreshAccess();

    let chosen = null;
    let lastPosition = null;
    let pending = false;
    const place = () => {
      if (!panel.hidden) return; // Never move the button while the user is interacting with the menu.
      const candidates = positions(window.innerWidth, window.innerHeight);
      const next = choosePlacement(candidates, visibleObstacles(host), chosen);
      const positionKey = [next.id,next.left,next.top,window.innerHeight].join(":");
      if (positionKey === lastPosition) return;
      lastPosition = positionKey;
      chosen = next.id;
      const edge = next.horizontal === "right" ? "right" : "left";
      host.style.top = next.top + "px";
      host.style.left = next.left + "px";
      host.style.right = "auto";
      host.style.bottom = "auto";
      panel.style.left = edge === "left" ? "0" : "auto";
      panel.style.right = edge === "right" ? "0" : "auto";
      // Above the trigger for bottom placements, below it elsewhere.
      if (next.vertical === "bottom") {
        panel.style.top = "auto";
        panel.style.bottom = "56px";
        panel.style.maxHeight = Math.max(140, next.top - 70) + "px";
      } else {
        panel.style.top = "56px";
        panel.style.bottom = "auto";
        panel.style.maxHeight = Math.max(140, window.innerHeight - next.bottom - 22) + "px";
      }
    };
    const schedulePlacement = () => {
      if (pending || !panel.hidden) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; place(); });
    };
    const setOpen = (open) => {
      panel.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
      trigger.setAttribute("aria-label", open ? "Close app launcher" : "Open app launcher");
      if (!open) schedulePlacement();
    };
    trigger.addEventListener("click", () => setOpen(panel.hidden));
    document.addEventListener("pointerdown", (event) => {
      if (!panel.hidden && !event.composedPath().includes(host)) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hidden) { setOpen(false); trigger.focus(); }
    });
    document.body.append(host);
    place();
    window.addEventListener("resize", schedulePlacement, { passive: true });
    window.addEventListener("scroll", schedulePlacement, { passive: true, capture: true });
    // Re-check after the host app finishes loading its layout.
    window.addEventListener("load", schedulePlacement, { once: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, {once:true});
  else mount();
})();
