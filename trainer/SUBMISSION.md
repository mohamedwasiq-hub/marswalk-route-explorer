# Sol by Sol: submission pack

Each heading in section 1 is a field on your team's **Project** tab. Copy them in. Everything must be in English.

**Deadline:** click **Submit for Judging** before **Sunday 15 Nov, 11:59 PM** (your Local Event's time zone).

**Rules that affect you:**
- **Demo:** a video of 30 seconds or less, or a deck of 7 slides or fewer.
- **You're under 18:** no face, photo or voice. Use a screen recording with text captions.
- **Links:** they must be public, with no login.

---

## 1. Project page fields

### Project Name

Sol by Sol: Mars Outpost Trainer

### High-Level Project Summary

Sol by Sol is a browser game for kids aged 7 to 12. Players run a two-person outpost at Jezero Crater on Mars for 10 sols. Each sol they share out limited solar power between making air, growing food, doing science and turning on a storm shelter, so every choice has a real cost. Space-weather forecasts from Earth arrive minutes late and are sometimes wrong. After every sol, a report explains what happened and shares a real NASA fact with its source, such as the solar storm that hit Mars in May 2024 or MOXIE making oxygen from Mars air. The game turns the trade-offs mission planners face into something kids can feel and understand.

### Link to Project Demo

*(public YouTube or Google Drive link to your 30-second captioned video)*

### Link to Final Project

*(public link to the live game, from Netlify or GitHub Pages)*

### Detailed Project Description

**What it does**

Players manage three things:
- **power**: what every decision is spent on;
- **life support**: air and food, used up every sol;
- **radiation**: the safety cost of exploring and of skipping the shelter.

Each sol, the solar panels make power depending on the sky (clear, hazy or dust storm). Players spend it with + and − buttons:
- **Make air**: +2 oxygen.
- **Grow food**: +2 food.
- **Lab work**: +1 science.
- **Explore outside**: +3 science, but +1 radiation.
- **Storm shelter**: blocks most storm radiation, but no exploring.

Night heaters always take 1 power, and spare power charges a small battery. A live preview shows what tonight will look like before players commit. The crew must stay alive for 10 sols. Science and a low radiation dose earn extra stars.

**Why it teaches real trade-offs**
- **No choice is free.** Exploring earns science but adds dose. Sheltering keeps the crew safe but costs power and science. Saving power means less air or food today.
- **Uncertainty is part of the game.** Forecasts from Mission Control arrive 3 to 22 minutes late (light-speed delay) and are right 9 times in 10 on Cadet, or 3 times in 4 on Commander.
- **Failure teaches without punishing.** Each report explains why things changed. The end screen gives lessons built from the player's own choices, and every mission has new weather, so kids can try another strategy.
- **We kept it simple.** Following the challenge's advice, there are 3 core resources, not 6.

**Grounded in real NASA data** (curated and built in, not live; every fact is cited in the game):
- Curiosity RAD measured about 0.64 mSv a day of surface radiation. That is 1 dose point per sol in the game.
- On 20 May 2024, a solar storm gave Curiosity its biggest radiation surge since landing in 2012. This is the model for our solar storms, and the report shows Curiosity's real photo with particle specks.
- MOXIE on Perseverance made 122 g of oxygen from Mars air.
- The 2018 global dust storm ended Opportunity's mission. Dust devils cleaned Spirit's and Opportunity's panels.
- Mars sunlight, temperature and sol length come from NASA Mars facts.
- The outpost photo is NASA Perseverance's Jezero delta panorama.

**How we checked it**

We wrote a simulator that plays 2,000 missions per strategy:
- **Cadet:** careful play wins about 87% of missions, random play about 24%, and reckless play never.
- **Commander:** careful play wins about 32%.

So good decisions matter, and the safe choice is never free. We tested on desktop and phone, in light and dark mode.

**Accessibility**
- Plays in a browser with no download or account.
- Keyboard playable, with screen-reader announcements and touch targets of at least 44 px.
- Colour is never the only signal.
- Reduced motion is supported.

**Tools**

HTML, CSS and JavaScript, with no build step. Phosphor icons, and Baloo 2 and Lexend fonts. Node.js for the balance simulator.

**What's next**
- A Moon mode with 14-day lunar nights.
- A classroom mode where teams of four share the outpost.
- Live DONKI space-weather events.

### Use of Super Intelligence (SI)

*(Not shown to judges. Edit it so it is true for you.)*

Yes. The code and text were written with an AI coding assistant (Claude), directed and reviewed by me. I chose the challenge, the game idea and the rules, and checked the facts and the balance. There are no AI-generated images, video or audio: all photos are real NASA images. The AI use is marked in the page metadata, in the Science notes panel, at the top of every code file, and in the README.

### NASA Data

- Curiosity Radiation Assessment Detector (RAD) surface dose: NASA PIA17601; Hassler et al., *Science* 2014.
- 20 May 2024 solar storm at Mars, Curiosity RAD and navigation camera: NASA PIA26302.
- MOXIE oxygen production on Perseverance: NASA PIA26041.
- Perseverance Mastcam-Z panorama of the Jezero Crater delta: NASA PIA24921.
- Opportunity and Spirit mission records (dust storms, panel cleaning): NASA Science mission pages.
- NASA Mars facts (sunlight, temperature, sol length).
- NASA DONKI Space Weather Database (CCMC): the kind of solar events our storms model.

### Space Agency Partner Data and Other References

- Phosphor Icons (MIT licence).
- Baloo 2 and Lexend fonts (SIL Open Font License), via Google Fonts.
- No Space Agency Partner datasets were used in this version.

---

## 2. Demo: 30-second silent video with captions

Use no voice and no face. Record the screen (Windows: Win + Alt + R, or the Xbox Game Bar). Add captions in CapCut or Clipchamp, and export at 1920 × 1080.

| Time | On screen | Caption |
|---|---|---|
| 0:00–0:03 | Title screen | "Team Red Route Lab · Junior Astronaut Mission Trainer" |
| 0:03–0:07 | Click Cadet, then Start mission | "Sol by Sol: keep a Mars crew alive for 10 sols" |
| 0:07–0:12 | Press + on Make air and Grow food; the meters change | "Share out solar power. Every choice costs something." |
| 0:12–0:17 | High storm forecast; turn on Storm shelter | "Forecasts arrive minutes late, and can be wrong" |
| 0:17–0:22 | End sol; the report with Curiosity's storm photo | "Real NASA data: the May 2024 solar storm at Mars" |
| 0:22–0:27 | End screen with stars and "What you learned" | "Learn from every choice, then try a new strategy" |
| 0:27–0:30 | Title screen | "Built on NASA data, for kids aged 7 to 12" |

## 3. Judging criteria

| Criterion | Where Sol by Sol shows it |
|---|---|
| Impact | For ages 7 to 12 and classrooms; free, no install, phone friendly |
| Creativity | Light-delay forecasts that can be wrong; a live "tonight" preview; lessons built from the player's own choices |
| Validity | Real NASA records with sources in the game; a balance simulator; honest notes on how the values are scaled |
| Relevance | Exactly the challenge brief: run a Mars outpost, balancing life support, radiation shielding, power and food |
| Presentation | Real NASA photos, a clear mission-console design, dark mode, a 30-second captioned demo |
