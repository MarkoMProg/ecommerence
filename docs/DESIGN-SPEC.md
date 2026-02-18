# 🧾 Design Document — Premium DnD Apparel E-commerce

## 1. Project Overview

**Project Type:** E-commerce website
**Industry:** Fashion / Gaming Lifestyle
**Products:** Dungeons & Dragons themed apparel and accessories (t-shirts, hoodies, hats, posters, limited drops)

**Core Goal:**
Create a **premium, minimal, fashion-forward shopping experience** similar to:

* Supreme
* God Is A Designer
* High-end streetwear brand stores

NOT like:

* Typical gaming merch shops
* Cartoonish fantasy stores
* Cluttered marketplaces

---

## 2. Brand Positioning

### 🎯 Brand Personality

The brand should feel:

* Premium
* Minimal
* Confident
* Dark academia + streetwear
* Modern fantasy, not childish fantasy
* Limited-edition culture

Tone:

> "Elite tabletop culture meets high-fashion streetwear."

---

## 3. Visual Style Direction

### 🖤 Overall Look & Feel

Style keywords:

* Dark mode dominant
* Bold typography
* Minimal UI chrome
* Large hero photography
* Strong grid layouts
* Editorial fashion layout
* High contrast
* Generous whitespace

Think:

> Fashion magazine + streetwear drop page + Apple product minimalism.

---

## 4. Color System

### Primary Colors

```
Background: #0A0A0A (near black)
Secondary BG: #121212
Card BG: #1A1A1A
Text Primary: #FFFFFF
Text Secondary: #AAAAAA
```

### Accent Colors (Used Sparingly)

```
Primary Accent: #FF4D00 (burnt orange / infernal glow)
Secondary Accent: #7A5FFF (arcane purple)
Highlight: #E6C068 (gold / premium feel)
```

Rules:

* Accent colors used ONLY for:

  * CTA buttons
  * Hover states
  * Drop labels
  * Price highlights

---

## 5. Typography

### Font Style

Use modern premium sans-serif.

Recommended:

* Headings: **Inter Tight / Space Grotesk**
* Body: **Inter**
* Accent (optional): JetBrains Mono for SKU / drops

### Typography Scale

#### Headlines

Very large and bold.

```
H1: 64–96px, bold, uppercase
H2: 36–48px
H3: 24–32px
```

#### Body

```
Body: 16px
Small: 14px
Meta: 12px uppercase tracking
```

---

## 6. Layout System

### Grid

Use a clean 12-column responsive grid.

Desktop:

* Max width: 1400px
* Large gutters
* Big whitespace margins

Mobile:

* 1 column stacked
* Edge-to-edge product imagery

---

## 7. Page Structure

### 🏠 Homepage Layout

#### 1. Hero Section (Full Width)

Large cinematic banner:

* Product lifestyle photo
* Dark overlay gradient
* Minimal text:

Example:

```
NEW DROP — INFERNAL COLLECTION
Forged in Shadow.
[ SHOP NOW ]
```

Button style:

* Filled accent color
* Rounded corners minimal (6px)

#### 2. Featured Drop Grid

Grid of products:

* 3–4 columns desktop
* Large square images
* Hover effect: slight zoom + shadow

Card includes:

* Product image
* Name
* Price
* "Limited" tag (if applicable)

#### 3. Editorial Section

Large split layout:

Left: Image
Right: Text story

Example:

```
CRAFTED FOR ADVENTURERS

Designed for those who walk between realms.
Minimal. Timeless. Legendary.
```

#### 4. Category Navigation

Minimal icon-less grid:

* T-Shirts
* Hoodies
* Hats
* Accessories
* Posters

Text only, clean.

#### 5. Footer

Minimal:

* Logo
* Navigation
* Socials
* Newsletter signup

---

### 🛍️ Shop Page Layout

#### Structure

Top:

* Title: "ALL ITEMS"
* Minimal filters row

Filters style:

* Text links, not heavy UI
* Example:

```
ALL | T-SHIRTS | HOODIES | HATS | ACCESSORIES
```

#### Product Grid

Large product cards:

* Clean white background image area
* No borders
* Strong spacing

Hover:

* Image zoom
* Quick "View" overlay

---

### 📦 Product Page Layout

#### Top Section

Two-column layout:

Left:

* Large product gallery
* Thumbnail carousel

Right:

* Product name (large)
* Price
* Size selector
* Add to Cart button

#### Product Details

Accordion sections:

* Description
* Materials
* Sizing guide
* Shipping info

#### Related Products

Minimal horizontal grid.

---

## 8. UI Components

### Buttons

Primary:

* Solid accent color
* Bold uppercase text
* Subtle hover glow

Secondary:

* Outline style
* White border

### Cards

* No borders
* Subtle shadow
* Soft rounded corners

### Labels

Small uppercase tags:

```
LIMITED
NEW DROP
SOLD OUT
```

Use accent colors.

---

## 9. Motion & Interaction

Animations should be subtle and premium.

Include:

* Smooth hover transitions
* Image zoom on hover
* Fade-in scroll animations
* Button glow on hover

Avoid:

* Bouncy animations
* Cartoon effects
* Loud motion

---

## 10. UX Principles

### Key UX Goals

* Fast browsing
* Minimal friction
* Focus on product visuals
* Strong brand identity

---

## 11. Functional Requirements

Essential features:

* Product catalog
* Filters
* Cart
* Checkout
* Account system
* Wishlist
* Drop announcements

---

## 12. Style Do's and Don'ts

### ✅ Do

* Use large typography
* Keep layouts clean
* Use high contrast
* Showcase products prominently

### ❌ Don't

* Use fantasy icons everywhere
* Overload with colors
* Use bright gradients
* Add game UI elements

---

## 13. Future Expansion Considerations

Design should support:

* Limited drop countdown pages
* Lookbook editorials
* Influencer collections
* Loyalty tiers
