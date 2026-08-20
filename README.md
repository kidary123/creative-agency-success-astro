# Creative Agency Success — landing page

Rebuild of the Creative Agency Success site in **Astro**, with a first-class
AI-readability layer.

**Live:** <https://creative-agency-success-roads1.vercel.app>

| | |
|---|---|
| Landing | <https://creative-agency-success-roads1.vercel.app> |
| AI overview | <https://creative-agency-success-roads1.vercel.app/llms.txt> |
| Machine catalog | <https://creative-agency-success-roads1.vercel.app/catalog.txt> |
| Content files | <https://creative-agency-success-roads1.vercel.app/ai/about.md> |

```bash
npm install
npm run dev      # http://localhost:4321
```

---

## What's built

| # | Section | Status |
|---|---------|--------|
| 1 | Header / nav — logo, five anchor links, CTA | ✅ |
| 2 | Hero — headline, sub-copy, positioning line, CTA, graphic | ✅ |
| 3 | Stats band — heading, media with play button, four figures | ✅ |
| 4 | Program cards — Agency Accelerator + Scale Partnership | ✅ |
| 5 | Footer — logo, Menu / Resources columns, newsletter | ✅ |

Out of scope by design (read for context, not built): Journey To Your Success,
Featured-in press logos, Testimonials, the six-pillar Scale Method section,
Resources grid, Paths To Success CTA band.

---

## AI readability

The brief's core requirement. Five layers, all populated from real content:

**1. [`/llms.txt`](./public/llms.txt)** — Markdown overview at the site root:
what the company does, both programs, the Scale Method, the results, who it's
for, and resources. Links out to the deeper content files.

**2. [`/catalog.txt`](./public/catalog.txt)** — flat machine-readable catalog:
organization, two programs with stage/audience/outcome, the framework, the
result figures, and resources.

**3. Markdown content files** in [`public/ai/`](./public/ai/) — served as real
URLs so a crawler can actually fetch what `llms.txt` links to:

- [`about.md`](./public/ai/about.md) — who we are, the promise, who we serve, beliefs, the Individual Clarity / Collective Confidence path
- [`programs.md`](./public/ai/programs.md) — both programs in depth: the problem each solves, what gets built, the outcome
- [`scale-method.md`](./public/ai/scale-method.md) — the six pillars and why the order matters
- [`results.md`](./public/ai/results.md) — the four figures and what each one actually measures
- [`resources.md`](./public/ai/resources.md) — Facebook Group, Books, Free Trainings, Podcast

**4. JSON-LD** — [`StructuredData.astro`](./src/components/StructuredData.astro)
emits `Organization` with both programs as `Service`/`Offer`, plus
`hasOfferCatalog` for the six pillars, an `audience` block, `knowsAbout`, and a
second `ItemList` for the result figures. Generated from `src/data/site.ts`, so
the schema can't drift from what's on screen.

**5. Semantic HTML** — one `h1`, sectioned `h2`/`h3`, `header`/`main`/`nav`/
`footer` landmarks, `aria-labelledby` on every section, each program card as an
`<article>` with its own heading, stats as a `<dl>`, real alt text, skip link.

`<head>` also advertises both metadata files via `<link rel="alternate">`.

### The typo decision

The Figma has three typos: "Sucess", "Expertize", "Recurning Revenue".
[`src/data/site.ts`](./src/data/site.ts) stores `display` and `correct`
variants side by side — the design renders faithfully, while `llms.txt`,
`catalog.txt` and the JSON-LD all use correct spellings, as the brief requires.

---

## Architecture

```
src/
├── components/
│   ├── Header.astro          nav + mobile panel
│   ├── Hero.astro            headline + inline SVG growth graphic
│   ├── StatsBand.astro       media + four figures
│   ├── ProgramCards.astro    the two offerings
│   ├── Footer.astro          columns + newsletter
│   ├── Logo.astro
│   └── StructuredData.astro  JSON-LD, generated from site.ts
├── data/
│   └── site.ts               single source of truth for all copy
├── layouts/
│   └── BaseLayout.astro      head, SEO, fonts, JSON-LD, motion boot
├── scripts/
│   └── motion.ts             the only file that knows about GSAP
└── styles/
    ├── tokens.css            design tokens — the whole visual system
    ├── reset.css
    └── global.css            type scale, layout primitives, buttons
```

**Content lives in `src/data/site.ts`.** Components read from it. That's what
lets the JSON-LD, the rendered page, and the AI metadata stay in sync.

**Styling is plain CSS with design tokens** — no framework. Colours in OKLCH,
fluid type and spacing via `clamp()` (no breakpoints for type), easing curves
named by intent. Re-skinning to match the Figma exactly is a four-value change
at the top of `tokens.css`.

**Animation** is declared in markup (`data-animate="fade-up"`) and executed by
`motion.ts`. Two guarantees: content stays visible if JS fails, and
`prefers-reduced-motion` is honoured via `gsap.matchMedia()`.

---

## Judgment calls

**No Figma access.** The design file needs an authenticated session, so exact
spacing, colours and assets couldn't be pulled from the Inspect panel. The
build follows the brief's copy, section order and figures exactly, with an
independent art direction. Everything visual routes through tokens so matching
the real design later is a small, contained change.

**Placeholders, labelled as such.** The hero graphic is a purpose-built inline
SVG rather than a stock illustration. The stats media is an Unsplash photo with
real alt text. Both are swap-in-place.

**Priority order.** AI metadata and semantic structure first — the brief says
that's what matters most and it's fully independent of the visual. Sections
next. Visual fidelity last, since it's the part most cheaply corrected.

**Newsletter form** validates and confirms client-side; no backend. Point
`action` at an endpoint when one exists.

---

## Verification

`astro check` → **0 errors, 0 warnings** across 14 files (TypeScript strict).
`astro build` → clean. Both JSON-LD blocks parse as valid JSON.
