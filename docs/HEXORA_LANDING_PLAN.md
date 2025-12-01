# Hexora Landing Page - Implementation Plan

## 1. Design Analysis
**Theme:** Ultra-dark / Cyberpunk Professional.
**Colors:** 
- Background: `#0A0A0A` (Near Black) to `#000000`.
- Accents: Purple/Violet (`#8B5CF6`) for primary buttons and glows.
- Text: White (Headings), Grey-400 (Body).
**Typography:** Clean Sans-serif (Inter or similar), highly legible.

## 2. Page Architecture (Section by Section)

### A. Header (Navbar)
- **Left:** Logo "Hexora".
- **Center:** Links (Features, Resources, Testimonials, Pricing).
- **Right:** "Sign In" (Text), "Get Started" (Purple Button).
- **Behavior:** Fixed/Sticky with blur effect.

### B. Hero Section
- **Elements:**
  - "New Update" Pill Badge.
  - H1: "Visual Tools To Build Smarter Databases".
  - Subtext: "Transform ideas into scalable schemas...".
  - CTA: "Get Started Free" (White), "Watch Demo" (Outline).
  - **Visual:** Right-aligned abstract 3D dashboard/schema visualization. Needs a floating/glassmorphism effect.
  - **Social Proof:** "Support 100+ Database Integrations" + small icon row.

### C. Logo Ticker
- **Text:** "Powering teams from early-stage to unicorns".
- **Visual:** Marquee of greyed-out logos (Coinbase, Zoom, etc.).

### D. Feature Spotlight 1 (The Core)
- **Layout:** Center aligned text -> Large Feature Card.
- **Card:** Dark glass card with a glowing "Processor/Chip" icon in the center.
- **Effect:** Purple radial glow behind the chip.

### E. Feature Spotlight 2 (Efficiency)
- **Layout:** Large Feature Card -> Text.
- **Card:** Visualization of floating keyboard keys (A, S, Z, X).
- **Effect:** Keys should look tactile/3D.

### F. Bento Grid (Everything You Need)
- **Headline:** "Everything You Need To Build Smarter Databases".
- **Grid Layout:** 2x3 or mixed grid.
  1. **Integrations:** Orbiting logos around a central hub.
  2. **File Mgmt:** UI snippet of a file tree.
  3. **Compatibility:** Progress bars for MySQL, PostgreSQL, etc.
  4. **Schema Design:** Code editor snippet with syntax highlighting.
  5. **Collaboration:** User avatars with permission toggles.

### G. Keyboard Shortcuts Section
- **Headline:** "Master Every Command...".
- **Visual:** A full rendered keyboard layout (CSS or SVG).
- **Interaction:** Hovering keys might light them up.
- **List:** 3-column list of shortcuts below the keyboard.

### H. Pricing Section
- **Headline:** "Flexible Pricing That Scales...".
- **Cards:** 3 Cards (Starter, Pro, Enterprise).
- **Style:** Dark cards with subtle borders. "Pro" card might have a glow.

### I. FAQ Section
- **Layout:** Simple accordion list.

### J. Footer
- **Layout:** 5 Columns (Brand + Links).
- **Bottom:** Copyright + "Made with love".

## 3. Technical Requirements

### Libraries & Tools
- **Framework:** React + Vite.
- **Styling:** Tailwind CSS.
- **Icons:** `lucide-react` (for UI icons).
- **Animations:** `framer-motion` (essential for the smooth reveals and floating effects).
- **3D/Visuals:** CSS gradients and shadows for "glows". Maybe simple SVGs for the keyboard/chip to keep it lightweight.

### Assets Needed
- **Logos:** Company logos for the ticker (can use placeholders/lucide).
- **Hero Image:** Need a placeholder "Dashboard" image or build a CSS-only mock.
- **Keyboard Image:** Can be built with CSS Grid.

## 4. Animation Strategy
- **Scroll Reveal:** All sections fade in + move up (`y: 20 -> 0`).
- **Glows:** Pulse animations on the "Core" chip and "Get Started" buttons.
- **Floating:** Hero image should gently float up and down.
