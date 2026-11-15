# Sol by Sol: Mars Outpost Trainer

**NASA Space Apps Challenge 2026 · Build a Junior Astronaut Mission Trainer · Team Red Route Lab**

A browser game for kids aged 7 to 12. You run a two-person outpost at Jezero Crater on Mars for 10 sols (Mars days). Each sol you share out the solar power between making air, growing food, doing science and turning on a storm shelter. Every choice costs something, and every report explains what happened, with a real NASA fact and its source.

No download, no account, no build step. Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8770
```

## What players learn

- **Power budgets:** Mars gets less than half of Earth's sunlight, dust storms cut solar power, and heaters need power every night.
- **Life support:** the crew needs air and food every sol. Making oxygen from Mars air works like NASA's MOXIE.
- **Radiation trade-offs:** exploring earns science but adds dose. A storm shelter costs power but blocks most of a solar storm.
- **Decisions under uncertainty:** space-weather forecasts arrive minutes late (light-speed delay) and are sometimes wrong.

## Real NASA data used

These are curated, archived facts built into the game, not a live feed. Sources are linked inside the game, under Science notes.

- Curiosity RAD: about 0.64 mSv per sol of surface radiation (1 dose point in the game). NASA PIA17601; Hassler et al., *Science* 2014.
- 20 May 2024 solar storm: the biggest radiation surge Curiosity had measured since it landed in 2012. NASA PIA26302.
- MOXIE: 122 g of oxygen made from Mars air, up to 12 g an hour. NASA PIA26041.
- The 2018 global dust storm and Opportunity, and dust devils cleaning rover panels. NASA mission pages.
- Mars sunlight, temperature and sol length. NASA Mars facts.
- Space-weather events of the kind logged in NASA's DONKI database.
- Photos: Perseverance Jezero delta panorama (PIA24921), MOXIE (PIA26041), Curiosity storm specks (PIA26302).

## How it works

- `js/game.js`: the rules, with no DOM. It uses a seeded random schedule (sky, solar storms, forecasts, light delay).
- `js/data.js`: all the words, the facts and their sources.
- `js/ui.js`: the interface (meters, steppers, live preview, reports, end screen).
- `tools/simulate.js`: plays 2,000 missions per strategy to check the balance (`node tools/simulate.js`).

Latest balance run: on Cadet, careful play wins about 87% of missions, random play about 24%, and reckless play never. On Commander, careful play wins about 32%.

## Accessibility

- Keyboard playable, with visible focus rings and touch targets of at least 44 px.
- Screen-reader announcements for every change.
- Colour is never used alone (each meter has an icon, a number and a label).
- Light and dark mode, and reduced motion.

## AI use

The code and text were written with an AI coding assistant (Claude), directed and reviewed by the team. There are no AI-generated images, video or audio. The AI use is also noted in the page's metadata, in the Science notes panel, and at the top of every code file.

NASA images are used under NASA's media guidelines. This game is not made or endorsed by NASA.
