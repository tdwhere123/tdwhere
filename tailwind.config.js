/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        /* —— Museum palette (legacy names + museum aliases) —— */
        paper: "var(--paper)",
        "paper-warm": "var(--paper-warm)",
        "paper-deep": "var(--paper-deep)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        faint: "var(--faint)",
        tea: "var(--tea)",
        "tea-deep": "var(--tea-deep)",
        clay: "var(--clay)",
        moss: "var(--moss)",
        dai: "var(--dai)",
        seal: "var(--seal)",
        hairline: "var(--hairline)",
        night: "var(--night)",
        "night-2": "var(--night-2)",
        amber: "var(--amber)",
        "amber-dim": "var(--amber-dim)",
        "museum-bg": "var(--museum-bg)",
        "museum-bg-deep": "var(--museum-bg-deep)",
        "museum-ink": "var(--museum-ink)",
        "museum-muted": "var(--museum-muted)",
        "museum-stone": "var(--museum-stone)",
        "museum-brass": "var(--museum-brass)",
        "museum-dark": "var(--museum-dark)",
        "museum-line": "var(--museum-line)",
      },
      fontFamily: {
        serif: ["Fraunces", '"Noto Serif SC"', "serif"],
        sans: ["Inter", '"Noto Sans SC"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
        hand: ['"Ma Shan Zheng"', '"ZCOOL XiaoWei"', "cursive"],
      },
      fontSize: {
        hero: ["clamp(88px, 18vw, 208px)", { lineHeight: "1.05", letterSpacing: "0.02em" }],
        h1: ["clamp(38px, 5.6vw, 68px)", { lineHeight: "1.12" }],
        h2: ["clamp(28px, 3.8vw, 44px)", { lineHeight: "1.2" }],
        h3: ["clamp(20px, 2.4vw, 26px)", { lineHeight: "1.3" }],
      },
      maxWidth: {
        shell: "1240px",
        reading: "680px",
        demo: "1080px",
      },
      transitionTimingFunction: {
        zen: "cubic-bezier(0.22, 1, 0.36, 1)",
        stamp: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        card: "0 1px 0 rgba(32, 40, 39, 0.05)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "cue-drop": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "80%": { opacity: "0.15" },
          "100%": { transform: "translateY(24px)", opacity: "0" },
        },
        "quote-drift": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        scanlines: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "0 48px" },
        },
        "gate-breath": {
          "0%, 100%": { transform: "scaleX(1)" },
          "50%": { transform: "scaleX(0.35)" },
        },
        "ring-rotate": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "type-press": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(3px)" },
        },
        "lang-fade": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "cue-drop": "cue-drop 2.2s ease-in infinite",
        "quote-drift": "quote-drift 24s linear infinite",
        scanlines: "scanlines 12s linear infinite",
        "gate-breath": "gate-breath 4.8s ease-in-out infinite",
        "ring-rotate": "ring-rotate 60s linear infinite",
        "type-press": "type-press 2.6s ease-in-out infinite",
        "lang-fade": "lang-fade 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
