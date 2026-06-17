# ◈ AETHER — A DeFi World You Travel Through

> _"Don't read the market. Travel it."_

AETHER is a landing-page experiment that reimagines decentralized finance as a **surreal, living world** you journey through — not a dashboard you scroll. Built on a massive interactive **WebGL / Three.js** environment, it carries you **from a moonlit midnight to a golden sunrise** as you scroll, mapping every DeFi concept to a place in a dreamlike landscape.

The result feels less like a crypto website and more like a fantasy world you can interact with.

![AETHER hero](docs/hero.png)
<!-- Drop a screenshot at docs/hero.png to populate this image -->

---

## ✨ What's inside

- **A day-cycle 3D world.** A custom sky shader with a real **moon that sets** and **sun that rises**; the whole scene's lighting, fog, exposure and palette shift **dark → light** as you travel.
- **Stylized low-poly mountains** generated with simplex noise, painterly height-based coloring, a carved valley, and parallax silhouette ranges for depth.
- **A glowing river of liquidity** with an animated flow shader threading the valley floor.
- **Living inhabitants** — bioluminescent pulsing jellyfish, a flapping flock of manta-creatures, spinning crystal "tokens", and floating low-poly islands.
- **Atmosphere** — fireflies, drifting stardust, soft cloud sprites, and exponential fog that all fade as dawn breaks.
- **Scroll-driven cinematic camera** on a smooth Catmull-Rom spline, eased for buttery motion, with mouse parallax.
- **Bloom post-processing** so the moon, sun, river and creatures genuinely radiate.
- **Oversized typography + environmental storytelling**, a vertical **DEPTH** gauge, and a **time-of-day HUD** that ticks from `23:48 Moonrise` to `06:05 Sunrise`.

### The journey (4 stations)

| Station | Time of day | Concept |
|---|---|---|
| **Midnight** | 🌙 Night | The origin — a moonlit overlook of the world |
| **Valley** | 🌙 Deep night | The Valley of Liquidity — a glowing river of pooled capital |
| **Ascent** | ✦ Pre-dawn | The Ascent of Yield — staking as a mountain you climb |
| **Daybreak** | ☀️ Sunrise | Above the clouds — governance & the new day breaking |

---

## 🚀 Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # production build → dist/
npm run preview  # preview the build
```

Requires Node 18+.

---

## 🛠 Tech stack

- **[Three.js](https://threejs.org/)** — WebGL scene, custom GLSL shaders, post-processing (UnrealBloomPass)
- **[GSAP](https://gsap.com/) + ScrollTrigger** — scroll-driven journey & panel reveals
- **[simplex-noise](https://github.com/jwagner/simplex-noise.js)** — procedural terrain
- **[Vite](https://vitejs.dev/)** — dev server & bundler

### Architecture

```
index.html              # overlay UI: typography, nav, HUD, scroll panels
src/
  main.js               # orchestrator: renderer, lights, day-cycle, scroll → camera
  journey.js            # camera spline + time-of-day curve per station
  style.css             # oversized type + cinematic overlay
  world/
    sky.js              # day-cycle sky shader (moon sets, sun rises, stars)
    terrain.js          # noise mountains + parallax silhouettes
    river.js            # flowing liquidity shader
    atmosphere.js       # fireflies, stardust, clouds
    creatures.js        # jellyfish, manta flock, crystals
    islands.js          # floating low-poly islands
```

---

## 🎬 Build-your-own: the template prompt

AETHER was generated from a single, structured prompt. You can reuse it to build an immersive, world-as-interface landing page for **any** domain. Copy it, fill the `{{placeholders}}`, delete what you don't need.

> **Create a {{product type, e.g. crypto/DeFi}} platform where users journey through a {{mood, e.g. surreal, dreamlike}} {{world type, e.g. digital landscape}} instead of {{the boring default, e.g. scrolling through dashboards}}. Make {{the domain}} feel immersive, cinematic and impossible to ignore.**
>
> Build a **landing page around a massive interactive 3D environment**.
>
> - Create stylized **{{environment, e.g. mountains and dreamlike landscapes}}** inspired by {{visual reference, e.g. digital matte paintings}}
> - Use **WebGL + Three.js** to turn the background into a living world
> - Design **scroll interactions that feel like traveling** through a {{ecosystem/world}}
> - Blend **oversized typography** with environmental storytelling
> - Add **floating elements and animated creatures** to make the world feel alive
> - Use **depth, motion and scale** to create a sense of exploration
> - **Replace traditional feature sections** with visual experiences
> - Use **smooth camera movements and transitions** to guide users through the journey
> - **Focus on emotion first, product second**
>
> **Mood arc:** the experience should travel from **{{start state, e.g. dark moonlit night}}** to **{{end state, e.g. bright sunrise}}** as the user scrolls — {{describe the transition, e.g. moon setting, sun rising, palette shifting darker→lighter}}.
>
> **Stations (one per scroll section):**
> 1. {{Station 1 — name + what the user sees + the product concept it represents}}
> 2. {{Station 2 — …}}
> 3. {{Station 3 — …}}
> 4. {{Finale — the call to action, dressed as the climax of the journey}}
>
> **Tech constraints:** {{e.g. Vite + Three.js + GSAP ScrollTrigger, post-processing bloom, no backend}}.
>
> **Then run it locally.**

### How to use it well

1. **Fill the four knobs that change everything:**

   | Knob | What it controls | AETHER's answer |
   |---|---|---|
   | **Domain + anti-pattern** | The hook ("instead of X") | DeFi · "instead of scrolling dashboards" |
   | **World + visual reference** | What the 3D scene looks like | Stylized mountains · digital paintings |
   | **Mood arc** | The emotional/color journey | Midnight night → sunrise |
   | **Stations → product mapping** | Turns features into places | Liquidity = glowing river, Yield = mountain ascent, Governance = daybreak above clouds |

2. **Map every product feature to a physical place or natural phenomenon.** Don't say "show TVL." Say _"liquidity is a glowing river that rises and falls with every swap."_ That reframing is what makes it cinematic instead of a dashboard.

3. **Specify the mood arc as a direction, not just colors.** "Darker → lighter, moon setting, sun rising" drives lighting, fog, exposure, sky and particles all at once — far more actionable than "use purple and orange."

4. **Always end with "then run it locally"** — it forces a working, verifiable result.

### Iteration prompts (the follow-ups that refined AETHER)

- **Fix the arc:** _"Rework the color scheme darker→lighter — the sun rises at the end of the scroll, the moon sets at the start. Make each section its own time-of-day world. More immersive."_
- **Push cinematic:** _"Add bloom post-processing so glows radiate. Add a time-of-day HUD that ticks from midnight to sunrise as I scroll."_
- **Polish bugs:** _"The hero text overflows and clips on wide screens — keep it oversized but contained."_
- **Go further:** _"Add god-ray light shafts from the rising sun, a reflective sea of clouds at the summit, and ambient audio that swells with the dawn."_

### A filled-in example (different domain)

> Create a **sustainable-investing** platform where users journey through a **living forest that grows around them** instead of **reading ESG spreadsheets**. Make green finance feel immersive, cinematic and impossible to ignore. Build a landing page around a massive interactive 3D forest in Three.js… The experience travels from **a bare winter dawn to a lush summer canopy** as you scroll. Stations: (1) _Seedling_ — your first deposit sprouts a sapling; (2) _Canopy_ — compounding returns grow the forest dense with light; (3) _Ecosystem_ — impact metrics appear as wildlife returning; (4) _Harvest_ — the call to invest. Vite + Three.js + GSAP. Then run it locally.

---

## 📄 License

MIT — do anything, just don't blame us if you get lost in the world.

🤖 Built with [Claude Code](https://claude.com/claude-code)
