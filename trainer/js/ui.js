/* AI-assisted: written with an AI coding assistant (Claude), directed and reviewed by the team. NASA Space Apps 2026 SI disclosure. */
/* Sol by Sol: interface. Reads rules from SolGame and words from SolData. */
(function () {
  "use strict";
  var G = window.SolGame, D = window.SolData;
  var $ = function (id) { return document.getElementById(id); };

  var game = null;
  var shownFacts = {};
  var usedOxygenOnce = false;

  var METERS = [
    { k: "oxygen",  name: "Air (oxygen)", icon: "ph-wind" },
    { k: "food",    name: "Food",         icon: "ph-plant" },
    { k: "battery", name: "Battery",      icon: "ph-battery-high" },
    { k: "dose",    name: "Radiation dose", icon: "ph-radioactive" },
    { k: "science", name: "Science",      icon: "ph-star" }
  ];

  /* ---------- Storage (per-viewer convenience only) ---------- */
  function loadBest() { try { return JSON.parse(localStorage.getItem("solbysol-best") || "{}"); } catch (e) { return {}; } }
  function saveBest(level, stars) {
    try { var b = loadBest(); if (!b[level] || stars > b[level]) { b[level] = stars; localStorage.setItem("solbysol-best", JSON.stringify(b)); } } catch (e) {}
  }
  function renderBest() {
    var b = loadBest(), parts = [];
    if (b.cadet) parts.push("Cadet " + b.cadet + "/3 stars");
    if (b.commander) parts.push("Commander " + b.commander + "/3 stars");
    $("best-line").hidden = !parts.length;
    $("best-line").textContent = parts.length ? "Your best: " + parts.join(", ") : "";
  }

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function icon(name, extra) { return '<i class="ph-bold ' + name + (extra ? " " + extra : "") + '" aria-hidden="true"></i>'; }
  function say(text) { $("live").textContent = ""; setTimeout(function () { $("live").textContent = text; }, 30); }

  /* ---------- Screens ---------- */
  function showTitle() {
    game = null;
    $("screen-title").hidden = false;
    $("screen-game").hidden = true;
    $("sol-track").hidden = true;
    renderBest();
    window.scrollTo(0, 0);
  }

  function startGame(level) {
    game = G.newGame(level);
    shownFacts = {};
    usedOxygenOnce = false;
    $("screen-title").hidden = true;
    $("screen-game").hidden = false;
    $("sol-track").hidden = false;
    renderAll();
    window.scrollTo(0, 0);
    say("Mission started. Sol 1 of 10. " + D.SKY[G.skyToday(game)].name + ".");
  }

  function L() { return G.LEVELS[game.level]; }

  /* ---------- Render ---------- */
  function renderAll() {
    renderTrack();
    renderScene();
    renderMC();
    renderPower();
    renderMeters();
    renderPreview();
    renderCrewNote();
    $("end-btn").innerHTML = "End sol " + game.sol + " " + icon("ph-moon-stars");
  }

  function renderTrack() {
    var ol = $("sol-track"); ol.innerHTML = "";
    ol.setAttribute("aria-label", "Sol " + game.sol + " of " + L().sols);
    for (var i = 1; i <= L().sols; i++) {
      var li = el("li", i < game.sol ? "done" : (i === game.sol ? "now" : ""), String(i));
      if (i === game.sol) li.setAttribute("aria-current", "step");
      ol.appendChild(li);
    }
  }

  function renderScene() {
    var sky = G.skyToday(game), S = D.SKY[sky];
    $("scene").dataset.sky = sky;
    $("sky-icon").className = "ph-bold " + S.icon;
    $("sky-name").textContent = S.name;
    var p = G.panelPower(game);
    $("panel-line").textContent = "Panels make " + p + " power today" + (game.dusty && sky !== "dust" ? " (dusty panels, −1)" : "");
  }

  function renderMC() {
    var idx = game.sol - 1;
    var risk = game.schedule.forecast[idx];
    var delay = game.schedule.delay[idx];
    $("mc").dataset.risk = risk;
    $("mc-risk").textContent = risk === "high" ? "High" : "Low";
    $("mc-delay").textContent = "Sent from Earth " + delay + " minutes ago (that's how long light takes today)";
    $("mc-advice").textContent = risk === "high"
      ? "Our Sun-watching spacecraft saw a big blast. Particles may reach Mars today. The storm shelter would keep the crew safer."
      : "The Sun looks calm today. A good day to explore, but forecasts are not always right.";
  }

  function previewNow() { return G.preview(game); }

  function renderMeters() {
    var box = $("meters"); box.innerHTML = "";
    var pv = previewNow();
    var Lv = L();
    METERS.forEach(function (m) {
      var cur = game[m.k], next = pv[m.k];
      var max = m.k === "dose" ? Lv.doseLimit : (m.k === "science" ? Lv.scienceGoal : Lv.max[m.k]);
      var row = el("div", "meter");
      row.dataset.k = m.k;
      var low = (m.k === "oxygen" || m.k === "food") ? next <= 2 : (m.k === "dose" ? next >= Lv.doseLimit - 3 : false);
      if (low) row.classList.add("low");
      var unit = m.k === "dose" ? " / " + Lv.doseLimit + " limit" : (m.k === "science" ? " / " + Lv.scienceGoal + " goal" : " / " + max);
      var fill = Math.min(cur, next), ghost = Math.max(cur, next);
      var tonight;
      if (m.k === "oxygen" || m.k === "food") {
        tonight = next <= 0 ? '<span class="warn">Runs out tonight!</span>' : "Tonight: <b>" + next + "</b>" + (next <= 2 ? ' <span class="warn">low</span>' : "");
      } else if (m.k === "dose") {
        tonight = next >= Lv.doseLimit ? '<span class="warn">Over the limit tonight!</span>' : "Tonight: <b>" + next + "</b> (if no storm)";
      } else if (m.k === "battery") {
        tonight = "Tonight: <b>" + next + "</b> after heaters";
      } else {
        tonight = "Tonight: <b>" + next + "</b>" + (next >= Lv.scienceGoal ? " (goal reached)" : "");
      }
      var perSol = m.k === "oxygen" ? "crew uses 2 a sol" : m.k === "food" ? "crew eats 2 a sol" : m.k === "dose" ? "+1 every sol" : "";
      row.innerHTML =
        '<span class="meter-icon" aria-hidden="true"><i class="ph-bold ' + m.icon + '"></i></span>' +
        '<span class="meter-name">' + m.name + "</span>" +
        '<span class="meter-val">' + cur + "<small>" + unit + "</small></span>" +
        '<span class="meter-bar" role="img" aria-label="' + m.name + " " + cur + unit + ", tonight " + next + '">' +
          '<span class="meter-ghost" style="transform:scaleX(' + Math.min(1, ghost / max) + ')"></span>' +
          '<span class="meter-fill" style="transform:scaleX(' + Math.min(1, Math.max(0, fill) / max) + ')"></span>' +
        "</span>" +
        '<span class="meter-tonight"><span>' + tonight + "</span><span>" + perSol + "</span></span>";
      box.appendChild(row);
    });
  }

  function renderPower() {
    var avail = G.powerAvailable(game), spent = G.powerSpent(game.jobs), panel = G.panelPower(game);
    $("power-left").textContent = String(avail - spent);
    $("power-of").textContent = "of " + avail + " left";
    var cells = $("cells"); cells.innerHTML = "";
    for (var i = 0; i < avail; i++) {
      var c = el("span", "cell" + (i < spent ? " used" : "") + (i >= panel ? " from-battery" : ""), '<i class="ph-fill ph-lightning"></i>');
      cells.appendChild(c);
    }

    var ul = $("jobs"); ul.innerHTML = "";
    ["oxygen", "food", "lab", "explore", "shelter"].forEach(function (k) {
      var T = D.JOB_TEXT[k], v = game.jobs[k];
      var li = el("li", "job" + (v ? " on" : ""));
      var reason = G.canAdd(game, k);
      var why = "";
      if (k === "explore" && game.jobs.shelter) why = "Not while the crew is in the shelter.";
      if (k === "shelter" && game.jobs.explore) why = "Explorers are outside. Turning this on cancels the drive.";
      var cost = G.JOBS[k].cost;
      var left = '<span class="job-icon" aria-hidden="true"><i class="ph-bold ' + T.icon + '"></i></span>' +
        "<span><span class=\"job-name\">" + T.name + "</span><span class=\"job-gives\">" + cost + " power: " + T.gives + "</span>" +
        (why ? '<span class="job-why">' + why + "</span>" : "") + "</span>";
      li.innerHTML = left;
      if (k === "explore" || k === "shelter") {
        var b = el("button", "toggle");
        b.type = "button";
        b.setAttribute("aria-pressed", v ? "true" : "false");
        b.setAttribute("aria-label", T.name + (v ? ", on" : ", off"));
        b.innerHTML = v ? icon("ph-check") + "On" : "Turn on";
        var blocked = !v && reason === "power";
        b.disabled = blocked;
        b.title = blocked ? "Not enough power left" : T.hint;
        b.addEventListener("click", function () { G.setJob(game, k, v ? 0 : 1); afterChange(T.name + (v ? " off" : " on")); });
        li.appendChild(b);
      } else {
        var st = el("span", "stepper");
        var minus = el("button", "", icon("ph-minus")); minus.type = "button"; minus.setAttribute("aria-label", "Less power to " + T.name); minus.disabled = v === 0;
        var out = el("output", "", String(v)); out.setAttribute("aria-label", T.name + " power");
        var plus = el("button", "", icon("ph-plus")); plus.type = "button"; plus.setAttribute("aria-label", "More power to " + T.name); plus.disabled = !!reason;
        plus.title = reason === "power" ? "Not enough power left" : reason === "max" ? "This job is at its maximum" : T.hint;
        minus.addEventListener("click", function () { G.setJob(game, k, v - 1); afterChange(T.name + " " + (v - 1)); });
        plus.addEventListener("click", function () { G.setJob(game, k, v + 1); if (k === "oxygen") usedOxygenOnce = true; afterChange(T.name + " " + (v + 1)); });
        st.appendChild(minus); st.appendChild(out); st.appendChild(plus);
        li.appendChild(st);
      }
      ul.appendChild(li);
    });

    var heat = el("li", "job locked",
      '<span class="job-icon" aria-hidden="true"><i class="ph-bold ph-thermometer-cold"></i></span>' +
      '<span><span class="job-name">Night heaters</span><span class="job-gives">1 power, always on. Mars nights are freezing.</span></span>' +
      '<span class="locked-tag">Always on</span>');
    ul.appendChild(heat);

    var pv = previewNow();
    var foot = [];
    if (pv.charged > 0) foot.push(pv.charged + " power left over will charge the battery.");
    if (pv.wasted > 0) foot.push(pv.wasted + " power will be wasted because the battery is full.");
    if (spent - G.HEATER > panel) foot.push("You are using " + (spent - G.HEATER - panel) + " power from the battery.");
    $("power-foot").textContent = foot.join(" ");
  }

  function renderPreview() {
    var pv = previewNow(), bits = [];
    if (pv.oxygen <= 0) bits.push('<span class="warn">Air will run out tonight. Make more air!</span>');
    if (pv.food <= 0) bits.push('<span class="warn">Food will run out tonight. Grow more food!</span>');
    if (pv.cold) bits.push('<span class="warn">No power left for the heaters. The cold crew will eat 1 extra food.</span>');
    if (pv.dose >= L().doseLimit) bits.push('<span class="warn">This would put the crew over the radiation limit.</span>');
    if (!bits.length) bits.push("Tonight: air " + game.oxygen + " → " + pv.oxygen + ", food " + game.food + " → " + pv.food + ", science " + game.science + " → " + pv.science + ".");
    $("preview-line").innerHTML = bits.join(" ");
  }

  function renderCrewNote() {
    var note = "", pv = previewNow(), sky = G.skyToday(game), risk = game.schedule.forecast[game.sol - 1];
    if (game.sol === 1 && G.powerSpent(game.jobs) === G.HEATER) note = "Hi " + L().label + "! Your crew needs 2 air and 2 food every sol. Try putting 1 power into Make air and 1 into Grow food, then end the sol.";
    else if (risk === "high" && !game.jobs.shelter) note = "Mission Control thinks a solar storm is coming. The shelter costs 2 power, but it blocks most of the radiation.";
    else if (sky === "dust") note = "Dust storm! The panels make very little power. Use what is in the battery for air and food first.";
    else if (pv.oxygen <= 2 || pv.food <= 2) note = "Supplies are getting low. Each power cell on air or food makes 2.";
    else if (game.dose >= L().doseLimit - 6) note = "The crew's radiation dose is getting high. Maybe skip exploring and stay inside today.";
    var box = $("crew-note");
    box.innerHTML = note ? icon("ph-chat-circle-text") + "<p>" + note + "</p>" : "";
  }

  function afterChange(msg) {
    renderPower(); renderMeters(); renderPreview(); renderCrewNote();
    if (msg) say(msg + ". " + $("power-left").textContent + " power left.");
  }

  /* ---------- End of sol ---------- */
  function pickFact(r) {
    var order = [];
    if (r.events.indexOf("storm-inside") > -1 || r.events.indexOf("storm-outside") > -1) order.push("storm", "shelter");
    if (r.events.indexOf("storm-sheltered") > -1) order.push("shelter", "storm");
    if (r.events.indexOf("devil") > -1) order.push("devil");
    if (r.events.indexOf("dust") > -1) order.push("dust", "sunlight");
    if (r.events.indexOf("cold") > -1) order.push("cold");
    if (r.events.indexOf("wasted") > -1) order.push("wasted");
    if (r.jobs.oxygen > 0) order.push("moxie");
    if (r.jobs.food > 0) order.push("veggie");
    order.push("sol", "background", "delay", "sunlight", "moxie", "veggie", "shelter");
    for (var i = 0; i < order.length; i++) if (!shownFacts[order[i]]) { shownFacts[order[i]] = true; return order[i]; }
    return null;
  }

  function headline(r) {
    var ev = r.events;
    if (ev.indexOf("storm-sheltered") > -1) return { t: "Solar storm! The shelter worked.", i: "ph-shield-check", tone: "good" };
    if (ev.indexOf("storm-outside") > -1) return { t: "Solar storm caught the explorers outside!", i: "ph-radioactive", tone: "bad" };
    if (ev.indexOf("storm-inside") > -1) return { t: "A solar storm hit the base", i: "ph-radioactive", tone: "bad" };
    if (ev.indexOf("devil") > -1) return { t: "A dust devil cleaned the panels!", i: "ph-tornado", tone: "good" };
    if (ev.indexOf("dust") > -1) return { t: "A long, dusty sol", i: "ph-wind", tone: "dust" };
    if (r.sky === "hazy") return { t: "A hazy but quiet sol", i: "ph-cloud-sun", tone: "good" };
    return { t: "A calm, sunny sol", i: "ph-sun", tone: "good" };
  }

  function forecastLine(r) {
    var said = r.forecast === "high" ? "High" : "Low";
    if (r.storm && r.forecast === "high") return "Mission Control said the storm chance was " + said + ", and they were right.";
    if (r.storm) return "The forecast said " + said + ", but a storm came anyway. Real forecasts can miss storms too.";
    if (r.forecast === "high") return "The forecast said " + said + ", but no storm came this time. Better safe than sorry.";
    return "The Sun stayed quiet, just as Mission Control said.";
  }

  function changeRow(k, name, iconName, before, after, why) {
    var d = after - before;
    var cls = d === 0 ? "" : ((k === "dose" ? d < 0 : d > 0) ? "up" : "down");
    var li = el("li", "change");
    li.dataset.k = k;
    li.innerHTML = icon(iconName) + '<span><strong>' + name + '</strong><br><span class="why">' + why + "</span></span>" +
      '<span class="nums">' + before + " → <span class=\"" + cls + "\">" + after + "</span></span>";
    return li;
  }

  function showReport(r) {
    var h = headline(r);
    $("report-head").dataset.tone = h.tone;
    $("report-icon").innerHTML = icon(h.i);
    $("report-kicker").textContent = "Sol " + r.sol + " report";
    $("report-h").textContent = h.t;
    $("report-line").textContent = forecastLine(r);

    var j = r.jobs, list = $("report-changes"); list.innerHTML = "";
    var oxyWhy = (j.oxygen ? "Made " + (j.oxygen * 2) + ". " : "") + "Crew breathed 2.";
    var foodWhy = (j.food ? "Grew " + (j.food * 2) + ". " : "") + "Crew ate 2." + (r.cold ? " +1 extra on a cold night." : "");
    var batWhy = "Panels made " + r.panel + "." + (r.charged ? " Saved " + r.charged + "." : "") + (r.wasted ? " " + r.wasted + " wasted (full)." : "") + (r.cold ? " Ran out before the heaters." : " Heaters used 1.");
    var doseWhy = "+1 normal Mars radiation." + (j.explore ? " +1 for exploring." : "") + (r.stormDose ? " +" + r.stormDose + " from the storm" + (j.shelter ? " (shelter blocked most)." : ".") : "");
    var sciWhy = (j.lab ? "Lab work +" + j.lab + ". " : "") + (j.explore ? "Explore drive +3." : "") || "No science today.";
    if (!j.lab && !j.explore) sciWhy = "No science jobs today.";
    list.appendChild(changeRow("oxygen", "Air", "ph-wind", r.before.oxygen, r.after.oxygen, oxyWhy));
    list.appendChild(changeRow("food", "Food", "ph-plant", r.before.food, r.after.food, foodWhy));
    list.appendChild(changeRow("battery", "Battery", "ph-battery-high", r.before.battery, r.after.battery, batWhy));
    list.appendChild(changeRow("dose", "Radiation dose", "ph-radioactive", r.before.dose, r.after.dose, doseWhy));
    list.appendChild(changeRow("science", "Science", "ph-star", r.before.science, r.after.science, sciWhy));

    var fk = pickFact(r), fact = $("report-fact");
    fact.innerHTML = "";
    if (fk) {
      var F = D.FACTS[fk], S = D.SOURCES[F.source];
      fact.innerHTML =
        "<h3>" + icon("ph-lightbulb") + "Real science: " + F.title + "</h3>" +
        (F.image ? '<img src="' + F.image + '" alt="' + F.imageAlt + '" loading="lazy">' : "") +
        "<p>" + F.text + "</p>" +
        '<p class="src">Source: <a href="' + S.url + '" target="_blank" rel="noopener">' + S.label + "</a>" + (F.credit ? ". Photo: " + F.credit : "") + "</p>";
    }

    $("report-next").innerHTML = game.over ? "See mission results " + icon("ph-flag-checkered") : "Start sol " + game.sol + " " + icon("ph-arrow-right");
    $("dlg-report").showModal();
    say(h.t + ". " + forecastLine(r));
  }

  function showEnd() {
    var last = game.history[game.history.length - 1];
    var E = D.ENDINGS[last.ending] || D.ENDINGS.win;
    var stars = G.stars(game), Lv = L();
    if (game.result === "win") saveBest(game.level, stars);
    $("end-h").textContent = E.title;
    $("end-line").textContent = E.line;
    var st = $("end-stars"); st.innerHTML = "";
    st.setAttribute("role", "img");
    st.setAttribute("aria-label", stars + " of 3 stars");
    for (var i = 0; i < 3; i++) st.appendChild(el("i", i < stars ? "ph-fill ph-star" : "ph-bold ph-star empty"));

    var stats = $("end-stats");
    stats.innerHTML =
      "<div><dt>Sols survived</dt><dd>" + (game.result === "win" ? Lv.sols : last.sol - 1) + " / " + Lv.sols + "</dd></div>" +
      "<div><dt>Science</dt><dd>" + game.science + " / " + Lv.scienceGoal + "</dd></div>" +
      "<div><dt>Radiation dose</dt><dd>" + game.dose + " / " + Lv.doseLimit + "</dd></div>";

    var h = game.history, storms = 0, sheltered = 0, falseAlarms = 0, wasted = 0, cold = 0, explores = 0, exploreDose = 0;
    h.forEach(function (r) {
      if (r.storm) { storms++; if (r.jobs.shelter) sheltered++; }
      if (!r.storm && r.jobs.shelter) falseAlarms++;
      wasted += r.wasted; if (r.cold) cold++;
      if (r.jobs.explore) { explores++; exploreDose += 1 + (r.storm && !r.jobs.shelter ? Lv.stormDose.outside - Lv.stormDose.inside : 0); }
    });
    var learned = [];
    if (storms) learned.push("You faced " + storms + " solar storm" + (storms > 1 ? "s" : "") + " and sheltered from " + sheltered + ". Shelters cost power but cut the dose from up to " + Lv.stormDose.inside + " points to just " + Lv.stormDose.shelter + ".");
    if (falseAlarms) learned.push("You sheltered " + falseAlarms + " time" + (falseAlarms > 1 ? "s" : "") + " when no storm came. Planners often choose safety even when a forecast might be wrong.");
    if (explores) learned.push("Exploring outside earned " + (explores * 3) + " science but added " + exploreDose + " radiation points. Every science trip has a cost.");
    if (wasted) learned.push(wasted + " power was wasted because the battery was full. Matching jobs to sunny days uses every bit of power.");
    if (cold) learned.push("On " + cold + " cold night" + (cold > 1 ? "s" : "") + " there was no power for the heaters. Always save some power for the night.");
    if (game.result !== "win" && last.ending === "oxygen") learned.push("Air runs out fastest. Real Mars bases would make oxygen every day, like NASA's MOXIE did.");
    if (!learned.length) learned.push("Balancing power, air, food and radiation is exactly what real mission planners do every day.");
    $("end-learned").innerHTML = learned.slice(0, 4).map(function (t) { return "<li>" + t + "</li>"; }).join("");
    $("dlg-end").showModal();
    say(E.title + " " + stars + " of 3 stars.");
  }

  /* ---------- Science notes ---------- */
  function renderNotes() {
    var items = [
      ["Radiation every sol", "About 0.64 mSv a day on the surface, measured by Curiosity. 1 dose point in the game.", "rad2014"],
      ["Solar storm at Mars", "20 May 2024: the biggest radiation surge Curiosity had seen since 2012.", "storm2024"],
      ["Making oxygen", "MOXIE made 122 g of oxygen from Mars air, up to 12 g an hour.", "moxie"],
      ["Dust storms", "A 2018 planet-wide dust storm cut off Opportunity's solar power.", "opportunity"],
      ["Panel cleaning", "Wind gusts and dust devils cleaned the Spirit and Opportunity rovers' panels.", "spirit"],
      ["Sunlight, cold and sols", "Less than half Earth's sunlight, average about -60 °C, a sol is 24 h 39 min 35 s.", "marsFacts"],
      ["Space weather forecasts", "NASA's DONKI database logs solar flares and particle storms. Our storms are modelled on events like these.", "donki"],
      ["Your outpost site", "The Jezero Crater delta, photographed by Perseverance.", "delta"]
    ];
    $("notes-grid").innerHTML = items.map(function (it) {
      var S = D.SOURCES[it[2]];
      return '<div class="note"><strong>' + it[0] + "</strong><p>" + it[1] + '</p><a href="' + S.url + '" target="_blank" rel="noopener">' + S.label + "</a></div>";
    }).join("");
  }

  /* ---------- Wire up ---------- */
  document.querySelectorAll("[data-open]").forEach(function (b) {
    b.addEventListener("click", function () { $("dlg-" + b.dataset.open).showModal(); });
  });
  $("start-btn").addEventListener("click", function () {
    var lvl = document.querySelector('input[name="level"]:checked').value;
    startGame(lvl);
  });
  $("brand").addEventListener("click", function (e) {
    e.preventDefault();
    if (game && !game.over && !window.confirm("Leave this mission and go back to the start?")) return;
    showTitle();
  });
  $("end-btn").addEventListener("click", function () {
    if (!game || game.over) return;
    var r = G.endSol(game);
    showReport(r);
  });
  $("report-next").addEventListener("click", function () {
    $("dlg-report").close();
    if (game.over) { renderTrack(); showEnd(); }
    else { renderAll(); $("end-btn").focus({ preventScroll: true }); say("Sol " + game.sol + ". " + D.SKY[G.skyToday(game)].name + ". " + G.panelPower(game) + " power from the panels."); }
  });
  $("dlg-report").addEventListener("cancel", function (e) { e.preventDefault(); $("report-next").click(); });
  $("end-again").addEventListener("click", function () { var lvl = game.level; $("dlg-end").close(); startGame(lvl); });
  $("end-title").addEventListener("click", function () { $("dlg-end").close(); showTitle(); });

  renderNotes();
  renderBest();
})();
