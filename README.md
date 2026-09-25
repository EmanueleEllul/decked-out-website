# 🃏 Decked Out — Official Game Website

> **"Draft. Battle. Collect."**

The official promotional website for **Decked Out**, a single-player roguelike deck-building RPG built in Godot 4.7 Forward+. A pure game showcase — no simulators, no minigames, just the game beautifully presented.

Live and ready to deploy on **GitHub Pages** with zero build steps or external dependencies.

---

## 🌟 What the Site Shows

### 1. 🃏 Series 1 Card Compendium
- **All 62 Cards**: Pixel-art catalog with animated spritesheets across 6 classes.
- **3D Holographic Hover Shaders**: Cards tilt dynamically on hover with iridescent glow on Exotic & Legendary rarities.
- **Instant Filtering**: Filter by Class, Rarity, and sort by Name, Cost, Damage, or Rarity.
- **Click-to-Inspect Modal**: Full card stats panel with combat properties, mitigation type, and rarity details.

### 2. 🛡️ Heroes & Relics
- **7 Asymmetric Heroes**: Deck Monk, Gorilla Gabe, Lost Spirit, Necri, Demonling, Hunter The Hedgehog, and Scrap Goblin.
- **Hero Profile Viewer**: Portrait, baseline HP/ATK/Mana stats, signature trait, class affinity, and lore bio.
- **9 Ancient Relics**: Each relic's effect, tactical benefit, and shard cost displayed in a clean vault grid.

### 3. ⚔️ Combat Mechanics Breakdown
- Deterministic mitigation formula: `Damage = max(1, Attack - Defense)`.
- Physical vs Magical damage and what each absorbs.
- All 5 status ailments (Burn, Bleed, Poison, Stun, Scrap) explained.

### 4. 🗺️ Dungeon & Bestiary
- **Act Climax Bosses**: All boss encounters from all 3 acts with HP, ATK, Armor, and Ward stats.
- **Common Foe Roster**: 5 dungeon enemy types with full combat profiles.
- **12 Mystery Events**: All narrative dilemmas with their 3-choice outcomes displayed.

### 5. 📖 Game Overview & Specs
- Game engine, platform targets, developer, and wishlist/community links.

---

## 🚀 Deploy to GitHub Pages

Zero build tools required:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy Decked Out website"
   git push origin main
   ```
2. **Enable GitHub Pages**:
   - Repository → **Settings** → **Pages**
   - Source: `Deploy from a branch` → Branch: `main` / `/(root)`
   - Click **Save**
3. **Live at**: `https://emanueleellul.github.io/decked-out-website/`

---

## 📁 Repository Structure

```
decked-out-website/
├── index.html              # Overview & core pillars
├── mechanics.html          # Combat formulas & status ailments
├── heroes.html             # 7 Champions & animated character showcase
├── cards.html              # 62 Cards compendium & modal inspector
├── relics.html             # 9 Ancient Relics vault
├── dungeon.html            # 3-Act Dungeon & Bestiary
├── specs.html              # Technical specifications & developer info
├── README.md               # Documentation
├── css/
│   ├── style.css           # Pixel RPG retro UI & responsive layout
│   └── card-foil.css       # Card hover shaders & rarity foil effects
├── js/
│   ├── data.js             # 62 cards, 7 heroes, 9 relics, acts data
│   ├── audio.js            # Game SFX player & Web Audio ambient synthesizer
│   ├── compendium.js       # Card grid, filters, search & modal inspector
│   ├── heroes-relics.js    # Animated hero profile viewer & relics showcase
│   ├── dungeon-map.js      # Bestiary (boss icons & animated encounters)
│   └── app.js              # Site controls, wishlist navigation & toasts
└── assets/
    ├── cards/              # Series 1 card sprites (PNG + animated WebP)
    ├── heroes/             # Hero portrait sprites
    ├── enemies/            # Dungeon enemy and boss sprites
    └── audio/              # Game sound effects (.mp3)
```

---

## 🎮 Credits & Tech Stack
- **Game Engine**: Godot Engine 4.7 (Forward+ renderer)
- **Frontend**: Semantic HTML5, CSS Variables, 3D CSS Transforms, Web Audio API, Vanilla ES6 JavaScript
- **Developer**: Emanuele Ellul
