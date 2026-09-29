// Decked Out - Gacha & Booster Pack Opening Simulator
// High-Performance 60FPS: Pre-rendered 3D hardware-accelerated card flips,
// tactile foil tear ceremony, rarity energy auras, sound fanfares & collection binder

class PackSimulator {
  constructor() {
    this.allCards = (typeof window !== 'undefined' && window.GAME_CARDS) ? window.GAME_CARDS : (typeof GAME_CARDS !== 'undefined' ? GAME_CARDS : []);
    this.packs = (typeof window !== 'undefined' && window.GAME_PACKS) ? window.GAME_PACKS : (typeof GAME_PACKS !== 'undefined' ? GAME_PACKS : []);
    
    // Ensure default packs if not present in data
    if (!this.packs || this.packs.length === 0) {
      this.initDefaultPacks();
    }

    this.gems = 2500;
    this.gold = 500;
    this.packsOpened = 0;
    this.collection = {}; // { [cardId]: count }
    this.currentOpenedCards = [];
    this.revealedCount = 0;
    this.activePack = null;
    this.activeTab = 'shop'; // 'shop' | 'binder'
    this.binderFilter = 'all'; // 'all' | 'owned' | 'missing'
    this.binderClass = 'all';
    this.binderRarity = 'all';

    this.loadState();
    this.init();
  }

  initDefaultPacks() {
    this.packs = [
      {
        id: "common",
        name: "Common Pack",
        cost: 150,
        currency: "Gems",
        cardCount: 6,
        badge: "Entry Draft",
        description: "Standard booster pack. Ideal for expanding initial card collection and discovering staple mechanics.",
        rates: { "Common": 67.5, "Uncommon": 22.0, "Rare": 7.0, "Epic": 2.2, "Legendary": 0.8, "Exotic": 0.5 },
        guarantee: "1 Guaranteed Uncommon+"
      },
      {
        id: "rare",
        name: "Rare Pack",
        cost: 350,
        currency: "Gems",
        cardCount: 6,
        badge: "High Tier",
        description: "Packed with concentrated rare magic. 48% chance of Rare per card slot with elevated Epic/Legendary rates.",
        rates: { "Common": 10.0, "Uncommon": 22.0, "Rare": 48.0, "Epic": 14.0, "Legendary": 5.0, "Exotic": 1.0 },
        guarantee: "High Rare Concentration"
      },
      {
        id: "exotic",
        name: "Exotic Pack",
        cost: 1050,
        currency: "Gems",
        cardCount: 8,
        badge: "Guaranteed Foil",
        description: "The crown jewel of booster packs! Contains 1 Guaranteed Exotic + 1 Guaranteed Legendary + 6 high-tier cards.",
        rates: { "Uncommon": 2.0, "Rare": 10.0, "Epic": 34.0, "Legendary": 32.0, "Exotic": 22.0 },
        guarantee: "1 Guaranteed Exotic + 1 Guaranteed Legendary"
      },
      {
        id: "bundle",
        name: "Collector's Bundle Box",
        cost: 1600,
        currency: "Gems",
        cardCount: 38,
        badge: "Maximum Value",
        description: "Massive 38-card box bundle combining 3 Common Packs + 2 Rare Packs + 1 Exotic Pack with substantial Gem savings!",
        rates: { "Common": 40.0, "Uncommon": 25.0, "Rare": 20.0, "Epic": 8.0, "Legendary": 5.0, "Exotic": 2.0 },
        guarantee: "Includes 1 Guaranteed Exotic & 1 Guaranteed Legendary"
      },
      {
        id: "hero-draft",
        name: "Hero Archetype Draft",
        cost: 450,
        currency: "Gems",
        cardCount: 7,
        badge: "Class Targeted",
        description: "Draft cards tuned for high archetype synergy. Features elevated rare pulls for your favorite combat styles.",
        rates: { "Common": 28.0, "Uncommon": 42.0, "Rare": 20.0, "Epic": 7.0, "Legendary": 2.5, "Exotic": 0.5 },
        guarantee: "High Synergy Card Pool"
      }
    ];
  }

  loadState() {
    try {
      if (typeof localStorage === 'undefined') return;
      const savedGems = localStorage.getItem('decked_gems');
      if (savedGems !== null) this.gems = parseInt(savedGems, 10);
      const savedGold = localStorage.getItem('decked_gold');
      if (savedGold !== null) this.gold = parseInt(savedGold, 10);
      const savedOpened = localStorage.getItem('decked_packs_opened');
      if (savedOpened !== null) this.packsOpened = parseInt(savedOpened, 10);

      const savedCol = localStorage.getItem('decked_collection');
      if (savedCol) {
        const parsed = JSON.parse(savedCol);
        const validIds = new Set(this.allCards.map(c => c.id));
        this.collection = {};
        for (const [id, count] of Object.entries(parsed)) {
          if (validIds.has(id)) {
            this.collection[id] = count;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load pack simulator state:', e);
    }
  }

  saveState() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('decked_gems', this.gems);
        localStorage.setItem('decked_gold', this.gold);
        localStorage.setItem('decked_packs_opened', this.packsOpened);
        localStorage.setItem('decked_collection', JSON.stringify(this.collection));
      }
    } catch (e) {}

    this.updateCurrencyDisplays();
    this.updateBinderProgress();
  }

  init() {
    this.ensureCards(() => {
      this.renderPackShelf();
      this.renderBinderGrid();
      this.bindEvents();
      this.updateCurrencyDisplays();
      this.updateBinderProgress();
    });
  }

  ensureCards(callback, retries = 20) {
    if (this.allCards && this.allCards.length > 0) {
      callback();
      return;
    }
    if (typeof window !== 'undefined' && window.GAME_CARDS && window.GAME_CARDS.length > 0) {
      this.allCards = window.GAME_CARDS;
      callback();
      return;
    }
    if (retries > 0) {
      setTimeout(() => this.ensureCards(callback, retries - 1), 100);
    } else {
      callback();
    }
  }

  bindEvents() {
    // Free Gems / Supply Drop Button
    const supplyBtn = document.getElementById('claim-supply-drop-btn');
    if (supplyBtn && (!supplyBtn.dataset || !supplyBtn.dataset.bound)) {
      if (supplyBtn.dataset) supplyBtn.dataset.bound = 'true';
      supplyBtn.addEventListener('click', () => {
        this.gems += 500;
        this.saveState();
        this.bumpCurrency('gems');
        if (window.audioMgr) window.audioMgr.playSFX('goldGain');
        if (window.showToast) window.showToast('💎 Supply Drop Claimed: +500 Free Gems!');
      });
    }

    // Tab Switcher (Shop vs Binder)
    const shopTabBtn = document.getElementById('tab-btn-shop');
    const binderTabBtn = document.getElementById('tab-btn-binder');
    const shopSection = document.getElementById('packs-shop-section');
    const binderSection = document.getElementById('binder-album-section');

    if (shopTabBtn && binderTabBtn) {
      shopTabBtn.addEventListener('click', () => {
        this.activeTab = 'shop';
        shopTabBtn.classList.add('active');
        binderTabBtn.classList.remove('active');
        if (shopSection) shopSection.style.display = 'block';
        if (binderSection) binderSection.style.display = 'none';
        if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
      });

      binderTabBtn.addEventListener('click', () => {
        this.activeTab = 'binder';
        binderTabBtn.classList.add('active');
        shopTabBtn.classList.remove('active');
        if (shopSection) shopSection.style.display = 'none';
        if (binderSection) binderSection.style.display = 'block';
        if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
        this.renderBinderGrid();
      });
    }

    // Binder Filters
    const ownershipPills = document.querySelectorAll('.binder-filter-ownership');
    ownershipPills.forEach(pill => {
      pill.addEventListener('click', () => {
        ownershipPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.binderFilter = pill.dataset.filter;
        if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
        this.renderBinderGrid();
      });
    });

    const raritySelect = document.getElementById('binder-rarity-select');
    if (raritySelect) {
      raritySelect.addEventListener('change', (e) => {
        this.binderRarity = e.target.value;
        if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
        this.renderBinderGrid();
      });
    }

    const classSelect = document.getElementById('binder-class-select');
    if (classSelect) {
      classSelect.addEventListener('change', (e) => {
        this.binderClass = e.target.value;
        if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
        this.renderBinderGrid();
      });
    }

    // Pack Theatre Controls
    const theatreCloseBtn = document.getElementById('theatre-close-btn');
    if (theatreCloseBtn) {
      theatreCloseBtn.addEventListener('click', () => this.closeTheatre());
    }

    const tearStrip = document.getElementById('theatre-tear-strip');
    const ripActionBtn = document.getElementById('btn-rip-foil');
    if (tearStrip) {
      tearStrip.addEventListener('click', () => this.executeTearSequence());
    }
    if (ripActionBtn) {
      ripActionBtn.addEventListener('click', () => this.executeTearSequence());
    }

    const revealAllBtn = document.getElementById('theatre-reveal-all-btn');
    if (revealAllBtn) {
      revealAllBtn.addEventListener('click', () => this.revealAllCards());
    }

    const openAnotherBtn = document.getElementById('theatre-open-another-btn');
    if (openAnotherBtn) {
      openAnotherBtn.addEventListener('click', () => {
        if (this.activePack) {
          this.startPackOpening(this.activePack.id);
        }
      });
    }

    const doneCollectingBtn = document.getElementById('theatre-done-btn');
    if (doneCollectingBtn) {
      doneCollectingBtn.addEventListener('click', () => {
        if (window.audioMgr) window.audioMgr.playSFX('goldGain');
        this.closeTheatre();
      });
    }

    const viewInBinderBtn = document.getElementById('theatre-view-binder-btn');
    if (viewInBinderBtn) {
      viewInBinderBtn.addEventListener('click', () => {
        this.closeTheatre();
        if (binderTabBtn) binderTabBtn.click();
      });
    }

    // Odds Modal Close
    const oddsModal = document.getElementById('pack-odds-modal');
    const oddsCloseBtn = document.getElementById('odds-modal-close');
    if (oddsCloseBtn && oddsModal) {
      oddsCloseBtn.addEventListener('click', () => oddsModal.classList.remove('active'));
      oddsModal.addEventListener('click', (e) => {
        if (e.target === oddsModal) oddsModal.classList.remove('active');
      });
    }

    // Card Detail Modal Close (from compendium)
    const cardModal = document.getElementById('card-detail-modal');
    const cardModalClose = document.getElementById('card-modal-close');
    if (cardModal && cardModalClose) {
      cardModalClose.addEventListener('click', () => {
        cardModal.classList.remove('active');
        cardModal.classList.remove('open');
      });
      cardModal.addEventListener('click', (e) => {
        if (e.target === cardModal) {
          cardModal.classList.remove('active');
          cardModal.classList.remove('open');
        }
      });
    }

    // Keyboard ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (oddsModal && oddsModal.classList.contains('active')) {
          oddsModal.classList.remove('active');
        } else if (cardModal && (cardModal.classList.contains('active') || cardModal.classList.contains('open'))) {
          cardModal.classList.remove('active');
          cardModal.classList.remove('open');
        } else {
          this.closeTheatre();
        }
      }
    });
  }

  updateCurrencyDisplays() {
    const gemsEls = document.querySelectorAll('.user-gems-count');
    gemsEls.forEach(el => el.textContent = this.gems.toLocaleString());

    const goldEls = document.querySelectorAll('.user-gold-count');
    goldEls.forEach(el => el.textContent = this.gold.toLocaleString());

    const packsEls = document.querySelectorAll('.user-packs-opened-count');
    packsEls.forEach(el => el.textContent = this.packsOpened.toLocaleString());
  }

  bumpCurrency(type) {
    const pill = document.querySelector(`.pack-currency-pill.${type}`);
    if (pill) {
      pill.classList.remove('bump');
      void pill.offsetWidth;
      pill.classList.add('bump');
      setTimeout(() => pill.classList.remove('bump'), 250);
    }
  }

  updateBinderProgress() {
    const totalPossible = this.allCards.length || 62;
    const ownedUnique = Object.keys(this.collection).length;
    const pct = totalPossible > 0 ? Math.round((ownedUnique / totalPossible) * 100) : 0;

    const fillEl = document.getElementById('binder-progress-fill');
    const labelEl = document.getElementById('binder-progress-stat');
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (labelEl) labelEl.textContent = `${ownedUnique} / ${totalPossible} Unlocked (${pct}%)`;

    // Update rarity breakdown counts
    const rarityCounts = { Common: 0, Uncommon: 0, Rare: 0, Epic: 0, Legendary: 0, Exotic: 0 };
    const rarityTotals = { Common: 0, Uncommon: 0, Rare: 0, Epic: 0, Legendary: 0, Exotic: 0 };

    this.allCards.forEach(c => {
      if (rarityTotals[c.rarity] !== undefined) rarityTotals[c.rarity]++;
      if (this.collection[c.id]) {
        if (rarityCounts[c.rarity] !== undefined) rarityCounts[c.rarity]++;
      }
    });

    for (const [r, count] of Object.entries(rarityCounts)) {
      const el = document.getElementById(`count-rarity-${r.toLowerCase()}`);
      if (el) el.textContent = `${count}/${rarityTotals[r] || 0}`;
    }
  }

  renderPackShelf() {
    const container = document.getElementById('packs-shelf-grid');
    if (!container) return;

    if (!this.packs || this.packs.length === 0) {
      this.initDefaultPacks();
    }

    const packMascots = {
      'common': 'assets/heroes/anim/Goblin.gif',
      'rare': 'assets/heroes/anim/DeckMonk.gif',
      'exotic': 'assets/heroes/anim/Demonling.gif',
      'bundle': 'assets/heroes/anim/GorillaGabe.gif',
      'hero-draft': 'assets/heroes/anim/Hunter the Hedgehog.gif'
    };

    const foilClasses = {
      'common': 'foil-common',
      'rare': 'foil-rare',
      'exotic': 'foil-exotic',
      'bundle': 'foil-bundle',
      'hero-draft': 'foil-hero'
    };

    container.innerHTML = this.packs.map(pack => {
      const isFeatured = pack.id === 'exotic' || pack.id === 'bundle';
      const badgeClass = pack.id === 'exotic' ? 'exotic' : (pack.id === 'bundle' ? 'bundle' : (pack.id === 'hero-draft' ? 'draft' : ''));
      const mascot = packMascots[pack.id] || 'assets/heroes/anim/DeckMonk.gif';
      const foilClass = foilClasses[pack.id] || 'foil-common';

      return `
        <div class="pack-shelf-item ${isFeatured ? 'featured' : ''}" data-pack-id="${pack.id}">
          <div class="pack-badge ${badgeClass}">${pack.badge}</div>

          <!-- 3D Interactive Booster Pack Model -->
          <div class="booster-pack-3d" data-pack-id="${pack.id}" title="Click to rip open ${pack.name}">
            <div class="booster-pack-body ${foilClass}">
              <div class="pack-crimp top"></div>
              
              <div class="pack-art-content">
                <span class="pack-logo-kicker">DECKED OUT • TCG</span>
                <img src="${mascot}" alt="${pack.name}" class="pack-sprite-icon" loading="lazy">
                <div class="pack-name-headline">${pack.name}</div>
                <div class="pack-cards-sub">${pack.cardCount} CARDS</div>
              </div>

              <div class="pack-crimp bottom"></div>
              <div class="foil-shimmer"></div>
            </div>
          </div>

          <!-- Information & Actions -->
          <div class="pack-info-area">
            <div class="pack-title-row">
              <h3>${pack.name}</h3>
              <span style="font-family: var(--font-pixel); font-size: 0.85rem; color: #38bdf8;">💎 ${pack.cost}</span>
            </div>

            <p class="pack-desc-text">${pack.description}</p>

            ${pack.guarantee ? `<div class="pack-guarantee-pill">⭐ ${pack.guarantee}</div>` : ''}

            <div class="pack-card-actions">
              <button class="btn-open-pack" data-pack-id="${pack.id}">
                <span>Open Pack</span>
                <span style="background: rgba(0,0,0,0.3); padding: 0.15rem 0.45rem; font-size: 0.75rem;">💎 ${pack.cost}</span>
              </button>
              <button class="btn-view-odds" data-pack-id="${pack.id}" title="View Drop Rates">Odds</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners
    container.querySelectorAll('.btn-open-pack').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startPackOpening(btn.dataset.packId);
      });
    });

    container.querySelectorAll('.booster-pack-3d').forEach(packEl => {
      packEl.addEventListener('click', () => {
        this.startPackOpening(packEl.dataset.packId);
      });
    });

    container.querySelectorAll('.btn-view-odds').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showOddsModal(btn.dataset.packId);
      });
    });
  }

  showOddsModal(packId) {
    const pack = this.packs.find(p => p.id === packId);
    if (!pack) return;

    const modal = document.getElementById('pack-odds-modal');
    const content = document.getElementById('odds-modal-content');
    if (!modal || !content) return;

    content.innerHTML = `
      <h3 style="font-family: var(--font-pixel); color: #fff; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
        <span>📦</span> ${pack.name} — Drop Rates
      </h3>
      <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1rem;">
        Authentic drop odds configured per card slot in Godot 4.7 Forward+.
      </p>

      <table class="odds-table">
        <thead>
          <tr>
            <th>Rarity</th>
            <th>Rate per Slot</th>
            <th>Tier Color</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(pack.rates).map(([rarity, rate]) => `
            <tr>
              <td style="font-weight: 700; color: var(--rarity-${rarity.toLowerCase()});">${rarity}</td>
              <td>${rate.toFixed(1)}%</td>
              <td><span style="display: inline-block; width: 14px; height: 14px; background: var(--rarity-${rarity.toLowerCase()});"></span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${pack.guarantee ? `
        <div style="background: rgba(56, 189, 248, 0.1); border: 1px dashed #38bdf8; padding: 0.6rem; font-family: var(--font-pixel); font-size: 0.72rem; color: #38bdf8;">
          ⭐ Guaranteed Slot: ${pack.guarantee}
        </div>
      ` : ''}

      <div style="margin-top: 1.25rem; text-align: right;">
        <button class="btn btn-primary" onclick="document.getElementById('pack-odds-modal').classList.remove('active');">Close</button>
      </div>
    `;

    modal.classList.add('active');
  }

  startPackOpening(packId) {
    const pack = this.packs.find(p => p.id === packId);
    if (!pack) return;

    if (this.gems < pack.cost) {
      if (window.showToast) {
        window.showToast('⚠️ Not enough Gems! Click "+500 Free Supply Drop" above.', 'warning');
      }
      if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
      this.bumpCurrency('gems');
      return;
    }

    this.activePack = pack;
    this.gems -= pack.cost;
    this.packsOpened++;
    this.bumpCurrency('gems');
    this.bumpCurrency('opened');

    // Generate pulled cards from clean Series 1 pool
    this.currentOpenedCards = this.rollCardsForPack(pack);
    this.revealedCount = 0;

    // Track duplicate scrap gain
    let scrapGained = 0;
    const scrapValues = { 'Common': 5, 'Uncommon': 10, 'Rare': 25, 'Epic': 50, 'Legendary': 100, 'Exotic': 250 };

    this.currentOpenedCards.forEach(card => {
      if (this.collection[card.id]) {
        scrapGained += scrapValues[card.rarity] || 10;
        this.collection[card.id]++;
      } else {
        this.collection[card.id] = 1;
      }
    });

    if (scrapGained > 0) {
      this.gold += scrapGained;
      this.bumpCurrency('gold');
    }

    this.saveState();

    // Prepare Pack Opening Theatre Modal
    const modal = document.getElementById('pack-theatre-modal');
    const ripArena = document.getElementById('theatre-rip-arena');
    const revealStage = document.getElementById('theatre-reveal-stage');
    const theatreTitle = document.getElementById('theatre-pack-title');
    const theatrePackBody = document.getElementById('theatre-pack-body');
    const summaryText = document.getElementById('cards-stage-summary-text');
    const openAnotherBtn = document.getElementById('theatre-open-another-btn');

    if (!modal) return;

    if (theatreTitle) theatreTitle.textContent = `${pack.name}`;
    if (summaryText) summaryText.innerHTML = `Cracking <strong>${pack.name}</strong> • ${pack.cardCount} Cards Loaded`;
    if (openAnotherBtn) openAnotherBtn.innerHTML = `<span>Open Another</span> <span style="background: rgba(0,0,0,0.4); padding: 0.1rem 0.4rem; font-size: 0.72rem;">💎 ${pack.cost}</span>`;

    // Apply foil theme to the centerpiece pack
    if (theatrePackBody) {
      theatrePackBody.className = `theatre-pack-body foil-${pack.id}`;
      const mascot = pack.id === 'common' ? 'assets/heroes/anim/Goblin.gif' :
                    (pack.id === 'rare' ? 'assets/heroes/anim/DeckMonk.gif' :
                    (pack.id === 'exotic' ? 'assets/heroes/anim/Demonling.gif' :
                    (pack.id === 'bundle' ? 'assets/heroes/anim/GorillaGabe.gif' : 'assets/heroes/anim/Hunter the Hedgehog.gif')));
      
      const mascotImg = document.getElementById('theatre-pack-mascot');
      if (mascotImg) mascotImg.src = mascot;
      const nameEl = document.getElementById('theatre-pack-name');
      if (nameEl) nameEl.textContent = pack.name;
    }

    // Reset view phases: show tear arena, hide card reveal shelf
    if (ripArena) ripArena.style.display = 'flex';
    if (revealStage) revealStage.classList.remove('active');

    const tearStrip = document.getElementById('theatre-tear-strip');
    if (tearStrip) tearStrip.style.display = 'flex';

    modal.classList.add('active');
    if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
  }

  executeTearSequence() {
    const theatrePackBody = document.getElementById('theatre-pack-body');
    const tearStrip = document.getElementById('theatre-tear-strip');
    const ripArena = document.getElementById('theatre-rip-arena');
    const revealStage = document.getElementById('theatre-reveal-stage');

    // 1. Tactile Rip Audio
    if (window.audioMgr) window.audioMgr.playPackRip();

    // 2. Tactile Rip Shake and Particle Burst
    if (theatrePackBody) {
      theatrePackBody.classList.add('shake');
    }
    if (tearStrip) {
      tearStrip.style.display = 'none';
    }

    this.triggerFoilSparks();

    // 3. Transition to Reveal Stage after 350ms
    setTimeout(() => {
      if (ripArena) ripArena.style.display = 'none';
      if (revealStage) revealStage.classList.add('active');
      this.populateRevealShelf();
    }, 350);
  }

  populateRevealShelf() {
    const shelf = document.getElementById('theatre-opened-grid');
    const revealAllBtn = document.getElementById('theatre-reveal-all-btn');
    if (!shelf) return;

    if (revealAllBtn) revealAllBtn.style.display = 'inline-flex';

    // Rarity rank for auras
    const auraClasses = {
      'Common': 'aura-common',
      'Uncommon': 'aura-uncommon',
      'Rare': 'aura-rare',
      'Epic': 'aura-epic',
      'Legendary': 'aura-legendary',
      'Exotic': 'aura-exotic'
    };

    shelf.innerHTML = this.currentOpenedCards.map((card, idx) => {
      const isNew = this.collection[card.id] === 1;
      const auraClass = auraClasses[card.rarity] || 'aura-common';
      const cardHTML = this.generateCardHTML(card);

      return `
        <div class="pack-flip-card" data-index="${idx}">
          <div class="pack-flip-inner">
            <!-- Back Face (Suspenseful Mystery Back with Rarity Aura) -->
            <div class="pack-card-face pack-face-back ${auraClass}">
              <div class="card-back-core">
                <div class="card-back-gem">🃏</div>
                <span class="card-back-title">DECKED OUT</span>
                <span class="card-back-hint">CLICK TO REVEAL</span>
              </div>
            </div>

            <!-- Front Face (Revealed Card) -->
            <div class="pack-card-face pack-face-front">
              ${isNew ? '<span class="pack-tag-new">NEW!</span>' : '<span class="pack-tag-dup">DUP</span>'}
              ${cardHTML}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to flip cards individually
    shelf.querySelectorAll('.pack-flip-card').forEach(cardEl => {
      cardEl.addEventListener('click', () => {
        const idx = parseInt(cardEl.dataset.index, 10);
        if (cardEl.classList.contains('is-flipped')) {
          // Card already flipped: open card inspector modal!
          const card = this.currentOpenedCards[idx];
          if (card) this.inspectCard(card);
        } else {
          this.revealCard(cardEl, idx, false);
        }
      });
    });
  }

  revealCard(cardEl, index, isBatch = false) {
    if (cardEl.classList.contains('is-flipped')) return;

    cardEl.classList.add('is-flipped');
    this.revealedCount++;

    const card = this.currentOpenedCards[index];

    // Audio and VFX
    if (!isBatch && window.audioMgr) {
      if (card.rarity === 'Exotic') {
        window.audioMgr.playFanfare('Exotic');
        this.triggerCelebration('Exotic');
      } else if (card.rarity === 'Legendary') {
        window.audioMgr.playFanfare('Legendary');
        this.triggerCelebration('Legendary');
      } else if (card.rarity === 'Epic' || card.rarity === 'Rare') {
        window.audioMgr.playSFX('goldGain');
        this.triggerCelebration('Rare');
      } else {
        window.audioMgr.playSFX('cardPlay');
      }
    }

    if (this.revealedCount >= this.currentOpenedCards.length) {
      this.onAllCardsRevealed();
    }
  }

  revealAllCards() {
    const unrevealed = document.querySelectorAll('.pack-flip-card:not(.is-flipped)');
    if (unrevealed.length === 0) return;

    const revealAllBtn = document.getElementById('theatre-reveal-all-btn');
    if (revealAllBtn) revealAllBtn.style.display = 'none';

    // Find highest rarity in this pack
    let highestRarity = 'Common';
    const rarityRank = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5, 'Exotic': 6 };

    this.currentOpenedCards.forEach(c => {
      if ((rarityRank[c.rarity] || 1) > (rarityRank[highestRarity] || 1)) {
        highestRarity = c.rarity;
      }
    });

    if (window.audioMgr) window.audioMgr.playSFX('cardPlay');

    // Cascade flip each card smoothly with 70ms stagger
    unrevealed.forEach((cardEl, i) => {
      setTimeout(() => {
        const idx = parseInt(cardEl.dataset.index, 10);
        this.revealCard(cardEl, idx, true);

        // On the final card, play grand fanfare for highest rarity pull
        if (i === unrevealed.length - 1 && window.audioMgr) {
          if (highestRarity === 'Exotic' || highestRarity === 'Legendary') {
            window.audioMgr.playFanfare(highestRarity);
            this.triggerCelebration(highestRarity);
          } else if (highestRarity === 'Epic' || highestRarity === 'Rare') {
            window.audioMgr.playSFX('goldGain');
            this.triggerCelebration('Rare');
          }
          this.onAllCardsRevealed();
        }
      }, i * 75);
    });
  }

  onAllCardsRevealed() {
    const revealAllBtn = document.getElementById('theatre-reveal-all-btn');
    if (revealAllBtn) revealAllBtn.style.display = 'none';

    const summaryText = document.getElementById('cards-stage-summary-text');
    if (summaryText) {
      const counts = {};
      this.currentOpenedCards.forEach(c => {
        counts[c.rarity] = (counts[c.rarity] || 0) + 1;
      });

      const parts = Object.entries(counts).map(([r, n]) => `${n} ${r}`);
      summaryText.innerHTML = `✨ <strong>Pack Results:</strong> ${parts.join(', ')} • Added to Binder!`;
    }
  }

  closeTheatre() {
    const modal = document.getElementById('pack-theatre-modal');
    if (modal) modal.classList.remove('active');
    this.currentOpenedCards = [];
    this.updateBinderProgress();
    if (this.activeTab === 'binder') {
      this.renderBinderGrid();
    }
  }

  inspectCard(card) {
    const modal = document.getElementById('card-detail-modal');
    const content = document.getElementById('card-detail-content');
    if (!modal || !content) return;

    if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
    content.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
        ${this.generateCardHTML(card)}
      </div>
    `;
    modal.classList.add('active');
    modal.classList.add('open');
  }

  generateCardHTML(card) {
    if (!card) return '';
    if (typeof window !== 'undefined' && window.CompendiumManager && typeof window.CompendiumManager.generateCardHTML === 'function') {
      return window.CompendiumManager.generateCardHTML(card);
    }
    if (typeof CompendiumManager !== 'undefined' && typeof CompendiumManager.generateCardHTML === 'function') {
      return CompendiumManager.generateCardHTML(card);
    }
    if (typeof window !== 'undefined' && typeof window.generateCardHTML === 'function') {
      return window.generateCardHTML(card);
    }
    return `
      <div class="game-card rarity-${(card.rarity || 'common').toLowerCase()}">
        <div class="card-top-bar">
          <div class="card-cost-gem">${card.cost || 0}</div>
          <div class="card-name-title">${card.name || 'Card'}</div>
        </div>
        <div class="card-image-box">
          <img src="${card.image || card.staticImage || ''}" alt="${card.name || ''}" loading="lazy" />
        </div>
        <div class="card-desc-box"><p>${card.description || ''}</p></div>
        <div class="card-footer-bar"><span>${card.code || ''}</span><span>${card.rarity || ''}</span></div>
      </div>
    `;
  }

  // Hardware-accelerated Celebratory Sparks
  triggerCelebration(tier = 'Rare') {
    const stage = document.getElementById('pack-theatre-modal');
    if (!stage) return;

    const colors = tier === 'Exotic' 
      ? ['#00e5ff', '#ec4899', '#fcd34d', '#38bdf8', '#ffffff'] 
      : (tier === 'Legendary' ? ['#f59e0b', '#fbbf24', '#f97316', '#fff'] : ['#38bdf8', '#818cf8', '#fff']);

    const particleCount = tier === 'Exotic' ? 24 : 14;
    const fragment = document.createDocumentFragment();
    const sparks = [];

    for (let i = 0; i < particleCount; i++) {
      const spark = document.createElement('div');
      spark.className = 'sparkle-burst';
      spark.style.left = '50%';
      spark.style.top = '45%';
      spark.style.background = colors[i % colors.length];

      const angle = (i / particleCount) * Math.PI * 2;
      const dist = 140 + Math.random() * 160;
      const dx = `${Math.cos(angle) * dist}px`;
      const dy = `${Math.sin(angle) * dist}px`;
      spark.style.setProperty('--dx', dx);
      spark.style.setProperty('--dy', dy);

      fragment.appendChild(spark);
      sparks.push(spark);
    }

    stage.appendChild(fragment);
    setTimeout(() => {
      sparks.forEach(s => s.remove());
    }, 680);
  }

  triggerFoilSparks() {
    const arena = document.getElementById('theatre-rip-arena');
    if (!arena) return;

    const colors = ['#f59e0b', '#ffffff', '#fbbf24', '#e2e8f0'];
    const particleCount = 18;
    const fragment = document.createDocumentFragment();
    const sparks = [];

    for (let i = 0; i < particleCount; i++) {
      const spark = document.createElement('div');
      spark.className = 'sparkle-burst';
      spark.style.left = `${30 + Math.random() * 40}%`;
      spark.style.top = '25%';
      spark.style.background = colors[i % colors.length];

      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 100;
      const dx = `${Math.cos(angle) * dist}px`;
      const dy = `${Math.sin(angle) * dist}px`;
      spark.style.setProperty('--dx', dx);
      spark.style.setProperty('--dy', dy);

      fragment.appendChild(spark);
      sparks.push(spark);
    }

    arena.appendChild(fragment);
    setTimeout(() => {
      sparks.forEach(s => s.remove());
    }, 600);
  }

  rollCardsForPack(pack) {
    const cards = [];
    const pool = this.allCards;

    const getRandomByRarity = (rarity, filterClass = null) => {
      let match = pool.filter(c => c.rarity.toLowerCase() === rarity.toLowerCase());
      if (filterClass) {
        const classMatch = match.filter(c => c.class === filterClass);
        if (classMatch.length > 0) match = classMatch;
      }
      if (match.length > 0) {
        return match[Math.floor(Math.random() * match.length)];
      }
      return pool[Math.floor(Math.random() * pool.length)];
    };

    const rollRarity = (rates) => {
      const rand = Math.random() * 100;
      let cum = 0;
      for (const [rarity, pct] of Object.entries(rates)) {
        cum += pct;
        if (rand <= cum) return rarity;
      }
      return 'Common';
    };

    if (pack.id === 'exotic') {
      // 1 Guaranteed Exotic
      cards.push(getRandomByRarity('Exotic'));
      // 1 Guaranteed Legendary
      cards.push(getRandomByRarity('Legendary'));
      // 6 High-Tier cards
      for (let i = 2; i < 8; i++) {
        const r = rollRarity(pack.rates);
        cards.push(getRandomByRarity(r));
      }
    } else if (pack.id === 'bundle') {
      // Guaranteed Exotic + Legendary in 38-card mega box
      cards.push(getRandomByRarity('Exotic'));
      cards.push(getRandomByRarity('Legendary'));
      for (let i = 2; i < pack.cardCount; i++) {
        const r = rollRarity(pack.rates);
        cards.push(getRandomByRarity(r));
      }
    } else if (pack.id === 'hero-draft') {
      // Pick random class for targeted synergy
      const classes = ['Swordsman', 'Wild Mages', 'Goblins', 'Animal', 'Monster', 'Elixir'];
      const targetClass = classes[Math.floor(Math.random() * classes.length)];
      for (let i = 0; i < pack.cardCount; i++) {
        const r = rollRarity(pack.rates);
        cards.push(getRandomByRarity(r, i < 5 ? targetClass : null));
      }
    } else {
      // Standard Common & Rare packs
      for (let i = 0; i < pack.cardCount; i++) {
        const r = rollRarity(pack.rates);
        cards.push(getRandomByRarity(r));
      }
    }

    return cards;
  }

  // --- Collection Binder Album View ---
  renderBinderGrid() {
    const container = document.getElementById('binder-grid-container');
    if (!container) return;

    let filtered = [...this.allCards];

    // Filter by ownership
    if (this.binderFilter === 'owned') {
      filtered = filtered.filter(c => this.collection[c.id] > 0);
    } else if (this.binderFilter === 'missing') {
      filtered = filtered.filter(c => !this.collection[c.id]);
    }

    // Filter by class
    if (this.binderClass !== 'all') {
      filtered = filtered.filter(c => c.class === this.binderClass);
    }

    // Filter by rarity
    if (this.binderRarity !== 'all') {
      filtered = filtered.filter(c => c.rarity.toLowerCase() === this.binderRarity.toLowerCase());
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted); font-family: var(--font-pixel);">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🔍</div>
          <h3>No Cards in this View</h3>
          <p>Adjust your ownership or category filters to view your binder.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(card => {
      const ownedCount = this.collection[card.id] || 0;
      const isOwned = ownedCount > 0;

      if (isOwned) {
        return `
          <div class="binder-card-slot" data-card-id="${card.id}" title="Click to view card details">
            <span class="binder-owned-qty">x${ownedCount}</span>
            ${this.generateCardHTML(card)}
          </div>
        `;
      } else {
        return `
          <div class="binder-card-slot locked" data-card-id="${card.id}" title="Not yet discovered in booster packs">
            <div class="binder-lock-overlay">
              <div class="binder-lock-icon">🔒</div>
              <span class="binder-lock-code">${card.code}</span>
              <span style="font-family: var(--font-pixel); font-size: 0.6rem; color: #64748b; margin-top: 0.25rem;">${card.rarity}</span>
            </div>
            ${this.generateCardHTML(card)}
          </div>
        `;
      }
    }).join('');

    // Attach click listeners to owned cards in binder
    container.querySelectorAll('.binder-card-slot:not(.locked)').forEach(slot => {
      slot.addEventListener('click', () => {
        const cardId = slot.dataset.cardId;
        const card = this.allCards.find(c => c.id === cardId);
        if (card) this.inspectCard(card);
      });
    });
  }
}

if (typeof window !== 'undefined') {
  window.PackSimulator = PackSimulator;
}

function initPackSimulator() {
  if (document.getElementById('packs-shelf-grid') && (!window.packSimulator || !document.getElementById('packs-shelf-grid').children.length)) {
    window.packSimulator = new PackSimulator();
    window.packSim = window.packSimulator;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPackSimulator);
  } else {
    initPackSimulator();
  }
}
