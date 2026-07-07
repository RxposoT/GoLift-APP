---
name: GoLift
description: Portuguese-language fitness companion for tracking workouts, metrics, and progress
colors:
  primary: "#005CE6"
  primary-dark: "#0A84FF"
  accent: "#005CE6"
  accent-dark: "#0A84FF"
  accent-green: "#34C759"
  accent-green-dark: "#30D158"
  streak: "#FF9F0A"
  amber: "#f59e0b"
  bg: "#F2F2F7"
  bg-dark: "#080808"
  surface: "#FFFFFF"
  surface-dark: "#1C1C1E"
  surface-muted: "#E5E5EA"
  surface-muted-dark: "#2C2C2E"
  ink: "#000000"
  ink-dark: "#FFFFFF"
  ink-secondary: "#6C6C70"
  ink-secondary-dark: "#8E8E93"
  ink-tertiary: "#AEAEB2"
  ink-tertiary-dark: "#48484A"
  border: "#E5E5EA"
  border-dark: "#2C2C2E"
  border-light: "#F2F2F7"
  border-light-dark: "#1C1C1E"
  danger: "#FF3B30"
  health-gray: "#6b7280"
  health-green: "#10b981"
  health-lime: "#84cc16"
  health-orange: "#f97316"
  health-red: "#ef4444"
  health-darkred: "#991b1b"
  badge-purple: "#8B5CF6"
  badge-lavender: "#a78bfa"
  badge-gold: "#FF9500"
  badge-darkgold: "#FFD700"
  badge-coral: "#FF6B6B"
  neutral-soft: "#888"
  chart-indigo: "#5856D6"
  chart-lightblue: "#5AC8FA"
  chart-fuschia: "#d946ef"
  chart-green: "#22c55e"
  chart-yellow: "#FFD60A"
  chart-red: "#FF453A"
  ios-blue: "#007AFF"
typography:
  display:
    fontSize: 52
    fontWeight: 800
    letterSpacing: -2
  title1:
    fontSize: 32
    fontWeight: 800
    letterSpacing: -1
  title2:
    fontSize: 24
    fontWeight: 800
    letterSpacing: -0.5
  title3:
    fontSize: 20
    fontWeight: 700
    letterSpacing: -0.3
  headline:
    fontSize: 17
    fontWeight: 600
    letterSpacing: -0.2
  body:
    fontSize: 15
    fontWeight: 400
    letterSpacing: 0
  callout:
    fontSize: 14
    fontWeight: 400
    letterSpacing: 0
  subhead:
    fontSize: 13
    fontWeight: 500
    letterSpacing: 0.1
  footnote:
    fontSize: 12
    fontWeight: 400
    letterSpacing: 0.1
  caption:
    fontSize: 11
    fontWeight: 700
    letterSpacing: 1
    textTransform: uppercase
rounded:
  sm: 6
  md: 10
  lg: 14
  xl: 20
  xxl: 28
  full: 999
spacing:
  xxs: 2
  xs: 4
  sm: 8
  md: 12
  lg: 16
  xl: 20
  xxl: 24
  xxxl: 32
  huge: 48
  massive: 64
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.xl}"
    padding: "12px 20px"
    typography: headline
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "12px 20px"
    typography: headline
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.accent}"
    rounded: "{rounded.xl}"
    padding: "12px 20px"
    typography: headline
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#FFFFFF"
    rounded: "{rounded.xl}"
    padding: "12px 20px"
    typography: headline
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 12px"
  card-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  card-elevated:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
---

# Design System: GoLift

## 1. Overview

**Creative North Star: "The Quiet Powerhouse"**

GoLift is a premium fitness companion that earns its place on the home screen through restraint, not flash. Every pixel serves the training session: fast access to logs, glanceable metrics, and the satisfying weight of a streak maintained. The aesthetic is Apple Fitness+ if it were built for data-driven trainees — deep dark mode canvas, sparing use of the blue accent, typography that commands without shouting.

This system explicitly rejects the "fitness bro" visual culture: no neon gradients, no shredded silhouettes, no aggressive badges. It also rejects SaaS-generic warm neutrals and over-gamified toy interfaces. The app feels expensive because it's quiet — the data does the talking.

**Key Characteristics:**
- **Dark-mode primary.** The app lives in gyms, early mornings, low light. Dark surfaces are the hero; light mode is a clean, faithful adaptation.
- **One accent, used sparingly.** The blue (#005CE6 / #0A84FF) appears on ≤15% of any screen — primary actions, active states, the streak ring. Its rarity gives it weight.
- **Generous geometry.** 20px corner radius on cards, 10px on inputs, 12-20px button padding — nothing feels sharp or rushed.
- **Typography as architecture.** Heavy weights (800) at large sizes for hierarchy. Tight letter-spacing (-2 to -0.5) for a confident, condensed feel. No decorative fonts.
- **Haptic as a design material.** Buttons, interactions, and state changes use haptic feedback (light/medium impact) as a tactile signal layer.

## 2. Colors

A restrained palette built around a single blue accent on a neutral framework. Dark and light themes switch the background and surface layers while keeping accent and semantic colors stable but adapted for contrast.

### Primary
- **System Blue** (#005CE6 / oklch(50% 0.17 260)): The action color. Primary buttons, active tab indicators, accent links, streak completions. Used on ≤15% of any screen.
- **System Blue Dark** (#0A84FF / oklch(60% 0.19 255)): Dark mode adaptation of the primary — slightly lighter and more saturated to maintain contrast against dark surfaces. Same role, same rarity.

### Semantic
- **Green** (#34C759 / #30D158): Exclusively for completion states — streak filled, workout done, goal achieved. Never used decoratively.
- **Streak Orange** (#FF9F0A): The streak indicator, community avatar fallback. A warm accent reserved for the flame icon and streak-related UI. Used only where "heat" or "energy" is the semantic signal.
- **Amber** (#f59e0b): AI-powered features and tips, Pro subscription badge, medal/gold positions, password strength middle tier. Signals "attention-worthy" without the urgency of red.
- **Red** (#FF3B30): Danger and destructive actions. Delete buttons, error states, validation failures. Used only where system feedback demands it.

### Neutral
- **Ink** (#000000 / #FFFFFF): Body text at full weight. Maximum contrast.
- **Ink Secondary** (#6C6C70 / #8E8E93): Secondary text, labels, metadata. Hits ≥4.5:1 against backgrounds.
- **Ink Tertiary** (#AEAEB2 / #48484A): Placeholders, disabled text, hints. Lower contrast by design.
- **Background** (#F2F2F7 / #080808): The canvas. Light mode is the iOS system gray; dark mode is near-black (#080808) for deep, inky richness.
- **Surface** (#FFFFFF / #1C1C1E): Card and sheet backgrounds. Light mode pure white; dark mode subtle dark gray.
- **Surface Muted** (#E5E5EA / #2C2C2E): Tertiary surfaces, skeleton loaders, unselected states, icon containers.
- **Border** (#E5E5EA / #2C2C2E): Default border stroke for inputs, dividers.
- **Border Light** (#F2F2F7 / #1C1C1E): Subtle dividers, section gaps.

### Named Rules
**The One Voice Rule.** The blue accent never competes. Only one accent color exists. If something is interactive, it uses the blue or inherits the default text color. No secondary accent, no warm alternative. The blue's rarity (≤15% per screen) is its power. *Exception: achievement badges and IMC health segments use distinct tier colors (see Badge & Tier Colors below). These are decorative/narrative, not interactive.*

**The No-Data-Color Rule.** Semantic states (completed, pending, error, locked) use their own colors, not the accent. Green = done, red = error, gray = locked/unavailable. Blue = action. Never mix the two.

**Badge & Tier Colors.** Achievement badges, medal positions, and IMC health segments use a multi-color palette by design — each color carries tier/severity information that blue alone cannot convey. These are the only zones where the palette expands beyond the single accent:
- **Medals:** #f59e0b (gold), #94a3b8 (silver), #cd7f32 (bronze)
- **Badge rarities:** Common badges use the blue accent; rare badges use purple (#BF5AF2) or orange (#FF9F0A); locked badges are gray
- **IMC health bar:** A 7-step ramp from gray (underweight) through green (healthy) and amber (overweight) to red (obese) — follows the medical convention, not a decorative choice
- **Password strength:** red (weak) → amber (medium) → green (strong) — standard UX pattern

## 3. Typography

**Display Font:** System font (SF Pro on iOS, Roboto on Android) — platform-native by design, no custom font loading.
**Body Font:** System font (same stack).
**Label/Mono Font:** System font (same stack).

**Character:** Confident and architectural. Heavy weights at large sizes create a bold, condensed feel; tight tracking (-2 to -0.5) on display sizes. At body sizes the type recedes into readability. No decorative fonts, no variable axes. The system font is the right choice: zero loading cost, perfect platform-native rendering, familiar to users.

### Hierarchy
- **Display** (800, 52px, -2 tracking): Hero headlines — the user's name on the home screen, large achievement callouts. *Extremely rare; 1-2 per screen maximum.*
- **Title 1** (800, 32px, -1 tracking): Primary screen titles, modal headers.
- **Title 2** (800, 24px, -0.5 tracking): Section headers within scrollable content.
- **Title 3** (700, 20px, -0.3 tracking): Card titles, workout names, community group names.
- **Headline** (600, 17px, -0.2 tracking): Button labels, tappable list items, emphasized body.
- **Body** (400, 15px, 0 tracking): The default reading size. Most content, descriptions, paragraphs. Max line length 65ch.
- **Callout** (400, 14px, 0 tracking): Secondary information, supplementary text.
- **Subhead** (500, 13px, 0.1 tracking): Labels above inputs, section subtitles, metadata.
- **Footnote** (400, 12px, 0.1 tracking): Legal text, timestamps, helper text.
- **Caption** (700, 11px, 1 tracking, uppercase): Badge labels, tab indicators, small UI tags.

### Named Rules
**The No-Custom-Font Rule.** GoLift uses the system font stack exclusively. No custom typography. Custom fonts add loading latency, layout shift, and platform rendering inconsistencies for zero functional gain in a data-forward fitness app.

**The Tight Tracking Rule.** At display sizes (≥20px), tracking is always negative (-0.3 to -2). Positive tracking is reserved for the caption variant only (uppercase labels at 11px, +1 tracking).

## 4. Elevation

GoLift uses iOS-style layered elevation: depth is conveyed through tonal layering and subtle drop shadows, not through heavy box-shadows or blurs. The default state of every surface is flat (no shadow). Elevation is a response to hierarchy — cards that need separation from the canvas.

**Light mode:** Shadows are faint (6-15% opacity black) with minimal blur radius. The effect is a gentle lift, not a floating card.
**Dark mode:** Shadows use higher opacity (30%) but the same blur physics. On near-black backgrounds, tonal layering (surface vs. surface-muted) does more work than shadows.

### Shadow Vocabulary
- **Level 1** (elevation 1, offset 0/1, opacity 6% light / 30% dark, blur 2): Small inset-adjacent elements, subtle dividers.
- **Level 2** (elevation 2, offset 0/2, opacity 10% light / 30% dark, blur 4): Default card elevation. Cards that sit above the background.
- **Level 3** (elevation 3, offset 0/4, opacity 15% light / 30% dark, blur 12): Modals, action sheets, floating UI. Highest natural elevation.

### Named Rules
**The Flat-At-Rest Rule.** Surfaces start flat. Shadows appear only as a response to hierarchy need — cards on a background canvas get level 2; everything else stays flat. Never add a shadow to a surface that is already differentiated by color.

## 5. Components

### Buttons
- **Shape:** Generously rounded (radius xl / 20px). Full-width by default on mobile sheets; inline padding on toolbar contexts.
- **Primary (blue, white text, headline weight):** The default call-to-action. Blue background (#005CE6 / #0A84FF), white text, 12px vertical / 20px horizontal padding. Pressed state shifts via opacity (0.7). Light haptic feedback on press.
- **Secondary (white/gray surface, ink text):** For non-primary actions on the same surface. Uses backgroundSecondary (#FFFFFF / #1C1C1E), inherits text color. Subtle border via borderLight. Pressed opacity 0.7.
- **Ghost (transparent, blue text):** Text-only actions with no container. Blue text inheriting from accent. For tertiary actions, "skip" flows, and links.
- **Danger (red, white text):** Destructive confirmation. Red background (#FF3B30), white text. Used only where system feedback demands it.
- **Loading state:** Replaces children with ActivityIndicator in matching color. Disabled interaction during loading.
- **Sizes:** sm (8px vertical / 16px horizontal), md (12px / 20px), lg (16px / 24px).

### Cards / Containers
- **Corner Style:** Generously rounded (radius xl / 20px).
- **Background:** surface (#FFFFFF / #1C1C1E) — always lighter than the canvas in dark mode, always white in light mode.
- **Shadow Strategy:** Elevated cards use level 2 shadow. Non-elevated cards are flat with tonal differentiation only.
- **Border:** None by default. Cards rely on tonal separation (surface vs. background).
- **Internal Padding:** lg (16px) default.
- **Gradient variant:** Uses LinearGradient with subtle tonal shift (surface → surface-muted or surface → border) for visual emphasis without adding color.

### Inputs / Fields
- **Style:** Filled with backgroundSecondary (#FFFFFF / #1C1C1E). Border stroke 1px in border color (#E5E5EA / #2C2C2E).
- **Shape:** Rounded md (10px).
- **Focus:** Border shifts to accent blue (#005CE6 / #0A84FF). No glow, no shadow — clean focus indicator.
- **Error:** Border shifts to danger red (#FF3B30). Error message appears below in footnote size with red color.
- **Disabled:** Reduced opacity (0.4).
- **Icons:** Optional 18px leading icon in textTertiary for search/email/password fields.
- **Password toggle:** Eye icon button with 8px hit slop for accessibility.

### Navigation (Tab Bar)
- **Style:** Floating pill bar above safe area bottom. Dark blur background (BlurView) in both modes. Generous internal padding.
- **Icons:** Ionicons, 24px at rest. Active tab uses filled variant (e.g., "home" vs. "home-outline") in accent blue.
- **Label:** Caption variant (11px, 700 weight, uppercase, 1 tracking). Active tab is blue, inactive is textTertiary.
- **Floating play button:** Centered circular button with gradient background (accent → primary) for workout start. Scale-down press animation with spring.
- **Animation:** Tab items animate scale to 0.9 and translate up 8px on press with spring physics. Smooth native transitions.

### Loading / Empty States
- **Skeleton Loaders:** Platform-native shimmer using Animated opacity pulse (1 → 0.3, 800ms cycle). Per-screen composites (HomeScreenSkeleton, WorkoutsScreenSkeleton, etc.) with layout-matching geometry. Background uses surfaceMuted (#E5E5EA / #2C2C2E), radius 6-10px.
- **Empty State:** Centered layout with 64px circular icon container (surfaceMuted bg + textTertiary icon, 28px). Title3 heading + body subtitle + optional primary CTA button. Handles every "no data yet" scenario.
- **Loading Overlay:** Semi-transparent black overlay (40% opacity). Centered card with surface background, radius lg (14px), ActivityIndicator in accent color + optional subhead message.

### Streak Bar
- **Signature component.** Horizontal row of 7 day indicators, each showing the day initial ("S", "T", "Q", "Q", "S", "S", "D" for Portuguese).
- **State:** Completed days fill with accent blue; today has a subtle outlined style; future days are muted.
- **Tappable:** Opens a modal showing full streak calendar with history. Modal uses standard card styling.

### List Items
- **Style:** Full-width pressable rows. No border by default (tonal separation). Optional chevron icon for navigation items.
- **Padding:** md vertical (12px) inside cards.
- **Feedback:** Haptic light on press + opacity feedback.

### Dialog (Gorila)
- **Custom dialog system** for contextual interactions (daily check-in, workout feedback, community reactions).
- **Style:** Modal overlay with backdrop blur or semi-transparent background. Surface card with title/subhead/action buttons.
- **Animation:** Fade + scale entrance, spring physics.

## 6. Do's and Don'ts

### Do:
- **Do** use dark mode as the primary design target. The app is used in gyms, early mornings, and low-light environments. Light-mode is a faithful adaptation, not the hero.
- **Do** keep the blue accent to ≤15% of any screen. Its rarity gives it meaning. Every blue element should answer "what can the user do here?"
- **Do** use the system font stack exclusively. Zero loading cost, perfect rendering, no layout shift.
- **Do** use haptic feedback (light impact) for button presses and state changes. It's a tactile signal layer that reinforces the premium feel.
- **Do** keep cards flat at rest. Elevation (level 2 shadow) is for cards that need visual separation from the canvas, not a default.
- **Do** use generous corner radius (20px for cards, 10-14px for buttons and inputs). The geometry should feel soft and considered.
- **Do** use text-wrap strategies: balance on headings, pretty on body text.
- **Do** animate with purpose — state changes, feedback, and transition guidance only. No decorative bounce.
- **Do** respect `prefers-reduced-motion`: every animation must degrade gracefully to instant transitions.
- **Do** verify body text contrast hits ≥4.5:1 against its background in both themes.

### Don't:
- **Don't** use gradient text (`background-clip: text`). Use a single solid color. Emphasis via weight or size.
- **Don't** use side-stripe borders (border-left/border-right >1px as a colored accent). Use full borders, background tints, or nothing.
- **Don't** pair the accent blue with warm colors or secondary accents. The blue speaks alone.
- **Don't** use neon, aggressive, or "fitness bro" visual language — no shredded silhouettes, no dark-gritty textures, no motivational-quote-as-design.
- **Don't** over-gamify. Streaks, XP, and levels should feel earned and data-driven, not like a children's toy. No cartoon achievements, no celebratory animations for routine actions.
- **Don't** use the cream/warm-neutral body background that has become the default AI aesthetic. Light mode uses iOS system gray (#F2F2F7); dark mode uses near-black (#080808).
- **Don't** use decorative glassmorphism (blur effects as surface styling). Reserve backdrop blur for the tab bar and modal overlays only.
- **Don't** use the hero-metric template (big number, small label, supporting stats, gradient accent) as a layout pattern. Surface metrics plainly.
- **Don't** use numbered section markers (01 / 02 / 03) as decorative scaffolding.
- **Don't** use tiny uppercase tracked eyebrow headers above every section. One named kicker as voice, not an eyebrow on every card.
- **Don't** use z-index values like 999 or 9999 — use the semantic scale (dropdown → sticky → modal-backdrop → modal → toast → tooltip).
- **Don't** nest cards. Cards should be siblings or standalone, never children of other cards.
