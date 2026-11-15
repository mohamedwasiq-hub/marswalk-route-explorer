# MarsWalk guide

What every part of the app does, then a 10-minute tutorial.

- [What MarsWalk is](#what-marswalk-is)
- [Start the app](#start-the-app)
- [Screen layout](#screen-layout)
- [Features](#features)
- [Tutorial](#tutorial)
- [Words used in the app](#words-used-in-the-app)
- [What the app cannot do](#what-the-app-cannot-do)
- [Troubleshooting](#troubleshooting)

## What MarsWalk is

MarsWalk answers one question: **if an astronaut has to walk from one point to another on Mars, which path is easier, and why?**

It uses a real NASA elevation model of a 4.6 × 4.0 km area in Jezero Crater. It compares routes on steepness and distance, and it shows the numbers behind every result.

It is a research and education prototype. It does not certify any route as safe.

## Start the app

Run this inside the `web` folder:

```bash
python -m http.server 8765
```

Then open http://localhost:8765 in a browser. The app loads about 10 MB of terrain data, then shows the map.

It works without internet. The only thing that needs a connection is extra sharpness when you zoom in on the Whole Mars view.

## Screen layout

| Area | Where | What it holds |
|---|---|---|
| Top bar | Top | App name, the **Study site / Whole Mars** switch, and the **Guide**, **Data & method** and **Limitations** buttons |
| Map | Left | The terrain, routes, markers and map controls |
| Analysis sheet | Right (below the map on a phone) | Six numbered sections: Compare routes, Draw your own route, Priorities, Elevation profile, Segment inspector, Route briefing |

## Features

### 1. Study site map

The main map shows the Jezero delta front.

- **Pan and zoom:** drag to move; scroll, pinch or use **+ / −** to zoom.
- **Start and destination:** the white dot is the start on the crater floor. The yellow dot is the destination on top of the delta. They are 2.26 km apart in a straight line.
- **Scale bar:** bottom right, updates as you zoom.
- **Cursor readout:** bottom right. Move the mouse over the map to see latitude, longitude, elevation and slope at that point.

### 2. Layers panel

Top left of the map. Click **Layers** to show or hide it.

| Control | What it does |
|---|---|
| HiRISE image | Black-and-white orbital photo of the ground |
| Hillshade | Terrain drawn as if lit from the north-west, which makes shapes easy to read |
| Elevation | Height as colour, from dark teal (low) to orange (high) |
| Terrain slope | Colour overlay for steepness. Flat ground stays clear |
| Opacity | How strongly the slope overlay shows |
| Route A / B / C | Show or hide each route line |
| Science stops | Show or hide the diamond markers |

### 3. Legend

Bottom left of the map. It explains the slope colours and markers, and adds an elevation scale when the Elevation base map is on.

| Slope colour | Meaning |
|---|---|
| Clear | 0–5° |
| Pale yellow | 5–10° |
| Orange | 10–15° |
| Red | 15–20° |
| Dark red | 20–25° |
| Purple | Over 25° |

### 4. The routes

| Route | Colour | How it was made |
|---|---|---|
| **A, Direct** | Blue | A straight line from start to destination |
| **B, Terrain-aware** | Green | A computer search for gentle ground. It blocks slopes over 25° and penalises steep cells |
| **C, Yours** | Pink | A route you draw (see feature 6) |

### 5. Compare routes (section 01)

A table with one column per route and one row per measurement.

| Row | Meaning |
|---|---|
| **TDI** (big number) | Terrain Difficulty Index, 0–100. Lower is easier. The lowest gets a "lowest" tag |
| Length | Walking distance |
| Extra vs direct | How much longer than the straight line |
| Total climb | Sum of all uphill sections |
| Steepest point | Highest slope the route touches |
| Average slope | Mean slope along the route |
| Over 15° slope | Share of the route on steep ground |
| Data coverage | Share of the route that has terrain data |

- A green dot marks the best value in each row.
- Click a column header to select that route. The profile, inspector and briefing switch to it.

### 6. Draw your own route (section 02)

1. Press **Draw a route**. The cursor becomes a crosshair.
2. Click the map to add waypoints. The path starts at the start point automatically.
3. Press **Undo** to remove the last waypoint, or **Cancel** (or the Esc key) to stop.
4. Press **Finish**. The route is joined to the destination and scored.

Your route appears as **Route C** in the table, on the map and in the profile. It is scored with the same data and method as A and B. Use **Redraw my route** to try again, or **Delete my route** to remove it.

### 7. Priorities (section 03)

Three sliders set what matters when the TDI is calculated.

| Slider | Raises the cost of |
|---|---|
| Gentle terrain | Steep ground |
| Shorter distance | Extra walking distance |
| Data coverage | Stretches with no terrain data |

The TDI updates as you drag. The measurements in the table do not change, only the score. **Reset** restores the defaults (60 / 30 / 10).

### 8. Elevation profile (section 04)

A side view of the selected route: distance along the bottom, height up the side.

- The line colour shows slope, using the same colours as the map.
- Tabs **A / B / C** switch routes. All routes share the same axes, so shapes are comparable.
- **Hover** to read distance, elevation and slope. A dot shows the same point on the map.
- **Click** to open that stretch in the segment inspector.

### 9. Segment inspector (section 05)

Each route is split into 60 m segments.

- Click a route line on the map, or click the profile, to select a segment. It lights up white on the map.
- The inspector shows its position, elevation change, steepest point, average slope, data coverage and data source.
- One sentence explains why the segment helps or hurts the route's score.
- Below it, the **three hardest segments** of the selected route are listed. Click one to fly the map there.

### 10. Route briefing (section 06)

A plain-language summary of the selected route: distance, climb, steepest point, number of steep segments and data coverage. It ends with which route scores lowest under your current priorities.

- **Download JSON:** all routes with their measurements, segments and coordinates (metres and latitude/longitude).
- **Download CSV:** one row per segment, for a spreadsheet.

### 11. Science stops

Diamond markers on the map. Click one to see:

- what it is, and what kind of evidence it rests on;
- the closest each route passes;
- a link to the source.

| Stop | Source |
|---|---|
| Belva crater | IAU / USGS Gazetteer of Planetary Nomenclature |
| Delta front scarp | Our slope data, with NASA context on the delta |

### 12. Whole Mars view

Press **Whole Mars** in the top bar. The map switches to the entire planet.

- **Base map:** NASA/USGS Viking colour mosaic. A copy is bundled, so it works offline. Online, sharper tiles load from NASA Mars Trek as you zoom.
- **Landmarks:** Olympus Mons, Valles Marineris, Elysium Mons, Gale, Isidis Planitia, Syrtis Major Planum and Hellas Planitia. Click a dot for its size, position and IAU source link.
- **Jezero:** the orange ring marks the study site. A dashed circle shows the crater rim, drawn from its IAU diameter.
- **Fly to Jezero:** zooms from the planet into the study site, where the site image and all routes appear in their true position.
- **Whole planet:** zooms back out.
- **Cursor readout:** latitude and longitude.

Press **Study site** to return to the analysis map. The right-hand sheet stays the same in both views.

Route scoring is not available on the planet view. It needs 1 m terrain data, which exists only for small mapped patches.

### 13. Guide, Data & method, Limitations

Three buttons in the top bar. Each opens a panel. Close it with ×, the Esc key or a click outside.

| Button | Contents |
|---|---|
| Guide | A short tour for newcomers: elevation, slope, resolution, the routes and the score |
| Data & method | NASA products used, processing steps, the TDI formula, current values, the sensitivity table, validation checks, sources and how to reproduce |
| Limitations | What the app does not model and why its score is not a safety rating |

### 14. Built-in behaviour

- **Loading screen:** shown until the terrain is ready. If data can't load, it says so and tells you how to start the server.
- **Phone layout:** below 900 px wide, the sheet moves under the map and the map panels start collapsed.
- **Keyboard:** every control can be reached with Tab. A "Skip to route analysis" link appears on the first Tab press.
- **Reduced motion:** if your device asks for less animation, transitions are switched off.

## Tutorial

About 10 minutes. Each step says what to do and what you should see.

### Step 1: Get your bearings

1. Open the app. Wait for the map.
2. Press **Whole Mars**. Find the orange ring labelled "Jezero · study site".
3. Press **Fly to Jezero**. The view zooms in until you see the grey site image with coloured route lines.
4. Press **Study site**.

You should see the delta map with a blue and a green route.

### Step 2: Read the terrain

1. In **Layers**, switch the base map to **Hillshade**, then **Elevation**, then back to **HiRISE image**.
2. Move the mouse along the wide red and purple band.

The readout should show slopes above 20° on the band. That band is the delta front scarp, the cliff at the edge of the delta.

### Step 3: Compare the two routes

Look at the table in section 01.

- Route A is 2.26 km with a steepest point of 22.0°.
- Route B is 2.53 km with a steepest point of 14.1°.
- Route B has the lower TDI: 12.4 against 14.2.

Route B is longer but gentler, and with the default priorities that makes it the easier route.

### Step 4: Find out why

1. Click the **Route A** column header.
2. In section 05, click the first item in the hardest-segments list.

The map flies to the scarp. The inspector shows a segment with a steepest point near 22° and a sentence explaining that it includes ground steeper than 15°. This stretch is the main reason Route A scores worse.

### Step 5: Read the profile

1. Look at section 04 with Route A selected. Find the steep red rise near 0.6 km.
2. Click tab **B**. The climb is spread out and the line stays yellow and grey.
3. Hover along the profile and watch the dot move on the map.

### Step 6: Change the priorities

1. In section 03, drag **Gentle terrain** to 0 and **Shorter distance** to 100.
2. Look at the table.

Route A now has the lowest TDI. The measurements did not change, only what you value. Press **Reset**.

### Step 7: Draw your own route

1. Press **Draw a route**.
2. Click three or four points that go around the red band, heading for the destination.
3. Press **Finish**.

Route C appears in the table. Compare its TDI with Route B's. Try **Redraw my route** to improve it.

### Step 8: Visit a science stop

1. Click the diamond on the large crater in the west.
2. Read the popup, then open the source link.

It is Belva crater, named by the IAU. The popup shows how close each route comes to it.

### Step 9: Check the evidence

1. Press **Data & method**. Find the TDI formula and the table "Does Route B depend on our settings?".
2. Press **Limitations**. Find one thing the app does not model.

### Step 10: Take the results with you

1. Select the route you prefer.
2. Read section 06.
3. Press **Download CSV** and open the file in a spreadsheet.

## Words used in the app

| Word | Meaning |
|---|---|
| Elevation | Height in metres above the Mars 2000 reference surface. Mars has no sea level. Values here are negative because the area lies below that surface |
| Slope | Steepness of the ground in degrees. 0° is flat |
| DTM | Digital Terrain Model: a grid of elevation values |
| HiRISE | The high-resolution camera on NASA's Mars Reconnaissance Orbiter |
| Orthoimage | A photo corrected so it lines up with the map grid |
| Hillshade | A shaded picture of the terrain made from the elevation data |
| Segment | A 60 m stretch of a route |
| TDI | Terrain Difficulty Index: a 0–100 score from slope, extra distance and data gaps. Lower is easier |
| Data coverage | The share of a route that has valid terrain data |
| Scarp | A steep slope or cliff |

## What the app cannot do

- It scores terrain only. It does not model rocks under 3 m, loose sand, dust, radiation, temperature, lighting, communications or suit limits.
- It works for one 4.6 × 4.0 km area. The Whole Mars view has no route scoring.
- The start and destination are fixed.
- The 15° and 25° thresholds are illustrative choices, not NASA standards.
- The elevation data comes from images taken in 2007.
- Nothing has been checked against a real walk on Mars.

## Troubleshooting

| Problem | Fix |
|---|---|
| "MarsWalk couldn't load its terrain data" | Start the server from the `web` folder (see [Start the app](#start-the-app)). Opening `index.html` by double-click does not work |
| The Whole Mars view looks blurry when zoomed in | You are offline, so only the bundled image is available. Connect to the internet for sharper tiles |
| Clicking the map does nothing while drawing | Click inside the image area. Points outside the study site are ignored |
| A route line won't select | Zoom in and click directly on the line, or use the column header in section 01 |
