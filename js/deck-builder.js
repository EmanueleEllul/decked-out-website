// Decked Out - Deck Builder & Starter Deck Simulator
// Validates 10-100 card rules, max 15 duplicates, 1 Exotic/Legendary starter limit, mana curve & deck export

class DeckBuilder {
  constructor() {
    this.allCards = window.GAME_CARDS || [];
    this.deck = {}; // { cardId: count }
    this.elixirs = []; // Max 2 dedicated elixir cardIds
    this.starterPresets = {
      monk: {
        name: "Monk's Balanced Vanguard",
        hero: "Deck Monk",
        cards: {
          's1-046': 3, // Alley Cutlass
          's1-032': 2, // Anvil
          's1-013': 3, // Arrow
          's1-024': 2, // Bastion Lancer
          's1-053': 2, // Pureblade Heir
          's1-001': 2, // Flask (Elixir)
          's1-006': 2  // Orange Juice (Elixir)
        }
      },
      goblin: {
        name: "Goblin Scrap Recycler",
        hero: "Scrap Goblin",
        cards: {
          's1-058': 3, // Tinpicker Scout
          's1-060': 3, // Junkshield Bruiser
          's1-061': 2, // Scrap Slinger
          's1-062': 2, // Back-Alley Salvager
          's1-063': 2, // Rustbomb Runner
          's1-068': 1, // Scrap Mortar
          's1-070': 2  // Shrapnel Sort
        }
      },
      pyro: {
        name: "Infernal Wildfire",
        hero: "Demonling",
        cards: {
          's1-039': 3, // Cinder Archivist
          's1-072': 2, // Cinder Fox
          's1-063': 2, // Rustbomb Runner
          's1-043': 2, // Rift
          's1-004': 2, // Moonbrew
          's1-096': 1  // Ember Tyrant
        }
      },
      dragons: {
        name: "Primordial Dragon Bastion",
        hero: "Dragon",
        cards: {
          's2-001': 3, // Cinder Whelp
          's2-002': 2, // Ignis Drake
          's2-025': 3, // Pebble Whelp
          's2-026': 2, // Stone Drake
          's2-027': 2, // Granite Wyrm
          's2-008': 1  // Crimson Hellkite (1 Exotic starter limit)
        }
      }
    };

    this.loadDeck();
    this.init();
  }

  loadDeck() {
    try {
      const saved = localStorage.getItem('decked_active_deck');
      if (saved) {
        this.deck = JSON.parse(saved);
      } else {
        // Default to Monk preset
        this.deck = { ...this.starterPresets.monk.cards };
      }
    } catch(e) {
      this.deck = { ...this.starterPresets.monk.cards };
    }
  }

  saveDeck() {
    try {
      localStorage.setItem('decked_active_deck', JSON.stringify(this.deck));
    } catch(e) {}
    this.renderDeckStats();
    this.renderDeckList();
  }

  init() {
    this.bindEvents();
    this.renderPresets();
    this.renderDeckStats();
    this.renderDeckList();
  }

  bindEvents() {
    const clearBtn = document.getElementById('clear-deck-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.deck = {};
        this.saveDeck();
        window.audioMgr.playSFX('buttonClick');
        if (window.showToast) window.showToast('🗑️ Deck cleared.');
      });
    }

    const exportBtn = document.getElementById('export-deck-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportDeck());
    }

    const importBtn = document.getElementById('import-deck-btn');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.importDeck());
    }
  }

  renderPresets() {
    const container = document.getElementById('deck-presets-container');
    if (!container) return;

    container.innerHTML = Object.entries(this.starterPresets).map(([key, p]) => `
      <button class="btn btn-secondary preset-btn" data-preset="${key}" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">
        <span>${p.name}</span>
      </button>
    `).join('');

    container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.preset;
        if (this.starterPresets[key]) {
          this.deck = { ...this.starterPresets[key].cards };
          this.saveDeck();
          window.audioMgr.playSFX('cardPlay');
          if (window.showToast) window.showToast(`Loaded preset: ${this.starterPresets[key].name}`);
        }
      });
    });
  }

  addCard(cardId) {
    const card = this.allCards.find(c => c.id === cardId);
    if (!card) return;

    const currentCount = this.deck[cardId] || 0;
    const totalCards = this.getTotalCardCount();

    // 1. Deck limit: 100 max
    if (totalCards >= 100) {
      if (window.showToast) window.showToast('⚠️ Maximum deck size of 100 cards reached!', 'warning');
      return;
    }

    // 2. Duplicate limit: 15 copies
    if (currentCount >= 15) {
      if (window.showToast) window.showToast(`⚠️ Max 15 copies allowed for ${card.name}!`, 'warning');
      return;
    }

    // 3. Starter restriction: Max 1 Exotic OR 1 Legendary
    if (card.rarity === 'Exotic' || card.rarity === 'Legendary') {
      const existingHighRarity = Object.keys(this.deck).some(id => {
        const c = this.allCards.find(x => x.id === id);
        return c && (c.rarity === 'Exotic' || c.rarity === 'Legendary');
      });
      if (existingHighRarity && currentCount === 0) {
        if (window.showToast) window.showToast('⚠️ Starter decks allow at most 1 Exotic or 1 Legendary card!', 'warning');
        return;
      }
    }

    this.deck[cardId] = currentCount + 1;
    this.saveDeck();
    window.audioMgr.playSFX('cardPlay');
    if (window.showToast) window.showToast(`Added ${card.name} (${this.deck[cardId]}x)`);
  }

  removeCard(cardId) {
    if (!this.deck[cardId]) return;
    this.deck[cardId]--;
    if (this.deck[cardId] <= 0) {
      delete this.deck[cardId];
    }
    this.saveDeck();
    window.audioMgr.playSFX('buttonClick');
  }

  getTotalCardCount() {
    return Object.values(this.deck).reduce((sum, count) => sum + count, 0);
  }

  renderDeckStats() {
    const total = this.getTotalCardCount();
    const countEl = document.getElementById('deck-total-count');
    if (countEl) {
      countEl.textContent = `${total} / 100 Cards`;
      countEl.style.color = (total >= 10 && total <= 100) ? '#4ade80' : '#f87171';
    }

    // Validation Status
    const statusEl = document.getElementById('deck-validity-status');
    if (statusEl) {
      if (total < 10) {
        statusEl.innerHTML = '<span style="color: #f87171;">❌ Too Small (Need at least 10 cards)</span>';
      } else if (total > 100) {
        statusEl.innerHTML = '<span style="color: #f87171;">❌ Deck Overfilled (Max 100 cards)</span>';
      } else {
        statusEl.innerHTML = '<span style="color: #4ade80;">✅ Legal Starter Deck</span>';
      }
    }

    // Mana Curve Calculation
    const curve = [0, 0, 0, 0, 0, 0]; // 0, 1, 2, 3, 4, 5+
    let totalDmg = 0;
    let totalArmor = 0;
    let totalWard = 0;

    Object.entries(this.deck).forEach(([cardId, count]) => {
      const card = this.allCards.find(c => c.id === cardId);
      if (card) {
        const costSlot = Math.min(card.cost, 5);
        curve[costSlot] += count;
        totalDmg += (card.damage || 0) * count;
        totalArmor += (card.armor || 0) * count;
        totalWard += (card.ward || 0) * count;
      }
    });

    const maxCurve = Math.max(...curve, 1);
    const curveContainer = document.getElementById('mana-curve-chart');
    if (curveContainer) {
      curveContainer.innerHTML = curve.map((c, cost) => {
        const heightPct = Math.round((c / maxCurve) * 100);
        return `
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100px;">
            <span style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.25rem;">${c}</span>
            <div style="width: 100%; max-width: 24px; background: linear-gradient(to top, #0284c7, #38bdf8); height: ${heightPct}%; border-radius: 4px 4px 0 0; min-height: 4px;"></div>
            <span style="font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-top: 0.35rem;">${cost === 5 ? '5+' : cost}</span>
          </div>
        `;
      }).join('');
    }
  }

  renderDeckList() {
    const listContainer = document.getElementById('deck-cards-list');
    if (!listContainer) return;

    const entries = Object.entries(this.deck);
    if (entries.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-faint);">
          <p>Your deck is currently empty.</p>
          <p style="font-size: 0.8rem; margin-top: 0.5rem;">Select a Starter Preset above or click cards in the Compendium to add them.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = entries.map(([cardId, count]) => {
      const card = this.allCards.find(c => c.id === cardId);
      if (!card) return '';

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.85rem; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); margin-bottom: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span class="card-cost-gem" style="width: 22px; height: 22px; font-size: 0.75rem;">${card.cost}</span>
            <div>
              <strong style="font-size: 0.88rem; color: #fff; display: block;">${card.name}</strong>
              <span style="font-size: 0.72rem; color: var(--rarity-${card.rarity.toLowerCase()}); font-weight: 600;">${card.class} • ${card.rarity}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <button class="btn btn-secondary remove-one-btn" data-card-id="${card.id}" style="padding: 0.2rem 0.6rem; font-size: 0.8rem;">-</button>
            <span style="font-weight: 800; font-size: 0.95rem; min-width: 24px; text-align: center; color: var(--primary);">${count}x</span>
            <button class="btn btn-secondary add-one-btn" data-card-id="${card.id}" style="padding: 0.2rem 0.6rem; font-size: 0.8rem;">+</button>
          </div>
        </div>
      `;
    }).join('');

    listContainer.querySelectorAll('.add-one-btn').forEach(btn => {
      btn.addEventListener('click', () => this.addCard(btn.dataset.cardId));
    });
    listContainer.querySelectorAll('.remove-one-btn').forEach(btn => {
      btn.addEventListener('click', () => this.removeCard(btn.dataset.cardId));
    });
  }

  exportDeck() {
    const dataStr = JSON.stringify(this.deck);
    const code = btoa(dataStr);
    
    // Also build human-readable list
    let readable = `=== DECKED OUT STARTER DECK ===\nTotal Cards: ${this.getTotalCardCount()}\n\n`;
    Object.entries(this.deck).forEach(([id, count]) => {
      const c = this.allCards.find(x => x.id === id);
      if (c) readable += `${count}x ${c.name} (${c.class}, ${c.cost} Mana)\n`;
    });
    readable += `\nDeck Code:\n${code}`;

    navigator.clipboard.writeText(readable).then(() => {
      window.audioMgr.playSFX('buttonClick');
      if (window.showToast) window.showToast('📋 Deck code & decklist copied to clipboard!');
    }).catch(() => {
      prompt('Copy Deck Code:', code);
    });
  }

  importDeck() {
    const input = prompt('Paste Deck Code or JSON:');
    if (!input) return;
    try {
      let parsed = null;
      if (input.trim().startsWith('{')) {
        parsed = JSON.parse(input.trim());
      } else {
        const decoded = atob(input.trim());
        parsed = JSON.parse(decoded);
      }
      if (parsed && typeof parsed === 'object') {
        this.deck = parsed;
        this.saveDeck();
        window.audioMgr.playSFX('cardPlay');
        if (window.showToast) window.showToast('✅ Deck imported successfully!');
      }
    } catch(e) {
      alert('Invalid deck code or JSON string.');
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.deckBuilder = new DeckBuilder();
});
