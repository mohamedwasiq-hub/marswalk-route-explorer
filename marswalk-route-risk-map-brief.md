# MarsWalk Route Risk Map

## Project brief for a high-scoring NASA Space Apps Challenge submission

**Working title:** MarsWalk — Route Risk Explorer  
**Official challenge:** Interplanetary Survival Guide: Martian Map  
**Event:** NASA Space Apps Challenge Abu Dhabi, November 14–15, 2026  
**Project type:** Interactive web map / decision-support prototype  
**Intended users:** Mars mission planners, science teams, educators, and the public  
**One-sentence pitch:** MarsWalk compares candidate astronaut traverse routes using NASA Mars terrain data, explains the terrain factors behind each route score, and lets users inspect the evidence instead of treating a single route score as unquestionable.

> **Terminology note:** This brief interprets “fire rating” as a five-out-of-five / top judging score. It interprets “Mars walk road risk back plan” as the Mars-walk route-risk map project and its backup plan. The project must be described as a research and education prototype, not a certified astronaut-safety system.

## 1. Official challenge fit

NASA’s 2026 challenge asks teams to create a layered, integrated view of a Martian location or route, combining data from multiple NASA science missions. It is intended to help future human explorers plan Marswalks with route details, current conditions, safety context, and science opportunities.

MarsWalk answers this with a bounded Mars area, two candidate routes, a transparent route comparison, visible terrain layers, and traceable data sources. The weekend prototype should concentrate on terrain-based route screening. It must not imply it models every astronaut hazard or real-time conditions.

**Official challenge:** https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/  
**Abu Dhabi event:** https://www.spaceappschallenge.org/2026/local-events/abu-dhabi/  
**Official challenge list:** https://www.spaceappschallenge.org/2026/challenges/

## 2. Problem definition

A map image alone does not tell a Marswalk team whether a proposed path crosses steep slopes, rough terrain, or areas with limited data. A single “safest route” label is not trustworthy unless the method, data resolution, assumptions, and uncertainty are visible.

MarsWalk helps a user answer:

1. Where are the start, destination, and candidate paths in the selected Mars region?
2. What terrain evidence is available along each path?
3. Which route is shorter or has lower estimated terrain difficulty under the selected assumptions?
4. Which segments contribute most to the estimated difficulty?
5. How does the result change if the user changes a route or the relative importance of distance and slope?
6. What is known, what is inferred, and what is outside the prototype’s scope?

## 3. Product scope

### Minimum viable product

- One preselected Martian area with verified source coverage.
- A basemap or orthoimage with source and resolution shown.
- One elevation product if available for the area.
- Two selectable routes between a start point and destination.
- A route profile and segment-level visualization.
- A clearly named **terrain difficulty index** or **route screening score**, not a probability of injury or mission failure.
- A comparison panel showing route length, slope summary, data coverage, and score assumptions.
- A visible data limitations section.
- A public source repository and short README with provenance and reproduction steps.

### Stretch goals, only after the MVP works

- Add a second independent terrain or image layer.
- Add a user-adjustable weighting control for distance versus slope.
- Add a science-interest point layer with cited points of interest.
- Add downloadable route summary as CSV or JSON.
- Add an educator mode explaining map layers in plain language.

### Out of scope for a weekend prototype

- Certifying a route as safe for astronauts.
- Predicting injury, rover failure, landslides, weather, radiation exposure, or life-support performance.
- Claiming current/live Mars conditions unless an actual data product and time context are implemented.
- Treating image brightness or color as a measured physical hazard without a defined method.
- Reconstructing a global high-resolution Mars terrain model.
- Presenting AI-generated analysis as scientific ground truth.

## 4. Application roles and users

These are product roles: the different people the application should serve. One interface can support several roles, but the team should identify its primary user.

### 4.1 Traverse planner — primary operational user

**Definition:** A mission planner or astronaut-support team member comparing candidate paths through a defined area.

**Needs:** Route geometry, distance, terrain evidence, segment-level explanation, uncertainty, and comparison of alternatives.

**MarsWalk support:** Show two routes side by side; let the user inspect segments driving the score; disclose source resolution and data gaps.

### 4.2 Field geologist / science lead

**Definition:** A scientist selecting traverse segments that balance terrain constraints with opportunities to observe scientifically interesting features.

**Needs:** Context imagery, named or annotated features, route proximity to points of interest, and a distinction between observations and interpretations.

**MarsWalk support:** Optional science-interest annotations with a citation and confidence/source note for every feature. Do not invent geological facts from visual inspection alone.

### 4.3 Astronaut / EVA crew member

**Definition:** The person who would use a concise route briefing to understand terrain and route trade-offs before a simulated or future extravehicular activity.

**Needs:** Readable map, clear route instructions, plain-language terrain notes, simple legend, and a summary that does not hide uncertainty.

**MarsWalk support:** Provide a plain-language route card with length, high-slope segments, terrain notes, and limitations. Label it as a prototype briefing, not flight-certified guidance.

### 4.4 Mission operations / communications team

**Definition:** The team supporting the crew and coordinating mission constraints outside the EVA.

**Needs:** Shareable route data, reproducible calculations, source/timestamp record, and a common view for comparing alternatives.

**MarsWalk support:** Provide route IDs or exportable JSON/CSV and a provenance panel. Communications visibility is not modeled unless a suitable geometry method and data are implemented.

### 4.5 Educator / student

**Definition:** A learner exploring how planetary data and engineering trade-offs inform route selection.

**Needs:** Explanations of units and map layers, safe experimentation, and transparent cause-and-effect.

**MarsWalk support:** Add short explanations for elevation, slope, resolution, and uncertainty. Let a learner change a route or weight and observe the result.

### 4.6 Public reviewer / judge

**Definition:** A reviewer assessing whether the project uses NASA data meaningfully, applies a credible method, and communicates limitations.

**Needs:** Fast working demo; direct challenge relevance; accessible links; clear evidence and attribution.

**MarsWalk support:** Make the source data, calculation, validation example, and known limitations visible within a few clicks.

### 4.7 Data curator / developer

**Definition:** A contributor responsible for preparing source files, checking metadata, and reproducing map layers and scores.

**Needs:** Source inventory, stable filenames, coordinate reference metadata, units, processing notes, and repeatable build procedure.

**MarsWalk support:** Store a data manifest with source URLs, product IDs, acquisition dates, map projection, pixel spacing, units, and processing steps.

## 5. Scientific definitions

| Term | Definition for MarsWalk | Responsible use |
|---|---|---|
| **Traverse** | A planned path followed by an astronaut or rover across the surface. | Say “candidate traverse” for a proposed route. |
| **Marswalk / EVA** | A crewed excursion outside a habitat or spacecraft; EVA means extravehicular activity. | The prototype supports planning discussion; it does not certify EVA safety. |
| **Route segment** | A short portion of a route between adjacent sampled points. | Calculate and show metrics by segment. |
| **Basemap / orthoimage** | A map-projected image used for geographic context. An orthoimage is corrected for geometric distortions and aligned to a projection. | Identify instrument, product, spatial resolution, and source. Image pixels alone are not slope measurements. |
| **Digital terrain model (DTM)** | A gridded raster whose values represent terrain elevation or radius, with map-projection metadata. | Check units and whether values are areoid elevation or radius before deriving slope. |
| **Elevation** | Height relative to a stated reference surface, or radial distance from the body center, depending on the product. | Do not mix elevation and radius values without consistent conversion. |
| **Slope** | Local rate of elevation change relative to horizontal, often expressed in degrees or percent rise. | State method, raster spacing, units, and smoothing. |
| **Roughness** | A measure of local variation in terrain elevation or texture over a defined neighborhood and scale. | State metric and neighborhood. Do not call image texture “roughness” unless calculated as such. |
| **Terrain difficulty index** | A project-defined relative score derived from selected terrain measures, such as slope and route length. | Explain formula and weights. It is not a calibrated probability of danger. |
| **Hazard** | A condition with potential to cause harm or obstruct mission objectives. | Call slope a terrain factor or screening flag unless thresholds are sourced and validated. |
| **Risk** | A combination of the likelihood of an adverse event and its consequence under specified conditions. | MarsWalk does not calculate full operational risk unless likelihood, consequence, exposure, and validation are established. Prefer “route screening” or “terrain difficulty.” |
| **Uncertainty** | A range of plausible values or outcomes from measurement, processing, assumptions, or incomplete coverage. | Show gaps and explain that route ranking may change with data quality or weights. |
| **Spatial resolution** | Ground dimension represented by a pixel or grid cell. | Finer grid spacing does not automatically mean greater accuracy. |
| **Data coverage** | Fraction of the route or area with valid input data. | Report coverage; flag missing sections instead of silently filling them. |
| **Validation** | A check that output behaves as intended or agrees with an independent reference or known case. | Separate software tests, data checks, and scientific validation. Do not claim field validation on Mars. |

## 6. Data plan

### 6.1 Preferred sources

1. **NASA Planetary Data System (PDS) / Mars Orbital Data Explorer (ODE):** Search for a bounded area with an available MRO HiRISE DTM and associated orthoimage. HiRISE DTMs are derived elevation grids made from stereo observations. Documentation describes elevation or radius values, projection information, and associated orthoimages.  
   - HiRISE DTM overview: https://ode.rsl.wustl.edu/mars/pagehelp/Content/Missions_Instruments/Mars%20Reconnaissance%20Orbiter/HiRISE/HiRISE%20DTM.htm
   - HiRISE products: https://ode.rsl.wustl.edu/moon/pagehelp/Content/Missions_Instruments/Mars%20Reconnaissance%20Orbiter%20%28MRO%29/HiRISE/HiRISE.htm
   - Mars ODE: https://ode.rsl.wustl.edu/mars/

2. **MRO Context Camera (CTX):** Use a CTX image for broader context if a suitable product exists. CTX imagery is about 6 metres per pixel over a roughly 30-kilometre swath and provides context for HiRISE and CRISM.  
   - CTX overview: https://ode.rsl.wustl.edu/moon/pagehelp/Content/Missions_Instruments/Mars%20Reconnaissance%20Orbiter%20%28MRO%29/CTX/CTX.htm

3. **NASA Mars Trek:** Use for map exploration and candidate-area discovery. Verify whether displayed data can be downloaded and reused; do not assume a visual basemap is an analysis-ready elevation product.  
   - Mars Trek: https://trek.nasa.gov/mars/

### 6.2 Data selection checklist

Record before using a product:

- Product name and product ID.
- Direct archive or catalog URL.
- Instrument and mission.
- Observation or release date, if applicable.
- Coverage bounds and coordinate convention.
- Pixel/grid spacing and units.
- Map projection and coordinate reference information.
- Elevation reference: areoid, radius, or another product-defined datum.
- No-data value and valid-data percentage along routes.
- Attribution/use guidance.
- File size and whether it can be processed during the event.

### 6.3 Data rules

- NASA data must be integral to a working feature, not decorative.
- Keep attribution and product links near the data manifest and project page.
- Do not imply NASA endorsement or misuse NASA branding.
- Never fabricate values to fill missing terrain. If interpolation is used, label and explain it.
- Preserve original inputs and exact processing parameters.

## 7. Route-scoring method

### 7.1 Name the output honestly

Use **Terrain Difficulty Index (TDI)** or **Route Screening Score**. Do not call it “safety probability,” “risk of injury,” or “astronaut safety rating.” It is a transparent, prototype-relative comparison of routes under stated assumptions.

### 7.2 Minimum calculation workflow

1. Choose a bounded area with a verified DTM and image source.
2. Define start and destination in the same coordinate reference system as the terrain.
3. Create two route polylines: a shorter candidate and a terrain-aware alternative. For the MVP, routes may be manually drawn if clearly labeled as candidate paths.
4. Sample each route at a fixed interval appropriate to raster spacing. Do not imply precision finer than the data.
5. Sample elevation and calculate segment distance and elevation change.
6. Calculate slope consistently. A basic adjacent-sample estimate is: slope degrees = arctan(abs(delta elevation) / horizontal distance). Convert units first.
7. Summarize route length, maximum sampled slope, mean sampled slope, share above any clearly labeled illustrative threshold, valid-data coverage, and missing-data segments.
8. If using a combined index, normalize components and publish formula and weights.
9. Display segment-level values so a user can inspect why the routes differ.
10. Display weights and assumptions; add adjustable weights only if the resulting interpretation stays clear.

### 7.3 Example score (illustrative only)

One possible prototype formula:

    TDI = 100 × (w_s × S + w_l × L + w_c × C)

Where:

- S = normalized slope burden from 0 to 1.
- L = normalized route-length burden from 0 to 1.
- C = missing or low-confidence data burden from 0 to 1.
- w_s, w_l, and w_c are nonnegative weights summing to 1.

This is an example convention, not an established NASA standard. Choose and justify the final formula. State that the score is relative within this prototype and selected area, not an empirically calibrated mission-risk value. Show individual metrics beside any aggregate score.

### 7.4 Optional roughness

Include roughness only if the DTM is suitable and the team can define a reproducible metric, such as local standard deviation of elevation within a stated neighborhood. State neighborhood size and raster spacing. Do not present visual image texture as measured terrain roughness.

### 7.5 Uncertainty display

Show input resolution and route sampling interval; valid-data fraction; smoothing, resampling, reprojection, or interpolation; whether slopes come from a local DTM or coarser product; score weights and illustrative thresholds; and a warning that the prototype omits many operational hazards and is not validated for real EVA use.

## 8. Application architecture

    NASA / PDS products
            ↓
    Small preparation script (Python; rasterio/geopandas if available)
            ↓
    Prepared GeoTIFF / GeoJSON + provenance manifest
            ↓
    Web map (Leaflet or MapLibre) + route comparison UI
            ↓
    Route metrics and transparent score

### Suggested components

- **Data preparation:** Clip a small region, verify CRS/units/no-data, derive slope only from valid DTM, export lightweight output.
- **Data manifest:** JSON/YAML with product IDs, URLs, resolution, units, projection, dates, processing parameters.
- **Frontend:** React or simple web app with Leaflet/MapLibre; use a static prepared layer if live raster serving is too costly.
- **Route calculation:** Preprocess in Python or calculate in browser for a small grid. Keep formula understandable and version-controlled.
- **Hosting:** Public static deployment or accessible repository plus short screen recording if live hosting fails.
- **Reproducibility:** Setup instructions, sample output, and exact steps to reproduce the score.

### Core interface panels

1. **Map:** terrain, routes, start/destination, legend, scale.
2. **Route comparison:** length, slope summaries, data coverage, score, assumptions.
3. **Segment inspector:** click a route segment to see values and source coverage.
4. **Data and method:** products, resolution, formulas, thresholds, provenance.
5. **Limitations:** concise, always reachable, plain-language scope statement.

## 9. Validation and defensibility

Defensibility comes from a reproducible evidence chain, not from claiming nobody can copy the idea.

### 9.1 Data integrity checks

- Confirm product IDs and file labels match the manifest.
- Confirm raster coordinate system, units, dimensions, and no-data values.
- Inspect source and processed data for projection shifts or flipped axes.
- Compare sample elevations with original product values or documented metadata.
- Report route coverage so missing data cannot silently improve a score.

### 9.2 Algorithm checks

- Flat synthetic grid: slope should be approximately zero.
- Synthetic plane with known rise/run: calculated slope should match expected value within rounding tolerance.
- Known detour: route length should increase appropriately.
- No-data route: coverage should fall and the interface should flag it.
- Weight change: aggregate score may change, but raw measurements must not.

### 9.3 Independent cross-check

For at least one sample, compare derived slope or route profile to an independent GIS calculation or trusted source product. Record what was compared, the difference, and why it is acceptable for a prototype. Ask a second team member to review the calculation and source metadata.

### 9.4 Quick user validation

Ask someone who did not build the interface to:

1. Identify which route has lower estimated terrain difficulty.
2. Find the steepest segment and data source behind it.
3. Explain one limitation of the score.

Record hesitations and fix confusing labels. Call this a usability check, not formal user research.

### 9.5 Defensible project artifacts

- Public, version-controlled code.
- data-manifest.json with product IDs and metadata.
- method.md documenting calculation.
- Saved sample route and expected output.
- Validation note with checks and results.
- Changelog recording original team decisions.

## 10. Failure modes and backup plan

| Failure | Early warning | Backup action |
|---|---|---|
| No HiRISE DTM covers selected route | ODE search has no DTM covering area. | Search coverage first and pick study area based on available data. If no DTM can be processed, deliver an image-based route explorer and remove quantitative slope claims. |
| Download or processing takes too long | Large product, inaccessible file, unsupported format. | Use a browse image or smaller product for context; process a tiny region; include a prepared sample with provenance. Do not claim measurements derived from image-only data. |
| Projection or units unclear | Layers misalign or values seem implausible. | Stop quantitative scoring. Resolve metadata or switch products. Do not hide mismatches. |
| Score looks arbitrary | Reviewers cannot explain why route ranks better. | Remove aggregate score; show raw metrics, segment values, and explicit comparison. |
| Frontend deployment fails | Blank map or broken tiles. | Use local demo, screenshots, or recording; include repository instructions and prepared route output. |
| Team falls behind | No working map by Saturday afternoon. | Freeze scope to one area, one terrain layer, two static routes, one comparison, provenance, and a short story. Drop accounts, AI, animation, and extra layers. |
| Data gaps or coarse resolution dominate | Many missing samples or source coarser than route spacing. | Report coverage, adapt sampling interval, mark gaps, or choose another documented area. Never silently fill gaps. |

### Backup product if route-risk claims are unsupported

Rename the app **MarsWalk Terrain Explorer**. Keep the layered map, candidate routes, validated slope where available, context imagery, and science features. Remove “risk” from title and labels. Make route comparison descriptive and exploratory. This preserves challenge alignment without unsupported safety claims.

## 11. Hackathon team roles

For four to six people, assign clear ownership. A person may hold multiple roles, but each deliverable needs one accountable owner.

| Team role | Responsibilities | Deliverable |
|---|---|---|
| Product / challenge lead | Align scope to official challenge; define user and acceptance criteria; maintain task list. | Pitch, scope, user story, project narrative. |
| Planetary data lead | Find and verify PDS/ODE products; inspect metadata, coverage, projection, resolution, units, citations. | Data manifest and coverage decision. |
| GIS / analysis lead | Prepare raster; calculate route distance/slope; document formulas; run numerical checks. | Reproducible metrics and validation note. |
| Frontend / map lead | Build map, route selection, comparison, segment inspector, legend, limitations. | Working interface. |
| UX / visual design lead | Improve map readability, labels, accessibility, and conduct a quick usability check. | Interface flow, legend, usability notes. |
| Story / submission lead | Prepare project page, README, attribution, demo, screenshots/video, final checklist. | Submission package and pitch. |

For a team of three, combine product/story, data/GIS, and frontend/UX roles. A solo participant should build the data-backed static comparison first, then the map, then the story.

## 12. Judging strategy for the highest possible score

NASA Space Apps judging criteria are commonly expressed as **Impact, Creativity, Validity, Relevance, and Presentation**. Verify 2026-specific instructions in the registered team’s official project area. NASA’s 2025 judging guide explains these dimensions but does not replace current-year rules.

| Criterion | What MarsWalk should demonstrate | Evidence |
|---|---|---|
| **Impact** | Meaningful use for mission planning or STEM learning, with a named user and credible future path. | User story, route brief, educator use case, next step. |
| **Creativity** | Useful combination of route comparison, segment explanation, uncertainty, and traceable sources. | Live interaction where route/weight change affects comparison and user can inspect why. |
| **Validity** | Careful planetary-data handling, correct units/projection, transparent formulas, independent checks. | Metadata, method, synthetic tests, cross-check, coverage, limitations. |
| **Relevance** | Direct response to official Mars map challenge with NASA data central to the product. | Show Mars data and route workflow immediately in demo. |
| **Presentation** | Concise story, readable map, working demo, accurate claims, accessible links. | Rehearsed pitch, clear labels, fallback recording, public repository and README. |

### Claim discipline

Good claims:

- “Compares candidate routes using the terrain data shown.”
- “The index is a prototype relative comparison, not a calibrated mission-risk probability.”
- “This route has lower sampled slope burden under displayed assumptions.”
- “Coverage is incomplete here, so this segment is uncertain.”

Avoid:

- “This is the safest Mars route.”
- “This prevents astronaut injury.”
- “NASA-approved route planner.”
- “AI predicts Mars danger” unless a real validated model exists and is fully explained.

## 13. Two-day build schedule

Follow the official Abu Dhabi schedule and official NASA submission deadline. Do not assume a local briefing replaces submission requirements.

### Before event

- Create NASA Space Apps accounts and register for Abu Dhabi.
- Create a team, repository, and shared notes.
- Install GIS and web tools.
- Read the full official challenge statement.
- Check DTM coverage and choose location based on actual product availability.
- Respect official rules about when challenge work may begin.
- Prepare a backup study area and no-DTM fallback.

### Saturday, November 14

1. Agree scope, user, and one route-comparison question.
2. Confirm DTM/image source, metadata, download, and map alignment.
3. Create app skeleton and load one data layer.
4. Add two candidate routes and distance/slope summaries.
5. Add comparison, legend, source labels.
6. Run numerical checks and log limitations.
7. Finish the day with an end-to-end working slice, even if plain.

### Sunday, November 15

1. Improve usability and add segment inspection.
2. Finish validation and record actual results.
3. Add manifest, method, and limitations.
4. Ask a non-builder to complete the three usability tasks.
5. Freeze features early enough to prepare submission.
6. Test every project link in a signed-out browser.
7. Rehearse pitch and backup demo.
8. Submit and verify the official project is submitted, not just saved.

## 14. Demo script (about 90 seconds)

1. **Problem:** “A Marswalk team needs to compare routes using terrain evidence and understand what drives the difference.”
2. **Data:** “MarsWalk uses this identified NASA/PDS Mars terrain product. Here are its source, resolution, and coverage.”
3. **Action:** Select destination and switch between two candidate routes.
4. **Evidence:** Show length, slope summary, coverage, and segments contributing most to the terrain difficulty index.
5. **Transparency:** Change a weight or inspect a segment; explain that this is a relative prototype score, not certified safety prediction.
6. **Validation:** Show one independent check or synthetic test and report its result honestly.
7. **Impact:** “This makes terrain trade-offs visible and creates a reproducible starting point for human review and STEM learning.”

## 15. Submission checklist

- [ ] Selected official challenge is Interplanetary Survival Guide: Martian Map.
- [ ] Project page states problem, user, solution, data, method, and limitations.
- [ ] NASA data power a working feature.
- [ ] Every dataset has product name/ID and source link.
- [ ] Projection, resolution, units, no-data handling, and sampling are documented.
- [ ] Score is named accurately; no unsupported safety claims appear.
- [ ] At least one validation check and its result are reported.
- [ ] Known limitations and missing coverage are visible.
- [ ] Repository and demo links open without passwords or special access.
- [ ] AI use is disclosed according to current official instructions; AI media follows those instructions and does not misuse NASA branding.
- [ ] Pitch and fallback recording are tested.
- [ ] Official submission is completed before deadline.

## 16. Starter prompt for Claude

Use this brief as the project specification. First restate the project in your own words and identify contradictions or unknowns. Then help execute a weekend MVP for **MarsWalk — Route Risk Map**, directly aligned to NASA Space Apps 2026’s *Interplanetary Survival Guide: Martian Map* challenge.

Priorities:

1. Keep the project small enough to finish during the event.
2. Use real, cited NASA/PDS Mars data and preserve product IDs, units, projection, and resolution.
3. Do not invent data, metadata, or validation results.
4. Treat the score as a transparent relative terrain-difficulty comparison, not astronaut-safety or injury probability.
5. Give concrete implementation steps, file structure, data schema, route formula, tests, UI sections, and demo script.
6. If a product cannot be found or verified, say so and use the fallback plan.
7. Optimize for Impact, Creativity, Validity, Relevance, and Presentation through working evidence, not inflated claims.
8. Keep NASA attribution and all project links accessible.

Before recommending data or calculations, verify that the source exists and covers the chosen area. Ask the team to choose a location only if coverage cannot be established from available evidence.

## 17. References

- NASA Space Apps 2026 challenge, Interplanetary Survival Guide: Martian Map: https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/
- NASA Space Apps 2026 challenge list: https://www.spaceappschallenge.org/2026/challenges/
- NASA Space Apps 2026 overview: https://www.spaceappschallenge.org/2026/
- NASA Space Apps Abu Dhabi event: https://www.spaceappschallenge.org/2026/local-events/abu-dhabi/
- Mars Orbital Data Explorer: https://ode.rsl.wustl.edu/mars/
- MRO HiRISE DTM documentation: https://ode.rsl.wustl.edu/mars/pagehelp/Content/Missions_Instruments/Mars%20Reconnaissance%20Orbiter/HiRISE/HiRISE%20DTM.htm
- MRO HiRISE product overview: https://ode.rsl.wustl.edu/moon/pagehelp/Content/Missions_Instruments/Mars%20Reconnaissance%20Orbiter%20%28MRO%29/HiRISE/HiRISE.htm
- MRO CTX product documentation: https://ode.rsl.wustl.edu/moon/pagehelp/Content/Missions_Instruments/Mars%20Reconnaissance%20Orbiter%20%28MRO%29/CTX/CTX.htm
- NASA Mars Trek: https://trek.nasa.gov/mars/
- NASA 2025 judging guidance (background only; verify current-year instructions): https://spaceapps-v2-staging.s3.amazonaws.com/media/documents/Final_Space_Apps_2025_Judging_Guidelines_for_web.pdf
