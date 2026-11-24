# BorderPay — Blue Glassmorphism Design System Specification
**Document ID:** BP-DES-001  
**Author:** AGENT 02 (UI/UX Designer)  
**Date:** November 2026  
**Theme:** Premium Blue Glassmorphism Web3 Fintech

---

## 1. Visual Language & Metaphor

The BorderPay design system embodies the sophistication of institutional cross-border liquidity platforms blended with the futuristic transparency of decentralized protocols. 

The visual metaphor centers on **Layered Optical Glass immersed in Deep Oceanic Navy Space**, punctuated by **Vibrant Electric Blue refractive glows** and **Translucent Crystal interfaces**.

---

## 2. Color Palette & Token Definitions

```
Background Dark:  #030A22  (Deep Void Canvas)
Deep Navy:        #03195B  (Sub-surface Layers & Glass bases)
Royal Blue:       #0B2CB1  (Card Accents & Active States)
Electric Blue:    #1951FC  (Primary Brand, Action Glows)
Bright Blue:      #3781FC  (Interactive Hover & Highlights)
Ice Blue:         #CBE9FD  (High-contrast Text & Specular Refractions)
White:            #FFFFFF  (Primary Foreground Text)
Muted Blue Text:  #A9BEE4  (Secondary & Supporting Descriptions)
Border Glass:     rgba(255, 255, 255, 0.10) to rgba(55, 129, 252, 0.25)

Feedback Tokens:
- Success Emerald: #34D399 (Blockchain Confirmation, Valid Invoices)
- Warning Amber:   #FBBF24 (Expiring Invoices, Network Mismatch)
- Error Rose:      #FB7185 (Replay Attempts, Insufficient Balance, Tampered URL)
```

### 2.1 CSS Custom Properties Matrix
```css
:root {
  --bg-dark: #030a22;
  --navy-deep: #03195b;
  --blue-royal: #0b2cb1;
  --blue-electric: #1951fc;
  --blue-bright: #3781fc;
  --blue-ice: #cbe9fd;
  --text-primary: #ffffff;
  --text-muted: #a9bee4;
  --border-glass: rgba(255, 255, 255, 0.12);
  --border-glass-glow: rgba(25, 81, 252, 0.35);
  --glass-surface: rgba(3, 25, 91, 0.65);
  --glass-surface-elevated: rgba(11, 44, 177, 0.45);
}
```

---

## 3. Glassmorphism Architectural Primitives

### 3.1 Frosted Glass Panel (`.glass-panel`)
- Background: `linear-gradient(135deg, rgba(3, 25, 91, 0.75) 0%, rgba(3, 10, 34, 0.85) 100%)`
- Backdrop Filter: `blur(20px) saturate(180%)`
- Border: `1px solid rgba(255, 255, 255, 0.12)`
- Box Shadow: `0 8px 32px 0 rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)`

### 3.2 Interactive Glass Card (`.glass-card-interactive`)
- Rest State:
  - Background: `linear-gradient(145deg, rgba(11, 44, 177, 0.25) 0%, rgba(3, 25, 91, 0.50) 100%)`
  - Border: `1px solid rgba(55, 129, 252, 0.20)`
  - Transition: `all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`
- Hover State:
  - Transform: `translateY(-3px)`
  - Border: `1px solid rgba(55, 129, 252, 0.55)`
  - Box Shadow: `0 14px 35px -5px rgba(25, 81, 252, 0.30), inset 0 1px 0 rgba(203, 233, 253, 0.30)`

### 3.3 Glass Input Field (`.glass-input`)
- Background: `rgba(3, 10, 34, 0.65)`
- Border: `1px solid rgba(169, 190, 228, 0.20)`
- Focus: `border-color: #3781fc`, `box-shadow: 0 0 0 3px rgba(25, 81, 252, 0.25)`
- Color: `#ffffff`, placeholder: `#5673a5`

### 3.4 Glossy Gradient Token Badge (`.token-pill`)
- Linear gradient matching the token nature:
  - **mUSD:** `linear-gradient(135deg, #059669 0%, #10B981 100%)`
  - **mEUR:** `linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)`
  - **mJPY:** `linear-gradient(135deg, #DC2626 0%, #F87171 100%)`

---

## 4. Typography Hierarchy

| Role | Font Family | Size / Leading | Weight | Color |
|---|---|---|---|---|
| **Display Title** | Plus Jakarta Sans | 32px / 1.15 | 800 (Extrabold) | `#FFFFFF` |
| **Section Heading** | Plus Jakarta Sans | 20px / 1.25 | 700 (Bold) | `#FFFFFF` |
| **Card Header** | Plus Jakarta Sans | 16px / 1.35 | 600 (Semibold) | `#CBE9FD` |
| **Body Primary** | Plus Jakarta Sans | 14px / 1.50 | 500 (Medium) | `#FFFFFF` |
| **Body Muted** | Plus Jakarta Sans | 12px / 1.45 | 400 (Regular) | `#A9BEE4` |
| **Technical / Monospace** | JetBrains Mono | 12px - 14px | 500 (Medium) | `#CBE9FD` |
| **Action / Button** | Plus Jakarta Sans | 14px / 1.00 | 700 (Bold) | `#FFFFFF` |

---

## 5. Micro-Interactions & Animation Guidelines

1. **Laser QR Scanline:** A rhythmic luminous bar scanning vertically across the QR code with an electric blue aura (`rgba(25, 81, 252, 0.8)`).
2. **Radial Ambient Glow:** Three fixed background blurs that pulse gently in the background without causing layout shifts or CPU drain.
3. **Transaction Timeline Stepper:** Step nodes with pulsing halos for active steps, solid emerald rings for completed steps, and muted dashed connectors.
4. **Reduced-Motion Compliance:** Respects `@media (prefers-reduced-motion: reduce)` by removing continuous scanline translations and transforming transitions into instant opacity swaps.
