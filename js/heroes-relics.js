// Decked Out - Heroes & Relics Showcase

class HeroesRelicsManager {
  constructor() {
    this.heroes = (typeof window !== 'undefined' && window.GAME_HEROES) ? window.GAME_HEROES : (typeof GAME_HEROES !== 'undefined' ? GAME_HEROES : []);
    this.relics = (typeof window !== 'undefined' && window.GAME_RELICS) ? window.GAME_RELICS : (typeof GAME_RELICS !== 'undefined' ? GAME_RELICS : []);
    this.selectedHeroIndex = 0;
    this.init();
  }

  /** Derive the animated GIF path from a sprite path. */
  animPath(sprite) {
    if (!sprite) return null;
    const filename = sprite.split('/').pop().replace(/\.[^.]+$/, '');
    return `assets/heroes/anim/${filename}.gif`;
  }

  init() {
    this.renderHeroes();
    this.renderRelics();
  }

  ensureHeroes(callback, maxRetries = 25) {
    if (this.heroes && this.heroes.length > 0) {
      callback();
      return;
    }
    if (typeof window !== 'undefined' && window.GAME_HEROES && window.GAME_HEROES.length > 0) {
      this.heroes = window.GAME_HEROES;
      callback();
      return;
    }
    if (typeof GAME_HEROES !== 'undefined' && GAME_HEROES.length > 0) {
      this.heroes = GAME_HEROES;
      callback();
      return;
    }
    if (maxRetries > 0) {
      setTimeout(() => this.ensureHeroes(callback, maxRetries - 1), 100);
    }
  }

  ensureRelics(callback, maxRetries = 25) {
    if (this.relics && this.relics.length > 0) {
      callback();
      return;
    }
    if (typeof window !== 'undefined' && window.GAME_RELICS && window.GAME_RELICS.length > 0) {
      this.relics = window.GAME_RELICS;
      callback();
      return;
    }
    if (typeof GAME_RELICS !== 'undefined' && GAME_RELICS.length > 0) {
      this.relics = GAME_RELICS;
      callback();
      return;
    }
    if (maxRetries > 0) {
      setTimeout(() => this.ensureRelics(callback, maxRetries - 1), 100);
    }
  }

  renderHeroes() {
    const listContainer = document.getElementById('heroes-roster-shelf');
    if (!listContainer) return;

    this.ensureHeroes(() => {
      listContainer.innerHTML = this.heroes.map((h, idx) => {
        const anim = this.animPath(h.sprite);
        return `
          <div class="hero-roster-card ${idx === this.selectedHeroIndex ? 'active' : ''}" data-hero-idx="${idx}">
            <div class="hero-roster-avatar">
              ${h.sprite
                ? `<img src="${anim}" alt="${h.name}" class="pixel-art" onerror="this.src='${h.sprite}'" />`
                : `<span class="hero-fallback-icon">🛡️</span>`}
            </div>
            <div class="hero-roster-info">
              <strong class="hero-roster-name">${h.name}</strong>
              <span class="hero-roster-title">${h.title}</span>
            </div>
            <span class="hero-roster-arrow">➔</span>
          </div>
        `;
      }).join('');

      listContainer.querySelectorAll('.hero-roster-card').forEach(el => {
        el.addEventListener('click', () => {
          this.selectedHeroIndex = parseInt(el.dataset.heroIdx, 10);
          if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
          this.renderHeroes();
          this.updateHeroDetail();
        });
      });

      this.updateHeroDetail();
    });
  }

  updateHeroDetail() {
    const h = this.heroes[this.selectedHeroIndex];
    if (!h) return;

    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    set('hero-detail-name',     h.name);
    set('hero-detail-title',    h.title);
    set('hero-detail-unlock',   `Unlock: ${h.unlock}`);
    set('hero-detail-passive',  h.passive);
    set('hero-detail-affinity', h.affinity);
    set('hero-scaled-hp',       `${h.hp} HP`);
    set('hero-scaled-atk',      `${h.damage} ATK`);
    set('hero-scaled-mana',     `${h.mana} Mana`);
    set('hero-detail-description', h.description || '');

    const avatarEl = document.getElementById('hero-detail-avatar');
    if (avatarEl) {
      if (h.sprite) {
        const anim = this.animPath(h.sprite);
        avatarEl.innerHTML = `
          <img src="${anim}" alt="${h.name}" class="pixel-art"
               onerror="this.src='${h.sprite}'" />
        `;
      } else {
        avatarEl.innerHTML = `<span style="font-size:3rem;">🛡️</span>`;
      }
    }
  }

  renderRelics() {
    const container = document.getElementById('relics-grid-container');
    if (!container) return;

    this.ensureRelics(() => {
      container.innerHTML = this.relics.map(r => `
        <div class="relic-showcase-card">
          <div class="relic-card-header">
            <div class="relic-icon-frame">🏺</div>
            <div class="relic-header-text">
              <h4 class="relic-name">${r.name}</h4>
              <span class="relic-effect-badge">${r.effect}</span>
            </div>
          </div>
          <div class="relic-body">
            <p class="relic-tactical">${r.tactical}</p>
          </div>
          <div class="relic-footer">
            <span class="relic-cost-pill">Cost: ${r.cost} Relic Shards</span>
            <span class="relic-tier-pill">Tier ${r.cost > 3 ? 'II' : 'I'} Artifact</span>
          </div>
        </div>
      `).join('');
    });
  }
}

if (typeof window !== 'undefined') {
  window.HeroesRelicsManager = HeroesRelicsManager;
}

function initHeroesRelics() {
  if (document.getElementById('heroes-roster-shelf') || document.getElementById('relics-grid-container')) {
    window.heroesRelics = new HeroesRelicsManager();
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroesRelics);
  } else {
    initHeroesRelics();
  }
}
