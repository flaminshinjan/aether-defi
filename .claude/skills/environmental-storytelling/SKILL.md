---
name: environmental-storytelling
description: Map product features to places and natural phenomena instead of feature cards, and write station copy that narrates a journey. Use when designing immersive/cinematic web experiences that should feel like a world, not a brochure.
---

# Environmental Storytelling

**Use when** you want a product page to read as a place you travel through — each capability embodied as terrain, weather, or light rather than listed in a grid of cards.

## Technique
Pick one continuous metaphor for the whole journey and commit. In AETHER the spine is a single night-to-sunrise arc: the user scrolls from midnight toward first light, and the protocol's features are the landmarks they pass. The arc gives every section a shared direction and an emotional gradient (cold/uncertain → warm/arrived).

Map each feature to a phenomenon that *behaves* like the feature. Liquidity becomes a glowing river that rises and falls with swaps. Yield becomes a mountain ascent where altitude is reward. Governance becomes the moment you break the cloud line and the horizon ignites. The visual literally does what the feature does, so the metaphor teaches instead of decorating.

Write station copy in second person, present tense, sensory first. Lead with the world ("liquidity is a glowing river threading the valley floor"), then let the number land as proof inside the scene. Keep the eyebrow as a coordinate — phase + place — so the reader always knows where on the arc they are.

## Pattern
```html
<!-- Station = feature embodied as place. Eyebrow gives phase + location. -->
<section class="panel" data-panel="1">
  <div class="panel__inner panel__left">
    <p class="eyebrow">01 — Midnight · The Valley of Liquidity</p>
    <h2 class="headline">Pools that<br />breathe.</h2>
    <p class="body">
      By moonlight, liquidity is a glowing river threading the valley
      floor — rising and falling with every swap.
    </p>
    <ul class="stats">
      <li><b>$4.2B</b><span>Total value locked</span></li>
      <li><b>0.04%</b><span>Avg. slippage</span></li>
    </ul>
  </div>
</section>
```

Copy formula per station: `phenomenon that mirrors the mechanic` → `what the user does` → `the proof number`. e.g. yield: "staking becomes a mountain you ascend… the higher you go, the brighter the reward — 18.6% base APY."

## Pitfalls
- Mixing metaphors (a river AND a city AND a galaxy) breaks immersion — one world, one arc.
- Picking a phenomenon that doesn't behave like the feature turns the metaphor into mere set-dressing; the visual should mimic the mechanic.
- Leading with the stat instead of the scene reverts you to a dashboard — number comes after the image.
- Dropping the place/phase eyebrow leaves users lost on a long scroll with no chrome; it's your only "you are here."
- Over-writing each panel; two or three sentences max — the 3D world is carrying most of the narrative.
- A metaphor with no resolution feels aimless — give the arc an ending (the sunrise, the summit) that pays off the opening tension.
