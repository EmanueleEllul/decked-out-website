// Decked Out - Interactive Dungeon Map, Encounters, Gambler Minigames & World Boss Tracker
// Features Act 1-3 branching paths, Mystery Event simulator, Gambler wagers & 1,000,000 HP World Boss raid

class DungeonMapManager {
  constructor() {
    this.acts = window.GAME_ACTS || [];
    this.mysteryEvents = window.MYSTERY_EVENTS || [];
    this.activeAct = 1;

    // World boss persistent state
    this.godMaxHp = 1000000;
    this.godHp = 1000000;
    this.loadWorldBoss();

    this.init();
  }

  loadWorldBoss() {
    try {
      const saved = localStorage.getItem('decked_god_hp');
      if (saved !== null) {
        this.godHp = parseInt(saved, 10);
      } else {
        this.godHp = 874520; // Default partially chipped by previous heroes
      }
    } catch(e) {}
  }

  saveWorldBoss() {
    try {
      localStorage.setItem('decked_god_hp', this.godHp);
    } catch(e) {}
    this.renderWorldBoss();
  }

  init() {
    this.bindEvents();
    this.renderActMap(this.activeAct);
    this.renderMysteryEvents();
    this.renderWorldBoss();
  }

  bindEvents() {
    // Act selector tabs
    const actBtns = document.querySelectorAll('.act-tab-btn');
    actBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        actBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeAct = parseInt(btn.dataset.act, 10);
        window.audioMgr.playSFX('buttonClick');
        this.renderActMap(this.activeAct);
      });
    });

    // Gambler Coin Flip
    const coinFlipBtn = document.getElementById('gambler-coin-flip-btn');
    if (coinFlipBtn) {
      coinFlipBtn.addEventListener('click', () => this.playCoinFlip());
    }

    // Gambler Wheel Spin
    const wheelSpinBtn = document.getElementById('gambler-wheel-spin-btn');
    if (wheelSpinBtn) {
      wheelSpinBtn.addEventListener('click', () => this.spinWheelOfFate());
    }

    // World Boss Strike
    const godStrikeBtn = document.getElementById('god-raid-strike-btn');
    if (godStrikeBtn) {
      godStrikeBtn.addEventListener('click', () => this.strikeTheGod());
    }
  }

  renderActMap(actNum) {
    const actData = this.acts.find(a => a.act === actNum) || this.acts[0];
    const container = document.getElementById('dungeon-map-visualizer');
    if (!container) return;

    const nodeIcons = [
      { type: 'Start', icon: '🚩', name: 'Expedition Start' },
      { type: 'Combat', icon: '⚔️', name: 'Normal Combat (25 Gold, 5 Gems)' },
      { type: 'Campsite', icon: '🏕️', name: 'Rest / Scavenge Node' },
      { type: 'Mystery', icon: '❓', name: 'Mystery Event Dilemma' },
      { type: 'Shop', icon: '🛒', name: 'In-Run Card Shop' },
      { type: 'Elite', icon: '💀', name: 'Elite Combat Encounter' },
      { type: 'Trader', icon: '💼', name: 'The Trader (Card Barter)' },
      { type: 'Chemist', icon: '🧪', name: 'The Chemist (Alchemy)' },
      { type: 'Gambler', icon: '🎲', name: 'The Gambler (Wagers)' },
      { type: 'Relic', icon: '🏺', name: 'Relic Chamber' },
      { type: 'Boss', icon: '👑', name: 'Act Climax Boss' }
    ];

    let html = `
      <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <h3 style="color: #fff; font-size: 1.4rem;">Act ${actData.act}: ${actData.name}</h3>
            <span style="color: var(--text-muted); font-size: 0.85rem;">${actData.floors} Floors • Theme: ${actData.theme}</span>
          </div>
          <span class="tag-badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;">
            Inter-Act Rule: Discard Shuffles into Deck!
          </span>
        </div>

        <div style="display: flex; gap: 0.75rem; overflow-x: auto; padding: 1.5rem 0.5rem; scrollbar-width: thin;">
    `;

    // Render floor nodes
    for (let f = 0; f <= actData.floors; f++) {
      let node = nodeIcons[1]; // default combat
      if (f === 0) node = nodeIcons[0]; // Start
      else if (f === actData.floors) node = nodeIcons[10]; // Boss
      else if (f % 4 === 0) node = nodeIcons[2]; // Campsite
      else if (f === 3 || f === 7) node = nodeIcons[3]; // Mystery
      else if (f === 5) node = nodeIcons[4]; // Shop
      else if (f === 6) node = nodeIcons[5]; // Elite
      else if (f === 8) node = nodeIcons[8]; // Gambler
      else if (f === 9) node = nodeIcons[6]; // Trader
      else if (f === 11) node = nodeIcons[7]; // Chemist

      html += `
        <div class="map-node-item" title="Floor ${f}: ${node.name}" style="flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; transition: transform 0.2s ease;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: ${f === actData.floors ? 'radial-gradient(circle, #ef4444, #991b1b)' : 'var(--bg-surface-elevated)'}; border: 2px solid ${f === actData.floors ? '#fca5a5' : 'var(--border-strong)'}; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
            ${node.icon}
          </div>
          <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">F${f}</span>
          <span style="font-size: 0.65rem; color: var(--text-faint); max-width: 60px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${node.type}</span>
        </div>
        ${f < actData.floors ? '<div style="align-self: center; color: #334155; font-size: 1.2rem;">➔</div>' : ''}
      `;
    }

    html += `
        </div>
      </div>
    `;

    // Render Boss Pool for this Act
    html += `
      <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 2rem;">
        <h4 style="font-size: 1.1rem; color: #fff; margin-bottom: 1rem;">💀 Act ${actData.act} Climax Boss Pool</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
          ${actData.bossPool.map(b => `
            <div style="display: flex; gap: 1rem; align-items: center; background: var(--bg-deep); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <div style="width: 60px; height: 60px; border-radius: var(--radius-md); overflow: hidden; background: #000; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                <img src="${b.sprite}" alt="${b.name}" style="width: 100%; height: 100%; object-fit: contain;" />
              </div>
              <div>
                <strong style="color: #fff; font-size: 1rem; display: block;">${b.name}</strong>
                <span style="font-size: 0.8rem; color: #f87171; font-weight: 700;">${b.hp.toLocaleString()} HP • ${b.atk} ATK</span>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">${b.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  renderMysteryEvents() {
    const container = document.getElementById('mystery-events-carousel');
    if (!container) return;

    container.innerHTML = this.mysteryEvents.map(evt => `
      <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; flex-direction: column;">
        <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.5rem;">
          <span style="font-size: 1.6rem;">${evt.icon}</span>
          <h4 style="color: #fff; font-size: 1.05rem;">${evt.name}</h4>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 1rem; font-style: italic; flex: 1;">
          "${evt.lore}"
        </p>
        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          ${evt.choices.map((c, i) => `
            <button class="btn btn-secondary mystery-choice-btn" data-event-id="${evt.id}" data-choice-index="${i}" style="font-size: 0.78rem; padding: 0.45rem 0.75rem; text-align: left; justify-content: flex-start; line-height: 1.3;">
              <strong>${c.label}</strong>: <span style="color: #94a3b8;">${c.outcome}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.mystery-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const evtId = parseInt(btn.dataset.eventId, 10);
        const choiceIdx = parseInt(btn.dataset.choiceIndex, 10);
        const evt = this.mysteryEvents.find(e => e.id === evtId);
        if (evt && evt.choices[choiceIdx]) {
          const choice = evt.choices[choiceIdx];
          window.audioMgr.playSFX('buttonClick');
          if (choice.effect.gold && window.packSim) {
            window.packSim.gold = Math.max(0, window.packSim.gold + choice.effect.gold);
          }
          if (choice.effect.gems && window.packSim) {
            window.packSim.gems = Math.max(0, window.packSim.gems + choice.effect.gems);
            window.packSim.saveState();
          }
          if (window.showToast) {
            window.showToast(`✨ ${choice.label} resolved: ${choice.outcome}`);
          }
        }
      });
    });
  }

  playCoinFlip() {
    const wagerInput = document.getElementById('gambler-wager-amount');
    const wager = parseInt(wagerInput?.value || '50', 10);

    if (!window.packSim || window.packSim.gold < wager) {
      if (window.showToast) window.showToast('⚠️ Not enough Gold to place this wager!', 'warning');
      return;
    }

    window.packSim.gold -= wager;
    window.audioMgr.playSFX('buttonClick');

    const win = Math.random() < 0.5;
    const resultBox = document.getElementById('gambler-result-box');

    if (win) {
      const winnings = Math.round(wager * 2.5);
      window.packSim.gems += winnings;
      window.packSim.saveState();
      window.audioMgr.playSFX('goldGain');
      if (resultBox) {
        resultBox.innerHTML = `
          <div style="color: #4ade80; font-weight: 700; font-size: 1.1rem;">
            🪙 HEADS! YOU WIN! Won ${winnings} Gems (2.5x Multiplier)!
          </div>
        `;
      }
    } else {
      window.packSim.saveState();
      window.audioMgr.playSFX('enemyHit');
      if (resultBox) {
        resultBox.innerHTML = `
          <div style="color: #f87171; font-weight: 700; font-size: 1.1rem;">
            💔 TAILS! Bad Luck! Lost ${wager} Gold wager.
          </div>
        `;
      }
    }
  }

  spinWheelOfFate() {
    if (!window.packSim || window.packSim.gold < 30) {
      if (window.showToast) window.showToast('⚠️ Wheel spin costs 30 Gold!', 'warning');
      return;
    }

    window.packSim.gold -= 30;
    window.packSim.saveState();
    window.audioMgr.playSFX('buttonClick');

    const wheelOutcomes = [
      { label: "💎 Jackpot! +150 Gems", gems: 150 },
      { label: "💰 Gold Rush! +75 Gold", gold: 75 },
      { label: "⚡ Alchemical Surge! Card Upgraded", gems: 25 },
      { label: "❤️ Life Elixir! +25 Health", gold: 15 },
      { label: "☠️ Bad Luck! Suffer -15 HP damage", hpLoss: 15 },
      { label: "💸 Pickpocket! Lost 40 Gold", goldLoss: 40 }
    ];

    const pick = wheelOutcomes[Math.floor(Math.random() * wheelOutcomes.length)];
    if (pick.gems) window.packSim.gems += pick.gems;
    if (pick.gold) window.packSim.gold += pick.gold;
    if (pick.goldLoss) window.packSim.gold = Math.max(0, window.packSim.gold - pick.goldLoss);
    window.packSim.saveState();

    window.audioMgr.playFanfare('Legendary');
    const resultBox = document.getElementById('gambler-result-box');
    if (resultBox) {
      resultBox.innerHTML = `
        <div style="color: #fbbf24; font-weight: 700; font-size: 1.1rem;">
          🎡 WHEEL STOPPED ON: ${pick.label}
        </div>
      `;
    }
  }

  strikeTheGod() {
    const strikeDmg = Math.floor(Math.random() * 25000) + 15000;
    this.godHp = Math.max(0, this.godHp - strikeDmg);
    this.saveWorldBoss();

    window.audioMgr.playSFX('enemyHit');
    if (window.packSim) {
      window.packSim.gems += 50;
      window.packSim.saveState();
    }

    if (window.showToast) {
      window.showToast(`⚡ Celestial Strike dealt ${strikeDmg.toLocaleString()} damage to The God!`);
    }

    if (this.godHp <= 0) {
      window.audioMgr.playFanfare('Exotic');
      alert('🏆 THE GOD HAS FALLEN! 10,000 Gems and Divine Godslayer Mastery Unlocked!');
      this.godHp = 1000000;
      this.saveWorldBoss();
    }
  }

  renderWorldBoss() {
    const barEl = document.getElementById('god-hp-fill');
    const labelEl = document.getElementById('god-hp-label');
    const pct = Math.max(0, (this.godHp / this.godMaxHp) * 100);

    if (barEl) barEl.style.width = `${pct}%`;
    if (labelEl) labelEl.textContent = `${this.godHp.toLocaleString()} / ${this.godMaxHp.toLocaleString()} HP (${pct.toFixed(2)}%)`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.dungeonMap = new DungeonMapManager();
});
