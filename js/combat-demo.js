// Decked Out - Playable Tactical Combat Demo & Sandbox
// Implements deterministic Godot damage formula: max(1, Base - Armor/Ward), status DoTs, Mana & Hero passives

class CombatDemo {
  constructor() {
    this.heroes = window.GAME_HEROES || [];
    this.cards = window.GAME_CARDS || [];
    
    this.selectedHero = this.heroes[0] || { name: 'Deck Monk', hp: 100, damage: 10, mana: 15 };
    this.player = {
      maxHp: 100,
      hp: 100,
      baseAtk: 10,
      maxMana: 15,
      mana: 15,
      armor: 0,
      ward: 0,
      scrap: 0,
      burn: 0,
      bleed: 0
    };

    this.enemyPool = [
      { name: "Goblin Sentry", hp: 45, maxHp: 45, atk: 7, armor: 2, ward: 0, sprite: "assets/enemies/Goblin.png" },
      { name: "Bandit Marauder", hp: 65, maxHp: 65, atk: 9, armor: 4, ward: 0, sprite: "assets/enemies/Bandit.png" },
      { name: "Cultist Pyromancer", hp: 70, maxHp: 70, atk: 11, armor: 0, ward: 8, sprite: "assets/enemies/Cultist.png" },
      { name: "Elite Knight", hp: 120, maxHp: 120, atk: 14, armor: 10, ward: 2, sprite: "assets/enemies/EliteKnight.png" },
      { name: "Boss: Bone Amalgam", hp: 220, maxHp: 220, atk: 14, armor: 12, ward: 0, sprite: "assets/enemies/EliteKnight.png" }
    ];

    this.currentEnemy = { ...this.enemyPool[0], burn: 0, bleed: 0, poison: 0, isStunned: false };
    this.hand = [];
    this.deck = [];
    this.discard = [];
    this.turn = 1;
    this.heroAttackedThisTurn = false;
    this.combatLog = [];

    this.init();
  }

  init() {
    this.bindEvents();
    this.resetCombat();
  }

  bindEvents() {
    const heroSelect = document.getElementById('combat-hero-select');
    if (heroSelect) {
      heroSelect.innerHTML = this.heroes.map(h => `<option value="${h.name}">${h.name}</option>`).join('');
      heroSelect.addEventListener('change', (e) => {
        const found = this.heroes.find(h => h.name === e.target.value);
        if (found) {
          this.selectedHero = found;
          this.resetCombat();
        }
      });
    }

    const enemySelect = document.getElementById('combat-enemy-select');
    if (enemySelect) {
      enemySelect.innerHTML = this.enemyPool.map((e, idx) => `<option value="${idx}">${e.name} (${e.hp} HP)</option>`).join('');
      enemySelect.addEventListener('change', (e) => {
        const idx = parseInt(e.target.value, 10);
        if (this.enemyPool[idx]) {
          this.currentEnemy = { ...this.enemyPool[idx], burn: 0, bleed: 0, poison: 0, isStunned: false };
          this.resetCombat();
        }
      });
    }

    const heroAttackBtn = document.getElementById('combat-hero-attack-btn');
    if (heroAttackBtn) {
      heroAttackBtn.addEventListener('click', () => this.executeHeroAttack());
    }

    const endTurnBtn = document.getElementById('combat-end-turn-btn');
    if (endTurnBtn) {
      endTurnBtn.addEventListener('click', () => this.endTurn());
    }

    const restartBtn = document.getElementById('combat-restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.resetCombat());
    }
  }

  resetCombat() {
    this.player.maxHp = this.selectedHero.hp || 100;
    this.player.hp = this.player.maxHp;
    this.player.baseAtk = this.selectedHero.damage || 10;
    this.player.maxMana = this.selectedHero.mana || 15;
    this.player.mana = this.player.maxMana;
    this.player.armor = 0;
    this.player.ward = this.selectedHero.name === 'Necri' ? 8 : 0;
    this.player.scrap = 0;
    this.player.burn = 0;
    this.player.bleed = 0;

    const enemyIdx = parseInt(document.getElementById('combat-enemy-select')?.value || '0', 10);
    const template = this.enemyPool[enemyIdx] || this.enemyPool[0];
    this.currentEnemy = {
      ...template,
      burn: 0,
      bleed: 0,
      poison: 0,
      isStunned: false
    };

    this.turn = 1;
    this.heroAttackedThisTurn = false;
    this.combatLog = [`⚔️ Battle initiated against ${this.currentEnemy.name}!`];

    this.buildCombatDeck();
    this.drawHand(5);

    window.audioMgr.playSFX('turnStart');
    this.renderCombatState();
  }

  buildCombatDeck() {
    // Pick suitable combat cards
    const pool = this.cards.filter(c => c.damage > 0 || c.armor > 0 || c.ward > 0 || c.healing > 0);
    this.deck = [];
    for (let i = 0; i < 20; i++) {
      const card = pool[Math.floor(Math.random() * pool.length)];
      this.deck.push(card);
    }
    this.discard = [];
  }

  drawHand(count) {
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) {
        if (this.discard.length === 0) break;
        this.deck = [...this.discard];
        this.discard = [];
      }
      if (this.deck.length > 0 && this.hand.length < 5) {
        this.hand.push(this.deck.pop());
      }
    }

    // Hero summon passives: Necri summons Skeleton
    if (this.selectedHero.name === 'Necri' && this.hand.length < 5) {
      const skel = this.cards.find(c => c.name === 'Skeleton');
      if (skel) this.hand.push(skel);
    }
  }

  playCard(index) {
    const card = this.hand[index];
    if (!card) return;

    if (this.player.mana < card.cost) {
      if (window.showToast) window.showToast('⚠️ Not enough Mana to play this card!', 'warning');
      return;
    }

    this.player.mana -= card.cost;
    this.hand.splice(index, 1);
    this.discard.push(card);

    window.audioMgr.playSFX('cardPlay');
    this.combatLog.push(`🃏 Played [${card.name}] for ${card.cost} Mana.`);

    // 1. Damage calculation
    if (card.damage > 0) {
      let mitigatedDmg = card.damage;
      if (card.damageType === 'Physical') {
        const defense = this.currentEnemy.armor;
        mitigatedDmg = Math.max(1, card.damage - defense);
        this.combatLog.push(`💥 Dealt ${mitigatedDmg} Physical damage (${card.damage} - ${defense} Enemy Armor).`);
      } else if (card.damageType === 'Magic') {
        const defense = this.currentEnemy.ward;
        mitigatedDmg = Math.max(1, card.damage - defense);
        this.combatLog.push(`✨ Dealt ${mitigatedDmg} Magic damage (${card.damage} - ${defense} Enemy Ward).`);
      } else {
        mitigatedDmg = card.damage;
        this.combatLog.push(`⚡ Dealt ${mitigatedDmg} direct damage.`);
      }

      this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - mitigatedDmg);
      window.audioMgr.playSFX('enemyHit');
    }

    // 2. Armor & Ward gain
    if (card.armor > 0) {
      this.player.armor += card.armor;
      this.combatLog.push(`🛡️ Gained +${card.armor} Armor.`);
    }
    if (card.ward > 0) {
      this.player.ward += card.ward;
      this.combatLog.push(`🔮 Gained +${card.ward} Ward.`);
    }

    // 3. Healing
    if (card.healing > 0) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + card.healing);
      this.combatLog.push(`❤️ Restored +${card.healing} HP.`);
    }

    // 4. Status Effects
    if (card.burn > 0) {
      this.currentEnemy.burn += card.burn;
      this.combatLog.push(`🔥 Inflicted ${card.burn} Burn on enemy!`);
    }
    if (card.bleed > 0) {
      this.currentEnemy.bleed += card.bleed;
      this.combatLog.push(`🩸 Inflicted ${card.bleed} Bleed on enemy!`);
    }
    if (card.poison > 0) {
      this.currentEnemy.poison += card.poison;
      this.combatLog.push(`☠️ Inflicted ${card.poison} Poison on enemy!`);
    }
    if (card.stunChance > 0) {
      const roll = Math.random() * 100;
      if (roll <= card.stunChance) {
        this.currentEnemy.isStunned = true;
        this.combatLog.push(`⚡ Enemy is STUNNED! Their next turn will be skipped.`);
      }
    }

    // 5. Scrap
    if (card.scrapGain > 0) {
      this.player.scrap += card.scrapGain;
      this.combatLog.push(`⚙️ Gained +${card.scrapGain} Scrap.`);
    }

    this.checkVictoryOrDefeat();
    this.renderCombatState();
  }

  executeHeroAttack() {
    if (this.heroAttackedThisTurn) {
      if (window.showToast) window.showToast('Hero already attacked this turn!', 'warning');
      return;
    }

    this.heroAttackedThisTurn = true;
    const base = this.player.baseAtk;
    const defense = this.currentEnemy.armor;
    const finalDmg = Math.max(1, base - defense);

    this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - finalDmg);
    window.audioMgr.playSFX('enemyHit');
    this.combatLog.push(`⚔️ Hero Strike dealt ${finalDmg} physical damage!`);

    // Hero Trait Triggers
    if (this.selectedHero.name === 'Demonling') {
      this.currentEnemy.burn += 3;
      this.combatLog.push(`🔥 Demonling trait ignited target for 3 Burn!`);
    } else if (this.selectedHero.name === 'Hunter The Hedgehog') {
      this.currentEnemy.bleed += 4;
      this.combatLog.push(`🩸 Hunter trait inflicted 4 Bleed!`);
    }

    this.checkVictoryOrDefeat();
    this.renderCombatState();
  }

  endTurn() {
    window.audioMgr.playSFX('turnEnd');

    // 1. Status DoTs on Enemy
    if (this.currentEnemy.burn > 0) {
      this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - this.currentEnemy.burn);
      this.combatLog.push(`🔥 Burn ticked for ${this.currentEnemy.burn} damage.`);
      this.currentEnemy.burn = Math.max(0, this.currentEnemy.burn - 1);
    }
    if (this.currentEnemy.bleed > 0) {
      this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - this.currentEnemy.bleed);
      this.combatLog.push(`🩸 Bleed ticked for ${this.currentEnemy.bleed} damage.`);
    }
    if (this.currentEnemy.poison > 0) {
      this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - this.currentEnemy.poison);
      this.combatLog.push(`☠️ Poison ticked for ${this.currentEnemy.poison} damage.`);
    }

    if (this.checkVictoryOrDefeat()) return;

    // 2. Enemy Action
    if (this.currentEnemy.isStunned) {
      this.combatLog.push(`⚡ ${this.currentEnemy.name} is stunned and skips turn!`);
      this.currentEnemy.isStunned = false;
    } else {
      const enemyDmg = this.currentEnemy.atk;
      let dmgLeft = enemyDmg;

      // Armor absorbs first
      if (this.player.armor > 0) {
        const absorbed = Math.min(this.player.armor, dmgLeft);
        this.player.armor -= absorbed;
        dmgLeft -= absorbed;
        this.combatLog.push(`🛡️ Player Armor absorbed ${absorbed} damage.`);
      }

      if (dmgLeft > 0) {
        this.player.hp = Math.max(0, this.player.hp - dmgLeft);
        this.combatLog.push(`💔 ${this.currentEnemy.name} struck player for ${dmgLeft} HP damage!`);
        window.audioMgr.playSFX('enemyHit');
      }
    }

    if (this.checkVictoryOrDefeat()) return;

    // 3. New Turn Start
    this.turn++;
    this.player.mana = this.player.maxMana;
    this.heroAttackedThisTurn = false;
    this.drawHand(2); // Draw 2 cards per turn standard

    // Necri passive heal
    if (this.selectedHero.name === 'Necri') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2);
    }

    window.audioMgr.playSFX('turnStart');
    this.combatLog.push(`--- Turn ${this.turn} Begins (Mana Refilled) ---`);
    this.renderCombatState();
  }

  checkVictoryOrDefeat() {
    if (this.currentEnemy.hp <= 0) {
      this.combatLog.push(`🏆 VICTORY! Slew ${this.currentEnemy.name}! Gained +25 Gold & +5 Gems.`);
      window.audioMgr.playSFX('goldGain');
      if (window.packSim) {
        window.packSim.gold += 25;
        window.packSim.gems += 5;
        window.packSim.saveState();
      }
      this.renderCombatState();
      return true;
    }
    if (this.player.hp <= 0) {
      this.combatLog.push(`💀 DEFEAT! The Hero has fallen.`);
      this.renderCombatState();
      return true;
    }
    return false;
  }

  renderCombatState() {
    // Player Stats
    const playerHpFill = document.getElementById('player-hp-fill');
    const playerHpLabel = document.getElementById('player-hp-label');
    const playerManaLabel = document.getElementById('player-mana-label');
    const playerArmorLabel = document.getElementById('player-armor-label');
    const playerWardLabel = document.getElementById('player-ward-label');

    if (playerHpFill) playerHpFill.style.width = `${Math.max(0, (this.player.hp / this.player.maxHp) * 100)}%`;
    if (playerHpLabel) playerHpLabel.textContent = `${this.player.hp} / ${this.player.maxHp} HP`;
    if (playerManaLabel) playerManaLabel.textContent = `${this.player.mana} / ${this.player.maxMana} Mana`;
    if (playerArmorLabel) playerArmorLabel.textContent = `Armor: ${this.player.armor}`;
    if (playerWardLabel) playerWardLabel.textContent = `Ward: ${this.player.ward}`;

    // Enemy Stats
    const enemyHpFill = document.getElementById('enemy-hp-fill');
    const enemyHpLabel = document.getElementById('enemy-hp-label');
    const enemyNameLabel = document.getElementById('enemy-display-name');
    const enemyArmorLabel = document.getElementById('enemy-armor-label');
    const enemyAvatarImg = document.getElementById('enemy-avatar-img');

    if (enemyHpFill) enemyHpFill.style.width = `${Math.max(0, (this.currentEnemy.hp / this.currentEnemy.maxHp) * 100)}%`;
    if (enemyHpLabel) enemyHpLabel.textContent = `${this.currentEnemy.hp} / ${this.currentEnemy.maxHp} HP`;
    if (enemyNameLabel) enemyNameLabel.textContent = this.currentEnemy.name;
    if (enemyArmorLabel) enemyArmorLabel.textContent = `Armor: ${this.currentEnemy.armor} | Ward: ${this.currentEnemy.ward}`;
    if (enemyAvatarImg && this.currentEnemy.sprite) enemyAvatarImg.src = this.currentEnemy.sprite;

    // Hand Shelf
    const handContainer = document.getElementById('combat-hand-cards');
    if (handContainer) {
      handContainer.innerHTML = this.hand.map((card, idx) => `
        <div class="combat-card-playable" data-hand-index="${idx}" style="cursor: pointer; width: 170px; flex-shrink: 0; transition: transform 0.2s ease;">
          <div style="transform: scale(0.85); transform-origin: top left;">
            ${window.compendium ? window.compendium.generateCardHTML(card, false) : ''}
          </div>
        </div>
      `).join('');

      handContainer.querySelectorAll('.combat-card-playable').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.dataset.handIndex, 10);
          this.playCard(idx);
        });
      });
    }

    // Combat Log
    const logBox = document.getElementById('combat-log-box');
    if (logBox) {
      logBox.innerHTML = this.combatLog.slice(-6).map(line => `<div style="margin-bottom: 0.25rem;">${line}</div>`).join('');
      logBox.scrollTop = logBox.scrollHeight;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.combatDemo = new CombatDemo();
});
