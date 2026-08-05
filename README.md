# whybit.

**think it. build it. vibe it.**

tiny electronics for curious makers — out of bengaluru, india.

---

## what's this?

the source of [whybit.in](https://whybit.in) — three static html pages with Tailwind (no build step, no framework fatigue). open it, read it, remix it.

## the kits (coming soon)

- **lun-e** — esp32-c3 tracked robot with animated oled eyes and esp-now radio.

the firmware lives at [whybitlabs/T-01-The-Explorer](https://github.com/whybitlabs/T-01-The-Explorer).

## layout

```
index.html          →  whybit.in/
about/index.html    →  whybit.in/about
contact/index.html  →  whybit.in/contact
styles.css          →  everything tailwind can't do elegantly
script.js           →  theme toggle, cursor glow, scroll blur
```

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
