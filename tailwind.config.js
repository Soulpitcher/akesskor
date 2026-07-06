/**
 * Tailwind-konfiguration för Åkes Skor.
 *
 * CSS:en är förkompilerad till tailwind.css (ingen CDN i produktion).
 * Efter ändringar i index.html, bygg om med:
 *
 *   npx tailwindcss@3.4 -c tailwind.config.js -i tailwind.source.css -o tailwind.css --minify
 *
 * Alla färg-/typografivärden pekar på CSS-variablerna i style.css.
 */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      /* ── FÄRGER ─────────────────────────────────────────────────
         <alpha-value> är Tailwinds platshållare för opacity-klasser,
         t.ex. bg-primary/80, text-secondary/50. */
      colors: {
        'primary':           'rgb(var(--primary-ch)          / <alpha-value>)',
        'primary-dark':      'rgb(var(--primary-dark-ch)     / <alpha-value>)',
        'on-primary':        'rgb(var(--on-primary-ch)       / <alpha-value>)',
        'on-primary-alt':    'rgb(var(--on-primary-alt-ch)   / <alpha-value>)',
        'secondary':         'rgb(var(--secondary-ch)        / <alpha-value>)',
        'on-secondary':      'rgb(var(--on-secondary-ch)     / <alpha-value>)',
        'accent':            'rgb(var(--accent-ch)           / <alpha-value>)',
        'on-accent':         'rgb(var(--on-accent-ch)        / <alpha-value>)',
        'surface':           'rgb(var(--surface-ch)          / <alpha-value>)',
        'surface-low':       'rgb(var(--surface-low-ch)      / <alpha-value>)',
        'surface-mid':       'rgb(var(--surface-mid-ch)      / <alpha-value>)',
        'surface-high':      'rgb(var(--surface-high-ch)     / <alpha-value>)',
        'surface-highest':   'rgb(var(--surface-highest-ch)  / <alpha-value>)',
        'on-surface':        'rgb(var(--on-surface-ch)       / <alpha-value>)',
        'on-surface-muted':  'rgb(var(--on-surface-muted-ch) / <alpha-value>)',
        'outline':           'rgb(var(--outline-ch)          / <alpha-value>)',
        'outline-dim':       'rgb(var(--outline-dim-ch)      / <alpha-value>)',
      },

      /* ── TYPSNITT ─────────────────────────────────────────────── */
      fontFamily: {
        headline: ['var(--font-serif)'],
        body:     ['var(--font-sans)'],
        label:    ['var(--font-sans)'],
      },

      /* ── STORLEKAR ────────────────────────────────────────────── */
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1' }],                    /* 10px — badge-text */
        'hero': ['clamp(3.5rem, 8vw, 6rem)', { lineHeight: '0.9' }], /* fluid hero */
      },

      /* ── BOKSTAVSAVSTÅND ──────────────────────────────────────── */
      letterSpacing: {
        overline: '0.15em',   /* etiketter, knappar, nav-länkar */
      },
    },
  },
};
