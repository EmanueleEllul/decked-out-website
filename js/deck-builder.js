// Decked Out - Tactical Deck Builder Workshop & Card Vault
// Features full card library search, filters, legal deck validation, tactical combat analytics, and one-click arena testing

class DeckBuilder {
  constructor() {
    this.allCards = window.GAME_CARDS || [];
    this.deck = {}; // { cardId: count }
    this.searchQuery = '';
    this.selectedClass = 'all';
    this.selectedRarity = 'all';

    this.starterPresets = {
      monk: {
        name: "🛡️ Monk's Vanguard",
        hero: "Deck Monk",
        cards: {
          's1-046': 3, // Alley Cutlass
          's1-032': 2, // Anvil
          's1-013': 3, // Arrow
          's1-047': 2, // Bastion Lancer
          's1-049': 2, // Execution Cadet
          's1-036': 2, // Flask
          's1-006': 2  // Orange Juice
        }
      },
      goblin: {
        name: "⚙️ Scrap Recycler",
        hero: "Scrap Goblin",
        cards: {
          's1-058': 3, // Tinpicker Scout (Animated)
          's1-060': 3, // Junkshield Bruiser (Animated)
          's1-061': 2, // Scrap Slinger (Animated)
          's1-062': 2, // Back-Alley Salvager (Animated)
          's1-063': 2, // Rustbomb Runner (Animated)
          's1-070': 2, // Shrapnel Sort
          's1-068': 1  // Scrap Mortar (Animated)
        }
      },
      pyro: {
        name: "🔥 Infernal Wildfire",
        hero: "Demonling",
        cards: {
          's1-045': 1, // Ember Tyrant (Legendary)
          's1-024': 3, // Ghost
          's1-043': 3, // Crypt Broodmother
          's1-030': 2, // Moonbrew
          's1-036': 3, // Flask
          's1-038': 2  // Cinder Fox
        }
      },
      necro: {
        name: "🦴 Crypt Swarm",
        hero: "Necri",
        cards: {
          's1-024': 3, // Ghost
          's1-043': 3, // Crypt Broodmother
          's1-041': 2, // Bone Pit Abomination
          's1-042': 2, // Ashmaw Colossus
          's1-036': 2, // Flask
          's1-004': 2  // Mystic Tea
        }
      },
      beast: {
        name: "🐾 Primal Pack",
        hero: "Hunter The Hedgehog",
        cards: {
          's1-001': 3, // Cat
          's1-005': 3, // Dog
          's1-038': 2, // Cinder Fox
          's1-021': 3, // Hedgehog
          's1-031': 2, // Howls
          's1-035': 1  // Fangs (Legendary)
        }
      },
      arcane: {
        name: "🔮 Arcane Surge",
        hero: "Lost Spirit",
        cards: {
          's1-053': 3, // Bloodmoon Hexer
          's1-054': 3, // Mirror Sigilist
          's1-034': 2, // Rift
          's1-051': 2, // Lantern Owl
          's1-030': 2, // Moonbrew
          's1-033': 1  // Blink (Exotic)
        }
      }
    };

    this.activeHero = "Deck Monk";
    this.loadDeck();
    this.init();
  }

  loadDeck() {
    try {
      const saved = localStorage.getItem('decked_active_deck');
      if (saved) {
        this.deck = JSON.parse(saved);
        // Clean out any invalid card IDs
        Object.keys(this.deck).forEach(id => {
          if (!this.allCards.find(c => c.id === id)) {
            delete this.deck[id];
          }
        });
      } else {
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
    this.renderWorkbench();
  }

  init() {
    this.bindEvents();
    this.renderPresets();
    this.renderWorkbench();
  }

  bindEvents() {
    // Search Input
    const searchInput = document.getElementById('deck-card-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderCardVault();
      });
    }

    // Class Filter Pills
    const classPills = document.querySelectorAll('#deck-class-pills .filter-pill');
    classPills.forEach(pill => {
      pill.addEventListener('click', () => {
        classPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedClass = pill.dataset.class;
        if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
        this.renderCardVault();
      });
    });

    // Rarity Filter Pills
    const rarityPills = document.querySelectorAll('#deck-rarity-pills .filter-pill');
    rarityPills.forEach(pill => {
      pill.addEventListener('click', () => {
        rarityPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedRarity = pill.dataset.rarity;
        if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
        this.renderCardVault();
      });
    });

    // Clear Deck Button
    const clearBtn = document.getElementById('clear-deck-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.deck = {};
        this.saveDeck();
        if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
        if (window.showToast) window.showToast('🗑️ Active deck cleared.');
      });
    }

    // Export Deck Button
    const exportBtn = document.getElementById('export-deck-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportDeck());
    }

    // Import Deck Button
    const importBtn = document.getElementById('import-deck-btn');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.importDeck());
    }

    // Test in Arena Button (Sends deck to Combat Demo)
    const testInArenaBtn = document.getElementById('test-in-arena-btn');
    if (testInArenaBtn) {
      testInArenaBtn.addEventListener('click', () => this.testDeckInArena());
    }

    // Floating Preview Tooltip Hide on Mouseleave from list
    const listContainer = document.getElementById('deck-cards-list');
    const popover = document.getElementById('deck-card-hover-preview');
    if (listContainer && popover) {
      listContainer.addEventListener('mouseleave', () => {
        popover.style.display = 'none';
      });
    }
  }

  renderPresets() {
    const container = document.getElementById('deck-presets-container');
    if (!container) return;

    container.innerHTML = Object.entries(this.starterPresets).map(([key, p]) => `
      <button class="preset-pill-btn" data-preset="${key}">
        <span>${p.name}</span>
      </button>
    `).join('');

    container.querySelectorAll('.preset-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.preset;
        if (this.starterPresets[key]) {
          this.deck = { ...this.starterPresets[key].cards };
          this.activeHero = this.starterPresets[key].hero;
          this.saveDeck();
          if (window.audioMgr) window.audioMgr.playSFX('cardPlay');
          if (window.showToast) window.showToast(`Loaded archetype preset: ${this.starterPresets[key].name}`);
        }
      });
    });
  }

  addCard(cardId) {
    const card = this.allCards.find(c => c.id === cardId);
    if (!card) return;

    const currentCount = this.deck[cardId] || 0;
    const totalCards = this.getTotalCardCount();

    if (totalCards >= 100) {
      if (window.showToast) window.showToast('⚠️ Maximum deck size of 100 cards reached!', 'warning');
      return;
    }

    if (currentCount >= 15) {
      if (window.showToast) window.showToast(`⚠️ Max 15 copies allowed for ${card.name}!`, 'warning');
      return;
    }

    // Check Starter Rule: Max 1 Exotic OR 1 Legendary
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
    if (window.audioMgr) window.audioMgr.playSFX('cardPlay');
  }

  removeCard(cardId) {
    if (!this.deck[cardId]) return;
    this.deck[cardId]--;
    if (this.deck[cardId] <= 0) {
      delete this.deck[cardId];
    }
    this.saveDeck();
    if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
  }

  deleteCard(cardId) {
    if (!this.deck[cardId]) return;
    delete this.deck[cardId];
    this.saveDeck();
    if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
  }

  getTotalCardCount() {
    return Object.values(this.deck).reduce((sum, count) => sum + count, 0);
  }

  renderWorkbench() {
    this.renderCardVault();
    this.renderDeckSummary();
    this.renderDeckAnalytics();
    this.renderDeckList();
  }

  /* ========================================================
     LEFT COLUMN: CARD VAULT BROWSER
     ======================================================== */
  renderCardVault() {
    const grid = document.getElementById('deck-vault-grid');
    const countBadge = document.getElementById('deck-vault-count-badge');
    if (!grid) return;

    // Filter cards
    const filtered = this.allCards.filter(card => {
      // Class Filter
      if (this.selectedClass !== 'all' && card.class !== this.selectedClass) {
        return false;
      }
      // Rarity Filter
      if (this.selectedRarity !== 'all' && card.rarity !== this.selectedRarity) {
        return false;
      }
      // Search Query
      if (this.searchQuery) {
        const text = `${card.name} ${card.class} ${card.description} ${card.damageType} ${card.rarity}`.toLowerCase();
        if (!text.includes(this.searchQuery)) return false;
      }
      return true;
    });

    if (countBadge) countBadge.textContent = `${filtered.length} Cards`;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-faint);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
          <p>No cards match your filter criteria.</p>
        </div>
      `;
      return;
    }

    const classIcons = {
      'Elixir': '🧪',
      'Wild Mages': '🔮',
      'Swordsman': '⚔️',
      'Animal': '🐾',
      'Monster': '👹',
      'Goblins': '⚙️'
    };

    grid.innerHTML = filtered.map(card => {
      const inDeckCount = this.deck[card.id] || 0;
      const isMaxed = inDeckCount >= 15;
      const imageSrc = card.image || card.staticImage;

      // Stats Pills
      const stats = [];
      if (card.damage > 0) {
        const icon = card.damageType === 'Magic' ? '✨' : '⚔️';
        stats.push(`<span class="stat-pill ${card.damageType === 'Magic' ? 'magic' : 'dmg'}">${icon} ${card.damage}</span>`);
      }
      if (card.armor > 0) stats.push(`<span class="stat-pill armor">🛡️ ${card.armor}</span>`);
      if (card.ward > 0) stats.push(`<span class="stat-pill ward">🔮 ${card.ward}</span>`);
      if (card.healing > 0) stats.push(`<span class="stat-pill heal">❤️ ${card.healing}</span>`);

      return `
        <div class="vault-card-item rarity-${card.rarity.toLowerCase()} ${inDeckCount > 0 ? 'in-deck' : ''}" 
             data-card-id="${card.id}" 
             title="Click to add ${card.name} to deck">
          <!-- Top Bar -->
          <div class="vault-card-top">
            <span class="card-cost-gem" style="width: 22px; height: 22px; font-size: 0.75rem;">${card.cost}</span>
            <div class="vault-card-title">${card.name}</div>
            <span style="font-size: 0.85rem;" title="${card.class}">${classIcons[card.class] || '🃏'}</span>
          </div>

          <!-- Thumbnail Art -->
          <div class="vault-card-img-box">
            <img src="${imageSrc}" alt="${card.name}" loading="lazy" />
          </div>

          <!-- Stats Row -->
          ${stats.length > 0 ? `<div class="vault-card-stats">${stats.join('')}</div>` : ''}

          <!-- Footer Bar -->
          <div class="vault-card-footer">
            <span class="vault-card-deck-badge ${inDeckCount > 0 ? (isMaxed ? 'maxed' : 'in-deck') : ''}">
              ${inDeckCount > 0 ? (isMaxed ? '15x (Max)' : `${inDeckCount}x in deck`) : '0 in deck'}
            </span>
            <button class="vault-card-add-btn" data-add-id="${card.id}" ${isMaxed ? 'disabled' : ''}>
              ${isMaxed ? 'Max' : '+ Add'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to cards
    grid.querySelectorAll('.vault-card-item').forEach(cardEl => {
      cardEl.addEventListener('click', (e) => {
        const cardId = cardEl.dataset.cardId;
        this.addCard(cardId);
      });
    });
  }

  /* ========================================================
     RIGHT COLUMN: DECK SUMMARY & RULES
     ======================================================== */
  renderDeckSummary() {
    const total = this.getTotalCardCount();
    const countEl = document.getElementById('deck-total-count');
    const fillEl = document.getElementById('deck-count-progress-fill');
    const heroEl = document.getElementById('deck-assigned-hero');

    if (heroEl) heroEl.textContent = `🛡️ Archetype: ${this.activeHero}`;

    if (countEl) {
      countEl.textContent = `${total} / 100`;
      countEl.style.color = (total >= 10 && total <= 100) ? '#4ade80' : '#f87171';
    }

    if (fillEl) {
      const pct = Math.min(100, Math.round((total / 100) * 100));
      fillEl.style.width = `${pct}%`;
      if (total > 100) fillEl.classList.add('overfill');
      else fillEl.classList.remove('overfill');
    }

    // Rules Verification
    const sizeItem = document.getElementById('rule-size-item');
    const sizeText = document.getElementById('rule-size-text');
    if (sizeItem && sizeText) {
      const isSizeLegal = total >= 10 && total <= 100;
      sizeItem.className = `rule-check-item ${isSizeLegal ? 'valid' : 'invalid'}`;
      sizeItem.querySelector('.rule-icon').textContent = isSizeLegal ? '✅' : '❌';
      sizeText.textContent = `${total} Cards (${isSizeLegal ? '10-100 legal' : (total < 10 ? 'need at least 10' : 'overfilled max 100')})`;
    }

    // Starter Limit: Max 1 Exotic OR 1 Legendary
    const starterItem = document.getElementById('rule-starter-item');
    const starterText = document.getElementById('rule-starter-text');
    if (starterItem && starterText) {
      let highRarityCount = 0;
      Object.entries(this.deck).forEach(([id, count]) => {
        const c = this.allCards.find(x => x.id === id);
        if (c && (c.rarity === 'Exotic' || c.rarity === 'Legendary')) {
          highRarityCount += count;
        }
      });

      const isStarterLegal = highRarityCount <= 1;
      starterItem.className = `rule-check-item ${isStarterLegal ? 'valid' : 'invalid'}`;
      starterItem.querySelector('.rule-icon').textContent = isStarterLegal ? '✅' : '❌';
      starterText.textContent = `${highRarityCount} / 1 Exotic or Legendary (${isStarterLegal ? 'Legal' : 'Max 1 allowed'})`;
    }

    // Duplicate Limit: Max 15 copies
    const copiesItem = document.getElementById('rule-copies-item');
    const copiesText = document.getElementById('rule-copies-text');
    if (copiesItem && copiesText) {
      const highestCopy = Math.max(0, ...Object.values(this.deck));
      const isCopiesLegal = highestCopy <= 15;
      copiesItem.className = `rule-check-item ${isCopiesLegal ? 'valid' : 'invalid'}`;
      copiesItem.querySelector('.rule-icon').textContent = isCopiesLegal ? '✅' : '❌';
      copiesText.textContent = `Max copy count: ${highestCopy}x (Limit ≤ 15x)`;
    }
  }

  /* ========================================================
     TACTICAL ANALYTICS: MANA CURVE & COMBAT STATS
     ======================================================== */
  renderDeckAnalytics() {
    const curve = [0, 0, 0, 0, 0, 0]; // 0, 1, 2, 3, 4, 5+
    let totalManaSum = 0;
    let totalCards = 0;

    let totalPhys = 0;
    let totalMag = 0;
    let totalArmor = 0;
    let totalWard = 0;
    let totalHeal = 0;

    const classDistribution = {};

    Object.entries(this.deck).forEach(([cardId, count]) => {
      const card = this.allCards.find(c => c.id === cardId);
      if (!card) return;

      const slot = Math.min(card.cost, 5);
      curve[slot] += count;
      totalManaSum += (card.cost * count);
      totalCards += count;

      if (card.damage > 0) {
        if (card.damageType === 'Magic') totalMag += (card.damage * count);
        else totalPhys += (card.damage * count);
      }
      if (card.armor > 0) totalArmor += (card.armor * count);
      if (card.ward > 0) totalWard += (card.ward * count);
      if (card.healing > 0) totalHeal += (card.healing * count);

      classDistribution[card.class] = (classDistribution[card.class] || 0) + count;
    });

    // 1. Average Mana
    const avgManaEl = document.getElementById('deck-avg-mana');
    if (avgManaEl) {
      const avg = totalCards > 0 ? (totalManaSum / totalCards).toFixed(1) : '0.0';
      avgManaEl.textContent = `Avg: ${avg} Mana`;
    }

    // 2. Mana Histogram Chart
    const curveContainer = document.getElementById('mana-curve-chart');
    if (curveContainer) {
      const maxCurve = Math.max(...curve, 1);
      curveContainer.innerHTML = curve.map((c, cost) => {
        const heightPct = Math.round((c / maxCurve) * 100);
        return `
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100px;">
            <span style="font-size: 0.72rem; color: #94a3b8; font-weight: 700; margin-bottom: 0.25rem;">${c}</span>
            <div style="width: 100%; max-width: 26px; background: linear-gradient(to top, #0284c7, #38bdf8); height: ${heightPct}%; border-radius: 4px 4px 0 0; min-height: 4px; box-shadow: 0 0 8px rgba(56, 189, 248, 0.4);"></div>
            <span style="font-size: 0.75rem; color: #cbd5e1; font-weight: 800; margin-top: 0.35rem;">${cost === 5 ? '5+' : cost}</span>
          </div>
        `;
      }).join('');
    }

    // 3. Combat Synergy Stats
    const physEl = document.getElementById('deck-total-phys');
    const magEl = document.getElementById('deck-total-mag');
    const armorEl = document.getElementById('deck-total-armor');
    const wardEl = document.getElementById('deck-total-ward');
    const healEl = document.getElementById('deck-total-heal');

    if (physEl) physEl.textContent = totalPhys;
    if (magEl) magEl.textContent = totalMag;
    if (armorEl) armorEl.textContent = totalArmor;
    if (wardEl) wardEl.textContent = totalWard;
    if (healEl) healEl.textContent = totalHeal;

    // 4. Class Composition Breakdown
    const compContainer = document.getElementById('deck-class-composition');
    if (compContainer) {
      const classColors = {
        'Swordsman': '#f59e0b',
        'Monster': '#ef4444',
        'Goblins': '#10b981',
        'Wild Mages': '#8b5cf6',
        'Animal': '#06b6d4',
        'Elixir': '#ec4899'
      };

      if (totalCards === 0) {
        compContainer.innerHTML = '';
        return;
      }

      compContainer.innerHTML = Object.entries(classDistribution)
        .sort((a, b) => b[1] - a[1])
        .map(([cls, cnt]) => {
          const pct = Math.round((cnt / totalCards) * 100);
          const col = classColors[cls] || '#38bdf8';
          return `
            <div class="class-comp-bar-row">
              <span style="width: 85px; font-weight: 600;">${cls}</span>
              <div class="class-comp-track">
                <div class="class-comp-fill" style="width: ${pct}%; background: ${col};"></div>
              </div>
              <span style="width: 45px; text-align: right; font-weight: 700;">${cnt} (${pct}%)</span>
            </div>
          `;
        }).join('');
    }
  }

  /* ========================================================
     ACTIVE DECK LIST & HOVER PREVIEW
     ======================================================== */
  renderDeckList() {
    const listContainer = document.getElementById('deck-cards-list');
    const uniqueCountEl = document.getElementById('deck-unique-count');
    if (!listContainer) return;

    const entries = Object.entries(this.deck);
    if (uniqueCountEl) uniqueCountEl.textContent = entries.length;

    if (entries.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-faint);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🎴</div>
          <p style="font-size: 0.95rem; color: #fff; margin-bottom: 0.25rem;">Your expedition deck is empty.</p>
          <p style="font-size: 0.8rem; color: var(--text-muted);">
            Pick an Archetype Preset above or click any card in the Card Vault to build your deck!
          </p>
        </div>
      `;
      return;
    }

    // Sort by Mana Cost then Name
    entries.sort((a, b) => {
      const cardA = this.allCards.find(c => c.id === a[0]);
      const cardB = this.allCards.find(c => c.id === b[0]);
      if (!cardA || !cardB) return 0;
      if (cardA.cost !== cardB.cost) return cardA.cost - cardB.cost;
      return cardA.name.localeCompare(cardB.name);
    });

    listContainer.innerHTML = entries.map(([cardId, count]) => {
      const card = this.allCards.find(c => c.id === cardId);
      if (!card) return '';

      const thumbSrc = card.image || card.staticImage;

      return `
        <div class="deck-card-row" data-card-id="${card.id}">
          <div class="deck-card-row-info">
            <span class="card-cost-gem" style="width: 22px; height: 22px; font-size: 0.72rem; flex-shrink: 0;">${card.cost}</span>
            <div class="deck-card-row-thumb">
              <img src="${thumbSrc}" alt="${card.name}" />
            </div>
            <div class="deck-card-row-text">
              <span class="deck-card-row-name" title="${card.name}">${card.name}</span>
              <span class="deck-card-row-meta" style="color: var(--rarity-${card.rarity.toLowerCase()});">
                ${card.class} • ${card.rarity}
              </span>
            </div>
          </div>

          <div class="deck-card-row-ctrls">
            <button class="deck-qty-btn row-sub-btn" data-card-id="${card.id}" title="Remove one copy">-</button>
            <span class="deck-qty-badge">${count}x</span>
            <button class="deck-qty-btn row-add-btn" data-card-id="${card.id}" title="Add one copy">+</button>
            <button class="deck-del-btn row-del-btn" data-card-id="${card.id}" title="Delete all copies of this card">✕</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach Quantity Controls
    listContainer.querySelectorAll('.row-add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.addCard(btn.dataset.cardId);
      });
    });
    listContainer.querySelectorAll('.row-sub-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeCard(btn.dataset.cardId);
      });
    });
    listContainer.querySelectorAll('.row-del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteCard(btn.dataset.cardId);
      });
    });

    // Attach Hover Preview to Rows
    const popover = document.getElementById('deck-card-hover-preview');
    listContainer.querySelectorAll('.deck-card-row').forEach(row => {
      row.addEventListener('mouseenter', (e) => {
        const cardId = row.dataset.cardId;
        const card = this.allCards.find(c => c.id === cardId);
        if (card && popover && window.compendium) {
          popover.innerHTML = window.compendium.generateCardHTML(card, false);
          popover.style.display = 'block';
          this.positionPopover(e, popover);
        }
      });

      row.addEventListener('mousemove', (e) => {
        if (popover && popover.style.display === 'block') {
          this.positionPopover(e, popover);
        }
      });

      row.addEventListener('mouseleave', () => {
        if (popover) popover.style.display = 'none';
      });
    });
  }

  positionPopover(e, popover) {
    const popWidth = 230;
    const popHeight = 330;
    let left = e.clientX + 20;
    let top = e.clientY - 120;

    // Check right edge
    if (left + popWidth > window.innerWidth - 20) {
      left = e.clientX - popWidth - 20;
    }
    // Check bottom edge
    if (top + popHeight > window.innerHeight - 20) {
      top = window.innerHeight - popHeight - 20;
    }
    // Check top edge
    if (top < 20) top = 20;

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
  }

  /* ========================================================
     ARENA INTEGRATION & EXPORT/IMPORT
     ======================================================== */
  testDeckInArena() {
    const total = this.getTotalCardCount();
    if (total < 10) {
      if (window.showToast) window.showToast('⚠️ Deck must have at least 10 cards to test in Combat Arena!', 'warning');
      return;
    }

    // Convert deck dictionary to card instances array
    const deckInstances = [];
    Object.entries(this.deck).forEach(([cardId, count]) => {
      const card = this.allCards.find(c => c.id === cardId);
      if (card) {
        for (let i = 0; i < count; i++) {
          deckInstances.push({ ...card });
        }
      }
    });

    // Shuffle
    for (let i = deckInstances.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckInstances[i], deckInstances[j]] = [deckInstances[j], deckInstances[i]];
    }

    // Load into Combat Demo
    if (window.combatDemo) {
      window.combatDemo.deck = [...deckInstances];
      window.combatDemo.discard = [];
      window.combatDemo.hand = [];
      window.combatDemo.turn = 1;
      window.combatDemo.drawHand(5);
      window.combatDemo.renderCombatState();
    }

    // Switch to combat tab
    if (window.app) {
      window.app.switchTab('combat');
      const combatPane = document.getElementById('tab-combat');
      if (combatPane) combatPane.scrollIntoView({ behavior: 'smooth' });
    }

    if (window.audioMgr) window.audioMgr.playSFX('cardPlay');
    if (window.showToast) window.showToast(`⚔️ Loaded your ${total}-card custom deck into Combat Arena!`);
  }

  exportDeck() {
    const dataStr = JSON.stringify(this.deck);
    const code = btoa(dataStr);

    let readable = `=== DECKED OUT STARTER DECK ===\nTotal Cards: ${this.getTotalCardCount()}\n\n`;
    Object.entries(this.deck).forEach(([id, count]) => {
      const c = this.allCards.find(x => x.id === id);
      if (c) readable += `${count}x ${c.name} (${c.class}, ${c.cost} Mana)\n`;
    });
    readable += `\nDeck Code:\n${code}`;

    navigator.clipboard.writeText(readable).then(() => {
      if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
      if (window.showToast) window.showToast('📋 Deck code copied to clipboard!');
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
        if (window.audioMgr) window.audioMgr.playSFX('cardPlay');
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
