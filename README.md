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
lun-e/pcb/          →  whybit.in/lun-e/pcb  (the board: specs, bom, pinout, board files)
lun-e/evolution/    →  whybit.in/lun-e/evolution  (every version, v1 → now)
connect/            →  whybit.in/connect   (connect — the controller for lun-e)
preorder/           →  whybit.in/preorder  (pre-order: lun-e rc kit, + connect add-on)
about/index.html    →  whybit.in/about
contact/index.html  →  whybit.in/contact
images/             →  local media (images/lun-e-rc/, images/connect/ = renders)
models/             →  3d models (lun-e-rc.glb / connect.glb viewers, lun-e-explode.glb / connect-explode.glb home scroll sections, lun-e.glb v1)
downloads/lun-e-rc/ →  gerbers, board step, bom, printable stls
downloads/connect/  →  printable stls for the controller
styles.css          →  everything tailwind can't do elegantly
script.js           →  theme toggle, starfield, cursor glow, scroll blur
hero-explode.js     →  home page scroll sections: lun-e (hero) and connect spin and come apart as you scroll.
                       one config per model in CONFIGS; a section opts in with data-hero="lune" / "connect"
film.js             →  silent loop of the launch film behind the home page pre-order section
film/               →  loop.mp4 (1080p), loop-720.mp4 (phones), loop-poster.jpg (still for reduced motion)
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

## pre-orders

whybit.in/preorder (`preorder/index.html` + `preorder.js`) takes free reservations — no
payment. people get the **lun-e rc kit** and can tick **add connect** (connect isn't sold
on its own, so that makes it **lun-e rc + connect**), fill in the form, and it posts to a tiny worker (`worker/index.js`) that stores it in
cloudflare d1. the home page has a short pre-order teaser (with the film looping behind it); every
"pre-order" link points to /preorder/. `/preorder/?kit=lun-e-rc-connect` opens with connect
already ticked.

**prices and products** live in one place — `KITS` at the top of `worker/index.js`:

```js
'lun-e-rc-kit':     { name: 'lun-e rc kit',       price: 5555 },
'lun-e-rc-connect': { name: 'lun-e rc + connect', price: 6666 },
```

`price` is in rupees, or `null` to show "price announced soon". the form reads them from
the api (the add-on price is the difference). the amounts are also written into the copy on
`preorder/index.html` and the home page teaser — grep for `₹` if you change them.

**no stock limit:** every order is saved as `reserved` — there's no cap and no waitlist.

the site deploys and works without the database — the form just says "reservations open
soon". to switch reservations on, once:

```sh
npx wrangler d1 create whybit-preorders
# paste the database_id it prints into wrangler.jsonc and un-comment the d1_databases block
npx wrangler d1 execute whybit-preorders --remote --file=worker/schema.sql
npx wrangler secret put ADMIN_KEY        # any long random string
```

then push. to download every reservation as a spreadsheet:

```sh
curl -H "Authorization: Bearer <ADMIN_KEY>" https://whybit.in/api/preorder/export -o preorders.csv
```

to try it locally with a throwaway database: add the same `d1_databases` block, then
`npx wrangler d1 execute whybit-preorders --local --file=worker/schema.sql` and
`npx wrangler dev` (put `ADMIN_KEY=anything` in `.dev.vars`).
