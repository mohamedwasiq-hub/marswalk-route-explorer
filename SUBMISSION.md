# MarsWalk submission pack

Updated 15 Nov 2026 against the official **2026 Project Submission Guide**. Every heading in section 1 is a field on your team's **Project** tab. Copy each one in. All text must be in English.

**Deadline:** click **Submit for Judging** before **Sunday 15 Nov, 11:59 PM** (your Local Event's time zone). A saved draft does not count. After you submit, a banner and a confirmation message appear.

## Rules that affect you

- **Demo:** a video of **30 seconds or less**, OR a slide deck of **7 slides or fewer** (title and intro slides count). Going over means the project can't go to Global Judging.
- **You are under 18:** don't use your face, photo, **voice** or likeness in the demo or the project. Use on-screen text captions and screen recordings only. No avatar photo.
- **Links:** they must be public, with no login or permission request. Test each one in a private window.
- **AI ("Super Intelligence") use:** AI-written code and text must say so in descriptive text **and** metadata. Done: there's a footer note in the app, an `ai-assistance` meta tag, a comment at the top of every code file, and the README section. The rules also say AI should not be used *to come up with your idea*, so describe truthfully where the idea came from.
- **NASA data:** you need at least one NASA dataset to be eligible for Global Awards. Done (HiRISE).
- Tick **Terms and Conditions** and **Confirm All Work is Original**, then click **Submit for Judging**.

---

## 1. Project page fields

### Project Name

MarsWalk Route Explorer

### High-Level Project Summary

MarsWalk is an interactive map that helps plan an astronaut's walk across the Jezero Crater delta on Mars, where Perseverance is exploring. It uses NASA's 1-metre HiRISE elevation model to compare walking routes: a short direct line, and a terrain-aware path found by a search that avoids steep ground. Users can draw their own route and have it scored the same way. The map layers an orbital image, elevation, hillshade and slope, and shows why each route scores the way it does, down to every 60 m segment. That answers the challenge's request for a layered, hyperlocal map that a human explorer could use to plan a safe Marswalk. Before anyone steps onto ground nobody has walked on, the route trade-offs need to be visible, checkable and honest about their limits. MarsWalk does that for mission planners and for classrooms.

### Link to Project Demo

*(paste your public YouTube, Google Drive or Slides link: 30-second video or 7-slide deck)*

### Link to Final Project

*(paste the GitHub Pages link; also put the GitHub repository link in the description)*

### Detailed Project Description

**What it does**

MarsWalk is a web map of a 4.6 × 4.0 km area on the Jezero delta front. A planner, student or judge can:

- switch between a HiRISE image, hillshade, elevation and terrain slope;
- compare a direct route (A) with a terrain-aware route (B) from the crater floor to the delta top;
- draw their own route (C) and have it scored live;
- move "What matters most?" sliders (gentle terrain, short distance, data coverage) and watch the ranking change;
- click any 60 m segment to see its slope and climb, and why it scores the way it does;
- follow an elevation profile coloured by slope and linked to the map;
- read a plain-language route briefing for a crew member, and export JSON or CSV;
- zoom out to the whole planet, see Jezero among IAU-named landmarks, and fly back in;
- open the data, formula, validation and limitations in one click.

**What we found**

The direct route is 2.26 km but crosses ground up to 22.0°, with 7.4% of it over 15°. The terrain-aware route is 12% longer (2.53 km), but it never goes over 14.1° and climbs 17 m less. With the default weights it has the lower Terrain Difficulty Index (12.4 vs 14.2). If you care only about distance, the direct route wins, and the app says so openly.

**How it works**

We read the NASA PDS elevation file directly, average it to a 3 m grid, correct the east–west pixel spacing for latitude, and compute slope. Route B comes from an A* least-cost search that avoids slopes over 25°. Each route is sampled every 6 m. The Terrain Difficulty Index (TDI) combines slope, extra distance and data gaps, using weights the user controls. It is our own prototype formula, not a NASA standard.

**How we checked it**

14 automated checks pass:
- test surfaces with known slopes;
- route lengths;
- missing-data handling;
- values against the raw file;
- a hand calculation;
- a comparison with Horn's method, used by GIS tools (median difference 0.21°).

A sensitivity run shows the terrain-aware route beats the direct route under all five router settings we tried.

**Benefits and goals**

It makes route trade-offs visible and checkable instead of hiding them in one "best route" label. Planners can test assumptions, and students can learn how terrain shapes exploration. Next steps:
- add rock abundance, thermal inertia and radiation layers (for example, Emirates Mars Mission atmospheric data);
- model elevation uncertainty;
- add sunlight and line-of-sight to a base;
- test the scores against Perseverance's real drive paths.

**Limitations**

MarsWalk is a research and education prototype. It does not certify any route as safe. It looks at terrain only. It doesn't cover:
- rocks under 3 m;
- sand or dust;
- radiation, lighting or communications;
- spacesuit limits.

The slope thresholds are illustrative. The elevation model is from 2007 images, and nothing has been tested in the field.

**Tools and languages**

- Python 3 and NumPy (reads the data and runs the method), Pillow for images.
- JavaScript, HTML and CSS front end with Leaflet (bundled, so it works offline).
- Hosted on GitHub Pages.

**Code:** *(GitHub repository link)*

### Use of Super Intelligence (SI)

*(Not shown to judges. Edit it so it is true for you.)*

Yes. Most of the code and documentation was written with an AI coding assistant (Claude), directed and reviewed by me. I chose the challenge, the study site, the questions and the design, and I checked the results. The AI helped write the data processing, routing, tests and web interface. No AI-generated images, video or audio are used. Every terrain value comes from the NASA HiRISE data, and the 14 validation checks run against the real files. The AI use is marked in the app's footer, in an `ai-assistance` meta tag, at the top of every code file, and in the README.

### NASA Data

- **HiRISE Digital Terrain Model** `DTEEC_002387_1985_003798_1985_A01`: Mars Reconnaissance Orbiter, NASA/JPL/University of Arizona, from the Planetary Data System (PDS) via Mars Orbital Data Explorer. 1 m posts, elevation above the Mars 2000 areoid. Every terrain number in the app comes from this product.
- **HiRISE orthoimage** `PSP_002387_1985_RED_C_01_ORTHO`: on the same grid, used as the image layer.
- **Viking MDIM 2.1 colour mosaic**: NASA/USGS, via **NASA Mars Trek** (JPL). Used for the whole-Mars view.
- **NASA/JPL Mars 2020 (Perseverance)** mission pages: context for the Jezero site.

### Space Agency Partner Data and Other References

- IAU/USGS Gazetteer of Planetary Nomenclature: place names and landmark positions.
- Leaflet (BSD-2 licence): map library.
- Fira Sans and Fira Code fonts (SIL Open Font License).
- Horn (1981), "Hill shading and the reflectance map": slope comparison method.
- No Space Agency Partner datasets were used in this version. Planned: Emirates Mars Mission (MBRSC) atmospheric and dust data as a conditions layer.

---

## 2. Demo: 30-second silent video with captions

No voice and no face. Record the screen, then add text captions in any editor (CapCut, Clipchamp or the Windows Photos editor). Export 1920 × 1080, upload to YouTube as **Unlisted** or **Public**, and test the link in a private window. Check that it is **30 seconds or less**.

| Time | On screen | Caption |
|---|---|---|
| 0:00–0:03 | Full map | "Team MarsWalk · Interplanetary Survival Guide: Martian Map" |
| 0:03–0:06 | Same, slow zoom | "Before the first Marswalk, someone has to choose the route." |
| 0:06–0:10 | Switch image → slope | "MarsWalk: NASA's 1-metre HiRISE terrain of Jezero Crater" |
| 0:10–0:15 | Route cards, click the scarp on Route A | "Direct route: 22° slopes. Terrain-aware route: 12% longer, never over 14°." |
| 0:15–0:19 | Drag "Shorter distance" up, then Reset | "Change what matters, and watch the ranking change." |
| 0:19–0:23 | Draw a route with 3 waypoints, Finish | "Draw your own route and it's scored the same way." |
| 0:23–0:26 | Open Data & method | "14 checks against the raw NASA files. Limits one click away." |
| 0:26–0:30 | Full map | "Making Mars route trade-offs visible, for crews and classrooms." |

**Backup if you run out of time:** a 7-slide deck (title → problem → the app screenshot → what we found → how it works/NASA data → checks and limits → future). Make it in Google Slides, share it as "Anyone with the link can view", and paste the link.

## 3. Usability check (optional, 10 minutes)

Ask someone who hasn't seen the app, such as a parent. Don't help them. Write down where they hesitate.

| Task | Done without help? | Where they hesitated |
|---|---|---|
| 1. Which route has the lower terrain difficulty? | | |
| 2. Find the steepest part of Route A. Where does that number come from? | | |
| 3. Name one thing this tool does not tell you. | | |
| 4. Draw your own route. Did it beat Route B? | | |

If you mention it in the submission, call it a quick usability check, not user research.

## 4. Judging criteria map

The five criteria are Impact, Creativity, Validity, Relevance and Presentation.

| Criterion | Where MarsWalk shows it |
|---|---|
| Impact | Named users (traverse planner, crew, educator), route briefing, "How to read this" for classrooms |
| Creativity | Weight sliders that flip the ranking, draw-your-own-route, the "why" for each segment |
| Validity | Real elevation model read from the raw file, latitude correction, 14 checks, sensitivity table, honest name for the score |
| Relevance | A layered, integrated view of a Martian route for a human explorer, as the challenge asks |
| Presentation | 30-second captioned demo, works offline, phone layout, limitations one click away, sources linked |
