// Decked Out - Interactive Card Compendium & Binder Explorer
// Renders all 104 cards with 3D tilt, holographic foil shaders, search & filters

class CompendiumManager {
  constructor() {
    this.cards = window.GAME_CARDS || [];
    this.filteredCards = [...this.cards];
    this.searchQuery = '';
    this.selectedSeries = 'all';
    this.selectedClass = 'all';
    this.selectedRarity = 'all';
    this.selectedSort = 'number';
    this.isUpgraded = false;
    this.viewMode = 'grid'; // 'grid' | 'binder'
    this.currentModalCard = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.applyFilters();
  }

  bindEvents() {
    const searchInput = document.getElementById('compendium-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.applyFilters();
      });
    }

    const seriesPills = document.querySelectorAll('.series-pill');
    seriesPills.forEach(pill => {
      pill.addEventListener('click', () => {
        seriesPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedSeries = pill.dataset.series;
        window.audioMgr.playSFX('buttonClick');
        this.applyFilters();
      });
    });

    const classSelect = document.getElementById('compendium-class-filter');
    if (classSelect) {
      classSelect.addEventListener('change', (e) => {
        this.selectedClass = e.target.value;
        window.audioMgr.playSFX('buttonClick');
        this.applyFilters();
      });
    }

    const raritySelect = document.getElementById('compendium-rarity-filter');
    if (raritySelect) {
      raritySelect.addEventListener('change', (e) => {
        this.selectedRarity = e.target.value;
        window.audioMgr.playSFX('buttonClick');
        this.applyFilters();
      });
    }

    const sortSelect = document.getElementById('compendium-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.selectedSort = e.target.value;
        window.audioMgr.playSFX('buttonClick');
        this.applyFilters();
      });
    }

    const upgradeToggle = document.getElementById('upgrade-stats-toggle');
    if (upgradeToggle) {
      upgradeToggle.addEventListener('change', (e) => {
        this.isUpgraded = e.target.checked;
        window.audioMgr.playSFX('cardPlay');
        this.renderCards();
      });
    }

    // Modal Close
    const modalClose = document.getElementById('card-modal-close');
    const modalOverlay = document.getElementById('card-detail-modal');
    if (modalClose && modalOverlay) {
      modalClose.addEventListener('click', () => this.closeModal());
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) this.closeModal();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  }

  applyFilters() {
    const rarityWeights = { 'Common': 0, 'Uncommon': 1, 'Rare': 2, 'Epic': 3, 'Legendary': 4, 'Exotic': 5 };

    this.filteredCards = this.cards.filter(card => {
      // Series filter
      if (this.selectedSeries !== 'all' && card.series !== parseInt(this.selectedSeries)) {
        return false;
      }
      // Class filter
      if (this.selectedClass !== 'all' && card.class !== this.selectedClass) {
        return false;
      }
      // Rarity filter
      if (this.selectedRarity !== 'all' && card.rarity !== this.selectedRarity) {
        return false;
      }
      // Search query
      if (this.searchQuery) {
        const text = `${card.name} ${card.code} ${card.class} ${card.dragonSubclass || ''} ${card.description} ${card.damageType}`.toLowerCase();
        if (!text.includes(this.searchQuery)) {
          return false;
        }
      }
      return true;
    });

    // Sort
    this.filteredCards.sort((a, b) => {
      if (this.selectedSort === 'number') {
        if (a.series !== b.series) return a.series - b.series;
        return a.number - b.number;
      }
      if (this.selectedSort === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (this.selectedSort === 'cost') {
        return a.cost - b.cost;
      }
      if (this.selectedSort === 'damage') {
        return b.damage - a.damage;
      }
      if (this.selectedSort === 'rarity') {
        return (rarityWeights[b.rarity] || 0) - (rarityWeights[a.rarity] || 0);
      }
      return 0;
    });

    this.renderCards();
    this.updateCardCounts();
  }

  updateCardCounts() {
    const countEl = document.getElementById('card-count-badge');
    if (countEl) {
      countEl.textContent = `Showing ${this.filteredCards.length} of ${this.cards.length} Cards`;
    }
  }

  renderCards() {
    const container = document.getElementById('cards-display-grid');
    if (!container) return;

    if (this.filteredCards.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-faint);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <h3>No Cards Found</h3>
          <p>Try clearing your search or adjusting your rarity and class filters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.filteredCards.map(card => this.generateCardHTML(card)).join('');

    // Attach 3D tilt interaction to rendered cards
    const cardEls = container.querySelectorAll('.game-card');
    cardEls.forEach(el => {
      this.attachTiltEffect(el);
      el.addEventListener('click', () => {
        const cardId = el.dataset.cardId;
        const card = this.cards.find(c => c.id === cardId);
        if (card) {
          window.audioMgr.playSFX('cardPlay');
          this.openModal(card);
        }
      });
    });
  }

  generateCardHTML(card, interactive = true) {
    const mult = this.isUpgraded ? 1.1 : 1.0;
    const dmg = card.damage > 0 ? Math.round(card.damage * mult) : 0;
    const armor = card.armor > 0 ? Math.round(card.armor * mult) : 0;
    const ward = card.ward > 0 ? Math.round(card.ward * mult) : 0;
    const heal = card.healing > 0 ? Math.round(card.healing * mult) : 0;

    const classIcons = {
      'Elixir': '🧪',
      'Wild Mages': '🔮',
      'Swordsman': '⚔️',
      'Animal': '🐾',
      'Monster': '👹',
      'Goblins': '⚙️',
      'Dragon': '🐉'
    };

    let imageHTML = '';
    if (card.image) {
      imageHTML = `<img src="${card.image}" alt="${card.name}" loading="lazy" />`;
    } else if (card.class === 'Dragon') {
      imageHTML = this.generateDragonSVG(card.dragonSubclass);
    } else {
      imageHTML = this.generateClassEmblem(card.class);
    }

    let statsRowHTML = '';
    const stats = [];
    if (dmg > 0) {
      const isMag = card.damageType === 'Magic';
      stats.push(`<span class="stat-pill ${isMag ? 'magic' : 'dmg'}">${isMag ? '✨' : '⚔️'} ${dmg}${card.isSplash ? ' (AoE)' : ''}</span>`);
    }
    if (armor > 0) {
      stats.push(`<span class="stat-pill armor">🛡️ ${armor}</span>`);
    }
    if (ward > 0) {
      stats.push(`<span class="stat-pill ward">🔮 ${ward}</span>`);
    }
    if (heal > 0) {
      stats.push(`<span class="stat-pill heal">❤️ ${heal}</span>`);
    }

    if (stats.length > 0) {
      statsRowHTML = `<div class="card-stats-row">${stats.join('')}</div>`;
    }

    // Status Tags
    const tags = [];
    if (card.burn > 0) tags.push(`<span class="tag-badge tag-burn">🔥 Burn ${card.burn}</span>`);
    if (card.bleed > 0) tags.push(`<span class="tag-badge tag-bleed">🩸 Bleed ${card.bleed}</span>`);
    if (card.poison > 0) tags.push(`<span class="tag-badge tag-poison">☠️ Poison ${card.poison}</span>`);
    if (card.stunChance > 0) tags.push(`<span class="tag-badge tag-stun">⚡ Stun ${card.stunChance}%</span>`);
    if (card.isSplash) tags.push(`<span class="tag-badge tag-splash">💥 Splash</span>`);
    if (card.scrapGain > 0 || card.spendAllScrap) tags.push(`<span class="tag-badge tag-scrap">⚙️ Scrap</span>`);

    return `
      <div class="card-3d-wrapper">
        <div class="game-card rarity-${card.rarity.toLowerCase()}" data-card-id="${card.id}">
          <div class="card-glare"></div>
          <div class="card-top-bar">
            <div class="card-cost-gem">${card.cost}</div>
            <div class="card-name-title" title="${card.name}">${card.name}</div>
            <div class="card-class-icon" title="${card.class}">${classIcons[card.class] || '🃏'}</div>
          </div>
          <div class="card-image-box">
            ${imageHTML}
          </div>
          ${statsRowHTML}
          <div class="card-desc-box">
            <p>${card.description}</p>
            ${tags.length > 0 ? `<div class="card-tags">${tags.join('')}</div>` : ''}
          </div>
          <div class="card-footer-bar">
            <span>${card.code}</span>
            <span class="rarity-text" style="color: var(--rarity-${card.rarity.toLowerCase()})">${card.rarity}</span>
          </div>
        </div>
      </div>
    `;
  }

  generateDragonSVG(subclass = 'Fire') {
    const themeColors = {
      'Fire': { fill: '#ef4444', glow: '#f97316', icon: '🔥' },
      'Ice': { fill: '#38bdf8', glow: '#06b6d4', icon: '❄️' },
      'Poison': { fill: '#22c55e', glow: '#84cc16', icon: '☠️' },
      'Earth': { fill: '#d97706', glow: '#78350f', icon: '🪨' }
    };
    const t = themeColors[subclass] || themeColors['Fire'];

    return `
      <div class="dragon-art-placeholder" style="background: radial-gradient(circle, ${t.glow}22 0%, #090c12 80%);">
        <svg viewBox="0 0 100 100" fill="none" stroke="${t.fill}" stroke-width="2.5">
          <path d="M50 15 C30 15, 20 35, 20 50 C20 70, 40 85, 50 88 C60 85, 80 70, 80 50 C80 35, 70 15, 50 15 Z" fill="${t.fill}15" />
          <path d="M35 40 L50 25 L65 40" stroke-linecap="round" />
          <circle cx="42" cy="48" r="3" fill="${t.fill}" />
          <circle cx="58" cy="48" r="3" fill="${t.fill}" />
          <path d="M45 65 Q50 72 55 65" stroke-linecap="round" />
          <path d="M25 30 L15 18 M75 30 L85 18" stroke-linecap="round" />
        </svg>
        <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: ${t.fill}; letter-spacing: 0.1em;">
          ${subclass} Dragon
        </span>
      </div>
    `;
  }

  generateClassEmblem(cardClass) {
    return `
      <div class="dragon-art-placeholder" style="background: #090c12;">
        <div style="font-size: 2.5rem; opacity: 0.7;">✨</div>
        <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--primary); letter-spacing: 0.1em;">
          ${cardClass}
        </span>
      </div>
    `;
  }

  attachTiltEffect(cardEl) {
    cardEl.addEventListener('mousemove', (e) => {
      const rect = cardEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      cardEl.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;
      cardEl.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
      cardEl.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
    });

    cardEl.addEventListener('mouseleave', () => {
      cardEl.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  }

  openModal(card) {
    this.currentModalCard = card;
    const modal = document.getElementById('card-detail-modal');
    const container = document.getElementById('card-detail-content');
    if (!modal || !container) return;

    const mult = this.isUpgraded ? 1.1 : 1.0;
    const dmg = card.damage > 0 ? Math.round(card.damage * mult) : 0;
    const armor = card.armor > 0 ? Math.round(card.armor * mult) : 0;
    const ward = card.ward > 0 ? Math.round(card.ward * mult) : 0;
    const heal = card.healing > 0 ? Math.round(card.healing * mult) : 0;

    container.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center;">
        ${this.generateCardHTML(card, false)}
      </div>
      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--rarity-${card.rarity.toLowerCase()}); font-weight: 700; letter-spacing: 0.1em;">
            Series ${card.series} • ${card.rarity}
          </span>
          <span style="font-family: var(--font-mono); color: var(--text-faint); font-size: 0.85rem;">${card.code}</span>
        </div>
        <h2 style="font-size: 2rem; color: #fff; margin-bottom: 0.5rem;">${card.name}</h2>
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
          <span class="tag-badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;">Class: ${card.class}</span>
          ${card.dragonSubclass && card.dragonSubclass !== 'None' ? `<span class="tag-badge" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5;">Subclass: ${card.dragonSubclass}</span>` : ''}
          <span class="tag-badge" style="background: rgba(56, 189, 248, 0.2); color: #7dd3fc;">Cost: ${card.cost} Mana</span>
          ${card.damageType !== 'None' ? `<span class="tag-badge" style="background: rgba(168, 85, 247, 0.2); color: #d8b4fe;">Type: ${card.damageType}</span>` : ''}
        </div>

        <div style="background: var(--bg-deep); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--text-faint); margin-bottom: 0.5rem;">Combat Properties</h4>
          <p style="font-size: 1rem; color: #e2e8f0; line-height: 1.6;">${card.description}</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="background: var(--bg-surface-elevated); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Damage Output</span>
            <strong style="font-size: 1.2rem; color: #f87171;">${dmg > 0 ? `${dmg} (${card.damageType})` : '—'}</strong>
          </div>
          <div style="background: var(--bg-surface-elevated); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Defensive Guard</span>
            <strong style="font-size: 1.2rem; color: #38bdf8;">${armor > 0 ? `+${armor} Armor ` : ''}${ward > 0 ? `+${ward} Ward ` : ''}${armor === 0 && ward === 0 ? '—' : ''}</strong>
          </div>
        </div>

        <div style="display: flex; gap: 1rem;">
          <button id="modal-add-to-deck-btn" class="btn btn-primary" style="flex: 1;">
            ➕ Add Card to Deck
          </button>
        </div>
      </div>
    `;

    modal.classList.add('open');

    // Attach tilt to preview inside modal
    const previewCard = container.querySelector('.game-card');
    if (previewCard) this.attachTiltEffect(previewCard);

    const addBtn = document.getElementById('modal-add-to-deck-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (window.deckBuilder) {
          window.deckBuilder.addCard(card.id);
        }
      });
    }
  }

  closeModal() {
    const modal = document.getElementById('card-detail-modal');
    if (modal) modal.classList.remove('open');
    this.currentModalCard = null;
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.compendium = new CompendiumManager();
});
