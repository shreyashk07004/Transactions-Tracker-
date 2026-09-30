# SpendLedger — Design System

## 1. Design concept — "Warm Ledger"

The app should feel like a well-made paper ledger lit by a soft screen,
not like a generic admin dashboard. Three ideas carry that:

- **Warm neutrals, cool accent.** Backgrounds are warm off-white paper in
  light mode and near-black ink in dark mode. The single accent is a cool
  indigo-violet. The contrast between warm ground and cool ink is what
  makes the app look deliberate rather than templated.
- **Texture.** A barely-visible grain sits over the whole app. It is the
  signature detail and costs nothing at runtime.
- **Motion with intent.** Nothing moves for decoration. Things move to
  show change: a figure counting to its new value, a meter filling, a
  chart growing from its baseline. Motion is fast, springy and never
  blocks input.

Restraint is part of the design. One accent colour, one texture, one
ambient animation. Everything else is quiet.

## 2. Colour tokens

### Light theme (:root)
--bg-app:         #F5F3EE   /* warm paper */
--bg-surface:     #FFFDFA
--bg-subtle:      #EDEAE2
--bg-inset:       #E7E3D9
--border:         #E2DED4
--border-strong:  #CBC5B8
--text-primary:   #1A1815
--text-secondary: #5C574E
--text-muted:     #8C867A
--accent:         #4F46E5
--accent-hover:   #4338CA
--accent-soft:    #ECEBFD   /* tinted background for active nav, chips */
--accent-ring:    rgba(79, 70, 229, 0.35)
--success:        #1A9E5F
--warning:        #C8811A
--danger:         #D64545
--positive-bg:    #E8F5EE
--warning-bg:     #FBF2E2
--danger-bg:      #FBEAEA
--grain-opacity:  0.035
--shadow-card:    0 1px 2px rgba(26, 24, 21, 0.04)
--shadow-lift:    0 6px 20px rgba(26, 24, 21, 0.08)
--shadow-modal:   0 24px 60px rgba(26, 24, 21, 0.22)

### Dark theme ([data-theme="dark"] and prefers-color-scheme: dark)
--bg-app:         #100F13   /* ink */
--bg-surface:     #191820
--bg-subtle:      #201F29
--bg-inset:       #16151C
--border:         #2B2936
--border-strong:  #3D3A4C
--text-primary:   #F2F0EC
--text-secondary: #A8A2B4
--text-muted:     #736E80
--accent:         #8B7CFF
--accent-hover:   #A394FF
--accent-soft:    #211E38
--accent-ring:    rgba(139, 124, 255, 0.40)
--success:        #34C77B
--warning:        #E0A038
--danger:         #F06A6A
--positive-bg:    #12271C
--warning-bg:     #2A2114
--danger-bg:      #2C1719
--grain-opacity:  0.055
--shadow-card:    0 1px 2px rgba(0, 0, 0, 0.40)
--shadow-lift:    0 6px 20px rgba(0, 0, 0, 0.55)
--shadow-modal:   0 24px 60px rgba(0, 0, 0, 0.70)

Define the complete light palette on bare :root. Redefine only the tokens
inside the dark blocks, so nothing has its only definition in a media query.
Theme follows the OS by default with a manual override in Settings.

### Signature gradient
--grad-accent: linear-gradient(100deg, #4F46E5 0%, #7C3AED 45%, #DB2777 100%)
Dark:          linear-gradient(100deg, #8B7CFF 0%, #A78BFA 45%, #F472B6 100%)

Used in exactly three places and nowhere else: the aurora header band,
the budget meter fill, and the 2px top edge of the active sidebar item.
Overusing this gradient is the fastest way to make the app look cheap.

## 3. Signature elements

These seven details are what make the app look like itself. Implement all
of them.

1. **Grain overlay.** A fixed, pointer-events-none full-window layer
   containing an inline SVG `feTurbulence` filter (baseFrequency 0.8,
   numOctaves 3), rendered at `--grain-opacity`, `mix-blend-mode: overlay`,
   `z-index: 1` beneath all content. Generated once, never animated.
2. **Aurora header band.** Behind the month title on the Dashboard, a 180px
   tall band with three blurred radial gradient blobs from the signature
   gradient at 22% opacity, `filter: blur(60px)`, drifting slowly. It is
   ambient, sits behind text, and must never reduce text contrast.
3. **The Ribbon budget meter.** Not a plain progress bar. A 14px tall
   capsule with an inset track, a gradient fill, a soft sheen highlight
   that sweeps across the fill once when the value changes, and three
   hairline milestone ticks at 70%, 90% and 100%. The fill colour crosses
   between states rather than snapping. Above 100% the capsule gains a
   1px danger-coloured outer ring.
4. **Counting figures.** Every headline number counts from its previous
   value to its new one. Tabular numerals so the width never jitters.
5. **Living donut.** The category donut has a hollow centre that shows the
   total; hovering a segment crossfades the centre to that category's name
   and amount, and lifts the hovered segment outward by 4px.
6. **Growing bars.** Daily bars scale up from the baseline with a 12ms
   stagger. The bar for today carries a small pulsing accent dot above it.
7. **Shimmer on success.** When a month ends under budget, the Saved stat
   card runs a single diagonal light sweep across it, once, on mount. No
   confetti, no sound, no repeat.

## 4. Chart palette

Category colours, assigned in this order:

#4F46E5  #1A9E5F  #C8811A  #7C3AED  #DB2777
#0E9AA7  #E2643A  #5B7CFA  #7C7566  #9A6B1F
#0E7490  #A21C68

Budget meter states: success below 70%, warning 70–90%,
danger 90–100%, and #A8253F above 100%.
Chart gridlines use --border. Axis labels use --text-muted at 12px.
Chart tooltips are surface cards with --shadow-lift, never the library default.

## 5. Typography

Two faces, both bundled locally as woff2 in `src/renderer/src/assets/fonts`
and declared with @font-face using `font-display: swap`. Never load a font
over the network — the app must render identically offline.

- **Fraunces** (or Instrument Serif if Fraunces is unavailable) — the
  display face. Used for exactly two things: the month title on the
  Dashboard and History, and the single hero "Spent" figure. Nothing else.
- **Inter** — everything else. Fallback stack:
  Inter, "Segoe UI", system-ui, sans-serif.

Every figure and every table cell carrying a number uses
`font-variant-numeric: tabular-nums`.

Scale:
- Display serif (month title)   34px / 400 / -0.01em
- Hero figure (serif)           40px / 400 / -0.02em
- Figure (sans, stat cards)     30px / 600 / -0.02em
- H1 page title                 22px / 600
- H2 section                    16px / 600
- Body                          14px / 400
- Label / table header          12px / 500 / 0.02em / uppercase
- Caption                       12px / 400 / text-muted

Line height 1.5 for body, 1.15 for figures and display text.

## 6. Spacing, shape, elevation

4px scale: 4, 8, 12, 16, 24, 32, 48, 64.
Card padding 20px. Grid gap 16px. Page gutter 28px.
Radius: 8px controls, 14px cards, 20px modals, 999px pills and the meter.
Every card carries a 1px --border and --shadow-card. Only three things ever
use --shadow-lift: a hovered card, a chart tooltip, an open dropdown.
Only the modal uses --shadow-modal.

## 7. Components

Card: bg-surface, 1px border, 14px radius, 20px padding, --shadow-card.
  On hover: border becomes --border-strong, translateY(-2px), --shadow-lift.
StatCard: 12px uppercase muted label, then the figure, then an optional
  12px delta line in success or danger. The figure is an AnimatedNumber.
Button primary: accent bg, white text, 36px tall, 8px radius, 14px / 500.
  Hover lightens to accent-hover; active scales to 0.97.
Button secondary: transparent, 1px --border-strong, --text-primary.
Button danger: danger bg, white text. Delete confirmation only.
Input: 36px tall, 1px border, 8px radius, 14px text. Focus draws a 2px
  --accent-ring and the border turns accent. No browser default outline.
Table: 44px rows, 12px uppercase muted header, 1px row separators,
  numeric columns right-aligned and tabular, row hover tints to --bg-subtle.
Modal: 520px wide, centred, 20px radius, backdrop rgba(0,0,0,0.5) with a
  4px backdrop blur.
Toast: bottom-right, 3.5s auto-dismiss, max 3 stacked.
Sidebar: 220px fixed, --bg-subtle, 38px items. The active item has an
  --accent-soft background, accent text, and a 2px signature-gradient top edge.
Suggestion card: --bg-surface with a 3px left rail coloured by tone
  (danger / warning / accent / success), an icon, a bold title, and body text.
Empty state: a centred inline SVG illustration that drifts 6px vertically
  on a 6s loop, a headline, and one primary button.

## 8. Motion system

### Tokens
--dur-instant: 90ms
--dur-fast:    150ms
--dur-base:    240ms
--dur-slow:    420ms
--dur-ambient: 18s

--ease-out:    cubic-bezier(0.16, 1, 0.30, 1)     /* default for entrances */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)     /* state crossfades */
--ease-in:     cubic-bezier(0.55, 0, 1, 0.45)     /* exits only */

Spring presets for the Motion library, exported from motion/tokens.ts:
  springSoft  = { type: 'spring', stiffness: 240, damping: 28, mass: 0.9 }
  springSnap  = { type: 'spring', stiffness: 420, damping: 32, mass: 0.7 }

### Principles
- Animate **transform and opacity only**. Never animate width, height, top,
  left, margin or padding — they force layout and cause jank.
  The budget meter fills with `transform: scaleX()`, not `width`.
- Entrances use --ease-out. Exits are faster than entrances and use --ease-in.
- Nothing on screen animates for longer than --dur-slow, with the single
  exception of the ambient aurora and the empty-state drift.
- Motion never blocks input. Every animated control is clickable
  from frame one.
- Charts animate once on mount and when the selected month changes.
  They must not re-animate on unrelated re-renders — key them on the
  month value so React remounts them deliberately.
- Do not stack animations on one element. One property change, one purpose.

### Animation inventory — implement every row

| # | Element | What happens | Duration | Easing | How |
|---|---|---|---|---|---|
| 1 | Page switch | Outgoing fades out and drops 4px; incoming fades in and rises from 8px | 200ms in / 120ms out | ease-out / ease-in | Motion `AnimatePresence mode="wait"` in PageTransition |
| 2 | Stat cards on mount | Fade and rise 12px, staggered 60ms apart | 240ms | ease-out | Motion stagger container |
| 3 | Headline figures | Count from previous value to new value | 700ms | ease-out | AnimatedNumber using `requestAnimationFrame`, tabular numerals |
| 4 | Budget meter fill | scaleX from current to target, colour crossfades between states | 600ms | ease-out | Motion `animate` on transform + backgroundColor |
| 5 | Meter sheen | One diagonal highlight sweeps across the fill after it settles | 900ms | ease-in-out | CSS keyframe, `animation-iteration-count: 1` |
| 6 | Donut on mount | Segments sweep clockwise from 0° | 500ms | ease-out | Recharts `isAnimationActive` with `animationDuration` |
| 7 | Donut hover | Hovered segment translates 4px outward, centre label crossfades | 150ms | ease-out | Recharts activeShape + Motion crossfade |
| 8 | Daily bars | Each bar scales up from the baseline, 12ms stagger | 400ms | ease-out | Recharts `animationBegin` per index |
| 9 | Today's bar | A 6px accent dot above it pulses opacity 0.4 → 1 → 0.4 | 2s loop | ease-in-out | CSS keyframe |
| 10 | Trend line | Line draws left to right via stroke-dashoffset | 800ms | ease-out | CSS on the Recharts path |
| 11 | Suggestion cards | Fade and slide in from 10px left, 45ms stagger | 220ms | ease-out | Motion stagger |
| 12 | Suggestion dismiss | Collapses and fades, remaining cards reflow smoothly | 180ms | ease-in | Motion `layout` + AnimatePresence |
| 13 | Modal open | Backdrop fades in; panel scales 0.96 → 1 and rises 12px | springSnap | — | Motion |
| 14 | Modal close | Panel scales to 0.98 and fades | 120ms | ease-in | Motion |
| 15 | Table row insert | New row fades in with a brief accent-soft background flash | 300ms | ease-out | Motion `layout` on rows |
| 16 | Table row delete | Row fades and collapses, rows below slide up | 200ms | ease-in | Motion AnimatePresence |
| 17 | Toast | Slides in 24px from the right and fades | springSoft | — | Motion |
| 18 | Card hover | translateY(-2px), shadow deepens, border strengthens | 150ms | ease-out | CSS transition |
| 19 | Button press | scale 0.97 while held | 90ms | ease-out | CSS `:active` |
| 20 | Sidebar active marker | The 2px gradient edge slides between items | springSoft | — | Motion `layoutId` shared element |
| 21 | Month change | Whole dashboard content crossfades; all figures recount | 180ms | ease-in-out | Key the content on the month value |
| 22 | Aurora blobs | Three blobs drift and scale slowly, offset phases | 18s loop | ease-in-out | CSS keyframes, transform only |
| 23 | Saved-card shimmer | One diagonal light sweep, once, when the month closes under budget | 1.1s | ease-in-out | CSS keyframe, runs once |
| 24 | Empty state | Illustration drifts 6px vertically | 6s loop | ease-in-out | CSS keyframe |
| 25 | Theme switch | Background and text colours crossfade | 240ms | ease-in-out | CSS transition on colour properties only |
| 26 | Loading | A skeleton shimmer on cards while data loads on first paint | 1.4s loop | linear | CSS gradient keyframe |

### Reduced motion — mandatory

Read `prefers-reduced-motion: reduce` in `useReducedMotion.ts` and thread it
through the Motion provider. When it is set:
- Every duration collapses to 0 except colour and opacity fades, which stay
  at --dur-instant.
- Counting figures render their final value immediately.
- The aurora, the pulsing dot, the shimmer and the empty-state drift stop
  entirely.
- Chart animations are disabled via `isAnimationActive={false}`.
Also ship the CSS safety net:
`@media (prefers-reduced-motion: reduce) { *, *::before, *::after {
animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
transition-duration: 0.01ms !important; } }`

### Performance guardrails
- Never animate more than roughly 30 elements at once. Stagger, do not swarm.
- Apply `will-change` only to the aurora blobs and the meter fill, and
  remove it after the animation settles.
- The idle app must sit near 0% CPU. If the aurora keeps the process awake,
  pause it when the window loses focus — listen for the Electron blur and
  focus events and toggle a `data-window-blurred` attribute on the root.

## 9. Accessibility
Body text contrast at least 4.5:1 in both themes, including over the aurora
and the grain. Never encode meaning in colour alone: the meter states its
percentage in text, and every suggestion carries an icon plus a tone word.
Every interactive element is keyboard-reachable with a visible focus ring
using --accent-ring. Modals trap focus and close on Escape. Every icon-only
button has an aria-label. Animated regions that update figures use
`aria-live="polite"` so the value is announced once it settles, not on
every animation frame.

## 10. Layout
Sidebar 220px + fluid content, max content width 1240px, centred.
Dashboard grid: 4 stat cards in a row at width ≥ 1100px, 2×2 below 1100px,
stacked below 720px. The two charts sit side by side above 1100px and stack
below it. Any chart or table that cannot shrink further scrolls inside its
own container; the page body never scrolls horizontally.
