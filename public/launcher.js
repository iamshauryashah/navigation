/* Shaurya's Websites shared app launcher. Loaded once per page. */
(() => {
  if (window.__shauryaLauncherLoaded) return;
  window.__shauryaLauncherLoaded = true;

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

  function mount() {
    if (document.getElementById("shaurya-app-launcher")) return;
    const host = document.createElement("div");
    host.id = "shaurya-app-launcher";
    const shadow = host.attachShadow({mode: "open"});
    shadow.innerHTML = `
      <style>
        :host { all: initial; position: fixed; top: 18px; right: 24px; z-index: 2147483000; color-scheme: dark; font-family: system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
        *, *::before, *::after { box-sizing: border-box; }
        button, a { -webkit-tap-highlight-color: transparent; }
        .trigger { display:grid;place-items:center;width:46px;height:46px;padding:0;border:1px solid #65527e;border-radius:14px;background:#171f33;color:#c4b5fd;cursor:pointer;box-shadow:0 6px 22px #0003; }
        .trigger:hover,.trigger[aria-expanded="true"] { background:#252e47;border-color:#c4b5fd; }
        :is(button,a,input):focus-visible { outline:3px solid #c4b5fd;outline-offset:3px; }
        .dots { display:grid;grid-template-columns:repeat(3,5px);gap:4px; }
        .dots i { width:5px;height:5px;border-radius:50%;background:currentColor; }
        .panel { position:absolute;top:56px;right:0;width:min(390px,calc(100vw - 24px));max-height:min(620px,calc(100dvh - 92px));overflow:auto;padding:20px;border:1px solid #34415c;border-radius:18px;background:#11192e;box-shadow:0 18px 60px #000a; }
        .panel[hidden] { display:none; }
        h2 { margin:0 0 16px;font-size:22px;line-height:1.2;color:#f0f2fa;font-weight:700; }
        .grid { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px; }
        .app { min-width:0;min-height:112px;padding:13px 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;text-align:center;text-decoration:none;border:1px solid #2b344d;border-radius:13px;background:#171f33;color:#f0f2fa;transition:background .15s,border-color .15s; }
        .app:hover { background:#252e47;border-color:#8e7bc4; }
        .app:first-child { border-color:#8e7bc4; background:linear-gradient(145deg,#30204f,#171f33 75%); }
        .app:first-child .emoji { background:#352650; }
        .home-tag { display:inline-block;padding:2px 9px;border-radius:999px;background:#c4b5fd;color:#17122c;font-size:11px;font-weight:650;line-height:1.3; }
        .app.current { border-color:#a78bfa; }
        .emoji { display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:#252e47;font-size:27px; }
        .name { font-size:12px;font-weight:650;line-height:1.3;overflow-wrap:anywhere; }
        @media (max-width: 480px) { :host { top:12px;right:12px; } .panel { padding:15px; } .app { min-height:99px; } }
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
    const setOpen = (open) => {
      panel.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
      trigger.setAttribute("aria-label", open ? "Close app launcher" : "Open app launcher");
    };
    trigger.addEventListener("click", () => setOpen(panel.hidden));
    document.addEventListener("pointerdown", (event) => {
      if (!panel.hidden && !event.composedPath().includes(host)) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hidden) { setOpen(false); trigger.focus(); }
    });
    document.body.append(host);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, {once:true});
  else mount();
})();
