// Decked Out - Gacha & Booster Pack Opening Simulator
// High-Performance 60FPS: Pre-rendered 3D hardware-accelerated card flips, zero layout thrashing

class PackSimulator {
  constructor() {
    this.packs = window.GAME_PACKS || [];
    this.allCards = window.GAME_CARDS || [];
    this.gems = 1500; // Starter gems
    this.gold = 500;  // Starter gold
    this.collection = {}; // { cardId: count }
    this.currentOpenedCards = [];
    this.revealedCount = 0;

    this.loadState();
    this.init();
  }

  loadState() {
    try {
      const savedGems = localStorage.getItem('decked_gems');
      if (savedGems !== null) this.gems = parseInt(savedGems, 10);
      const savedGold = localStorage.getItem('decked_gold');
      if (savedGold !== null) this.gold = parseInt(savedGold, 10);
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
        localStorage.setItem('decked_collection', JSON.stringify(this.collection));
      }
    } catch(e) {}
  }

  saveState() {
    try {
      localStorage.setItem('decked_gems', this.gems);
      localStorage.setItem('decked_gold', this.gold);
      localStorage.setItem('decked_collection', JSON.stringify(this.collection));
    } catch(e) {}
    this.updateCurrencyDisplays();
    this.updateCollectionProgress();
  }

  init() {
    this.renderPackList();
    this.bindEvents();
    this.updateCurrencyDisplays();
    this.updateCollectionProgress();
  }

  bindEvents() {
    const claimGemsBtn = document.getElementById('claim-free-gems-btn');
    if (claimGemsBtn) {
      claimGemsBtn.addEventListener('click', () => {
        this.gems += 500;
        this.saveState();
        if (window.audioMgr) window.audioMgr.playSFX('goldGain');
        if (window.showToast) window.showToast('💎 Claimed +500 Free Gems!');
      });
    }

    const revealAllBtn = document.getElementById('pack-reveal-all-btn');
    if (revealAllBtn) {
      revealAllBtn.addEventListener('click', () => this.revealAllCards());
    }

    const closePackModalBtn = document.getElementById('pack-modal-close-btn');
    if (closePackModalBtn) {
      closePackModalBtn.addEventListener('click', () => this.closePackModal());
    }
  }

  updateCurrencyDisplays() {
    const gemsEls = document.querySelectorAll('.user-gems-count');
    gemsEls.forEach(el => el.textContent = this.gems.toLocaleString());

    const goldEls = document.querySelectorAll('.user-gold-count');
    goldEls.forEach(el => el.textContent = this.gold.toLocaleString());
  }

  updateCollectionProgress() {
    const totalPossible = this.allCards.length;
    const ownedUnique = Object.keys(this.collection).length;
    const pct = totalPossible > 0 ? Math.round((ownedUnique / totalPossible) * 100) : 0;

    const barEl = document.getElementById('collection-progress-bar');
    const labelEl = document.getElementById('collection-progress-label');
    if (barEl) barEl.style.width = `${pct}%`;
    if (labelEl) labelEl.textContent = `${ownedUnique} / ${totalPossible} Unlocked (${pct}%)`;
  }

  renderPackList() {
    const container = document.getElementById('packs-shelf-grid');
    if (!container) return;

    container.innerHTML = this.packs.map(pack => `
      <div class="pack-card pack-${pack.id}">
        <div class="pack-card-badge">${pack.badge}</div>
        <div class="pack-foil-wrapper" data-pack-id="${pack.id}">
          <div class="pack-foil">
            <div class="pack-art-inner">
              <span class="pack-series">DECKED OUT</span>
              <div style="font-size: 2.8rem; margin: 0.5rem 0;">📦</div>
              <div class="pack-title">${pack.name}</div>
              <div style="font-size: 0.72rem; color: #fcd34d; font-weight: 700; margin-top: 0.25rem;">${pack.cardCount} CARDS</div>
            </div>
          </div>
        </div>
        <h3 style="font-size: 1.15rem; color: #fff; margin-bottom: 0.4rem;">${pack.name}</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.25rem; flex: 1;">
          ${pack.description}
        </p>
        <button class="btn btn-primary open-pack-btn" data-pack-id="${pack.id}" style="width: 100%; justify-content: center;">
          <span>Open Pack</span>
          <span style="background: rgba(0,0,0,0.3); padding: 0.15rem 0.5rem; border-radius: 99px; font-size: 0.82rem;">💎 ${pack.cost}</span>
        </button>
      </div>
    `).join('');

    container.querySelectorAll('.open-pack-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const packId = btn.dataset.packId;
        this.openPack(packId);
      });
    });

    container.querySelectorAll('.pack-foil-wrapper').forEach(wrapper => {
      wrapper.addEventListener('click', () => {
        const packId = wrapper.dataset.packId;
        this.openPack(packId);
      });
    });
  }

  openPack(packId) {
    const pack = this.packs.find(p => p.id === packId);
    if (!pack) return;

    if (this.gems < pack.cost) {
      if (window.showToast) window.showToast('⚠️ Not enough Gems! Click "Claim +500 Free Gems" above.', 'warning');
      if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
      return;
    }

    this.gems -= pack.cost;

    // Fast pre-cached pack tear audio
    if (window.audioMgr) window.audioMgr.playPackRip();

    // Generate pulled cards from clean Series 1 pool
    this.currentOpenedCards = this.rollCardsForPack(pack);
    this.revealedCount = 0;

    // Track cards in collection (batch in memory)
    this.currentOpenedCards.forEach(card => {
      this.collection[card.id] = (this.collection[card.id] || 0) + 1;
    });

    // Save state once per pack opening (no disk thrashing)
    this.saveState();

    const modal = document.getElementById('pack-opening-modal');
    const shelf = document.getElementById('pack-opened-shelf');
    const modalTitle = document.getElementById('opened-pack-title');
    const revealAllBtn = document.getElementById('pack-reveal-all-btn');

    if (!modal || !shelf) return;

    if (modalTitle) modalTitle.textContent = `Cracking ${pack.name}...`;
    if (revealAllBtn) revealAllBtn.style.display = 'inline-flex';

    // Pre-render both front and back faces into GPU 3D flip card structure
    // This eliminates all DOM recreation and image decoding stutter when flipping!
    shelf.innerHTML = this.currentOpenedCards.map((card, idx) => {
      const isNew = this.collection[card.id] === 1; // It was new before this pack
      const cardHTML = window.compendium ? window.compendium.generateCardHTML(card, false) : `<div>${card.name}</div>`;

      return `
        <div class="pack-flip-card" data-index="${idx}">
          <div class="pack-flip-inner">
            <!-- Back Face (Click to Flip) -->
            <div class="pack-card-face pack-face-back">
              <div class="card-back-pattern">
                <div class="gem">🃏</div>
                <span>DECKED OUT</span>
                <span style="font-size: 0.7rem; color: #64748b;">Click to Reveal</span>
              </div>
            </div>

            <!-- Front Face (Pre-decoded Card) -->
            <div class="pack-card-face pack-face-front">
              ${isNew ? '<span class="pack-new-badge">NEW!</span>' : ''}
              ${cardHTML}
            </div>
          </div>
        </div>
      `;
    }).join('');

    modal.classList.add('active');

    // Attach instantaneous 3D flip listeners
    shelf.querySelectorAll('.pack-flip-card').forEach(cardEl => {
      cardEl.addEventListener('click', () => {
        const idx = parseInt(cardEl.dataset.index, 10);
        this.revealCard(cardEl, idx, false);
      });
    });
  }

  rollCardsForPack(pack) {
    const cards = [];
    const pool = this.allCards;

    const getRandomByRarity = (rarity) => {
      const match = pool.filter(c => c.rarity.toLowerCase() === rarity.toLowerCase());
      if (match.length > 0) {
        return match[Math.floor(Math.random() * match.length)];
      }
      return pool[Math.floor(Math.random() * pool.length)];
    };

    const rollRarityFromTable = (rates) => {
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
        const r = rollRarityFromTable(pack.rates);
        cards.push(getRandomByRarity(r));
      }
    } else if (pack.id === 'bundle') {
      // Bundle box has 1 guaranteed Exotic & 1 guaranteed Legendary
      cards.push(getRandomByRarity('Exotic'));
      cards.push(getRandomByRarity('Legendary'));
      for (let i = 2; i < pack.cardCount; i++) {
        const r = rollRarityFromTable(pack.rates);
        cards.push(getRandomByRarity(r));
      }
    } else {
      // Standard Common & Rare packs
      for (let i = 0; i < pack.cardCount; i++) {
        const r = rollRarityFromTable(pack.rates);
        cards.push(getRandomByRarity(r));
      }
    }

    return cards;
  }

  revealCard(cardEl, index, isBatch = false) {
    if (cardEl.classList.contains('is-flipped')) return;

    // Pure GPU transform - 0ms latency, zero layout reflow
    cardEl.classList.add('is-flipped');
    this.revealedCount++;

    const card = this.currentOpenedCards[index];

    // Play SFX (throttled in batch mode)
    if (!isBatch && window.audioMgr) {
      if (card.rarity === 'Exotic') {
        window.audioMgr.playFanfare('Exotic');
        this.triggerSparkles(cardEl);
      } else if (card.rarity === 'Legendary') {
        window.audioMgr.playFanfare('Legendary');
        this.triggerSparkles(cardEl);
      } else if (card.rarity === 'Epic' || card.rarity === 'Rare') {
        window.audioMgr.playSFX('goldGain');
      } else {
        window.audioMgr.playSFX('cardPlay');
      }
    }

    if (this.revealedCount >= this.currentOpenedCards.length) {
      const revealAllBtn = document.getElementById('pack-reveal-all-btn');
      if (revealAllBtn) revealAllBtn.style.display = 'none';
    }
  }

  revealAllCards() {
    const unrevealed = document.querySelectorAll('.pack-flip-card:not(.is-flipped)');
    if (unrevealed.length === 0) return;

    const revealAllBtn = document.getElementById('pack-reveal-all-btn');
    if (revealAllBtn) revealAllBtn.style.display = 'none';

    // Find highest rarity card to play single celebratory fanfare at end
    let highestRarity = 'Common';
    const rarityRank = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5, 'Exotic': 6 };

    this.currentOpenedCards.forEach(c => {
      if ((rarityRank[c.rarity] || 1) > (rarityRank[highestRarity] || 1)) {
        highestRarity = c.rarity;
      }
    });

    if (window.audioMgr) window.audioMgr.playSFX('cardPlay');

    // Stagger flips smoothly every 70ms (pure CSS transform)
    unrevealed.forEach((cardEl, i) => {
      setTimeout(() => {
        const idx = parseInt(cardEl.dataset.index, 10);
        this.revealCard(cardEl, idx, true);

        // On the final card, play appropriate celebratory sound
        if (i === unrevealed.length - 1 && window.audioMgr) {
          if (highestRarity === 'Exotic' || highestRarity === 'Legendary') {
            window.audioMgr.playFanfare(highestRarity);
            this.triggerSparkles();
          } else if (highestRarity === 'Epic' || highestRarity === 'Rare') {
            window.audioMgr.playSFX('goldGain');
          }
        }
      }, i * 70);
    });
  }

  closePackModal() {
    const modal = document.getElementById('pack-opening-modal');
    if (modal) modal.classList.remove('active');
    const revealAllBtn = document.getElementById('pack-reveal-all-btn');
    if (revealAllBtn) revealAllBtn.style.display = 'inline-flex';
    this.currentOpenedCards = [];
  }

  // Lightweight hardware-accelerated sparkles (max 12 particles)
  triggerSparkles(targetEl) {
    const stage = document.getElementById('pack-opening-modal');
    if (!stage) return;

    const colors = ['#f59e0b', '#00e5ff', '#ec4899', '#ffffff', '#a855f7'];
    const particleCount = 12;

    const fragment = document.createDocumentFragment();
    const sparks = [];

    for (let i = 0; i < particleCount; i++) {
      const spark = document.createElement('div');
      spark.className = 'sparkle-burst';
      spark.style.left = '50%';
      spark.style.top = '50%';
      spark.style.background = colors[i % colors.length];

      const angle = (i / particleCount) * Math.PI * 2;
      const dist = 140 + Math.random() * 120;
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
    }, 650);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.packSim = new PackSimulator();
});
