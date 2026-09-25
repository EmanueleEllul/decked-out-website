const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LORE_SRC_DIR = 'C:\\Users\\ellul\\Documents\\decked-out\\lore';
const WEBSITE_DIR = path.resolve(__dirname, '..');
const ASSETS_LORE_DIR = path.join(WEBSITE_DIR, 'assets', 'lore');
const LORE_HTML_PATH = path.join(WEBSITE_DIR, 'lore.html');
const BACKUP_SRC_DIR = path.join(WEBSITE_DIR, 'lore-source');

// Helper to remove any instances of "bible" (rule constraint)
function sanitizeText(text) {
  return text
    .replace(/\bLore\s+Bible\b/gi, 'Lore Codex')
    .replace(/\bbible\b/gi, 'codex');
}

// Convert markdown text to styled HTML
function parseMarkdown(md) {
  md = sanitizeText(md);

  const lines = md.split(/\r?\n/);
  const out = [];
  let inCodeBlock = false;
  let codeBlockLines = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;
  let listType = null;
  let inBlockquote = false;
  let blockquoteLines = [];

  function flushBlockquote() {
    if (inBlockquote) {
      const quoteContent = blockquoteLines.join(' ').trim();
      out.push(`<div class="lore-quote-box"><blockquote>${quoteContent}</blockquote></div>`);
      blockquoteLines = [];
      inBlockquote = false;
    }
  }

  function flushList() {
    if (inList) {
      out.push(`</${listType}>`);
      inList = false;
      listType = null;
    }
  }

  function flushTable() {
    if (inTable && tableRows.length > 0) {
      out.push('<div class="timeline-table-wrapper"><table class="campaigns-table">');
      tableRows.forEach((row, idx) => {
        const cells = row.split('|').map(c => c.trim()).filter((c, i, a) => !(i === 0 && c === '') && !(i === a.length - 1 && c === ''));
        if (idx === 0) {
          out.push('<thead><tr>' + cells.map(c => `<th>${formatInline(c)}</th>`).join('') + '</tr></thead><tbody>');
        } else if (idx === 1 && cells.every(c => /^:?-+:?$/.test(c))) {
          // delimiter
        } else {
          out.push('<tr>' + cells.map(c => `<td>${formatInline(c)}</td>`).join('') + '</tr>');
        }
      });
      out.push('</tbody></table></div>');
      tableRows = [];
      inTable = false;
    }
  }

  function formatInline(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/!\[([^\]]*)\]\((.*?)\)/g, (match, alt, src) => {
        let cleanSrc = src.trim();
        if (cleanSrc.includes('map_before_war.jpg')) cleanSrc = 'assets/lore/map_before_war.jpg';
        if (cleanSrc.includes('map_after_war.jpg')) cleanSrc = 'assets/lore/map_after_war.jpg';
        return `<div class="map-card"><img src="${cleanSrc}" alt="${alt}" class="lore-map-img" /></div>`;
      })
      .replace(/\[([^\]]+)\]\((.*?)\)/g, '<span class="lore-link-term">$1</span>');
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Code blocks (e.g. ASCII map)
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        flushBlockquote();
        flushList();
        flushTable();
        inCodeBlock = true;
        codeBlockLines = [];
      } else {
        inCodeBlock = false;
        out.push(`<div class="ascii-map-container"><pre class="ascii-map-art">${codeBlockLines.join('\n')}</pre></div>`);
        codeBlockLines = [];
      }
      continue;
    }
    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Horizontal Rule
    if (/^---{1,}$/.test(line)) {
      flushBlockquote();
      flushList();
      flushTable();
      out.push('<hr class="lore-divider" />');
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      flushList();
      flushTable();
      inBlockquote = true;
      blockquoteLines.push(formatInline(line.replace(/^>\s*/, '')));
      continue;
    } else {
      flushBlockquote();
    }

    // Tables
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList();
      inTable = true;
      tableRows.push(line);
      continue;
    } else {
      flushTable();
    }

    // Headings
    if (line.startsWith('# ')) {
      flushList();
      out.push(`<div class="panel-header-wrap"><h2>${formatInline(line.slice(2))}</h2></div>`);
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      out.push(`<div class="panel-header-wrap" style="margin-top: 3rem;"><span class="volume-kicker">SECTION</span><h2>${formatInline(line.slice(3))}</h2></div>`);
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      out.push(`<h3 class="lore-h3">${formatInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('#### ')) {
      flushList();
      out.push(`<h4 class="lore-h4">${formatInline(line.slice(5))}</h4>`);
      continue;
    }

    // Lists (unordered)
    if (/^[-*]\s+/.test(line)) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
        out.push('<ul class="styled-bullet-list">');
      }
      out.push(`<li>${formatInline(line.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    // Lists (ordered)
    if (/^\d+\.\s+/.test(line)) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
        out.push('<ol class="styled-num-list">');
      }
      out.push(`<li>${formatInline(line.replace(/^\d+\.\s+/, ''))}</li>`);
      continue;
    }

    flushList();

    // Empty lines
    if (line === '') {
      continue;
    }

    // Normal Paragraph
    out.push(`<p class="lore-prose-para">${formatInline(line)}</p>`);
  }

  flushBlockquote();
  flushList();
  flushTable();

  return out.join('\n');
}

// Generate full lore.html content from markdown volumes
function generateLoreHtml(volumes) {
  const version = Date.now();

  const overviewHtml = parseMarkdown(volumes['README.md'] || '');
  const vol00Html = parseMarkdown(volumes['00_prequel_the_age_of_empires.md'] || '');
  const vol01Html = parseMarkdown(volumes['01_the_shattered_realms.md'] || '');
  const vol02Html = parseMarkdown(volumes['02_atlas_of_the_broken_world.md'] || '');
  const vol03Html = parseMarkdown(volumes['03_the_arts_of_war_and_relics.md'] || '');
  const vol04Html = parseMarkdown(volumes['04_the_six_orders.md'] || '');
  const vol05Html = parseMarkdown(volumes['05_chronicles_of_the_champions.md'] || '');
  const vol06Html = parseMarkdown(volumes['06_denizens_of_the_threshold.md'] || '');
  const vol07Html = parseMarkdown(volumes['07_the_dragon_lord_and_the_god.md'] || '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DECKED OUT - Lore Codex | The Chronicles of Aethelgard &amp; Aethelos</title>
  <meta name="description" content="The official Lore Codex of Decked Out: The Age of Empires, the Great World War, the Atlas of the Broken World, the Six Orders, Chronicles of the Champions, and Aethelos the Slumbering God.">
  <link rel="icon" type="image/png" href="assets/icon.png">
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  
  <!-- Stylesheets -->
  <link rel="stylesheet" href="css/style.css?v=${version}">
  <link rel="stylesheet" href="css/card-foil.css?v=4">
  <link rel="stylesheet" href="css/lore.css?v=${version}">
</head>
<body>

  <!-- Top Sticky Navigation Header -->
  <header class="site-header" id="top">
    <div class="header-container">
      <a href="index.html" class="brand-wrapper">
        <div class="brand-icon">
          <img src="assets/icon.png" alt="Decked Out Logo" class="brand-logo-img pixel-art" width="32" height="32" style="width: 32px; height: 32px; max-width: 32px; max-height: 32px; display: block;" />
        </div>
        <div class="brand-text">
          <h1>DECKED OUT</h1>
          <span>ROGUELIKE TCG</span>
        </div>
      </a>

      <!-- Navigation Links -->
      <nav>
        <ul class="nav-links">
          <li><a href="index.html" class="nav-link">Overview</a></li>
          <li><a href="mechanics.html" class="nav-link">Mechanics</a></li>
          <li><a href="heroes.html" class="nav-link">Heroes</a></li>
          <li><a href="cards.html" class="nav-link">Cards</a></li>
          <li><a href="deck-builder.html" class="nav-link">Deck Builder</a></li>
          <li><a href="combat.html" class="nav-link">Battle Test</a></li>
          <li><a href="relics.html" class="nav-link">Relics</a></li>
          <li><a href="dungeon.html" class="nav-link">Dungeon</a></li>
          <li><a href="lore.html" class="nav-link active">Lore</a></li>
          <li><a href="specs.html" class="nav-link">Game Info</a></li>
        </ul>
      </nav>

      <!-- Action Controls -->
      <div class="header-actions">
        <a href="https://store.steampowered.com/app/4298040/Decked_Out/" target="_blank" rel="noopener noreferrer" class="btn-wishlist" title="Wishlist Decked Out on Steam">
          <span>⭐</span> Wishlist on Steam
        </a>
        <button id="toggle-sfx-btn" class="audio-btn" title="Toggle Sound Effects">🔊</button>
        <button id="toggle-bgm-btn" class="audio-btn" title="Toggle Background Music">🎼</button>
        <button id="mobile-menu-toggle" class="mobile-toggle-btn" aria-label="Toggle Navigation Menu">☰</button>
      </div>
    </div>
  </header>

  <div id="page-content">

    <!-- Lore Hero Header -->
    <header class="lore-hero">
      <div class="lore-hero-inner">
        <div class="lore-kicker">📖 THE OFFICIAL LORE ARCHIVES</div>
        <h1 class="lore-main-title">THE <span>LORE</span> CODEX</h1>
        <p class="lore-subtitle">
          The Chronicles of the Shattered World, the Great War, and Aethelos the Slumbering God.
        </p>

        <div class="lore-quote-box">
          <blockquote>
            &ldquo;The world was not ended by a whisper or a dying star. It was broken by mortal hubris. And from the blood and fire of the Great War, a desperate fellowship rose to mend the sky.&rdquo;
          </blockquote>
          <span class="lore-quote-author">— Chronicler of the Broken Age</span>
        </div>
      </div>
    </header>

    <!-- Interactive Codex Volume Navigator -->
    <nav class="lore-tabs-nav" aria-label="Lore Codex Volume Navigation">
      <div class="lore-tabs-container">
        <button class="lore-tab-btn active" data-tab="tab-overview"><span>📖</span> Overview</button>
        <button class="lore-tab-btn" data-tab="tab-vol00"><span>🏛️</span> Vol 00: Age of Empires</button>
        <button class="lore-tab-btn" data-tab="tab-vol01"><span>⚔️</span> Vol 01: The Shattered World</button>
        <button class="lore-tab-btn" data-tab="tab-vol02"><span>🗺️</span> Vol 02: World Atlas &amp; Maps</button>
        <button class="lore-tab-btn" data-tab="tab-vol03"><span>🏺</span> Vol 03: Arts of War &amp; Relics</button>
        <button class="lore-tab-btn" data-tab="tab-vol04"><span>🔮</span> Vol 04: The Six Orders</button>
        <button class="lore-tab-btn" data-tab="tab-vol05"><span>🛡️</span> Vol 05: Champions</button>
        <button class="lore-tab-btn" data-tab="tab-vol06"><span>🎭</span> Vol 06: Denizens</button>
        <button class="lore-tab-btn" data-tab="tab-vol07"><span>👑</span> Vol 07: Mount Calamity &amp; The God</button>
      </div>
    </nav>

    <!-- Main Website Content -->
    <main class="main-wrapper">

      <!-- ==========================================
           TAB: OVERVIEW
           ========================================== -->
      <section class="lore-tab-panel active" id="tab-overview">
        <div class="lore-section-inner">
          <div class="panel-header-wrap">
            <span class="volume-kicker">COSMIC ARCHIVE &amp; TIMELINE</span>
            <h2>Overview of <span>The Universe</span></h2>
            <p>The foundations of Aethelgard, the RB Epoch, and the identity of the creator.</p>
          </div>

          <div class="lore-prose-card">
            ${overviewHtml}
          </div>
        </div>
      </section>

      <!-- ==========================================
           TAB: VOLUME 00: PREQUEL
           ========================================== -->
      <section class="lore-tab-panel" id="tab-vol00">
        <div class="lore-section-inner">
          <div class="panel-header-wrap">
            <span class="volume-kicker">VOLUME 00 &bull; PREQUEL</span>
            <h2>The Age of Empires &amp; <span>The Eve of Ruin</span></h2>
            <p>From the Golden Age of the Five Realms to the catastrophic rupture of the Firmament Siphon.</p>
          </div>

          <div class="lore-prose-card">
            ${vol00Html}
          </div>
        </div>
      </section>

      <!-- ==========================================
           TAB: VOLUME 01: THE SHATTERED REALMS
           ========================================== -->
      <section class="lore-tab-panel" id="tab-vol01">
        <div class="lore-section-inner">
          <div class="panel-header-wrap">
            <span class="volume-kicker">VOLUME 01 &bull; 0–25 ARB</span>
            <h2>The Shattered World &amp; <span>The Great War</span></h2>
            <p>The immediate aftermath of 0 RB, the tripartite inrush of plagues, and the Monk's crusade.</p>
          </div>

          <div class="lore-prose-card">
            ${vol01Html}
          </div>
        </div>
      </section>

      <!-- ==========================================
           TAB: VOLUME 02: ATLAS & MAPS
           ========================================== -->
      <section class="lore-tab-panel" id="tab-vol02">
        <div class="lore-section-inner">
          <div class="panel-header-wrap">
            <span class="volume-kicker">VOLUME 02 &bull; CARTOGRAPHY &amp; WAR THEATERS</span>
            <h2>Atlas of the <span>Broken World</span></h2>
            <p>Visual cartography of Aethelgard Before and After the war, regional territories, and major campaigns.</p>
          </div>

          <!-- Interactive Map Viewer Widget -->
          <div class="lore-map-viewer">
            <div class="map-controls-row">
              <button class="map-toggle-btn active" data-view="before">Map I: Before Cataclysm (10 BRB)</button>
              <button class="map-toggle-btn" data-view="after">Map II: After Shattering (25 ARB)</button>
              <button class="map-toggle-btn" data-view="both">Side-by-Side View</button>
            </div>

            <div class="map-display-area" id="map-display-area">
              <div class="map-card" id="map-card-before">
                <div class="map-card-header">
                  <span class="map-badge badge-brb">10 BRB</span>
                  <h4>Map I: Aethelgard Before the Cataclysm</h4>
                  <span class="map-note">The Golden Age: clear borders, prosperous cities, tranquil seas, Valley of Anchor</span>
                </div>
                <div class="map-image-wrapper">
                  <img src="assets/lore/map_before_war.jpg" alt="Aethelgard Before the Shatter (10 BRB)" class="lore-map-img" id="img-map-before" />
                  <div class="map-zoom-hint">🔍 Click to View Fullscreen</div>
                </div>
              </div>

              <div class="map-card" id="map-card-after" style="display: none;">
                <div class="map-card-header">
                  <span class="map-badge badge-arb">25 ARB</span>
                  <h4>Map II: Aethelgard After the Shattering</h4>
                  <span class="map-note">The Ruined Continent: Mount Calamity erupting, Celestial Rift, shattered citadels, trenches</span>
                </div>
                <div class="map-image-wrapper">
                  <img src="assets/lore/map_after_war.jpg" alt="Aethelgard After the Shatter (25 ARB)" class="lore-map-img" id="img-map-after" />
                  <div class="map-zoom-hint">🔍 Click to View Fullscreen</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Lightbox Modal -->
          <div class="map-lightbox-modal" id="map-lightbox" style="display: none;">
            <div class="lightbox-backdrop" id="lightbox-backdrop"></div>
            <div class="lightbox-content">
              <button class="lightbox-close" id="lightbox-close">&times; CLOSE</button>
              <img src="" alt="Fullscreen Map" id="lightbox-img" />
              <div class="lightbox-caption" id="lightbox-caption"></div>
            </div>
          </div>

          <div class="lore-prose-card" style="margin-top: 2.5rem;">
            ${vol02Html}
          </div>
        </div>
      </section>

      <!-- ==========================================
           TAB: VOLUME 03: ARTS OF WAR & RELICS
           ========================================== -->
      <section class="lore-tab-panel" id="tab-vol03">
        <div class="lore-section-inner">
          <div class="panel-header-wrap">
            <span class="volume-kicker">VOLUME 03 &bull; TACTICS &amp; HEIRLOOMS</span>
            <h2>The Arts of War &amp; <span>Relics of the Fallen</span></h2>
            <p>Principles of combat in the broken world, ancient heirloom relics, and dedicated elixirs.</p>
          </div>

          <div class="lore-prose-card">
            ${vol03Html}
          </div>
        </div>
      </section>

      <!-- ==========================================
           TAB: VOLUME 04: THE SIX ORDERS
           ========================================== -->
      <section class="lore-tab-panel" id="tab-vol04">
        <div class="lore-section-inner">
          <div class="panel-header-wrap">
            <span class="volume-kicker">VOLUME 04 &bull; COMBAT DISCIPLINES</span>
            <h2>The Six Martial &amp; <span>Magical Orders</span></h2>
            <p>The primary combat philosophies forged in the fires of conflict.</p>
          </div>

          <div class="lore-prose-card">
            ${vol04Html}
          </div>
        </div>
      </section>

      <!-- ==========================================
           TAB: VOLUME 05: CHRONICLES OF THE CHAMPIONS
           ========================================== -->
      <section class="lore-tab-panel" id="tab-vol05">
        <div class="lore-section-inner">
          <div class="panel-header-wrap">
            <span class="volume-kicker">VOLUME 05 &bull; HERO DOSSIERS</span>
            <h2>Chronicles of <span>The Champions</span></h2>
            <p>How eight survivors of the Great War answered the Monk's call to heal the world.</p>
          </div>

          <div class="lore-prose-card">
            ${vol05Html}
          </div>
        </div>
      </section>

      <!-- ==========================================
           TAB: VOLUME 06: DENIZENS
           ========================================== -->
      <section class="lore-tab-panel" id="tab-vol06">
        <div class="lore-section-inner">
          <div class="panel-header-wrap">
            <span class="volume-kicker">VOLUME 06 &bull; SURVIVORS &amp; SANCTUARIES</span>
            <h2>Denizens of <span>The Wasteland</span></h2>
            <p>Neutral wanderers who carved out a living in the chaos of unending war.</p>
          </div>

          <div class="lore-prose-card">
            ${vol06Html}
          </div>

          <!-- Interactive Stations Grid -->
          <div class="panel-header-wrap" style="margin-top: 3.5rem;">
            <span class="volume-kicker">INTERACTIVE STATIONS</span>
            <h2>Wasteland Enclave <span>Interactions</span></h2>
          </div>

          <div class="denizens-showcase-grid">
            <!-- Trader Station -->
            <div class="denizen-profile-card">
              <div class="denizen-avatar-row">
                <span class="denizen-icon">💼</span>
                <div>
                  <h4>The Trader's Exchange</h4>
                  <span class="denizen-habitat">Planar Currency Converter</span>
                </div>
              </div>
              <div class="denizen-interactive-station">
                <span class="station-kicker">CONVERT CURRENCY</span>
                <div class="currency-converter-widget">
                  <div class="converter-input-wrap">
                    <label for="trader-gold-in">Scavenged Run Gold:</label>
                    <input type="number" id="trader-gold-in" value="150" min="0" step="50" class="pixel-input" />
                  </div>
                  <div class="converter-arrow">&rarr;</div>
                  <div class="converter-output-wrap">
                    <label>Converted Astral Gems:</label>
                    <span id="trader-gem-out" class="pixel-stat-pill">100 GEMS</span>
                  </div>
                </div>
                <span class="station-note">Exchange formula: 150 In-Run Gold = 100 Meta Gems</span>
              </div>
            </div>

            <!-- Chemist Station -->
            <div class="denizen-profile-card">
              <div class="denizen-avatar-row">
                <span class="denizen-icon">🧪</span>
                <div>
                  <h4>The Chemist's Crucible</h4>
                  <span class="denizen-habitat">Combat Elixir Fusion</span>
                </div>
              </div>
              <div class="denizen-interactive-station">
                <span class="station-kicker">BREW MASTER PHIAL</span>
                <div class="fusion-station-widget">
                  <div class="fusion-selectors">
                    <select id="elixir-a" class="pixel-select">
                      <option value="Magic Milkshake (+4 Mana)">Magic Milkshake</option>
                      <option value="Moonbrew (+15 HP)">Moonbrew</option>
                      <option value="Acidic Cleanse (Purge Debuff)">Acidic Cleanse</option>
                    </select>
                    <span class="fusion-plus">+</span>
                    <select id="elixir-b" class="pixel-select">
                      <option value="Iron Tincture (+10 Armor)">Iron Tincture</option>
                      <option value="Arcane Draught (+8 Ward)">Arcane Draught</option>
                      <option value="Haste Tonic (+2 Draw)">Haste Tonic</option>
                    </select>
                  </div>
                  <button id="btn-fuse-elixir" class="pixel-btn-action">Brew Master Phial</button>
                  <div id="fusion-result" class="fusion-output-pill">Select two elixirs and ignite the crucible.</div>
                </div>
              </div>
            </div>

            <!-- Gambler Station -->
            <div class="denizen-profile-card">
              <div class="denizen-avatar-row">
                <span class="denizen-icon">🎲</span>
                <div>
                  <h4>The Gambler's Hazard</h4>
                  <span class="denizen-habitat">High-Stakes Coin Toss</span>
                </div>
              </div>
              <div class="denizen-interactive-station">
                <span class="station-kicker">ASTRAL COIN TOSS</span>
                <div class="gambler-game-box">
                  <div class="coin-display-wrap">
                    <div id="astral-coin" class="astral-coin-disc">🪙</div>
                  </div>
                  <button id="btn-flip-coin" class="pixel-btn-action">Flip Coin (Wager 100 Gold)</button>
                  <div id="gambler-feedback" class="gambler-feedback-text">Dare to challenge fate? Heads = +250 Gems. Tails = Soul Burn.</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- ==========================================
           TAB: VOLUME 07: MOUNT CALAMITY & AETHELOS
           ========================================== -->
      <section class="lore-tab-panel" id="tab-vol07">
        <div class="lore-section-inner">
          <div class="panel-header-wrap">
            <span class="volume-kicker">VOLUME 07 &bull; THE CLIMAX</span>
            <h2>Mount Calamity &amp; <span>Aethelos the Slumbering God</span></h2>
            <p>The sovereign Dragon Lord, the Celestial Rift, and the Generational War.</p>
          </div>

          <!-- Interactive 1,000,000 HP Generational Siege Station -->
          <div class="god-strike-section">
            <div class="god-strike-header">
              <span class="god-strike-kicker">⚔️ THE GENERATIONAL SIEGE OF AETHELOS</span>
              <h3>The 1,000,000 HP Mortal Defiance</h3>
              <p>Every strike across generations chips away at the sleeping creator. No damage is ever undone.</p>
            </div>

            <div class="god-hp-tracker-box">
              <div class="hp-meta-labels">
                <span class="hp-boss-title">👑 AETHELOS, THE SLUMBERING GOD</span>
                <span id="god-hp-text" class="hp-numeric-display">987,500 / 1,000,000 HP</span>
              </div>
              <div class="god-bar-track">
                <div id="god-hp-bar" class="god-bar-fill" style="width: 98.75%;"></div>
              </div>
              <div class="hp-bar-subline">
                <span>Phase: Deep Stasis Coma</span>
                <span>Cumulative Generations: 1,420 Fallen Crusaders</span>
              </div>
            </div>

            <div class="strike-controls-row">
              <button id="btn-strike-god" class="btn-strike-action">
                <span>⚔️</span> Strike The Slumbering God
              </button>
              <button id="btn-reset-god" class="btn-reset-strike" title="Reset demonstration to timeline default">
                ↺ Recalibrate Timeline
              </button>
            </div>
            <div id="strike-feedback" class="strike-feedback-log">
              Step forward and strike. Your wound will be preserved across lifetimes.
            </div>
          </div>

          <div class="lore-prose-card">
            ${vol07Html}
          </div>
        </div>
      </section>

    </main>

    <!-- Footer -->
    <footer class="site-footer">
      <div class="footer-container">
        <div class="footer-col brand-col">
          <div class="footer-brand">
            <img src="assets/icon.png" alt="Decked Out" class="footer-logo pixel-art" width="28" height="28" />
            <span class="footer-title">DECKED OUT</span>
          </div>
          <p class="footer-tagline">A tactical roguelike deckbuilding TCG forged in Godot 4.3.</p>
        </div>

        <div class="footer-col links-col">
          <div class="footer-heading">NAVIGATION</div>
          <ul class="footer-links">
            <li><a href="index.html">Overview</a></li>
            <li><a href="mechanics.html">Mechanics</a></li>
            <li><a href="heroes.html">Heroes</a></li>
            <li><a href="cards.html">Cards</a></li>
            <li><a href="deck-builder.html">Deck Builder</a></li>
            <li><a href="combat.html">Combat Demo</a></li>
            <li><a href="relics.html">Relics</a></li>
            <li><a href="dungeon.html">Dungeon Map</a></li>
            <li><a href="lore.html">Lore Codex</a></li>
            <li><a href="specs.html">Tech Specs</a></li>
          </ul>
        </div>

        <div class="footer-col steam-col">
          <div class="footer-heading">WISHLIST TODAY</div>
          <p>Support indie development by wishlisting Decked Out on Steam.</p>
          <a href="https://store.steampowered.com/app/4298040/Decked_Out/" target="_blank" rel="noopener noreferrer" class="btn-steam-footer">
            <span>⭐</span> Wishlist on Steam
          </a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 DECKED OUT. All lore and assets derived from the official Decked Out game project.</p>
      </div>
    </footer>

  </div>

  <!-- Audio Manager -->
  <script src="js/audio.js?v=6"></script>
  <!-- Core Application Scripts -->
  <script src="js/app.js?v=7"></script>

  <!-- Interactive Lore Page Controller -->
  <script>
    window.initLoreApp = function() {
      // 1. Tab Switching Controller
      const tabBtns = document.querySelectorAll('.lore-tab-btn');
      const tabPanels = document.querySelectorAll('.lore-tab-panel');

      function switchTab(targetId) {
        tabBtns.forEach(btn => {
          if (btn.getAttribute('data-tab') === targetId) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });

        tabPanels.forEach(panel => {
          if (panel.id === targetId) {
            panel.classList.add('active');
          } else {
            panel.classList.remove('active');
          }
        });

        if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
        
        const tabsNav = document.querySelector('.lore-tabs-nav');
        if (tabsNav) {
          const navY = tabsNav.getBoundingClientRect().top + window.pageYOffset - 70;
          window.scrollTo({ top: navY, behavior: 'smooth' });
        }
      }

      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.getAttribute('data-tab');
          if (target) switchTab(target);
        });
      });

      // 2. Interactive Map Viewer (Before / After / Both)
      const mapBtns = document.querySelectorAll('.map-toggle-btn');
      const cardBefore = document.getElementById('map-card-before');
      const cardAfter = document.getElementById('map-card-after');
      const mapDisplayArea = document.getElementById('map-display-area');

      mapBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          mapBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const view = btn.getAttribute('data-view');
          if (window.audioMgr) window.audioMgr.playSFX('cardDraw');

          if (view === 'before') {
            if (cardBefore) cardBefore.style.display = 'block';
            if (cardAfter) cardAfter.style.display = 'none';
            if (mapDisplayArea) mapDisplayArea.classList.remove('side-by-side');
          } else if (view === 'after') {
            if (cardBefore) cardBefore.style.display = 'none';
            if (cardAfter) cardAfter.style.display = 'block';
            if (mapDisplayArea) mapDisplayArea.classList.remove('side-by-side');
          } else if (view === 'both') {
            if (cardBefore) cardBefore.style.display = 'block';
            if (cardAfter) cardAfter.style.display = 'block';
            if (mapDisplayArea) mapDisplayArea.classList.add('side-by-side');
          }
        });
      });

      // 3. Map Lightbox
      const lightbox = document.getElementById('map-lightbox');
      const lightboxImg = document.getElementById('lightbox-img');
      const lightboxCaption = document.getElementById('lightbox-caption');
      const lightboxClose = document.getElementById('lightbox-close');
      const lightboxBackdrop = document.getElementById('lightbox-backdrop');

      function openLightbox(src, caption) {
        if (!lightbox || !lightboxImg) return;
        lightboxImg.src = src;
        if (lightboxCaption) lightboxCaption.textContent = caption;
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
      }

      function closeLightbox() {
        if (!lightbox) return;
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
      }

      const imgBefore = document.getElementById('img-map-before');
      const imgAfter = document.getElementById('img-map-after');

      if (imgBefore) {
        imgBefore.addEventListener('click', () => {
          openLightbox('assets/lore/map_before_war.jpg', 'Map I: Aethelgard Before the Cataclysm (10 BRB)');
        });
      }
      if (imgAfter) {
        imgAfter.addEventListener('click', () => {
          openLightbox('assets/lore/map_after_war.jpg', 'Map II: Aethelgard After the Shattering (25 ARB)');
        });
      }

      if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
      if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
      });

      // 4. Interactive Trader Currency Calculator
      const goldIn = document.getElementById('trader-gold-in');
      const gemOut = document.getElementById('trader-gem-out');
      if (goldIn && gemOut) {
        goldIn.addEventListener('input', () => {
          const val = parseInt(goldIn.value) || 0;
          const gems = Math.floor((val / 150) * 100);
          gemOut.textContent = gems + ' GEMS';
        });
      }

      // 5. Interactive Chemist Elixir Fusion
      const fuseBtn = document.getElementById('btn-fuse-elixir');
      const elixirA = document.getElementById('elixir-a');
      const elixirB = document.getElementById('elixir-b');
      const fusionResult = document.getElementById('fusion-result');
      if (fuseBtn && elixirA && elixirB && fusionResult) {
        fuseBtn.addEventListener('click', () => {
          if (window.audioMgr) window.audioMgr.playSFX('turnStart');
          fusionResult.textContent = \`✨ Master Phial brewed: \${elixirA.value} + \${elixirB.value} (Equipped into Quick-Pocket)\`;
        });
      }

      // 6. Interactive Gambler Coin Toss
      const coinBtn = document.getElementById('btn-flip-coin');
      const coinEl = document.getElementById('astral-coin');
      const gamblerFeedback = document.getElementById('gambler-feedback');
      let isFlipping = false;

      if (coinBtn && coinEl) {
        coinBtn.addEventListener('click', () => {
          if (isFlipping) return;
          isFlipping = true;
          if (window.audioMgr) window.audioMgr.playSFX('buttonClick');

          coinEl.classList.add('flipping');
          gamblerFeedback.textContent = 'Flipping the astral coin...';

          setTimeout(() => {
            coinEl.classList.remove('flipping');
            const win = Math.random() > 0.5;
            if (win) {
              if (window.audioMgr) window.audioMgr.playSFX('goldGain');
              coinEl.textContent = '⭐';
              gamblerFeedback.innerHTML = '<span style="color: #fbbf24; font-weight: 700;">HEADS! The Gambler grins: +250 Gems awarded!</span>';
            } else {
              if (window.audioMgr) window.audioMgr.playSFX('enemyHit');
              coinEl.textContent = '💀';
              gamblerFeedback.innerHTML = '<span style="color: #f87171; font-weight: 700;">TAILS! Cursed coin burns your soul (-15 HP)!</span>';
            }
            isFlipping = false;
          }, 600);
        });
      }

      // 7. Interactive Slumbering God Generational Strike
      let godHp = 987500;
      const godHpText = document.getElementById('god-hp-text');
      const godHpBar = document.getElementById('god-hp-bar');
      const strikeBtn = document.getElementById('btn-strike-god');
      const resetGodBtn = document.getElementById('btn-reset-god');
      const strikeFeedback = document.getElementById('strike-feedback');

      if (strikeBtn) {
        strikeBtn.addEventListener('click', () => {
          if (window.audioMgr) window.audioMgr.playSFX('enemyHit');
          const dmg = Math.floor(Math.random() * 850) + 1250;
          godHp = Math.max(0, godHp - dmg);
          
          const pct = ((godHp / 1000000) * 100).toFixed(2);
          if (godHpBar) godHpBar.style.width = pct + '%';
          if (godHpText) godHpText.textContent = godHp.toLocaleString() + ' / 1,000,000 HP';

          if (strikeFeedback) {
            strikeFeedback.innerHTML = \`<span style="color: #f87171; font-weight: 700;">⚔️ Strike landed! Inflicted -\${dmg.toLocaleString()} DMG!</span> <span style="color: #94a3b8;">Permanent wound etched into Aethelos across generations!</span>\`;
          }
        });
      }

      if (resetGodBtn) {
        resetGodBtn.addEventListener('click', () => {
          if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
          godHp = 987500;
          if (godHpBar) godHpBar.style.width = '98.75%';
          if (godHpText) godHpText.textContent = '987,500 / 1,000,000 HP';
          if (strikeFeedback) strikeFeedback.textContent = 'Generational Siege recalibrated to current timeline.';
        });
      }
    };

    document.addEventListener('DOMContentLoaded', () => {
      window.initLoreApp();
    });
  </script>

</body>
</html>
`;
}

// Synchronize all lore files
function syncLore(shouldGitCommit = true) {
  console.log(`\n========================================`);
  console.log(`[${new Date().toLocaleTimeString()}] Checking ${LORE_SRC_DIR}...`);

  if (!fs.existsSync(LORE_SRC_DIR)) {
    console.error(`[ERROR] Lore directory not found at: ${LORE_SRC_DIR}`);
    return false;
  }

  // 1. Copy Map Assets
  const mapsSrcDir = path.join(LORE_SRC_DIR, 'maps');
  if (fs.existsSync(mapsSrcDir)) {
    fs.mkdirSync(ASSETS_LORE_DIR, { recursive: true });
    const mapFiles = fs.readdirSync(mapsSrcDir);
    mapFiles.forEach(file => {
      const src = path.join(mapsSrcDir, file);
      const dest = path.join(ASSETS_LORE_DIR, file);
      fs.copyFileSync(src, dest);
    });
    console.log(`[ASSETS] Copied ${mapFiles.length} map file(s) to assets/lore/`);
  }

  // 2. Backup raw markdown files into repository
  fs.mkdirSync(BACKUP_SRC_DIR, { recursive: true });
  const mdFiles = fs.readdirSync(LORE_SRC_DIR).filter(f => f.endsWith('.md')).sort();
  mdFiles.forEach(file => {
    fs.copyFileSync(path.join(LORE_SRC_DIR, file), path.join(BACKUP_SRC_DIR, file));
  });
  console.log(`[BACKUP] Mirrored ${mdFiles.length} markdown file(s) into lore-source/`);

  // 3. Extract volume contents
  const volumes = {};
  mdFiles.forEach(file => {
    const content = fs.readFileSync(path.join(LORE_SRC_DIR, file), 'utf8');
    volumes[file] = content;
  });

  // 4. Generate lore.html
  console.log(`[BUILD] Rebuilding lore.html from markdown source files...`);
  const fullHtml = generateLoreHtml(volumes);
  fs.writeFileSync(LORE_HTML_PATH, fullHtml, 'utf8');
  console.log(`[BUILD] Successfully generated lore.html (${(fullHtml.length / 1024).toFixed(1)} KB)`);

  // 5. Check git status and commit/push if requested
  if (shouldGitCommit) {
    try {
      const gitStatus = execSync('git status --porcelain', { cwd: WEBSITE_DIR }).toString().trim();
      if (gitStatus) {
        console.log(`[GIT] Changes detected:\n${gitStatus}`);
        execSync('git add .', { cwd: WEBSITE_DIR });
        const commitMsg = `chore(lore): auto-sync lore from decked-out [${new Date().toISOString().replace('T', ' ').slice(0, 19)}]`;
        execSync(`git commit -m "${commitMsg}"`, { cwd: WEBSITE_DIR });
        console.log(`[GIT] Committed: ${commitMsg}`);
        console.log(`[GIT] Pushing to origin/main...`);
        execSync('git push origin main', { cwd: WEBSITE_DIR });
        console.log(`[SUCCESS] Lore changes pushed to GitHub Pages!`);
      } else {
        console.log(`[GIT] Working tree clean. Everything already up to date.`);
      }
    } catch (gitErr) {
      console.error(`[GIT ERROR] Failed to push to git:`, gitErr.message);
    }
  }

  return true;
}

if (require.main === module) {
  syncLore(true);
}

module.exports = { syncLore, generateLoreHtml, parseMarkdown };
