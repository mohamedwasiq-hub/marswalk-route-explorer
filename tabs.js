/* AI-assisted: written with an AI coding assistant (Claude), directed and reviewed by the team. NASA Space Apps 2026 SI disclosure. */
/* Sidebar tabs: Compare, Inspect, Plan. Keyboard: arrow keys, Home, End. */
(function () {
  "use strict";
  const tabs = Array.from(document.querySelectorAll('.sheet-tabs [role="tab"]'));
  const sheet = document.getElementById("analysis");

  function activate(tab, focus) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
    sheet.scrollTop = 0;
    // the profile canvas measures its width when drawn, so redraw once it is visible
    if (tab.id === "tab-inspect") window.dispatchEvent(new Event("resize"));
  }

  tabs.forEach((t, i) => {
    t.addEventListener("click", () => activate(t, false));
    t.addEventListener("keydown", e => {
      let j = null;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") j = 0;
      if (e.key === "End") j = tabs.length - 1;
      if (j != null) { e.preventDefault(); activate(tabs[j], true); }
    });
  });

  // clicking a route on the map opens its segment details
  document.addEventListener("mw:segment", () => activate(document.getElementById("tab-inspect"), false));

  // links can open a tab directly: #compare, #inspect, #plan
  const fromHash = () => {
    const t = document.getElementById("tab-" + location.hash.slice(1));
    if (t && tabs.includes(t)) activate(t, false);
  };
  window.addEventListener("hashchange", fromHash);
  fromHash();
})();
