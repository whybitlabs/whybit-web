# whybit.

**think it. build it. vibe it.**

tiny electronics for curious makers — out of bengaluru, india.

---

## what's this?

the source of [whybit.in](https://whybit.in) — three static html pages with Tailwind (no build step, no framework fatigue). open it, read it, remix it.

## the kits (coming soon)

- **Lun-E RC** — palm-sized tracked rover on a custom esp32-c3 board: n20 gear motors, printed chain tracks, esp-now radio and animated oled eyes.

the full build — hardware, wiring, firmware and print files — is documented at
[whybit.in/lun-e](https://whybit.in/lun-e/). the firmware itself lives at
[whybitlabs/T-01-The-Explorer](https://github.com/whybitlabs/T-01-The-Explorer)
(the repo still uses the T-01 name).

## layout

```
index.html          →  whybit.in/
lun-e/index.html    →  whybit.in/lun-e     (lun-e rc — the current build)
lun-e/evolution/    →  whybit.in/lun-e/evolution  (every version, v1 → now)
about/index.html    →  whybit.in/about
contact/index.html  →  whybit.in/contact
images/             →  local media (images/lun-e-rc/ = renders of the current build)
models/             →  3d models (lun-e-rc.glb viewer, lun-e-explode.glb home hero, lun-e.glb v1)
downloads/lun-e-rc/ →  gerbers, board step, bom, printable stls
styles.css          →  everything tailwind can't do elegantly
script.js           →  theme toggle, starfield, cursor glow, scroll blur
hero-explode.js     →  home hero: lun-e spins and comes apart as you scroll
```

to add a version to the evolution page: copy one `.evo-stop` link in the rail
and one chapter `<section>` in lun-e/evolution/index.html.

each page is standalone. the `<head>` boilerplate and the nav/footer chrome
are duplicated across the three files on purpose — that's the tax for having
no build step. edit one, edit all three.

## run locally

```sh
# any static server works — serve from the repo root so /about/ resolves
python3 -m http.server 8080
# then open http://localhost:8080
```

## say hi

- email — [harshith@whybit.in](mailto:harshith@whybit.in)
- github — [@whybitlabs](https://github.com/whybitlabs)
- instagram — [@whybit.in](https://www.instagram.com/whybit.in/)
- youtube — [@why-bit](https://www.youtube.com/@why-bit)

## license

copyleft 🄯 2026 whybit. released under the [GNU GPL v3](./LICENSE). fork it, remix it, ship it — just keep it free.

site by [absurd industries](https://absurd.industries/).
