// Decked Out - Heroes & Relics Hub Manager
// Features 7 Core Heroes and 3-Relic Active Loadout Builder

class HeroesRelicsManager {
  constructor() {
    this.heroes = window.GAME_HEROES || [];
    this.relics = window.GAME_RELICS || [];
    this.selectedHeroIndex = 0;
    this.equippedRelics = [];

    this.init();
  }

  init() {
    this.renderHeroes();
    this.renderRelics();
    this.bindEvents();
  }

  bindEvents() {
    // Interactive bindings for heroes roster and relics
  }

  renderHeroes() {
    const listContainer = document.getElementById('heroes-roster-shelf');
    if (!listContainer) return;

    listContainer.innerHTML = this.heroes.map((h, idx) => `
      <div class="hero-roster-card ${idx === this.selectedHeroIndex ? 'active' : ''}" data-hero-idx="${idx}" style="background: var(--bg-surface); border: 2px solid ${idx === this.selectedHeroIndex ? 'var(--primary)' : 'var(--border-subtle)'}; border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: all 0.2s ease;">
        <div style="width: 48px; height: 48px; border-radius: var(--radius-sm); overflow: hidden; background: #000; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-subtle);">
          ${h.sprite ? `<img src="${h.sprite}" alt="${h.name}" style="width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated;" />` : `<span style="font-size: 1.5rem;">🛡️</span>`}
        </div>
        <div>
          <strong style="color: #fff; font-size: 0.95rem; display: block;">${h.name}</strong>
          <span style="font-size: 0.75rem; color: var(--primary); font-weight: 600;">${h.title}</span>
        </div>
      </div>
    `).join('');

    listContainer.querySelectorAll('.hero-roster-card').forEach(el => {
      el.addEventListener('click', () => {
        this.selectedHeroIndex = parseInt(el.dataset.heroIdx, 10);
        window.audioMgr.playSFX('buttonClick');
        this.renderHeroes();
        this.updateHeroStatsDisplay();
      });
    });

    this.updateHeroStatsDisplay();
  }

  updateHeroStatsDisplay() {
    const h = this.heroes[this.selectedHeroIndex];
    if (!h) return;

    const nameEl = document.getElementById('hero-detail-name');
    const titleEl = document.getElementById('hero-detail-title');
    const avatarEl = document.getElementById('hero-detail-avatar');
    const unlockEl = document.getElementById('hero-detail-unlock');
    const passiveEl = document.getElementById('hero-detail-passive');
    const hpEl = document.getElementById('hero-scaled-hp');
    const atkEl = document.getElementById('hero-scaled-atk');
    const manaEl = document.getElementById('hero-scaled-mana');
    const affinityEl = document.getElementById('hero-detail-affinity');

    if (nameEl) nameEl.textContent = h.name;
    if (titleEl) titleEl.textContent = h.title;
    if (unlockEl) unlockEl.textContent = h.unlock;
    if (passiveEl) passiveEl.textContent = h.passive;
    if (affinityEl) affinityEl.textContent = h.affinity;
    if (hpEl) hpEl.textContent = `${h.hp} HP`;
    if (atkEl) atkEl.textContent = `${h.damage} ATK`;
    if (manaEl) manaEl.textContent = `${h.mana} Mana`;

    if (avatarEl) {
      if (h.sprite) {
        avatarEl.innerHTML = `<img src="${h.sprite}" alt="${h.name}" style="width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated;" />`;
      } else {
        avatarEl.innerHTML = `<span style="font-size: 3rem;">🛡️</span>`;
      }
    }
  }

  renderRelics() {
    const container = document.getElementById('relics-grid-container');
    if (!container) return;

    container.innerHTML = this.relics.map(r => {
      const isEquipped = this.equippedRelics.includes(r.name);
      return `
        <div class="relic-item-card ${isEquipped ? 'equipped' : ''}" style="background: var(--bg-surface); border: 2px solid ${isEquipped ? '#00e5ff' : 'var(--border-subtle)'}; border-radius: var(--radius-md); padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s ease;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h4 style="color: #fff; font-size: 1.05rem;">🏺 ${r.name}</h4>
              <span class="tag-badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">${r.effect}</span>
            </div>
            <p style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.5; margin-bottom: 1rem;">
              ${r.tactical}
            </p>
          </div>
          <button class="btn ${isEquipped ? 'btn-secondary' : 'btn-primary'} equip-relic-btn" data-relic="${r.name}" style="width: 100%; justify-content: center; font-size: 0.85rem; padding: 0.45rem;">
            ${isEquipped ? 'Equipped (Active)' : 'Equip Relic'}
          </button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.equip-relic-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const relicName = btn.dataset.relic;
        this.toggleRelic(relicName);
      });
    });

    this.renderActiveRelicsSlotBar();
  }

  toggleRelic(name) {
    if (this.equippedRelics.includes(name)) {
      this.equippedRelics = this.equippedRelics.filter(r => r !== name);
      window.audioMgr.playSFX('buttonClick');
    } else {
      if (this.equippedRelics.length >= 3) {
        if (window.showToast) window.showToast('⚠️ Max 3 Active Relics can be equipped at once!', 'warning');
        return;
      }
      this.equippedRelics.push(name);
      window.audioMgr.playSFX('goldGain');
    }
    this.renderRelics();
  }

  renderActiveRelicsSlotBar() {
    const container = document.getElementById('active-relics-slots');
    if (!container) return;

    container.innerHTML = [0, 1, 2].map(slotIdx => {
      const relicName = this.equippedRelics[slotIdx];
      const r = this.relics.find(x => x.name === relicName);
      return `
        <div style="flex: 1; min-width: 140px; background: var(--bg-deep); border: 2px dashed ${r ? '#38bdf8' : 'var(--border-subtle)'}; border-radius: var(--radius-md); padding: 0.75rem; text-align: center;">
          ${r ? `
            <strong style="color: #fff; font-size: 0.9rem; display: block;">🏺 ${r.name}</strong>
            <span style="font-size: 0.75rem; color: #38bdf8;">${r.effect}</span>
          ` : `
            <span style="font-size: 0.8rem; color: var(--text-faint);">Empty Relic Slot ${slotIdx + 1}</span>
          `}
        </div>
      `;
    }).join('');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.heroesRelics = new HeroesRelicsManager();
});
