# MarsWalk Route Explorer

**NASA Space Apps Challenge 2026 · Interplanetary Survival Guide: Martian Map · Abu Dhabi**

MarsWalk compares candidate astronaut walking routes across the Jezero Crater delta on Mars, using a NASA HiRISE elevation model. It shows *why* one route scores as easier than another, segment by segment, and makes its data, formula and limits visible.

> Research and education prototype. It does not certify any route as safe.

## What it does

- **Layered map** of a 4.6 × 4.0 km area: HiRISE image, hillshade, elevation and terrain slope.
- **Two candidate routes** from the crater floor to the delta top: a direct line, and a terrain-aware path found by a least-cost search.
- **Draw your own route**: click waypoints on the map and your route is scored live with the same method, as Route C.
- **Science stops** with a source for each, and how close every route passes.
- **Whole Mars view**: the entire planet with IAU-named landmarks, and a fly-in to the study site.

Every feature is described in [GUIDE.md](GUIDE.md), with a 10-minute tutorial.
- **Route comparison**: length, detour, total climb, steepest and mean slope, share over 15°, data coverage, and a **Terrain Difficulty Index**.
- **"What matters most?" sliders**: re-weight slope vs distance vs data gaps and watch the ranking change.
- **Elevation profile** coloured by slope, linked to the map.
- **Segment inspector**: click any part of a route to see its numbers and why it scores the way it does.
- **Plain-language route briefing** for a crew member, plus JSON and CSV export.
- **Data & method** and **Limitations** panels, always one click away.
- Live cursor readout: latitude, longitude, elevation and slope.

## Run it

```bash
cd web
python -m http.server 8765
```

Then open http://localhost:8765. It works offline: Leaflet is bundled in `web/vendor/`.

## Rebuild the data

```bash
python -m venv .venv
.venv\Scripts\pip install numpy pillow
```

Download the two products listed in `data-manifest.json` into `data/raw/`, then:

```bash
.venv\Scripts\python prep\build.py
.venv\Scripts\python prep\test_method.py
.venv\Scripts\python prep\sensitivity.py
```

## Project layout

```
prep/dtm.py           PDS3 DTM reader, slope, hillshade (numpy only)
prep/method.py        route sampling, A* router, TDI
prep/build.py         builds web/data/ from the raw products
prep/test_method.py   14 validation checks -> validation-results.md
prep/sensitivity.py   router-setting sensitivity -> sensitivity-results.md
prep/global_map.py    stitches the offline whole-Mars image from NASA Mars Trek tiles
GUIDE.md              every feature explained, plus a tutorial
SUBMISSION.md         project page text, pitch, video plan, usability sheet
prep/explore.py       overview images used to choose the study area
prep/preview.py       static alignment check image
web/                  the app (index.html, app.js, style.css, data/, vendor/)
data-manifest.json    product IDs, URLs, projection, units, processing
method.md             method and current results
validation-results.md latest check results
DATA-NOTES.md         notes from the data verification
PLAN.md               build plan
TODO.md               what's left
```

## Data

- Terrain: HiRISE DTM `DTEEC_002387_1985_003798_1985_A01` (University of Arizona), elevation in metres above the Mars 2000 areoid, 1 m posts.
- Image: HiRISE orthoimage `PSP_002387_1985_RED_C_01_ORTHO`, same grid.

- Planet view: Viking MDIM 2.1 colour mosaic (232 m/pixel), NASA/USGS, from NASA Mars Trek. Display only.
- Place names and landmark positions: IAU/USGS Gazetteer of Planetary Nomenclature (`web/data/places.json` lists each feature ID).
- Fonts: Fira Sans and Fira Code (SIL Open Font License), bundled in `web/vendor/fonts/`.

HiRISE data: NASA/JPL/University of Arizona, via the PDS and Mars ODE. Use of NASA data does not imply NASA endorsement.

## AI use

Most of this project's code and documentation was written with an AI coding assistant (Claude), directed by the team. The data checks in `validation-results.md` were run on the real NASA files. No AI-generated images, video or audio are used. As the 2026 Space Apps rules require, this is also stated in the app's footer, in an `ai-assistance` meta tag in `web/index.html`, and in a comment at the top of every code file.
