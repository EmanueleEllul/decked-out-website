// Decked Out - Gacha & Booster Pack Opening Simulator
// Features authentic Godot drop rates, foil tear animations, 3D card flips, and persistent collection tracking

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
      if (savedCol) this.collection = JSON.parse(savedCol);
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
        window.audioMgr.playSFX('goldGain');
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
      window.audioMgr.playSFX('buttonClick');
      return;
    }

    this.gems -= pack.cost;
    this.saveState();
    window.audioMgr.playPackRip();

    // Generate pulled cards based on pack rules
    this.currentOpenedCards = this.rollCardsForPack(pack);
    this.revealedCount = 0;

    // Show pack opening stage modal
    const modal = document.getElementById('pack-opening-modal');
    const shelf = document.getElementById('pack-opened-shelf');
    const modalTitle = document.getElementById('opened-pack-title');
    if (!modal || !shelf) return;

    if (modalTitle) modalTitle.textContent = `Cracking ${pack.name}...`;

    shelf.innerHTML = this.currentOpenedCards.map((c, idx) => `
      <div class="unrevealed-card" data-index="${idx}">
        <div class="card-back-pattern">
          <div class="gem">🃏</div>
          <span>DECKED OUT</span>
          <span style="font-size: 0.7rem; color: #475569;">Click to Reveal</span>
        </div>
      </div>
    `).join('');

    modal.classList.add('active');

    // Attach card flip listeners
    const unrevealedCards = shelf.querySelectorAll('.unrevealed-card');
    unrevealedCards.forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index, 10);
        this.revealCard(el, idx);
      });
    });
  }

  rollCardsForPack(pack) {
    const cards = [];
    const poolS1 = this.allCards.filter(c => c.series === 1);
    const poolS2 = this.allCards.filter(c => c.series === 2);
    const fullPool = this.allCards;

    const getRandomByRarity = (pool, rarity) => {
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
      cards.push(getRandomByRarity(fullPool, 'Exotic'));
      // 1 Guaranteed Legendary
      cards.push(getRandomByRarity(fullPool, 'Legendary'));
      // 6 High-Tier cards
      for (let i = 2; i < 8; i++) {
        const r = rollRarityFromTable(pack.rates);
        cards.push(getRandomByRarity(fullPool, r));
      }
    } else if (pack.id === 'dragons') {
      for (let i = 0; i < pack.cardCount; i++) {
        const r = rollRarityFromTable(pack.rates);
        cards.push(getRandomByRarity(poolS2, r));
      }
    } else if (pack.id === 'bundle') {
      // Bundle box has 1 guaranteed Exotic & 1 guaranteed Legendary
      cards.push(getRandomByRarity(fullPool, 'Exotic'));
      cards.push(getRandomByRarity(fullPool, 'Legendary'));
      for (let i = 2; i < pack.cardCount; i++) {
        const r = rollRarityFromTable(pack.rates);
        cards.push(getRandomByRarity(fullPool, r));
      }
    } else {
      // Standard Common & Rare packs
      for (let i = 0; i < pack.cardCount; i++) {
        const r = rollRarityFromTable(pack.rates);
        cards.push(getRandomByRarity(poolS1, r));
      }
    }

    return cards;
  }

  revealCard(el, index) {
    if (el.classList.contains('revealed')) return;
    el.classList.add('revealed', 'flipped');

    const card = this.currentOpenedCards[index];
    const isNew = !this.collection[card.id];

    // Track in collection
    this.collection[card.id] = (this.collection[card.id] || 0) + 1;
    this.saveState();

    setTimeout(() => {
      el.outerHTML = `
        <div style="position: relative; width: 220px;">
          ${isNew ? '<span class="tag-badge" style="position: absolute; top: -10px; right: -10px; z-index: 20; background: #ef4444; color: #fff; font-weight: 800; font-size: 0.75rem; box-shadow: 0 0 10px rgba(239,68,68,0.7);">NEW!</span>' : ''}
          ${window.compendium ? window.compendium.generateCardHTML(card) : ''}
        </div>
      `;

      // Play SFX
      if (card.rarity === 'Exotic') {
        window.audioMgr.playFanfare('Exotic');
        this.triggerSparkles();
      } else if (card.rarity === 'Legendary') {
        window.audioMgr.playFanfare('Legendary');
        this.triggerSparkles();
      } else if (card.rarity === 'Epic' || card.rarity === 'Rare') {
        window.audioMgr.playSFX('goldGain');
      } else {
        window.audioMgr.playSFX('cardPlay');
      }

      this.revealedCount++;
      if (this.revealedCount >= this.currentOpenedCards.length) {
        const revealAllBtn = document.getElementById('pack-reveal-all-btn');
        if (revealAllBtn) revealAllBtn.style.display = 'none';
      }
    }, 300);
  }

  revealAllCards() {
    const unrevealed = document.querySelectorAll('.unrevealed-card:not(.revealed)');
    unrevealed.forEach((el, i) => {
      setTimeout(() => {
        const idx = parseInt(el.dataset.index, 10);
        this.revealCard(el, idx);
      }, i * 150);
    });
  }

  closePackModal() {
    const modal = document.getElementById('pack-opening-modal');
    if (modal) modal.classList.remove('active');
    const revealAllBtn = document.getElementById('pack-reveal-all-btn');
    if (revealAllBtn) revealAllBtn.style.display = 'inline-flex';
    this.currentOpenedCards = [];
  }

  triggerSparkles() {
    const stage = document.getElementById('pack-opening-modal');
    if (!stage) return;

    for (let i = 0; i < 30; i++) {
      const spark = document.createElement('div');
      spark.className = 'sparkle-burst';
      spark.style.left = '50%';
      spark.style.top = '50%';
      const colors = ['#f59e0b', '#00e5ff', '#ec4899', '#ffffff', '#a855f7'];
      spark.style.background = colors[Math.floor(Math.random() * colors.length)];
      spark.style.boxShadow = `0 0 10px ${spark.style.background}`;

      const dx = (Math.random() - 0.5) * 600 + 'px';
      const dy = (Math.random() - 0.5) * 600 + 'px';
      spark.style.setProperty('--dx', dx);
      spark.style.setProperty('--dy', dy);

      stage.appendChild(spark);
      setTimeout(() => spark.remove(), 800);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.packSim = new PackSimulator();
});
