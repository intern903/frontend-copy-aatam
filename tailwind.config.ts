import type { Config } from "tailwindcss";

// Design tokens from Figma: "Aatam - Bridge to I (Copy)".
// Colours = local paint styles. Type = "Mobile/*" text styles + Typography Primitives.
// Spacing, radii and shadows have no Figma variables; these are the recurring values on the screens.
// Theme keys below REPLACE Tailwind's defaults, so only design values are available.

const ramp = (values: string[]) =>
  Object.fromEntries(values.map((v, i) => [String((i + 1) * 100), v]));

const heatmap = (values: string[]) =>
  Object.fromEntries(values.map((v, i) => [String(i + 1), v]));

const px = (values: number[]) =>
  Object.fromEntries(values.map((v) => [String(v), `${v}px`]));

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#ffffff",
      black: "#000000",
      alert: "#fa0202", // notification dot on the home header bell
      danger: "#ff383c", // Figma accents/red — "Wrong credentials", Sign out tile
      cancel: { DEFAULT: "#d9d9d9", text: "#3d3d3d" }, // Cancel buttons in Settings; CIF progress track
      ring: "#b0b0b0", // Figma grid/light grey — life-wheel rings
      line: "#e3ded8", // unticked checklist circles (Life Purpose)
      olive: "#414a32", // current page dot (Previous Drafts)
      // Figma "CCA - Start" / "CCA - Chat"
      chat: { line: "#b5b5b5", bubble: "#e9ecef", muted: "#7b7b7b" },

      primary: ramp(["#e5f1e5", "#cbe2cc", "#b2d4b2", "#98c599", "#7eb77f", "#659266", "#4c6e4c", "#324933"]),
      pink: ramp(["#fae8e6", "#f5d1cc", "#f1bab3", "#eca399", "#e78c80", "#b97066", "#8b544d", "#5c3833"]),
      blue: ramp(["#e2e8ef", "#c5d1df", "#a8bbce", "#8ba4be", "#6e8dae", "#58718b", "#425568", "#2c3846"]),
      yellow: ramp(["#f7edd9", "#f0dbb3", "#e8c88d", "#e1b667", "#d9a441", "#ae8334", "#826227", "#57421a"]),
      brown: ramp(["#f1e5dd", "#e3cabb", "#d6b099", "#c89577", "#ba7b55", "#956244", "#704a33", "#4a3122"]),
      background: {
        ...ramp(["#fefdfc", "#fefbf9", "#fdfaf6", "#fdf8f3", "#fcf6f0", "#cac5c0", "#979490", "#656260"]),
        DEFAULT: "#fcf6f0", // Background/500 — fill of every 393px screen
      },

      // Text colours (not styles in Figma; used across the screens)
      ink: {
        DEFAULT: "#000000",
        80: "rgb(0 0 0 / 0.8)",
        75: "rgb(0 0 0 / 0.75)",
        60: "rgb(0 0 0 / 0.6)",
        50: "rgb(0 0 0 / 0.5)",
        25: "rgb(0 0 0 / 0.25)",
        brown: "#423827",
        grey: "#474747", // Figma text/grey — chart legend
        muted: "#a09b93", // eye icon + checkbox border on the auth screens
      },

      heatmap: {
        brown: heatmap(["#f8ebe2", "#f4e0d2", "#f0d5c2", "#eccab1", "#e8bea1", "#e2b08d", "#dea57c", "#da9a6c", "#d68f5c", "#d2844b"]),
        green: heatmap(["#e2f8e6", "#d2f4d8", "#c2f0c9", "#b1ecbb", "#a1e8ad", "#8de29b", "#7cde8d", "#6cda7e", "#5cd670", "#4bd262"]),
        pink: heatmap(["#f8e2eb", "#f4d2e0", "#f0c2d5", "#ecb1ca", "#e8a1be", "#e28db0", "#de7ca5", "#da6c9a", "#d65c8f", "#d24b84"]),
        blue: heatmap(["#e2edf8", "#d2e3f4", "#c2d9f0", "#b1cfec", "#a1c4e8", "#8db8e2", "#7cadde", "#6ca3da", "#5c99d6", "#4b8fd2"]),
        yellow: heatmap(["#f8f3e2", "#f4ebd2", "#f0e4c2", "#ecddb1", "#e8d6a1", "#e2cd8d", "#dec67c", "#dabf6c", "#d6b85c", "#d2b04b"]),
      },
    },

    fontFamily: {
      heading: ["var(--font-poppins)", "sans-serif"], // family/heading
      body: ["var(--font-dm-sans)", "sans-serif"], // family/body
      mono: ["var(--font-jetbrains-mono)", "monospace"], // family/mono
    },

    fontWeight: {
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },

    // Mobile/* text styles: [size, { lineHeight, letterSpacing, fontWeight }]
    fontSize: {
      display: ["36px", { lineHeight: "43.2px", letterSpacing: "-0.54px", fontWeight: "600" }],
      h1: ["28px", { lineHeight: "35px", letterSpacing: "-0.28px", fontWeight: "600" }],
      h2: ["24px", { lineHeight: "31.2px", letterSpacing: "-0.24px", fontWeight: "600" }],
      h3: ["20px", { lineHeight: "27px", letterSpacing: "-0.1px", fontWeight: "500" }],
      h4: ["18px", { lineHeight: "25.2px", letterSpacing: "0px", fontWeight: "500" }],
      overline: ["12px", { lineHeight: "16.8px", letterSpacing: "0.72px", fontWeight: "600" }],
      "body-large": ["18px", { lineHeight: "25.6px", letterSpacing: "0px", fontWeight: "400" }],
      body: ["16px", { lineHeight: "21px", letterSpacing: "0px", fontWeight: "400" }],
      "body-medium": ["15px", { lineHeight: "22.5px", letterSpacing: "0px", fontWeight: "500" }],
      "body-small": ["13px", { lineHeight: "19.5px", letterSpacing: "0px", fontWeight: "400" }],
      caption: ["11px", { lineHeight: "15.4px", letterSpacing: "0.11px", fontWeight: "500" }],
      // Settings avatar initials (Display style, enlarged to 64/64 in Figma)
      "avatar-initials": ["64px", { lineHeight: "64px", letterSpacing: "-0.54px", fontWeight: "600" }],
      // Desktop/Caption — used on the mobile Login screen for "Remember me" / "Forgot Password"
      "caption-lg": ["12px", { lineHeight: "16.8px", letterSpacing: "0.12px", fontWeight: "500" }],
      "button-cta": ["14px", { lineHeight: "14px", letterSpacing: "0.14px", fontWeight: "600" }],
      "stat-display": ["36px", { lineHeight: "39.6px", letterSpacing: "0px", fontWeight: "700" }],
      "stat-large": ["24px", { lineHeight: "27.6px", letterSpacing: "0px", fontWeight: "500" }],
      "data-table": ["14px", { lineHeight: "21px", letterSpacing: "0px", fontWeight: "400" }],
      "data-small": ["12px", { lineHeight: "16.8px", letterSpacing: "0px", fontWeight: "400" }],
      "micro-data": ["10px", { lineHeight: "13px", letterSpacing: "0px", fontWeight: "500" }],
    },

    // Keys are pixel values: p-16 = 16px.
    spacing: {
      0: "0px",
      px: "1px",
      ...px([2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40]), // 40 recurs across the Settings screens
    },

    borderRadius: {
      none: "0px",
      ...px([2, 4, 8, 12, 16, 24]),
      pill: "9999px",
    },

    boxShadow: {
      none: "none",
      card: "0 0 12px 0 rgb(0 0 0 / 0.25)",
      "card-sm": "0 0 4px 0 rgb(0 0 0 / 0.25)",
      "input-inset": "inset 0 0 4px 0 rgb(0 0 0 / 0.25)",
      image: "0 0 12px 0 rgb(0 0 0 / 0.5)",
      // Not in Figma: the live CIF form's floating booking button
      fab: "0 6px 20px rgb(74 49 34 / 0.28)",
    },

    extend: {
      // Screens are designed at 393 × 852.
      width: {
        frame: "393px",
        content: "329px", // frame minus 32px gutters; header + bottom nav width
        toggle: "40px",
        wordmark: "150px", // CIF header wordmark
        "story-card": "250px", // Life Purpose story card
        "cluster-canvas": "560px", // the word board scrolls sideways inside its 329px panel
        "logo-large": "215px", // CIF welcome logo
      },
      maxWidth: { frame: "393px" },
      minHeight: { frame: "852px" },

      // Shell measurements from the RG / CCA screens (BNB-21 bottom nav, Frame 366 header)
      spacing: {
        "header-top": "70px", // header y on every screen (below the 62px iOS status bar)
        "nav-item": "25.5px", // padding around each bottom-nav item
        "nav-underline": "1.5px", // label → underline offset (3px gap minus the 1.5px stroke)
        "nav-clearance": "120px", // spacer the screens leave below content for the bottom nav
        "login-top": "166px", // Login card y
        "signup-top": "176px", // Password Setup / Reset Password card y
        "forgot-top": "216px", // Forgot Password card y
        "check-mail": "40px", // Check Mail card padding
        "cif-top": "102px", // CIF wordmark y
        "cif-logo-top": "191px", // CIF welcome logo y
      },
      borderWidth: {
        hairline: "0.5px",
      },
      height: {
        nav: "75px",
        frame: "852px",
        "area-card": "150px", // life-area image cards
        toggle: "20px",
        wordmark: "65px",
        "story-card": "350px",
        "cluster-board": "521px", // Life Purpose clustering panel
        "power-card": "200px", // power words photo card on the writing screen
        "draft-card": "295px", // draft statement card
        "purpose-card": "330px", // final statement card
        "foundation-map": "1141px", // Figma "LP - Final State" frame, scrolled
        "purpose-banner": "244px", // Life Purpose card above the Vision screens
        "answer-box": "100px", // Vision answer and statement fields
        "answer-card": "138px", // Vision write: earlier answers, scrolled sideways
        "vision-board": "520px", // Vision board canvas (not in Figma)
        "booking-panel": "401px", // "Book a call with Dinesh" panel
        "logo-large": "200px",
      },
      // Figma prototype transition on every home link: SLIDE_IN from the right, 0.3s, ease in and out
      keyframes: {
        "slide-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        // Power words: the clusters gather into the words (Life Purpose flow, step 13)
        rise: {
          from: { opacity: "0", transform: "translateY(12px) scale(0.96)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // A card turning over to its other side (vision cards)
        "card-turn": {
          from: { transform: "rotateY(90deg)" },
          to: { transform: "rotateY(0deg)" },
        },
      },
      animation: {
        "slide-in": "slide-in 300ms ease-in-out",
        rise: "rise 500ms ease-out",
        "card-turn": "card-turn 250ms ease-out",
      },
      size: {
        "icon-button": "40px",
        icon: "24px",
        logo: "161px",
        avatar: "50px", // home header buttons
        "avatar-lg": "120px", // Settings avatar
        "toggle-knob": "18px",
        wheel: "230px", // CIF life wheel
        check: "20px", // CIF checkbox
        node: "68px", // Life Purpose map nodes (dashed ring)
        "node-inner": "60px",
        "icon-lg": "32px",
        "board-photo": "120px", // a photo on the vision board (not in Figma)
      },
    },
  },
  plugins: [],
};
export default config;
