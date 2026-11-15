# Sol by Sol: plan and design

**Challenge:** NASA Space Apps 2026, *Build a Junior Astronaut Mission Trainer*
**Team:** Red Route Lab
**Audience:** kids aged 7 to 12, plus parents and classrooms

## Design read

This is an educational browser game for kids aged 7 to 12. It is playful but honest, built as a bold, block-based mission console over real NASA photography. It uses vanilla HTML, CSS and JS, so it runs with no build step and no account.

Dials: variance 5, motion 5, density 5.

The `ui-ux-pro-max` design system recommended **Vibrant and Block-based** with Baloo 2 type and an amber/blue palette. We keep Baloo 2 for headings and use Lexend for body text, because Lexend was designed for reading ease. We pull the colour towards Mars, with one action colour.

## The game in one line

Keep your 2-person Mars crew alive at Jezero Crater for 10 sols by sharing out each day's solar power. Every choice costs something.

## Core loop (one sol)

1. **Morning:** the solar panels report today's power, which depends on the sky (clear, hazy or dust storm). Mission Control on Earth sends a space-weather forecast. It arrives late, because light takes 3 to 22 minutes to get from Earth to Mars.
2. **Plan:** spend the power cells on:
   - **Make air**: 1 power gives +1 oxygen. It is based on NASA's MOXIE experiment.
   - **Grow food**: 1 power gives +1 food (greenhouse lights).
   - **Lab work**: 1 power gives +1 science (safe, indoors).
   - **Explore outside**: 2 power gives +3 science, but the crew gets an extra radiation dose.
   - **Storm shelter**: 2 power cuts a solar storm's dose. It also blocks exploring.
   - **Heaters**: 1 power every night is always taken (Mars nights average about -60 °C).
   - Any power left over charges the battery (it holds up to 6). Power beyond that is wasted.
3. **End sol:** the crew breathes 2 oxygen and eats 2 food. Radiation adds +1 (the normal Mars background). Then the day's event is revealed.
4. **Report:** what changed and why, plus a real fact with its NASA source.

## The three things kids juggle

These follow the challenge's advice to keep to two or three core resources:
- **Power**: the decision currency.
- **Life support**: oxygen and food, which are spent every sol.
- **Radiation**: the safety cost of exploring and of skipping the shelter.

Science is the *reward*, not a survival need.

## Win, lose and replay

- **Lose:** oxygen or food reaches 0, or the radiation dose reaches the limit (the flight surgeon sends the crew home).
- **Win:** the crew is still safe at the end of sol 10.
- **Stars:** 1 for surviving, +1 for reaching the science goal, +1 for keeping the dose low.
- **Replay:** every mission draws a new weather and storm schedule. Forecasts are sometimes wrong (90% right for Cadet, 70% for Commander). There are two difficulty levels.

No choice is free:
- An explore drive earns science but adds a radiation dose.
- The shelter keeps the crew safe but costs power and science.
- Saving power for the battery means less air or food today.

## Real NASA data (curated, not live, and shown in the game with sources)

| What | Value used | Source |
|---|---|---|
| Normal surface radiation | about 0.64 mSv per sol = **1 dose point** | Curiosity RAD, Hassler et al., *Science* 2014; NASA PIA17601 |
| Solar storm at Mars | 20 May 2024: biggest radiation surge since Curiosity landed in 2012 | NASA PIA26302 |
| Oxygen from Mars air | MOXIE: 122 g in total, best 12 g per hour | NASA PIA26041 |
| Dust storms cut solar power | 2018 global dust storm ended Opportunity | NASA Opportunity mission page |
| Wind and dust devils clean panels | gave Spirit and Opportunity power boosts | NASA MER mission pages |
| Sunlight on Mars | less than half of Earth's | NASA Mars facts |
| Light delay Earth to Mars | about 3 to 22 minutes one way | distance divided by the speed of light |
| Length of a sol | 24 h 39 min 35 s | NASA Mars facts |
| Night cold | average about -60 °C | NASA Mars facts |

The game scales the numbers down so that 10 sols are playable. The **Science notes** panel says this openly.

## Visual system

- **Theme:** light by default, with a full dark mode through `prefers-color-scheme`. One theme for the whole page.
- **Colour tokens:**
  - Mars dawn background, white cards, cool ink.
  - One action colour: **Mars orange** `#C2410C`, with white text at 5.2:1 contrast.
  - Data colours, each always shown with an icon and a number, never colour alone: oxygen blue, food green, battery amber, radiation magenta, science teal.
- **Shape:** cards 18 px, chips 12 px, buttons pill. No exceptions.
- **Type:** Baloo 2 (600/700) for headings and numbers, Lexend (400/500) for body text, 16 px minimum.
- **Icons:** Phosphor (bold), one family only.
- **Images:** real Perseverance and Curiosity photos, credited under each one.
- **Motion:**
  - meter bars glide (300 ms);
  - the sky tint changes with the weather;
  - the report card rises in.
  - Everything is static under `prefers-reduced-motion`.
- **Touch:** every control is at least 44 px, works with the keyboard, has a visible focus ring, and uses `aria-live` for reports.

## Layout

- **Desktop (≥ 1024 px):**
  - top bar with the logo, a sol tracker, and How to play / Science notes;
  - left column: the outpost photo with a weather tint, then the Mission Control message;
  - right column: Supplies meters, then Today's power with steppers, then the **End sol** button with a live "tonight" preview.
- **Phone:** one column, with the End sol button sticky at the bottom.
