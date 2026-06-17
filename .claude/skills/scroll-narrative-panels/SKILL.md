---
name: scroll-narrative-panels
description: Layer flowing 100vh HTML panels over a fixed full-screen WebGL canvas, revealing each with GSAP ScrollTrigger (fade/blur/translate) and smooth-scroll nav to stations, for immersive WebGL/Three.js storytelling. Use when scroll should narrate a 3D journey with text.
---

# Scroll Narrative Panels

**Use when** you want a 3D world as the persistent backdrop and HTML "panels" of copy that flow over it as the user scrolls — a scrollytelling page where text and camera advance together.

## Technique

Pin the WebGL canvas with `position: fixed` behind a separate scroll container (`#scroll`) of stacked `100vh` `.panel` sections. The canvas never scrolls; only the HTML does, and the same scroll position also drives the camera journey, so reading and flying stay in sync. Give panels transparent or gradient backgrounds so the world shows through, and `pointer-events: none` on decorative wrappers so the canvas can still receive pointer/parallax events where panels don't need clicks.

Animate each panel's inner element in with GSAP `scrollTrigger`. Use `toggleActions: 'play reverse play reverse'` so it animates in on enter and *back out* on leave in both directions — essential for a journey you scroll up and down. Combine `y` translate, `opacity`, and a `filter: blur()` for a cinematic settle; `power3.out` lands softly.

For nav, map a station index to a scroll fraction and `window.scrollTo({ behavior: 'smooth' })`. Reusing the journey's `progressForStation(i)` keeps the link targets aligned with the actual camera path. Call `ScrollTrigger.refresh()` after the loader hides so triggers measure the final layout.

## Pattern

```css
#world  { position: fixed; inset: 0; z-index: 0; }      /* persistent WebGL backdrop */
#scroll { position: relative; z-index: 1; }
.panel  { min-height: 100vh; display: flex; align-items: center; }
```

```js
gsap.registerPlugin(ScrollTrigger)

// reveal each panel in, and back out on leave (both scroll directions)
gsap.utils.toArray('.panel').forEach((panel) => {
  gsap.from(panel.querySelector('.panel__inner'), {
    scrollTrigger: {
      trigger: panel,
      start: 'top 70%',
      end: 'bottom 30%',
      toggleActions: 'play reverse play reverse',
    },
    y: 60, opacity: 0, filter: 'blur(12px)',
    duration: 1.1, ease: 'power3.out',
  })
})

// smooth-scroll nav: jump to a station by its scroll fraction
function scrollToStation(index) {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight
  const p = journey.progressForStation(index)          // shared with the camera path
  window.scrollTo({ top: p * maxScroll, behavior: 'smooth' })
}
document.querySelectorAll('[data-go]').forEach((el) =>
  el.addEventListener('click', (e) => { e.preventDefault(); scrollToStation(parseInt(el.dataset.go, 10)) }))

// after the loader hides, re-measure triggers against final layout
loader.classList.add('is-done')
ScrollTrigger.refresh()
```

## Pitfalls

- Animating `filter: blur()` is GPU-heavy on big panels; keep blur radii modest and the element count low.
- `toggleActions: 'play none none none'` leaves panels stuck visible when scrolling back up — use a reverse action for journeys.
- Forgetting `ScrollTrigger.refresh()` after the loader/late layout shifts makes start/end offsets wrong and reveals mistime.
- A scrolling (not `fixed`) canvas will jitter or detach from the panels — pin it and scroll only the HTML.
- Panels that swallow pointer events break mouse parallax; set `pointer-events: none` on non-interactive wrappers.
- `gsap.from` plays toward the element's natural CSS, so leftover inline `opacity`/`transform` can fight it — let GSAP own those props.
