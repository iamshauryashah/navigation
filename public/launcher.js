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
    "gerry.shauryaswebsite.com": ["light", "#0f766e"],
    "midterm-uj.shauryaswebsite.com": ["light", "#798969"],
    "presidentialsim.shauryaswebsites.com": ["light", "#15786e"],
    "soccersim.shauryaswebsites.com": ["dark", "#cdf879"],
    "soccermanager.shauryaswebsites.com": ["light", "#205a43"],
    "army.shauryaswebsite.com": ["light", "#4a5568"],
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
    { name: "Shaurya's Websites", icon: "✨", url: "https://www.shauryaswebsites.com/" },
    { name: "Midterm-UJ", icon: "🎓", url: "https://midterm-uj.shauryaswebsite.com/" },
    { name: "Gerry the Salamander", icon: "🦎", url: "https://gerry.shauryaswebsite.com/" },
    { name: "Race to Whitehouse", icon: "🏁", url: "https://race.shauryaswebsite.com/" },
    { name: "About Me", icon: "👋", url: "https://hello.shauryaswebsite.com/" },
    { name: "QED Project", icon: "🧩", url: "https://qed.shauryaswebsites.com/" },
    { name: "Road to 270", icon: "🗳️", url: "https://presidentialsim.shauryaswebsites.com/" },
    { name: "Soccer Sim", icon: "⚽", url: "https://soccersim.shauryaswebsites.com/" },
    { name: "Army Game", icon: "🛡️", url: "https://army.shauryaswebsite.com/" },
    { name: "Soccer Manager", icon: "📋", url: "https://soccermanager.shauryaswebsites.com/" }
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
    const shadow = host.attachShadow({mode: "open"});
    shadow.innerHTML = `
      <style>
        :host {
          all: initial; position: fixed; top: 18px; right: 24px; z-index: 2147483000;
          font-family: system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
          color-scheme: dark;
          --nav-panel: rgba(17,25,46,.78); --nav-edge: rgba(196,181,253,.25);
          --nav-text: #f0f2fa; --nav-card: rgba(23,31,51,.75);
          --nav-card-edge: rgba(169,178,201,.18); --nav-hover: rgba(70,62,100,.7);
          --nav-shadow: 0 18px 60px rgba(0,0,0,.48);
          --nav-trigger: rgba(23,31,51,.84); --nav-emoji: rgba(47,57,83,.72);
          --nav-tag-bg: rgba(196,181,253,.16);
        }
        :host([data-theme="light"]) {
          color-scheme: light;
          --nav-panel: rgba(255,255,255,.78); --nav-edge: rgba(29,36,51,.18);
          --nav-text: #1d2433; --nav-card: rgba(250,249,245,.73);
          --nav-card-edge: rgba(29,36,51,.14); --nav-hover: rgba(225,236,231,.92);
          --nav-shadow: 0 18px 60px rgba(29,36,51,.2);
          --nav-trigger: rgba(255,255,255,.84); --nav-emoji: rgba(235,239,237,.82);
          --nav-tag-bg: rgba(15,118,110,.1);
        }
        *, *::before, *::after { box-sizing: border-box; }
        button, a { -webkit-tap-highlight-color: transparent; }
        .trigger { display:grid;place-items:center;width:46px;height:46px;padding:0;border:1px solid var(--nav-edge);border-radius:14px;background:var(--nav-trigger);color:var(--nav-accent);cursor:pointer;box-shadow:0 6px 22px #0003;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px); }
        .trigger:hover,.trigger[aria-expanded="true"] { background:var(--nav-hover);border-color:var(--nav-accent); }
        :is(button,a,input):focus-visible { outline:3px solid var(--nav-accent);outline-offset:3px; }
        .dots { display:grid;grid-template-columns:repeat(3,5px);gap:4px; }
        .dots i { width:5px;height:5px;border-radius:50%;background:currentColor; }
        .panel { position:absolute;top:56px;right:0;width:min(390px,calc(100vw - 24px));max-height:min(620px,calc(100dvh - 92px));overflow:auto;padding:20px;border:1px solid var(--nav-edge);border-radius:18px;background:var(--nav-panel);box-shadow:var(--nav-shadow);backdrop-filter:blur(18px) saturate(135%);-webkit-backdrop-filter:blur(18px) saturate(135%); }
        .panel[hidden] { display:none; }
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
        <span class="dots" aria-hidden="true">${"<i></i>".repeat(9)}</span>
      </button>
      <section class="panel" id="shaurya-apps" aria-label="Apps" hidden>
        <h2>Apps</h2>
        <nav class="grid" aria-label="Shaurya's Websites apps"></nav>
      </section>`;
    const trigger = shadow.querySelector(".trigger");
    const panel = shadow.querySelector(".panel");
    const nav = shadow.querySelector(".grid");
    for (const app of apps) {
      const a = document.createElement("a");
      a.className = "app";
      a.href = app.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
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
