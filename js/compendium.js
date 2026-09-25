// Decked Out - Interactive Card Compendium & Binder Explorer
// Butter-smooth, zero-lag performance with animated spritesheet cards

class CompendiumManager {
  constructor() {
    this.cards = window.GAME_CARDS || [];
    this.filteredCards = [...this.cards];
    this.searchQuery = '';
    this.selectedClass = 'all';
    this.selectedRarity = 'all';
    this.selectedSort = 'number';
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

    // Class Filter Pills
    const classPills = document.querySelectorAll('.class-pill');
    classPills.forEach(pill => {
      pill.addEventListener('click', () => {
        classPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedClass = pill.dataset.class;
        window.audioMgr.playSFX('buttonClick');
        this.applyFilters();
      });
    });

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
        const text = `${card.name} ${card.code} ${card.class} ${card.description} ${card.damageType}`.toLowerCase();
        if (!text.includes(this.searchQuery)) {
          return false;
        }
      }
      return true;
    });

    // Sort
    this.filteredCards.sort((a, b) => {
      if (this.selectedSort === 'number') {
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
          <p>Try clearing your search query or adjusting filters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.filteredCards.map(card => this.generateCardHTML(card)).join('');

    // Attach click listeners without any expensive mousemove calculations!
    const cardEls = container.querySelectorAll('.game-card');
    cardEls.forEach(el => {
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

  generateCardHTML(card) {
    const dmg = card.damage > 0 ? card.damage : 0;
    const armor = card.armor > 0 ? card.armor : 0;
    const ward = card.ward > 0 ? card.ward : 0;
    const heal = card.healing > 0 ? card.healing : 0;

    const classIcons = {
      'Elixir': '🧪',
      'Wild Mages': '🔮',
      'Swordsman': '⚔️',
      'Animal': '🐾',
      'Monster': '👹',
      'Goblins': '⚙️'
    };

    let imageSrc = card.image || card.staticImage;

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
    if (card.isAnimated) tags.push(`<span class="tag-badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">🎬 Animated</span>`);
    if (card.burn > 0) tags.push(`<span class="tag-badge tag-burn">🔥 Burn ${card.burn}</span>`);
    if (card.bleed > 0) tags.push(`<span class="tag-badge tag-bleed">🩸 Bleed ${card.bleed}</span>`);
    if (card.poison > 0) tags.push(`<span class="tag-badge tag-poison">☠️ Poison ${card.poison}</span>`);
    if (card.stunChance > 0) tags.push(`<span class="tag-badge tag-stun">⚡ Stun ${card.stunChance}%</span>`);
    if (card.isSplash) tags.push(`<span class="tag-badge tag-splash">💥 Splash</span>`);
    if (card.scrapGain > 0 || card.spendAllScrap) tags.push(`<span class="tag-badge tag-scrap">⚙️ Scrap</span>`);

    return `
      <div class="card-3d-wrapper">
        <div class="game-card rarity-${card.rarity.toLowerCase()}" data-card-id="${card.id}">
          <div class="card-top-bar">
            <div class="card-cost-gem">${card.cost}</div>
            <div class="card-name-title" title="${card.name}">${card.name}</div>
            <div class="card-class-icon" title="${card.class}">${classIcons[card.class] || '🃏'}</div>
          </div>
          <div class="card-image-box">
            <img src="${imageSrc}" alt="${card.name}" loading="lazy" />
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

  openModal(card) {
    this.currentModalCard = card;
    const modal = document.getElementById('card-detail-modal');
    const container = document.getElementById('card-detail-content');
    if (!modal || !container) return;

    const dmg = card.damage > 0 ? card.damage : 0;
    const armor = card.armor > 0 ? card.armor : 0;
    const ward = card.ward > 0 ? card.ward : 0;
    const heal = card.healing > 0 ? card.healing : 0;

    container.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center;">
        ${this.generateCardHTML(card)}
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
          <span class="tag-badge" style="background: rgba(56, 189, 248, 0.2); color: #7dd3fc;">Cost: ${card.cost} Mana</span>
          ${card.damageType !== 'None' ? `<span class="tag-badge" style="background: rgba(168, 85, 247, 0.2); color: #d8b4fe;">Type: ${card.damageType}</span>` : ''}
          ${card.isAnimated ? `<span class="tag-badge" style="background: rgba(56, 189, 248, 0.3); color: #38bdf8;">🎬 Spliced Animated Spritesheet</span>` : ''}
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

        <div style="background: var(--bg-deep); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 0.82rem; color: var(--text-muted);">
            Mitigation Type: <strong style="color: ${['Fire','Frost','Arcane','Shadow','Holy'].includes(card.damageType) ? 'var(--ward-cyan)' : 'var(--armor-iron)'};">${['Fire','Frost','Arcane','Shadow','Holy'].includes(card.damageType) ? '🔮 Magical (Absorbed by Ward)' : '🛡️ Physical (Absorbed by Armor)'}</strong>
          </span>
          <span style="font-size: 0.82rem; color: var(--primary); font-weight: 700;">Series 1 • Core</span>
        </div>

        <div style="display: flex; gap: 1rem;">
          <button id="modal-close-action-btn" class="btn btn-secondary" style="flex: 1; justify-content: center;">
            ✕ Close Inspector
          </button>
        </div>
      </div>
    `;

    modal.classList.add('open');

    const closeBtn = document.getElementById('modal-close-action-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }
  }

  closeModal() {
    const modal = document.getElementById('card-detail-modal');
    if (modal) modal.classList.remove('open');
    this.currentModalCard = null;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.compendium = new CompendiumManager();
});
