# ZENTRA AI — Dynamic View Color System

## Design Philosophy (from user's reference)
- Use VIBRANT saturated colors with HIGH CONTRAST on dark backgrounds
- Max 2-3 vivid colors per page, rest is dark/neutral for eye rest
- Neon/vivid colors ONLY on important elements (buttons, headings, focal points) — like a highlighter, not a paintbrush
- Place neon tones on dark backgrounds for maximum pop

## Color Palette

### Backgrounds (Dark, Deep)
- `#08080f` → Near-black navy (main bg) — KEEP
- `#0D0D1A` → Nearly black (alt bg)
- Cards: `bg-white/[0.02]` with `border-white/[0.06]` — KEEP

### Primary Accent: Teal/Cyan (#00C9A7 → #06B6D4)
- Used for: PRIMARY CTA buttons, active states, links, main brand gradient
- Tailwind: `teal-400`, `teal-500`, `cyan-400`, `cyan-500`
- CSS var --primary: 172 100% 39% (teal-500)

### Secondary Accent: Electric Violet (#7C3AED → #8B5CF6)
- Used for: AI features, premium/pro elements, secondary gradients
- Tailwind: `violet-500`, `violet-600`, `purple-500`

### Energy Accent: Cherry Tomato / Amber (#FF6B35 → #F59E0B)
- Used for: Warnings, attention, sales highlights, price tags
- Tailwind: `amber-400`, `amber-500`, `orange-500` (SPARINGLY)
- Only 1 orange element per page max

### Digital Highlight: Neon Pink (#EC4899 → #F472B6)
- Used for: Special highlights, badges, "hot" items
- Tailwind: `pink-400`, `pink-500`, `fuchsia-500`

### Nature: Emerald (#10B981 → #34D399)
- Used for: Success states, revenue/positive metrics, "connected" status
- Tailwind: `emerald-400`, `emerald-500`

### Info: Sky Blue (#0EA5E9 → #38BDF8)
- Used for: Information, data, analytics
- Tailwind: `sky-400`, `sky-500`

### Text Colors
- Primary text: `text-white/90` or `text-white/80`
- Secondary: `text-white/50`
- Muted: `text-white/30`
- NO neon text for body copy

## Gradient Combinations (key brand gradients)

| Name | Gradient | Usage |
|------|----------|-------|
| Brand Hero | `from-teal-400 via-cyan-300 to-sky-400` | Hero headline, Z logo |
| AI Glow | `from-violet-500 via-fuchsia-500 to-pink-500` | AI features |
| Revenue | `from-emerald-400 to-teal-400` | Sales, revenue cards |
| Premium | `from-amber-400 to-orange-500` | Premium badges, pricing |
| CTA Primary | `from-teal-500 to-cyan-600` | Main action buttons |
| CTA Secondary | `from-violet-500 to-fuchsia-600` | Secondary action buttons |

## Per-Page Color Mapping

### Landing Page
- Hero text gradient: `from-teal-400 via-cyan-300 to-sky-400` (aqua flow)
- Background glow orbs: teal-500/10, violet-500/10, fuchsia-500/10 (varied!)
- CTA button: `bg-gradient-to-r from-teal-500 to-cyan-600 shadow-teal-500/25`
- Secondary CTA: `border-teal-500/30 hover:bg-teal-500/5`
- LIVE badge: `text-emerald-400 border-emerald-500/30 bg-emerald-500/5`
- Stats counters: each a DIFFERENT color:
  - ร้านค้า: teal-400
  - คำสั่งซื้อ: violet-400
  - Uptime: emerald-400
  - Rating: amber-400
- Feature cards colors array (each card different):
  ```
  from-teal-500 to-cyan-500
  from-violet-500 to-fuchsia-500
  from-amber-500 to-orange-500
  from-emerald-500 to-teal-500
  from-pink-500 to-rose-500
  from-sky-500 to-blue-500
  ```
- Steps section: icons each different color
- Pricing highlight: `ring-teal-500/60 shadow-teal-500/10`
- Price gradient text: `from-teal-400 to-cyan-400`
- Footer/CTA: `from-teal-500 to-cyan-600`

### Z Logo
- `bg-gradient-to-br from-teal-400 via-cyan-400 to-sky-500`
- Shadow: `shadow-teal-500/20`

### Sidebar
- Active item: `bg-gradient-to-r from-teal-500/15 to-cyan-500/10`
- Active text: `text-teal-400`
- Store management group: blue-themed icons
- AI Tools group: violet-themed icons
- Marketplace group: emerald-themed icons

### Dashboard
- Revenue card: `from-emerald-500 to-teal-500` icon `text-emerald-500`
- Monthly sales: `from-sky-500 to-blue-500` icon `text-sky-500`
- Orders: `from-amber-500 to-orange-500` icon `text-amber-500`
- Customers: `from-violet-500 to-fuchsia-500` icon `text-violet-500`
- AI badge: `text-violet-500 border-violet-500/30`
- Live dot: `bg-emerald-400`

### Auth Page
- Glow orbs: teal-500/10, violet-500/10
- Submit button: `from-teal-500 to-cyan-600`
- Toggle link: `text-teal-400`
- Logo: teal gradient

### Mall Page  
- Active category pill: `from-teal-500 to-cyan-600`
- Price: `text-emerald-400`
- Store icon: teal gradient
- Hover: `border-teal-500/20`

### AI Agents
- Each agent a different color pair:
  - Shopping Assistant: from-teal-500 to-cyan-500
  - Recommendation: from-violet-500 to-fuchsia-500
  - Dynamic Pricing: from-amber-500 to-orange-500
  - Customer Support: from-emerald-500 to-green-500
  - Inventory: from-sky-500 to-blue-500
  - Visual Search: from-pink-500 to-rose-500

### Store Settings
- Tab active: `from-teal-500/20 to-cyan-500/20`
- Save buttons: `from-teal-500 to-cyan-600`
- Section icons: varied (teal, violet, emerald, sky)

### Affiliate
- Stats icons: varied colors
- Add button: `from-teal-500 to-cyan-600`

### Marketplace
- Keep platform brand colors (Shopee=orange, Lazada=blue, TikTok=pink, LINE=green)
- Connect buttons: each platform's brand color

## CSS Variables Update

### Dark mode (.dark)
```
--primary: 172 100% 39%        /* Teal */
--primary-foreground: 0 0% 100%
--secondary: 258 90% 58%       /* Violet */  
--secondary-foreground: 0 0% 100%
--ring: 172 100% 39%
--sidebar-primary: 172 100% 39%
--sidebar-ring: 172 100% 39%
--sidebar-accent: 172 20% 14%
--accent: 172 15% 15%
--chart-1: 172 100% 42%        /* Teal */
--chart-2: 258 90% 62%         /* Violet */
--chart-3: 160 84% 42%         /* Emerald */
--chart-4: 189 94% 48%         /* Cyan */
--chart-5: 330 81% 60%         /* Pink */
```

### Light mode (:root)
```
--primary: 172 100% 32%
--secondary: 258 90% 52%
--ring: 172 100% 32%
--sidebar-primary: 172 100% 32%
--sidebar-ring: 172 100% 32%
--sidebar-accent: 172 10% 90%
--accent: 172 30% 94%
--chart-1: 172 100% 35%
--chart-2: 258 90% 55%
--chart-3: 160 84% 36%
--chart-4: 189 94% 40%
--chart-5: 330 81% 55%
```

## card-glow update
```css
.card-glow:hover {
  box-shadow: 0 0 20px rgba(0, 201, 167, 0.15), 0 0 40px rgba(0, 201, 167, 0.08);
  border-color: hsl(172 100% 39% / 0.4);
}
```

## gradient-border update
```css
background: linear-gradient(135deg, hsl(172 100% 39%), hsl(258 90% 58%), hsl(330 81% 60%));
```

## IMPORTANT RULES
1. MAX 2-3 vibrant colors per page section
2. Rest is neutral dark backgrounds
3. Orange/amber used VERY sparingly (only for energy/attention)
4. Each functional area has its own color identity
5. Neon only on focal points (buttons, headings, badges)
6. Body text stays white/gray — NEVER neon
