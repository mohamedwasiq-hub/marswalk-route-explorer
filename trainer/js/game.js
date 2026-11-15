/* AI-assisted: written with an AI coding assistant (Claude), directed and reviewed by the team. NASA Space Apps 2026 SI disclosure. */
/* Sol by Sol: game rules. Pure logic, no DOM, so it can be tested in Node. */
(function (root) {
  "use strict";

  var LEVELS = {
    cadet: {
      label: "Cadet",
      sols: 10,
      start: { oxygen: 9, food: 9, battery: 3, dose: 0, science: 0 },
      max: { oxygen: 12, food: 12, battery: 6 },
      doseLimit: 20,
      lowDose: 15,
      scienceGoal: 10,
      storms: [1, 2],          // min, max solar storms per mission
      dustStorm: [2, 2],       // length of the dust-storm stretch in sols
      forecastAccuracy: 0.9,
      stormDose: { shelter: 1, inside: 5, outside: 7 }
    },
    commander: {
      label: "Commander",
      sols: 10,
      start: { oxygen: 8, food: 8, battery: 2, dose: 0, science: 0 },
      max: { oxygen: 12, food: 12, battery: 6 },
      doseLimit: 20,
      lowDose: 15,
      scienceGoal: 13,
      storms: [2, 3],
      dustStorm: [2, 2],
      forecastAccuracy: 0.75,
      stormDose: { shelter: 1, inside: 5, outside: 8 }
    }
  };

  var SKY_POWER = { clear: 6, hazy: 4, dust: 2 };
  var USE_PER_SOL = { oxygen: 2, food: 2 };
  var HEATER = 1;

  var JOBS = {
    oxygen:  { cost: 1, max: 3, gives: 2 },
    food:    { cost: 1, max: 3, gives: 2 },
    lab:     { cost: 1, max: 2 },
    explore: { cost: 2, max: 1 },
    shelter: { cost: 2, max: 1 }
  };

  /* Small seeded random generator (mulberry32) so a mission can be replayed. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function randInt(r, lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); }

  /* Build the hidden schedule: sky per sol, storm sols, dust devil, forecasts, comms delay. */
  function makeSchedule(levelKey, seed) {
    var L = LEVELS[levelKey];
    var r = rng(seed);
    var n = L.sols;
    var sky = [];
    for (var i = 0; i < n; i++) sky.push(r() < 0.62 ? "clear" : "hazy");
    sky[0] = "clear"; // gentle first sol

    // one dust-storm stretch, never on sol 1 or 2
    var len = randInt(r, L.dustStorm[0], L.dustStorm[1]);
    var dStart = randInt(r, 3, n - len - 1);
    for (var d = dStart; d < dStart + len; d++) sky[d] = "dust";

    // solar storms, never on sol 1, not on back-to-back sols
    var stormCount = randInt(r, L.storms[0], L.storms[1]);
    var storm = new Array(n).fill(false);
    var tries = 0;
    while (stormCount > 0 && tries < 200) {
      tries++;
      var s = randInt(r, 1, n - 1);
      if (storm[s] || storm[s - 1] || storm[s + 1]) continue;
      storm[s] = true; stormCount--;
    }

    // a dust devil may clean the panels once, after the dust storm
    var devil = -1;
    if (dStart + len < n - 1 && r() < 0.75) devil = randInt(r, dStart + len, n - 2);

    // forecasts: right most of the time, sometimes a false alarm or a miss
    var forecast = [];
    for (var f = 0; f < n; f++) {
      var right = r() < L.forecastAccuracy;
      var says = storm[f] ? (right ? "high" : "low") : (right ? "low" : "high");
      forecast.push(says);
    }
    forecast[0] = "low"; // sol 1 is calm and correctly forecast, so the first lesson is simple

    // one-way light delay Earth to Mars drifts a little each sol, 3 to 22 minutes
    var delay = [];
    var m = randInt(r, 6, 19);
    for (var k = 0; k < n; k++) {
      delay.push(m);
      m = Math.max(3, Math.min(22, m + (r() < 0.5 ? -1 : 1)));
    }

    return { sky: sky, storm: storm, devil: devil, forecast: forecast, delay: delay, dustStart: dStart, dustLen: len };
  }

  function newGame(levelKey, seed) {
    var L = LEVELS[levelKey];
    if (seed == null) seed = Math.floor(Math.random() * 1e9);
    var s = L.start;
    return {
      level: levelKey,
      seed: seed,
      sol: 1,
      oxygen: s.oxygen, food: s.food, battery: s.battery, dose: s.dose, science: s.science,
      dusty: false,          // panels carrying dust (−1 power) until cleaned
      cleaned: false,
      schedule: makeSchedule(levelKey, seed),
      jobs: emptyJobs(),
      history: [],
      over: false,
      result: null           // "win" | "lose"
    };
  }

  function emptyJobs() { return { oxygen: 0, food: 0, lab: 0, explore: 0, shelter: 0 }; }

  function skyToday(g) { return g.schedule.sky[g.sol - 1]; }

  /* Power the panels make today. Dust builds up from sol 5 unless a dust devil cleaned it. */
  function panelPower(g) {
    var sky = skyToday(g);
    var p = SKY_POWER[sky];
    if (g.dusty && sky !== "dust") p -= 1; // a dust storm already counts the dust
    return Math.max(1, p);
  }

  function powerAvailable(g) { return panelPower(g) + g.battery; }

  function powerSpent(jobs) {
    var t = HEATER;
    for (var k in JOBS) t += (jobs[k] || 0) * JOBS[k].cost;
    return t;
  }

  /* Can this job go up by one? Returns a reason string when not. */
  function canAdd(g, job) {
    var J = JOBS[job];
    if (g.over) return "over";
    if (g.jobs[job] >= J.max) return "max";
    if (job === "explore" && g.jobs.shelter) return "shelter";
    if (job === "shelter" && g.jobs.explore) return "explore";
    if (powerSpent(g.jobs) + J.cost > powerAvailable(g)) return "power";
    return null;
  }

  function setJob(g, job, value) {
    var J = JOBS[job];
    value = Math.max(0, Math.min(J.max, value));
    var trial = Object.assign({}, g.jobs);
    trial[job] = value;
    if (job === "explore" && value) trial.shelter = 0;
    if (job === "shelter" && value) trial.explore = 0;
    if (powerSpent(trial) > powerAvailable(g)) return false;
    g.jobs = trial;
    return true;
  }

  /* What tonight looks like if the planned jobs go ahead, assuming no storm. Used for the live preview. */
  function preview(g, jobs) {
    jobs = jobs || g.jobs;
    var L = LEVELS[g.level];
    var panel = panelPower(g);
    var spentDay = powerSpent(jobs) - HEATER;
    var battery = g.battery;
    if (spentDay > panel) battery -= (spentDay - panel);
    var spare = Math.max(0, panel - spentDay);
    var charged = Math.min(spare, L.max.battery - battery);
    var wasted = spare - charged;
    battery += charged;
    var cold = false;
    if (battery >= HEATER) battery -= HEATER; else { cold = true; battery = 0; }
    var oxygen = Math.min(L.max.oxygen, g.oxygen + jobs.oxygen * JOBS.oxygen.gives) - USE_PER_SOL.oxygen;
    var food = Math.min(L.max.food, g.food + jobs.food * JOBS.food.gives) - USE_PER_SOL.food - (cold ? 1 : 0);
    var dose = g.dose + 1 + (jobs.explore ? 1 : 0);
    var science = g.science + jobs.lab + jobs.explore * 3;
    return { oxygen: oxygen, food: food, battery: battery, dose: dose, science: science, wasted: wasted, charged: charged, cold: cold };
  }

  /* Resolve the sol. Returns a report the UI turns into words. */
  function endSol(g) {
    if (g.over) return null;
    var L = LEVELS[g.level];
    var idx = g.sol - 1;
    var sky = skyToday(g);
    var storm = g.schedule.storm[idx];
    var jobs = Object.assign({}, g.jobs);
    var before = { oxygen: g.oxygen, food: g.food, battery: g.battery, dose: g.dose, science: g.science };
    var panel = panelPower(g);
    var p = preview(g, jobs);

    var stormDose = 0;
    if (storm) {
      if (jobs.shelter) stormDose = L.stormDose.shelter;
      else if (jobs.explore) stormDose = L.stormDose.outside;
      else stormDose = L.stormDose.inside;
    }

    g.oxygen = p.oxygen;
    g.food = p.food;
    g.battery = p.battery;
    g.science = p.science;
    g.dose = p.dose + stormDose;

    // panel dust: builds after sol 4, a dust storm also coats them, a dust devil cleans
    var events = [];
    if (sky === "dust") events.push("dust");
    if (storm) events.push(jobs.shelter ? "storm-sheltered" : (jobs.explore ? "storm-outside" : "storm-inside"));
    if (!storm && jobs.shelter) events.push("shelter-unused");
    if (p.cold) events.push("cold");
    if (p.wasted > 0) events.push("wasted");
    if (idx === g.schedule.devil && g.dusty) { g.dusty = false; g.cleaned = true; events.push("devil"); }
    else if (!g.dusty && !g.cleaned && (g.sol >= 4 || sky === "dust")) {
      if (sky === "dust" || g.sol === 4) { g.dusty = true; events.push("panels-dusty"); }
    }

    var report = {
      sol: g.sol, sky: sky, storm: storm, forecast: g.schedule.forecast[idx], panel: panel,
      jobs: jobs, before: before, after: { oxygen: g.oxygen, food: g.food, battery: g.battery, dose: g.dose, science: g.science },
      stormDose: stormDose, wasted: p.wasted, charged: p.charged, cold: p.cold, events: events, ending: null
    };

    // end checks
    if (g.oxygen <= 0) { g.oxygen = 0; report.ending = "oxygen"; }
    else if (g.food <= 0) { g.food = 0; report.ending = "food"; }
    else if (g.dose >= L.doseLimit) { report.ending = "dose"; }

    if (report.ending) { g.over = true; g.result = "lose"; }
    else if (g.sol >= L.sols) { g.over = true; g.result = "win"; report.ending = "win"; }

    g.history.push(report);
    if (!g.over) { g.sol += 1; g.jobs = emptyJobs(); }
    return report;
  }

  function stars(g) {
    var L = LEVELS[g.level];
    if (g.result !== "win") return 0;
    var s = 1;
    if (g.science >= L.scienceGoal) s++;
    if (g.dose <= L.lowDose) s++;
    return s;
  }

  var api = {
    LEVELS: LEVELS, SKY_POWER: SKY_POWER, USE_PER_SOL: USE_PER_SOL, HEATER: HEATER, JOBS: JOBS,
    newGame: newGame, panelPower: panelPower, powerAvailable: powerAvailable, powerSpent: powerSpent,
    canAdd: canAdd, setJob: setJob, preview: preview, endSol: endSol, stars: stars, skyToday: skyToday,
    emptyJobs: emptyJobs
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SolGame = api;
})(this);
