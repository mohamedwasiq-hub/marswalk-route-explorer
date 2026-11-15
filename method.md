# MarsWalk method

## Question

Between a start point on the Jezero crater floor and a destination on top of the delta, how do two candidate walking routes compare on **terrain**, and which parts of each route drive the difference?

## Pipeline

1. **Read the DTM.** `prep/dtm.py` parses the PDS3 label and reads the 32-bit float grid with numpy. Values ≤ −1e30 (the `MISSING_CONSTANT`) become NaN.
2. **Clip.** Rows 4600–8600, columns 1300–5900 of the DTM: 4.56 × 4.04 km across the delta front, 100% valid data. The west edge was set to include Belva crater.
3. **Analysis grid.** 3 × 3 block mean → cells of 2.974 m (east–west) × 3.029 m (north–south). Any block containing a missing post stays missing. We never fill gaps.
4. **Latitude correction.** The equirectangular map scale (1.0096 m/px) is true at 15°. At the site (18.49°N) one east–west post is 1.0096 × cos 18.49° / cos 15° = 0.9913 m. Ignoring this would understate east–west gradients by ~1.8% (validation check 4 shows a 26.57° test plane reading 26.30° without the correction).
5. **Slope.** `arctan(√(∂z/∂x)² + (∂z/∂y)²)` using `numpy.gradient` (central differences), in degrees.
6. **Routes.**
   - **A, Direct:** a straight line from start to destination.
   - **B, Terrain-aware:** A* search on a 6 m grid. Step cost = ground distance × (1 + (slope / 10°)²), averaged over the two cells. Cells over 25° are blocked. The grid path is simplified (RDP, 4 m tolerance) and then re-scored on the 3 m grid like Route A, so the router can't grade its own homework.
7. **Sampling.** Every 6 m along each route, bilinear interpolation of elevation and slope. Samples are grouped into 60 m segments for the inspector.
8. **User-drawn routes (Route C).** The browser holds the same 3 m elevation and slope grids (`elev3.bin`, `slope3.bin`) and a JavaScript port of the scoring code. A route drawn in the app is scored with the same method as A and B. Re-scoring A and B in the browser reproduces the Python results (TDI 14.2 and 12.4; lengths within 0.1 m).

## Science stops

Each stop carries its source. Nothing is inferred from image brightness or texture.

- **Belva crater:** IAU-named, 0.90 km across, centre 18.48°N 77.38°E ([Gazetteer feature 15872](https://planetarynames.wr.usgs.gov/Feature/15872)). The catalogue gives the centre to 0.01° (~600 m), so the marker is approximate; it does fall on the crater in our DTM.
- **Delta front scarp:** the steepest point the direct route crosses, from our slope grid. Context from NASA: the landform is an ancient river delta ([Mars 2020 landing press kit](https://www.jpl.nasa.gov/news/press_kits/mars_2020/landing/mission/landing_site/)).
- Not marked: the Perseverance landing site. NASA's pages we checked give it only to the nearest degree, so we don't plot it.

## Terrain Difficulty Index (TDI)

```
TDI = 100 × (w_s·S + w_l·L + w_c·C) / (w_s + w_l + w_c)

S = mean over samples of min(slope / 25°, 1)        slope burden
L = min((length − direct length) / direct length, 1)  detour burden
C = share of samples without valid terrain data       data-gap burden
```

Default weights: w_s = 0.6, w_l = 0.3, w_c = 0.1. Users can change them in the app; the raw measurements never change.

**What the TDI is not:** a probability of injury, a safety rating, or a calibrated mission-risk value. It is a transparent, relative comparison inside this study area. The 15° "steep" flag and the 25° saturation and no-go values are illustrative prototype choices, not NASA EVA standards.

## Current results (default weights)

| | Route A: Direct | Route B: Terrain-aware |
|---|---|---|
| Length | 2.26 km | 2.53 km (+12%) |
| Total climb | 134 m | 117 m |
| Steepest sampled slope | 22.0° | 14.1° |
| Mean slope | 5.9° | 3.7° |
| Share over 15° | 7.4% | 0.0% |
| Data coverage | 100% | 100% |
| S / L / C | 0.237 / 0.000 / 0.000 | 0.149 / 0.117 / 0.000 |
| **TDI** | **14.2** | **12.4** |

Route B trades 12% more distance for much gentler ground. If the user weights distance heavily (e.g. length 100, slope 0), Route A scores lower, so the result depends on priorities and the app makes that visible.

## Sensitivity

`prep/sensitivity.py` re-runs the router with a stricter and looser no-go limit (20°, 30°) and a stronger and weaker slope penalty, then scores each path with the fixed method (see `sensitivity-results.md`). The no-go limit doesn't change the path here. The penalty does: TDI ranges from 12.1 to 13.4. In all five cases the terrain-aware route scores below the direct route (14.2), so the ranking is stable while single values are approximate.

## Cross-check

Our slope (central differences) was compared with Horn's 3 × 3 method, which GDAL, QGIS and ArcGIS use, over 1 km² of the real DTM: mean 4.92° vs 4.83°, median absolute difference 0.21°. GDAL itself couldn't be run on the build machine, so Horn's formula is implemented directly in `prep/test_method.py`. A check in QGIS on another machine would be a fully independent confirmation.

## Known limitations

See the Limitations panel in the app. In short: terrain only, ~3 m slope baseline, 2007 data, no DTM error model, illustrative thresholds, no field validation.
