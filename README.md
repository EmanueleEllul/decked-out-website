# 🃏 Decked Out - Official Game Companion & TCG Compendium

> **"Draft. Battle. Collect. Upgrade."**

An interactive, responsive single-page web application and comprehensive companion portal for **Decked Out**, a single-player roguelike deck-building RPG built in Godot 4.7 Forward+.

Live showcase ready to deploy directly to **GitHub Pages** with zero build steps or external dependencies.

---

## 🌟 Key Features

### 1. 🃏 Interactive Card Compendium & 3D Binder
- **All 104 Cards**: Browse the complete catalog across **Series 1 (Core & Goblins)** and **Series 2 (Dragons Expansion)**.
- **Realistic 3D Holographic Foil Shaders**: Cards tilt dynamically in 3D based on cursor position (`rotateX`, `rotateY`) with iridescent color-dodge sheen effects on Exotic and Legendary cards.
- **Search & Multi-Filters**: Instant client-side filtering by Series, Class, Rarity, Cost, Damage Type, and text query.
- **Upgraded Mode Toggle**: Switch between base card stats and upgraded stats (+10% multipliers and Goblin Scrap contraptions).
- **Interactive Card Modal**: Full inspection with combat properties, defense ratings, status ailments, and a 1-click "Add to Deck" button.

### 2. 🛡️ Heroes & Relics Hub
- **All 8 Unique Heroes**: Deck Monk, Gorilla Gabe, Lost Spirit, Necri, Demonling, Hunter The Hedgehog, Scrap Goblin, and Dragon.
- **Hero Upgrade Calculator**: Interactive slider simulating meta-progression upgrades (+3% HP, ATK, and Mana per tier level outside of runs).
- **Relic Compendium**: The 9 ancient artifacts (Iron Heart, Keen Edge, Mana Lens, Quick Study, Golden Pouch, Hexglass Lens, Ruinous Seal, Sundered Chisel, Withering Banner).
- **3-Relic Active Loadout Builder**: Equip up to 3 active relics and view their combined combat impacts.

### 3. 📦 Gacha Booster Pack Simulator
- **Authentic Godot Drop Rates**: Open Common Packs, Rare Packs, Exotic Packs (guaranteed Exotic & Legendary!), Dragons Packs, and 38-card Collector's Bundle Boxes.
- **Tactile Pack Opening**: Foil ripping animations with sound effects and facedown cards ready to reveal.
- **Persistent Binder Collection**: Automatically saves opened cards and tracks your unique collection completion percentage in `localStorage`.
- **Claim Free Gems**: Includes starting gifts and gem refill buttons.

### 4. 🛠️ Starter Deck Builder & Exporter
- **Legal Deck Validation**: Enforces game rules: 10 to 100 cards, maximum 15 copies per card, and at most 1 Exotic or 1 Legendary in starter decks.
- **Visual Mana Curve**: Real-time histogram of card mana costs (0 through 5+).
- **Pre-Built Archetype Presets**: 1-click loading for Monk's Balanced Vanguard, Goblin Scrap Recycler, Infernal Wildfire, and Primordial Dragon Bastion.
- **Export & Import**: Export decklists to clipboard, generate base64 deck codes, or import shared decks.

### 5. ⚔️ Playable Tactical Combat Sandbox
- **Deterministic Mitigation Formula**:
  $$\text{Final Damage} = \max(1, \text{Base Damage} - \text{Relevant Defense})$$
- **Physical vs Magical Damage**: Physical hits test Armor; Magical hits test Ward.
- **Status Effects**: Live tracking of Burn, Bleed, Poison, Stun, and Scrap resources.
- **Turn Flow**: Refill 15 Mana, draw cards, play spells, trigger Hero Strikes, and battle through Enemy AI turns.
- **Genuine Game SFX**: Integrated audio triggers for card plays, enemy hits, gold gains, and turn shifts.

### 6. 🗺️ 3-Act Dungeon Map & World Boss Raid
- **Interactive Branching Acts**: Act 1 The Descent (12 floors), Act 2 The Core & Trials (10 floors), Act 3 The Primordial Summit (18 floors).
- **Climax Boss Pool**: Bone Amalgam, Archmage Ignis, Wreckyard Colossus, and Dragon Lord.
- **The Gambler's Den**: Play the 50/50 Coin Flip (wager Gold for 2.5x Gems) or spin the 6-slice Wheel of Fate!
- **12 Mystery Events**: Explore interactive narrative dilemmas with choices and immediate rewards/penalties.
- **The God Persistent World Boss**: Confront the secret 1,000,000 HP deity whose damage never resets on hero defeat!

### 7. 📖 Obsidian Documentation Hub
- **All 38 Notes Synchronized**: Complete knowledge base imported from the official Obsidian vault across 9 categories.
- **Markdown Rendering**: Formatted tables, callout alerts (`[!NOTE]`, `[!CAUTION]`, etc.), code snippets, and clickable `[[wikilinks]]`.
- **Live Search**: Instant documentation search across all notes and lore.

---

## 🚀 How to Deploy on GitHub Pages

This project is built with vanilla HTML5, CSS3, and modern ES6 JavaScript. It has **zero build dependencies**, meaning it can be deployed to GitHub Pages in seconds:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy Decked Out official website"
   git push origin main
   ```
2. **Enable GitHub Pages**:
   - Go to your repository on GitHub (`https://github.com/EmanueleEllul/decked-out-website`).
   - Click on **Settings** ➔ **Pages** (under Code and automation).
   - Under **Build and deployment**:
     - **Source**: `Deploy from a branch`
     - **Branch**: `main` / `/(root)`
   - Click **Save**.
3. **Enjoy your site**:
   - In less than a minute, your website will be live at:
     `https://emanueleellul.github.io/decked-out-website/`

---

## 📁 Repository Structure

```
decked-out-website/
├── index.html              # Main single-page application
├── README.md               # Project documentation and deployment guide
├── css/
│   ├── style.css           # Core dark fantasy responsive styling & layout
│   └── card-foil.css       # 3D card tilt, holographic shaders & pack animations
├── js/
│   ├── data.js             # 104 cards, 8 heroes, 9 relics, acts & drop rate data
│   ├── wiki-data.js        # 38 Obsidian vault notes with full markdown
│   ├── audio.js            # Godot game SFX player and Web Audio ambient synthesizer
│   ├── compendium.js       # Card binder, multi-filter, search & 3D tilt inspector
│   ├── pack-simulator.js   # Interactive gacha booster packs & collection binder
│   ├── deck-builder.js     # Deck construction, mana curve & export/import
│   ├── combat-demo.js      # Playable tactical combat sandbox arena
│   ├── dungeon-map.js      # 3-act map timeline, gambler minigames & The God raid
│   ├── heroes-relics.js    # Hero stats, upgrade calculator & relic loadout builder
│   ├── wiki-viewer.js      # Markdown wiki reader with wikilinks & search
│   └── app.js              # Application controller, tab navigation & toast alerts
└── assets/
    ├── cards/              # Series 1 card PNG sprites copied from the game
    ├── heroes/             # Hero portrait sprites
    ├── enemies/            # Dungeon enemies and bosses
    └── audio/              # Genuine game sound effects (.mp3)
```

---

## 🎮 Game Credits & Tech Stack
- **Game Engine**: Godot Engine 4.7 (Forward+ renderer)
- **Documentation**: Obsidian Knowledge Base
- **Frontend Stack**: Semantic HTML5, CSS Variables, 3D CSS Transforms, Web Audio API, Vanilla JavaScript
- **Developer**: Emanuele Ellul
