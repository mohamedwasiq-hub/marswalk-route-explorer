# MarsWalk: build-day plan

Challenge: **Interplanetary Survival Guide: Martian Map** (NASA Space Apps 2026, Abu Dhabi)
Rule: no project code before **9:00 AM, Sat Nov 14**. Submit before **11:59 PM, Sun Nov 15**.
Full spec: `marswalk-route-risk-map-brief.md`. Data facts: `DATA-NOTES.md`.

## Decisions already made (don't reopen them on Saturday)

| Topic | Decision |
|---|---|
| Area | Jezero Crater delta fan |
| Terrain | HiRISE DTM `DTEEC_002387_1985_003798_1985_A01` |
| Image | HiRISE orthoimage `PSP_002387_1985_RED_C_01_ORTHO` |
| Data prep | Python + numpy + pillow. **No rasterio/GDAL**: Windows Application Control blocks its DLL on this PC. Read the PDS3 `.IMG` directly (text label + raw binary grid). |
| Frontend | Plain HTML + JS + Leaflet (`L.CRS.Simple`, image overlays). No build step, no framework. |
| Hosting | GitHub Pages (static) |
| Routes | 2 hand-drawn candidate routes (A = shorter, B = terrain-aware) |
| Score name | Terrain Difficulty Index (TDI). Never "safety" or "risk of injury". |
| JP2 reading | Pillow can only read JPEG 2000 if it was built with OpenJPEG. If it can't, use the DTM hillshade as the basemap and note it. |

## Target file layout

```
hackathon/
  prep/            Python: read DTM, clip, slope, export
  web/             index.html, app.js, style.css, data/ (exported PNG + JSON)
  data/raw/        downloads (git-ignored)
  data-manifest.json
  method.md
  validation.md
  README.md
```

## Saturday, Nov 14

| Time | Task | Done when |
|---|---|---|
| 09:00 | `git init`, first commit, push to GitHub | Repo exists online |
| 09:15 | `prep/read_dtm.py`: parse label, load grid, apply no-data mask | Prints shape, min/max elevation |
| 10:00 | Pick a clip (~4 × 4 km on the delta front), compute slope (deg) | Slope stats look plausible |
| 10:45 | Export hillshade PNG, slope PNG, ortho PNG (clipped, same grid) | Images line up when overlaid |
| 11:30 | `web/` Leaflet page with layer toggles + legend | Map shows in browser |
| 12:30 | Lunch / buffer | |
| 13:00 | Draw routes A and B (GeoJSON in pixel coords) | Lines on map |
| 13:45 | `prep/score_routes.py`: sample every ~5 m, segment distance, slope, coverage, TDI | `routes.json` written |
| 14:45 | Comparison panel (length, max/mean slope, % > 15°, coverage, TDI) | Panel shows real numbers |
| 15:45 | Segment inspector (click segment → values) + elevation profile | Click works |
| 17:00 | Data & Method panel + Limitations panel | Reachable in 1 click |
| 18:00 | Deploy to GitHub Pages; show teammates (**80% checkpoint**) | Live link works |

**Fallback if behind at 15:00:** freeze to map + 2 routes + comparison + limitations.

## Sunday, Nov 15

| Time | Task |
|---|---|
| 09:00 | Weight slider (distance vs slope), re-scores live |
| 10:00 | Validation: flat-grid and known-plane tests, cross-check vs DTM values → `validation.md` |
| 11:00 | `data-manifest.json`, `method.md`, README with reproduction steps |
| 12:00 | Usability check with a non-builder (3 tasks from brief §9.4) |
| 13:00 | Design polish, mobile check |
| 15:00 | **Feature freeze** |
| 15:00 | Record 90-s demo video (backup), screenshots |
| 17:00 | Project page text: problem, user, data, method, limitations, AI-use disclosure |
| 19:00 | Submit on official platform; confirm it shows **submitted**, not saved |
| 20:00 | Rehearse pitch |

## Roles (team of 2)

- **Person 1 (data + logic):** prep scripts, scoring, validation, manifest.
- **Person 2 (map + story):** Leaflet UI, panels, design, pitch, video, submission.

## Tonight checklist

- [ ] Both teammates registered on the Abu Dhabi local event page, in one team
- [ ] GitHub account ready (repo is created at 09:00, not before)
- [ ] Read the official challenge text on spaceappschallenge.org
- [ ] Under-18: parent/guardian form sorted
- [ ] Laptop charger, extension cable
