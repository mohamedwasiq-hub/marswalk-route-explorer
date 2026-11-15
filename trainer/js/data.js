/* AI-assisted: written with an AI coding assistant (Claude), directed and reviewed by the team. NASA Space Apps 2026 SI disclosure. */
/* Sol by Sol: words, real facts and their sources. Curated from NASA records; nothing here is live data. */
(function (root) {
  "use strict";

  var SOURCES = {
    rad2014: {
      label: "Curiosity RAD surface radiation (NASA PIA17601; Hassler et al., Science, 2014)",
      url: "https://images.nasa.gov/details/PIA17601"
    },
    storm2024: {
      label: "Solar storm reaches Mars, 20 May 2024 (NASA PIA26302)",
      url: "https://images.nasa.gov/details/PIA26302"
    },
    moxie: {
      label: "MOXIE makes oxygen on Mars (NASA PIA26041)",
      url: "https://images.nasa.gov/details/PIA26041"
    },
    opportunity: {
      label: "Opportunity rover mission (NASA)",
      url: "https://science.nasa.gov/mission/mer-opportunity/"
    },
    spirit: {
      label: "Spirit rover mission (NASA)",
      url: "https://science.nasa.gov/mission/mer-spirit/"
    },
    marsFacts: {
      label: "Mars facts (NASA Science)",
      url: "https://science.nasa.gov/mars/facts/"
    },
    veggie: {
      label: "Veggie plant experiment on the Space Station (NASA)",
      url: "https://images.nasa.gov/details/KSC-20171017-PH_ISS01_0001"
    },
    donki: {
      label: "Space Weather Database (DONKI), NASA CCMC",
      url: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/"
    },
    delta: {
      label: "Detailed Panorama of Jezero Crater Delta (NASA PIA24921)",
      url: "https://images.nasa.gov/details/PIA24921"
    }
  };

  /* Facts shown in the sol report. Each one is short, true, and has a source. */
  var FACTS = {
    sunlight: {
      title: "Mars gets less sunlight",
      text: "Mars is farther from the Sun than Earth, so it gets less than half as much sunlight. Solar panels there make less power.",
      source: "marsFacts"
    },
    dust: {
      title: "Dust storms block the Sun",
      text: "In 2018 a dust storm covered the whole planet. So little sunlight got through that the Opportunity rover could not charge, and its mission ended.",
      source: "opportunity"
    },
    devil: {
      title: "Wind can clean solar panels",
      text: "Gusts of wind and dust devils blew dust off the Spirit and Opportunity rovers' solar panels, giving them a power boost.",
      source: "spirit"
    },
    moxie: {
      title: "Making air from Mars air",
      text: "NASA's MOXIE machine on the Perseverance rover made oxygen from the carbon dioxide in Mars's air: 122 grams in total, about what a small dog breathes in 10 hours.",
      source: "moxie",
      image: "assets/moxie.jpg",
      imageAlt: "Engineers in clean-room suits lower the gold MOXIE box into the Perseverance rover.",
      credit: "NASA/JPL-Caltech"
    },
    storm: {
      title: "A real solar storm hit Mars",
      text: "On 20 May 2024, particles from a solar storm reached Mars. Curiosity measured the biggest jump in radiation since it landed in 2012. The white specks in its camera picture are particles hitting the camera.",
      source: "storm2024",
      image: "assets/storm-specks.jpg",
      imageAlt: "Grainy black and white Curiosity navigation camera image of Martian hills, covered in white specks from solar particles.",
      credit: "NASA/JPL-Caltech"
    },
    background: {
      title: "Radiation every day",
      text: "Mars has no global magnetic field and thin air, so radiation reaches the ground. Curiosity measured about 0.64 millisieverts a day. In this game, that is 1 dose point per sol.",
      source: "rad2014"
    },
    shelter: {
      title: "Why shelters work",
      text: "Thick walls, water and soil soak up some of the radiation. Hiding in the most shielded room during a solar storm keeps the dose much lower.",
      source: "rad2014"
    },
    delay: {
      title: "Messages take minutes",
      text: "Radio travels at the speed of light, but Mars is so far away that a message takes about 3 to 22 minutes to arrive, depending on where the planets are.",
      source: "marsFacts"
    },
    cold: {
      title: "Mars nights are freezing",
      text: "The average temperature on Mars is about -60 °C. Heaters must run every night, so a base always needs some power saved.",
      source: "marsFacts"
    },
    veggie: {
      title: "Growing food in space",
      text: "Astronauts on the International Space Station grow lettuce and other plants under LED lights in a garden called Veggie.",
      source: "veggie"
    },
    sol: {
      title: "A sol is a Mars day",
      text: "One day on Mars, called a sol, lasts 24 hours, 39 minutes and 35 seconds. That is just a little longer than a day on Earth.",
      source: "marsFacts"
    },
    wasted: {
      title: "Batteries fill up",
      text: "A battery can only hold so much. Power you cannot store or use is lost, which is why planners match jobs to the sunshine.",
      source: "marsFacts"
    }
  };

  var SKY = {
    clear: { name: "Clear sky", icon: "ph-sun", line: "Bright sunshine on the panels." },
    hazy:  { name: "Hazy sky",  icon: "ph-cloud-sun", line: "Thin dust in the air dims the Sun." },
    dust:  { name: "Dust storm", icon: "ph-wind", line: "A dust storm is blocking most of the sunlight." }
  };

  var JOB_TEXT = {
    oxygen:  { name: "Make air",       icon: "ph-wind",       gives: "+2 oxygen",               hint: "Splits carbon dioxide from Mars air, like NASA's MOXIE." },
    food:    { name: "Grow food",      icon: "ph-plant",      gives: "+2 food",                 hint: "Grow lights for the greenhouse." },
    lab:     { name: "Lab work",       icon: "ph-flask",      gives: "+1 science",              hint: "Study rock samples safely indoors." },
    explore: { name: "Explore outside",icon: "ph-person-simple-hike", gives: "+3 science, +1 radiation", hint: "Drive the rover to new rocks. Outside, the crew gets more radiation." },
    shelter: { name: "Storm shelter",  icon: "ph-shield-check", gives: "Blocks most storm radiation", hint: "Crew stays in the shielded room. No exploring today." }
  };

  var ENDINGS = {
    win:    { title: "Mission complete!", line: "Your crew made it through 10 sols on Mars." },
    oxygen: { title: "Out of air", line: "The oxygen ran out, so the crew had to leave. Next time, make air before it gets low." },
    food:   { title: "Out of food", line: "The food ran out, so the crew had to leave. Next time, keep the greenhouse lights on." },
    dose:   { title: "Too much radiation", line: "The flight surgeon sent the crew home to keep them healthy. Next time, use the shelter when a storm is likely." }
  };

  var api = { SOURCES: SOURCES, FACTS: FACTS, SKY: SKY, JOB_TEXT: JOB_TEXT, ENDINGS: ENDINGS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SolData = api;
})(this);
