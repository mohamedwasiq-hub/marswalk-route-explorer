// Plays many missions with simple strategies to check game balance. Run: node tools/simulate.js
const G = require("../js/game.js");

function smart(g) {
  const L = G.LEVELS[g.level];
  const fc = g.schedule.forecast[g.sol - 1];
  g.jobs = G.emptyJobs();
  if (fc === "high") G.setJob(g, "shelter", 1);
  // keep air and food from dropping below 4 after tonight
  for (let i = 0; i < 3; i++) { if (G.preview(g).oxygen < 6) G.setJob(g, "oxygen", g.jobs.oxygen + 1); }
  for (let i = 0; i < 3; i++) { if (G.preview(g).food < 6) G.setJob(g, "food", g.jobs.food + 1); }
  if (fc !== "high" && g.dose + (L.sols - g.sol) + 7 < L.doseLimit) {
    G.setJob(g, "explore", 1);
    const pv = G.preview(g);
    if (pv.food < 5 || pv.oxygen < 5 || pv.cold) G.setJob(g, "explore", 0);
  }
  // spend on lab only while keeping 3 in the battery for bad days
  for (let i = 0; i < 2; i++) { G.setJob(g, "lab", g.jobs.lab + 1); if (G.preview(g).battery < 3) G.setJob(g, "lab", g.jobs.lab - 1); }
  // top up air and food further if power is left over
  for (let i = 0; i < 3; i++) { G.setJob(g, "food", g.jobs.food + 1); if (G.preview(g).battery < 3) G.setJob(g, "food", g.jobs.food - 1); }
  for (let i = 0; i < 3; i++) { G.setJob(g, "oxygen", g.jobs.oxygen + 1); if (G.preview(g).battery < 3) G.setJob(g, "oxygen", g.jobs.oxygen - 1); }
}

function reckless(g) {
  g.jobs = G.emptyJobs();
  G.setJob(g, "explore", 1);
  G.setJob(g, "oxygen", 2); G.setJob(g, "food", 2);
  G.setJob(g, "lab", 2);
}

function random(g) {
  g.jobs = G.emptyJobs();
  const keys = Object.keys(G.JOBS);
  for (let i = 0; i < 8; i++) {
    const k = keys[Math.floor(Math.random() * keys.length)];
    if (!G.canAdd(g, k)) G.setJob(g, k, g.jobs[k] + 1);
  }
}

function run(level, strat, n) {
  const out = { win: 0, oxygen: 0, food: 0, dose: 0, stars: [0, 0, 0, 0], sci: 0 };
  for (let i = 0; i < n; i++) {
    const g = G.newGame(level, i * 7919 + 13);
    while (!g.over) { strat(g); const r = G.endSol(g); if (r.ending && r.ending !== "win") out[r.ending]++; }
    if (g.result === "win") out.win++;
    out.stars[G.stars(g)]++;
    out.sci += g.science;
  }
  return `${level.padEnd(9)} ${strat.name.padEnd(8)} win ${(100 * out.win / n).toFixed(0)}%  lose(air ${out.oxygen}, food ${out.food}, dose ${out.dose})  stars0-3 ${out.stars.join("/")}  avg science ${(out.sci / n).toFixed(1)}`;
}

for (const lvl of ["cadet", "commander"]) for (const s of [smart, reckless, random]) console.log(run(lvl, s, 2000));
