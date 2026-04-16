/* ============================================================
   whybit. — script.js
   Vue 3 + Vue Router (CDN globals)
   Pages: Home / About / Contact
   ============================================================ */

const { createApp, ref, onMounted, onBeforeUnmount, computed, watch, nextTick } = Vue;
const { createRouter, createWebHashHistory, useRoute, RouterView, RouterLink } = VueRouter;

/* ============================================================
   SHARED: Logo component (wordmark with pulsing blue dot)
   ============================================================ */
const Logo = {
  props: { size: { type: String, default: 'text-2xl' } },
  template: `
    <span :class="[size, 'font-display font-normal tracking-tightest leading-none select-none']">
      <span>whybit</span><span class="logo-dot"></span>
    </span>
  `,
};

/* ============================================================
   SHARED: Magnetic button directive-ish wrapper
   ============================================================ */
const MagneticLink = {
  props: { to: String, href: String, label: String },
  template: `
    <a v-if="href" :href="href"
       class="magnetic inline-flex items-center gap-3 px-6 py-3 border border-ink-low hover:border-accent text-ink hover:text-accent transition-colors duration-300 text-xs tracking-[0.2em] uppercase"
       @mousemove="onMove" @mouseleave="onLeave">
      <slot>{{ label }}</slot>
    </a>
    <router-link v-else-if="to" :to="to"
       class="magnetic inline-flex items-center gap-3 px-6 py-3 border border-ink-low hover:border-accent text-ink hover:text-accent transition-colors duration-300 text-xs tracking-[0.2em] uppercase"
       @mousemove="onMove" @mouseleave="onLeave">
      <slot>{{ label }}</slot>
    </router-link>
  `,
  methods: {
    onMove(e) {
      if (window.matchMedia('(hover: none)').matches) return;
      const r = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.25;
      e.currentTarget.style.setProperty('--tx', x + 'px');
      e.currentTarget.style.setProperty('--ty', y + 'px');
    },
    onLeave(e) {
      e.currentTarget.style.setProperty('--tx', '0px');
      e.currentTarget.style.setProperty('--ty', '0px');
    },
  },
};

/* ============================================================
   PAGE: HOME
   ============================================================ */
const Home = {
  components: { Logo, MagneticLink },
  setup() {
    const heroRef = ref(null);
    const revealRefs = ref([]);

    onMounted(() => {
      // Word reveal on mount for hero
      nextTick(() => {
        document.querySelectorAll('.reveal-word').forEach((el, i) => {
          setTimeout(() => el.classList.add('in'), 150 + i * 80);
        });
      });

      // IntersectionObserver for sections
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.querySelectorAll('.reveal-on-scroll').forEach((el, i) => {
              setTimeout(() => el.classList.add('in'), i * 100);
            });
          }
        });
      }, { threshold: 0.2 });

      document.querySelectorAll('.observe-section').forEach(s => io.observe(s));
    });

    const products = [
      {
        name: 't-01 · explorer',
        tag:  'esp32-c3 · tank',
        price: 'coming soon',
        desc: 'wireless tracked robot. differential steering, animated oled eyes, esp-now radio.',
        color: '#FF5B1F',
        img: 'https://github.com/whybitlabs/T-01-The-Explorer/raw/main/images/t01-robots.jpeg',
      },
      {
        name: 't-01 · explorer kit',
        tag:  'diy · solder-it-yourself',
        price: 'coming soon',
        desc: 'every part, every screw, every track. you bring the patience.',
        color: '#2B5BFF',
        img: 'https://github.com/whybitlabs/T-01-The-Explorer/raw/main/images/t01-demo.jpeg',
      },
      {
        name: 'isro moon-rover kit',
        tag:  'rover · 3 attachments',
        price: 'coming soon',
        desc: 'a tiny pragyan, on your desk. swap-in arm, drill, and camera modules — one chassis, three missions.',
        color: '#2B5BFF',
        img: 'https://github.com/whybitlabs/T-01-The-Explorer/raw/main/images/t01-demo.gif',
      },
    ];

    const manifestoWords = [
      'make robotics easy',
      'turn curiosity into creation',
      'everything starts small',
      'think it.',
      'build it.',
      'vibe it.',
      'why?',
    ];

    return { products, manifestoWords, heroRef };
  },
  template: `
  <div>
    <!-- ============ HERO ============ -->
    <section ref="heroRef" class="relative min-h-[92svh] flex flex-col justify-center px-6 md:px-12 pt-24 pb-20 observe-section">

      <!-- Little eyebrow -->
      <div class="flex items-center gap-3 mb-8 text-[10px] md:text-xs tracking-[0.3em] uppercase text-ink-dim reveal-on-scroll">
        <span class="inline-block w-8 h-px bg-ink-low"></span>
        <span>est. 2026· bengaluru</span>
      </div>

      <!-- Hero title -->
      <h1 class="hero-title text-[18vw] md:text-[13vw] lg:text-[11rem] text-ink max-w-[11ch]">
        <span class="reveal-word">tiny</span>
        <span class="reveal-word">things,</span><br/>
        <span class="reveal-word"><em>big</em></span>
        <span class="reveal-word">why's.</span>
      </h1>

      <!-- Sub -->
      <p class="mt-8 max-w-md text-sm md:text-base text-ink-dim font-mono leading-relaxed reveal-on-scroll">
        desktop robotics kits for people who ask
        <span class="text-accent font-display italic text-lg align-baseline">why?</span>
        
      </p>

      <!-- CTAs -->
      <div class="mt-10 flex flex-wrap gap-4 reveal-on-scroll">
        <router-link to="/about" class="self-center text-xs tracking-[0.2em] uppercase text-ink-dim hover:text-ink transition-colors ul-link">the story →</router-link>
      </div>

      <!-- Bottom hero meta row -->
      <div class="absolute bottom-6 md:bottom-10 left-6 md:left-12 right-6 md:right-12 flex justify-between items-end text-[10px] tracking-[0.25em] uppercase text-ink-low font-mono pointer-events-none">
        <span>01 / home</span>
        <span class="hidden md:block">scroll ↓</span>
      </div>
    </section>

    <!-- ============ MANIFESTO MARQUEE ============ -->
    <section class="relative py-10 border-y border-line overflow-hidden observe-section">
      <div class="marquee-mask overflow-hidden">
        <div class="flex gap-16 animate-marquee whitespace-nowrap font-display italic text-5xl md:text-7xl text-ink-dim opacity-80">
          <span v-for="(w, i) in [...manifestoWords, ...manifestoWords]" :key="i" class="flex items-center gap-16">
            {{ w }}
            <span class="inline-block w-2 h-2 rounded-full bg-accent"></span>
          </span>
        </div>
      </div>
    </section>

    <!-- ============ PRODUCTS ============ -->
    <section class="px-6 md:px-12 py-24 md:py-32 observe-section">
      <div class="flex items-end justify-between mb-14 md:mb-20">
        <div>
          <div class="text-[10px] md:text-xs tracking-[0.3em] uppercase text-ink-dim mb-4 reveal-on-scroll">/ 02 — kits</div>
          <h2 class="font-display text-5xl md:text-7xl tracking-tighter2 text-ink max-w-xl leading-[0.95] reveal-on-scroll">
            small things that <em class="italic text-accent">do a lot.</em>
          </h2>
        </div>
        <router-link to="/contact" class="hidden md:inline-block text-xs tracking-[0.2em] uppercase text-ink-dim hover:text-accent ul-link reveal-on-scroll">get notified →</router-link>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <article v-for="(p, i) in products" :key="p.name"
                 class="product-card border border-line bg-bg-soft p-6 md:p-8 reveal-on-scroll"
                 @mousemove="onCardMove">
          <!-- Product visual: real T-01 imagery -->
          <div class="aspect-square w-full mb-6 rounded-sm relative overflow-hidden product-img bg-bg"
               :style="'background-color: var(--card-plate);'">
            <img :src="p.img" :alt="p.name" loading="lazy"
                 class="absolute inset-0 w-full h-full object-cover" />
            <div class="absolute inset-0 pointer-events-none"
                 :style="'background: radial-gradient(circle at 30% 30%, ' + p.color + '22, transparent 60%);'"></div>
            <!-- Dotted overlay -->
            <div class="absolute inset-0 pointer-events-none" style="background-image: radial-gradient(#D0D0D0 1px, transparent 1px); background-size: 10px 10px; opacity: 0.18; mix-blend-mode: multiply;"></div>
          </div>

          <div class="flex items-start justify-between mb-2">
            <h3 class="font-display text-2xl md:text-3xl text-ink">{{ p.name }}</h3>
            <span class="text-xs text-ink-dim font-mono">{{ p.price }}</span>
          </div>
          <div class="text-[10px] tracking-[0.25em] uppercase text-accent mb-3">{{ p.tag }}</div>
          <p class="text-sm text-ink-dim leading-relaxed mb-5">{{ p.desc }}</p>
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-ink-low">
              <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              coming soon
            </span>
            <router-link to="/contact" class="text-xs tracking-[0.2em] uppercase ul-link text-ink">notify me →</router-link>
          </div>
        </article>
      </div>
    </section>

    <!-- ============ THE WHY ============ -->
    <section class="px-6 md:px-12 py-28 md:py-40 relative observe-section">
      <div class="max-w-6xl">
        <div class="text-[10px] md:text-xs tracking-[0.3em] uppercase text-ink-dim mb-10 reveal-on-scroll">/ 03 — the why</div>
        <p class="font-display text-6xl md:text-9xl lg:text-[11rem] leading-[0.9] tracking-tightest text-ink reveal-on-scroll">
          <em class="italic text-accent">why?</em><br/>
          <span class="text-ink-dim">because every</span><br/>
          <span class="text-ink-dim">great invention</span><br/>
          <span class="text-ink">starts with one</span><br/>
          <span>question.</span>
        </p>
        <div class="mt-12 reveal-on-scroll">
          <magnetic-link to="/about" label="read the story" />
        </div>
      </div>
    </section>

    <!-- ============ FOOTER ============ -->
    <footer class="mt-auto px-6 md:px-12 py-10 border-t border-line flex flex-col md:flex-row md:items-end justify-between gap-8 text-[10px] tracking-[0.25em] uppercase text-ink-low">
      <div class="flex items-center gap-4">
        <logo size="text-xl" />
        <span class="hidden md:inline">· tiny. curious. open.</span>
      </div>
      <div class="flex flex-wrap gap-x-6 gap-y-2">
        <a href="https://www.instagram.com/whybitlabs/" target="_blank" rel="noopener" class="ul-link text-ink-dim hover:text-accent">instagram</a>
        <a href="https://www.youtube.com/@harshitharadhyadev/shorts" target="_blank" rel="noopener" class="ul-link text-ink-dim hover:text-accent">youtube</a>
        <a href="https://www.linkedin.com/in/l-harshith-aradhya-7571142b6/" target="_blank" rel="noopener" class="ul-link text-ink-dim hover:text-accent">linkedin</a>
        <a href="https://github.com/whybitlabs" target="_blank" rel="noopener" class="ul-link text-ink-dim hover:text-accent">github</a>
        <router-link to="/contact" class="ul-link text-ink-dim hover:text-accent">contact</router-link>
      </div>
      <div class="flex flex-col md:items-end gap-1 normal-case tracking-normal">
        <div class="text-[10px] tracking-[0.25em] uppercase">copyleft 🄯 2026 whybit · gpl v3</div>
        <div class="text-[10px] tracking-[0.25em] uppercase">
          site by
          <a href="https://absurd.industries/" target="_blank" rel="noopener" class="ul-link text-ink-dim hover:text-accent">absurd industries</a>
        </div>
      </div>
    </footer>
  </div>
  `,
  methods: {
    onCardMove(e) {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty('--cx', ((e.clientX - r.left) / r.width * 100) + '%');
      e.currentTarget.style.setProperty('--cy', ((e.clientY - r.top) / r.height * 100) + '%');
    },
  },
};

/* ============================================================
   PAGE: CONTACT
   ============================================================ */
const Contact = {
  components: { Logo, MagneticLink },
  template: `
  <div class="px-6 md:px-12 pt-28 pb-24">
    <div class="text-[10px] tracking-[0.3em] uppercase text-ink-dim mb-6">/ contact — say hi</div>
    <h1 class="hero-title text-7xl md:text-[11rem] text-ink mb-6">
      ask <em>why.</em>
    </h1>
    <p class="text-ink-dim max-w-md text-sm leading-relaxed mb-16">
      kits are still cooking. if you want to be first in line, collaborate on the t-01 explorer, or just nerd out about tiny robots — the door is open.
    </p>

    <div class="grid md:grid-cols-[1fr_2fr] gap-10 md:gap-20 max-w-6xl">
      <aside class="text-xs tracking-[0.2em] uppercase text-ink-dim space-y-6 md:sticky md:top-24 h-fit">
        <div>
          <div class="text-ink-low mb-2">based in</div>
          <div class="text-ink">bengaluru, india</div>
        </div>
        <div>
          <div class="text-ink-low mb-2">timezone</div>
          <div class="text-ink">ist (utc +5:30)</div>
        </div>
        <div>
          <div class="text-ink-low mb-2">status</div>
          <div class="inline-flex items-center gap-2 text-ink">
            <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            building
          </div>
        </div>
      </aside>

      <div class="space-y-10">
        <a href="mailto:harshith@whybit.in" class="block group border border-line hover:border-accent transition-colors p-6 md:p-8 bg-bg-soft">
          <div class="text-[10px] tracking-[0.3em] uppercase text-ink-low mb-3">email</div>
          <div class="font-display text-3xl md:text-5xl text-ink group-hover:text-accent transition-colors tracking-tighter2">harshith@whybit.in</div>
          <div class="text-xs text-ink-dim mt-3">for kit updates, partnerships, and general why-asking.</div>
        </a>

        <a href="https://wa.me/918277715578" target="_blank" rel="noopener" class="block group border border-line hover:border-accent transition-colors p-6 md:p-8 bg-bg-soft">
          <div class="text-[10px] tracking-[0.3em] uppercase text-ink-low mb-3">phone · whatsapp</div>
          <div class="font-display text-2xl md:text-4xl text-ink group-hover:text-accent transition-colors tracking-tighter2">+91 82777 15578</div>
          <div class="text-xs text-ink-dim mt-3">tap to whatsapp. voice notes welcome.</div>
        </a>

        <a href="https://github.com/whybitlabs/T-01-The-Explorer" target="_blank" rel="noopener" class="block group border border-line hover:border-accent transition-colors p-6 md:p-8 bg-bg-soft">
          <div class="text-[10px] tracking-[0.3em] uppercase text-ink-low mb-3">github · firmware</div>
          <div class="font-display text-2xl md:text-4xl text-ink group-hover:text-accent transition-colors tracking-tighter2">whybitlabs/t-01-the-explorer</div>
          <div class="text-xs text-ink-dim mt-3">open firmware for the t-01 tank. stars, forks, and issues welcome.</div>
        </a>

        <div class="grid grid-cols-3 gap-3 md:gap-4">
          <a href="https://www.instagram.com/whybitlabs/" target="_blank" rel="noopener" class="border border-line hover:border-accent transition-colors p-4 text-center text-[10px] tracking-[0.25em] uppercase text-ink-dim hover:text-accent">instagram</a>
          <a href="https://www.youtube.com/@harshitharadhyadev/shorts" target="_blank" rel="noopener" class="border border-line hover:border-accent transition-colors p-4 text-center text-[10px] tracking-[0.25em] uppercase text-ink-dim hover:text-accent">youtube</a>
          <a href="https://www.linkedin.com/in/l-harshith-aradhya-7571142b6/" target="_blank" rel="noopener" class="border border-line hover:border-accent transition-colors p-4 text-center text-[10px] tracking-[0.25em] uppercase text-ink-dim hover:text-accent">linkedin</a>
        </div>

        <p class="font-display italic text-ink-dim text-2xl md:text-3xl leading-tight pt-4">
          every great build starts with a conversation.
        </p>
      </div>
    </div>
  </div>
  `,
};

/* ============================================================
   PAGE: ABOUT (lightly done — the origin story)
   ============================================================ */
const About = {
  components: { Logo, MagneticLink },
  template: `
  <div class="px-6 md:px-12 pt-28 pb-24">
    <div class="text-[10px] tracking-[0.3em] uppercase text-ink-dim mb-6">/ about — the why behind why</div>
    <h1 class="hero-title text-7xl md:text-[11rem] text-ink mb-10">
      <em>why?</em>
    </h1>

    <div class="grid md:grid-cols-[1fr_2fr] gap-10 md:gap-20 max-w-6xl">
      <aside class="text-xs tracking-[0.2em] uppercase text-ink-dim space-y-6 md:sticky md:top-24 h-fit">
        <div>
          <div class="text-ink-low mb-2">founded</div>
          <div class="text-ink">2026 · bengaluru</div>
        </div>
        <div>
          <div class="text-ink-low mb-2">founder</div>
          <div class="text-ink">Harshith Aradhya</div>
        </div>
        <div>
          <div class="text-ink-low mb-2">build with</div>
          <div class="text-ink">soldering and precision</div>
        </div>
      </aside>

      <div class="space-y-8 font-mono text-base md:text-lg text-ink-dim leading-[1.8]">
        <p class="text-ink font-display italic text-3xl md:text-5xl leading-[1.1]">i'm building whybit for people like me.</p>
        <p>I've been a maker since childhood — breaking things, making things, rarely in that order. every great invention started with someone asking <span class="font-display italic text-accent text-xl">why?</span> — and then getting stubborn enough to find out.</p>
        <p>but robotics is expensive. intimidating. the first step feels like the hundredth.</p>
        <p>whybit is a small rebellion against that. tiny boards. kind docs. prices that don't require a conversation with your parents.</p>

        <hr class="border-line my-10" />

        <div class="space-y-4">
          <div class="font-display italic text-accent text-4xl md:text-6xl">why</div>
          <p>the question behind every invention, experiment, and idea. if we stop asking it, innovation dies quietly in a meeting room.</p>
        </div>
        <div class="space-y-4">
          <div class="font-display italic text-accent text-4xl md:text-6xl">bit</div>
          <p>the building block. everything starts small. a bit becomes a byte becomes a thing-that-moves-on-your-desk.</p>
        </div>

        <hr class="border-line my-10" />

        <p class="font-display italic text-ink text-3xl md:text-4xl leading-tight">think it. build it. vibe it.</p>
        <p class="text-ink-low text-sm">(yes, the site is vibe-coded. obviously.)</p>

        <div class="pt-8">
          <magnetic-link to="/contact" label="say hi →" />
        </div>
      </div>
    </div>
  </div>
  `,
};

/* ============================================================
   ROUTER
   ============================================================ */
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',        name: 'home',    component: Home },
    { path: '/about',   name: 'about',   component: About },
    { path: '/contact', name: 'contact', component: Contact },
  ],
  scrollBehavior() { return { top: 0 }; },
});

/* ============================================================
   ROOT APP: top nav (desktop) + bottom nav (mobile) + <router-view>
   ============================================================ */
const App = {
  components: { Logo },
  setup() {
    const route = useRoute();
    const currentName = computed(() => route.name || 'home');

    const navItems = [
      { to: '/',        name: 'home',    icon: 'home'    },
      { to: '/about',   name: 'about',   icon: 'why'     },
      { to: '/contact', name: 'contact', icon: 'contact' },
    ];

    /* ---------- THEME ---------- */
    const THEME_KEY = 'whybit-theme';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const stored = (() => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } })();
    const theme = ref(stored || (prefersDark.matches ? 'dark' : 'light'));

    const syncThemeColorMeta = (t) => {
      const color = t === 'dark' ? '#0A0A0A' : '#FAFAFA';
      document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', color));
    };

    const applyTheme = (t) => {
      document.documentElement.setAttribute('data-theme', t);
      syncThemeColorMeta(t);
    };

    applyTheme(theme.value);

    const toggleTheme = () => {
      theme.value = theme.value === 'dark' ? 'light' : 'dark';
      applyTheme(theme.value);
      try { localStorage.setItem(THEME_KEY, theme.value); } catch {}
    };

    // Follow OS preference if the user hasn't expressed one
    const onSchemeChange = (e) => {
      try { if (localStorage.getItem(THEME_KEY)) return; } catch {}
      theme.value = e.matches ? 'dark' : 'light';
      applyTheme(theme.value);
    };
    prefersDark.addEventListener?.('change', onSchemeChange);

    // Cursor tracking for dot-grid mask + cursor glow
    const onMove = (e) => {
      document.documentElement.style.setProperty('--mx', e.clientX + 'px');
      document.documentElement.style.setProperty('--my', e.clientY + 'px');
    };

    // Scroll velocity → subtle blur
    let lastY = 0, lastT = performance.now(), rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY;
        const t = performance.now();
        const v = Math.abs(y - lastY) / Math.max(1, t - lastT);
        const blur = Math.min(2, v * 0.8);
        document.documentElement.style.setProperty('--scroll-blur', blur + 'px');
        // Decay
        setTimeout(() => document.documentElement.style.setProperty('--scroll-blur', '0px'), 120);
        lastY = y; lastT = t; rafId = null;
      });
    };

    // Hover detection for cursor-glow growth
    const onHoverable = (e) => {
      const glow = document.getElementById('cursor-glow');
      if (!glow) return;
      const target = e.target.closest('a, button, .product-card, [data-hover]');
      glow.classList.toggle('hovering', !!target);
    };

    onMounted(() => {
      if (!window.matchMedia('(hover: none)').matches) {
        window.addEventListener('mousemove', onMove, { passive: true });
        window.addEventListener('mousemove', onHoverable, { passive: true });
      }
      window.addEventListener('scroll', onScroll, { passive: true });
    });
    onBeforeUnmount(() => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousemove', onHoverable);
      window.removeEventListener('scroll', onScroll);
      prefersDark.removeEventListener?.('change', onSchemeChange);
    });

    return { currentName, navItems, theme, toggleTheme };
  },
  template: `
  <!-- TOP NAV (desktop minimal, mobile logo-only) -->
  <header class="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-5 flex items-center justify-between pointer-events-none">
    <router-link to="/" class="pointer-events-auto">
      <logo size="text-xl md:text-2xl" />
    </router-link>
    <nav class="hidden md:flex gap-8 text-[10px] tracking-[0.3em] uppercase pointer-events-auto">
      <router-link v-for="n in navItems.slice(1)" :key="n.name" :to="n.to"
                   class="transition-colors hover:text-accent"
                   :class="currentName === n.name ? 'text-accent' : 'text-ink-dim'">
        {{ n.name }}
      </router-link>
    </nav>
    <div class="flex items-center gap-3 pointer-events-auto">
      <span class="md:hidden text-[10px] tracking-[0.3em] uppercase text-ink-low">{{ currentName }}</span>
      <button type="button"
              @click="toggleTheme"
              :aria-label="theme === 'dark' ? 'switch to light mode' : 'switch to dark mode'"
              :title="theme === 'dark' ? 'light mode' : 'dark mode'"
              class="theme-toggle w-9 h-9 rounded-full border border-line hover:border-accent hover:text-accent text-ink-dim flex items-center justify-center transition-colors">
        <!-- sun (shown in dark mode) -->
        <svg v-if="theme === 'dark'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
        <!-- moon (shown in light mode) -->
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      </button>
    </div>
  </header>

  <!-- PAGE CONTENT -->
  <main class="flex-1 flex flex-col scroll-blur-target pb-24 md:pb-0">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>

  <!-- BOTTOM NAV (mobile only) -->
  <nav class="bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around pt-2">
    <router-link v-for="n in navItems" :key="n.name" :to="n.to"
                 class="nav-item flex-1 flex flex-col items-center justify-center gap-1 py-2 text-ink-dim"
                 :class="{ active: currentName === n.name }">
      <!-- dotted icons -->
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <template v-if="n.icon === 'home'">
          <path d="M3 10 L11 3 L19 10 V18 H3 Z" />
          <circle cx="11" cy="14" r="1" fill="currentColor" />
        </template>
        <template v-else-if="n.icon === 'contact'">
          <rect x="3" y="5" width="16" height="12" rx="1.5" />
          <path d="M3 7 L11 12 L19 7" />
        </template>
        <template v-else-if="n.icon === 'why'">
          <circle cx="11" cy="11" r="8" />
          <path d="M9 9 Q9 7 11 7 Q13 7 13 9 Q13 10.5 11 11 V12.5" />
          <circle cx="11" cy="15" r="0.8" fill="currentColor" />
        </template>
      </svg>
      <span class="text-[9px] tracking-[0.25em] uppercase">{{ n.name }}</span>
    </router-link>
  </nav>
  `,
};

/* ============================================================
   MOUNT
   ============================================================ */
const app = createApp(App);
app.component('Logo', Logo);
app.component('MagneticLink', MagneticLink);
app.use(router);
app.mount('#app');