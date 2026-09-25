// Decked Out - Playable Tactical Combat Demo & Sandbox
// Authentic turn-based Godot deck combat: Mana, Armor/Ward, Status DoTs, and Automatic Hero Strike on End Turn

class CombatDemo {
  constructor() {
    this.heroes = window.GAME_HEROES || [];
    this.cards = window.GAME_CARDS || [];

    this.selectedHero = this.heroes[0] || {
      name: 'Deck Monk',
      title: 'The Master of Balance',
      hp: 100,
      damage: 10,
      mana: 15,
      sprite: 'assets/heroes/DeckMonk.png'
    };

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
      { name: "Goblin Sentry", rank: "Minion", hp: 45, maxHp: 45, atk: 7, armor: 2, ward: 0, sprite: "assets/enemies/Goblin.png", intent: "Strikes for 7 Physical DMG" },
      { name: "Gnome Tinkerer", rank: "Normal", hp: 55, maxHp: 55, atk: 8, armor: 3, ward: 4, sprite: "assets/enemies/Gnome.png", intent: "Tinkers strike for 8 DMG" },
      { name: "Bandit Marauder", rank: "Aggressive", hp: 70, maxHp: 70, atk: 10, armor: 4, ward: 0, sprite: "assets/enemies/Bandit.png", intent: "Heavy slash for 10 DMG" },
      { name: "Cultist Pyromancer", rank: "Caster", hp: 80, maxHp: 80, atk: 12, armor: 0, ward: 10, sprite: "assets/enemies/Cultist.png", intent: "Pyromancy blast for 12 Magic DMG" },
      { name: "Elite Knight", rank: "Elite", hp: 130, maxHp: 130, atk: 14, armor: 10, ward: 4, sprite: "assets/enemies/EliteKnight.png", intent: "Shield bash for 14 Physical DMG" },
      { name: "Bone Amalgam", rank: "Act Boss", hp: 220, maxHp: 220, atk: 16, armor: 14, ward: 0, sprite: "assets/enemies/EliteKnight.png", intent: "Bone pulverize for 16 Physical DMG" }
    ];

    this.currentEnemyIndex = 0;
    this.currentEnemy = { ...this.enemyPool[0], burn: 0, bleed: 0, poison: 0, isStunned: false };
    this.hand = [];
    this.deck = [];
    this.discard = [];
    this.turn = 1;
    this.combatLog = [];
    this.isResolvingTurn = false;
    this.battleEnded = false;

    this.init();
  }

  init() {
    this.bindEvents();
    this.resetCombat();
  }

  bindEvents() {
    // Hero Dropdown
    const heroSelect = document.getElementById('combat-hero-select');
    if (heroSelect) {
      heroSelect.innerHTML = this.heroes.map(h => `<option value="${h.name}">${h.name} (${h.hp} HP / ${h.damage} ATK)</option>`).join('');
      heroSelect.addEventListener('change', (e) => {
        const found = this.heroes.find(h => h.name === e.target.value);
        if (found) {
          this.selectedHero = found;
          this.resetCombat();
        }
      });
    }

    // Foe Dropdown
    const enemySelect = document.getElementById('combat-enemy-select');
    if (enemySelect) {
      enemySelect.innerHTML = this.enemyPool.map((foe, idx) => 
        `<option value="${idx}">[${foe.rank}] ${foe.name} (${foe.hp} HP / ${foe.atk} ATK)</option>`
      ).join('');
      enemySelect.addEventListener('change', (e) => {
        const idx = parseInt(e.target.value, 10);
        if (this.enemyPool[idx]) {
          this.currentEnemyIndex = idx;
          this.resetCombat();
        }
      });
    }

    // End Turn Button (Now automatically triggers Hero Strike!)
    const endTurnBtn = document.getElementById('combat-end-turn-btn');
    if (endTurnBtn) {
      endTurnBtn.addEventListener('click', () => {
        if (!this.isResolvingTurn && !this.battleEnded) {
          this.executeTurnSequence();
        }
      });
    }

    // Reset Battle Button
    const restartBtn = document.getElementById('combat-restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.resetCombat());
    }

    // Next Foe Toolbar Button
    const nextFoeBtn = document.getElementById('combat-next-foe-btn');
    if (nextFoeBtn) {
      nextFoeBtn.addEventListener('click', () => this.nextFoe());
    }

    // Overlay Buttons
    const overlayNextBtn = document.getElementById('combat-overlay-next-btn');
    if (overlayNextBtn) {
      overlayNextBtn.addEventListener('click', () => {
        this.hideResultOverlay();
        this.nextFoe();
      });
    }

    const overlayRetryBtn = document.getElementById('combat-overlay-retry-btn');
    if (overlayRetryBtn) {
      overlayRetryBtn.addEventListener('click', () => {
        this.hideResultOverlay();
        this.resetCombat();
      });
    }
  }

  nextFoe() {
    this.currentEnemyIndex = (this.currentEnemyIndex + 1) % this.enemyPool.length;
    const enemySelect = document.getElementById('combat-enemy-select');
    if (enemySelect) enemySelect.value = this.currentEnemyIndex;
    this.resetCombat();
  }

  resetCombat() {
    this.hideResultOverlay();
    this.isResolvingTurn = false;
    this.battleEnded = false;

    // Initialize Player Stats based on Selected Hero
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

    // Initialize Enemy Stats
    const template = this.enemyPool[this.currentEnemyIndex] || this.enemyPool[0];
    this.currentEnemy = {
      ...template,
      burn: 0,
      bleed: 0,
      poison: 0,
      isStunned: false
    };

    this.turn = 1;
    this.combatLog = [
      `⚔️ Battle initiated! [${this.selectedHero.name}] vs [${this.currentEnemy.name}].`,
      `💡 Note: Hero Strike (${this.player.baseAtk} DMG) triggers automatically when you End Turn!`
    ];

    this.buildCombatDeck();
    this.drawHand(5);

    // Turn Start Passive for Hero
    if (this.selectedHero.name === 'Necri' && this.hand.length < 5) {
      const skel = this.cards.find(c => c.name === 'Skeleton');
      if (skel) {
        this.hand.push(skel);
        this.combatLog.push(`💀 Necri summoned a Skeleton into hand!`);
      }
    }

    if (window.audioMgr) window.audioMgr.playSFX('turnStart');
    this.updatePhaseIndicator('Your Turn: Play Cards or End Turn', 'phase-player');
    this.renderCombatState();
  }

  buildCombatDeck() {
    // Pick combat cards from the clean 62-card Series 1 pool
    const pool = this.cards.filter(c => c.damage > 0 || c.armor > 0 || c.ward > 0 || c.healing > 0 || c.cardsToDraw > 0);
    this.deck = [];
    const validPool = pool.length > 0 ? pool : this.cards;
    for (let i = 0; i < 20; i++) {
      const card = validPool[Math.floor(Math.random() * validPool.length)];
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
  }

  playCard(index) {
    if (this.isResolvingTurn || this.battleEnded) return;

    const card = this.hand[index];
    if (!card) return;

    // Check Mana
    if (this.player.mana < card.cost) {
      if (window.showToast) {
        window.showToast(`⚠️ Need ${card.cost} Mana (Current: ${this.player.mana})!`, 'warning');
      }
      this.shakeManaBar();
      return;
    }

    // Deduct Mana & Move to Discard
    this.player.mana -= card.cost;
    this.hand.splice(index, 1);
    this.discard.push(card);

    if (window.audioMgr) window.audioMgr.playSFX('cardPlay');
    this.combatLog.push(`🃏 Played [${card.name}] for ${card.cost} Mana.`);

    // 1. Damage Calculation
    if (card.damage > 0) {
      let finalDmg = card.damage;
      let defenseType = '';

      if (card.damageType === 'Physical') {
        const defense = this.currentEnemy.armor;
        finalDmg = Math.max(1, card.damage - defense);
        defenseType = ` (${card.damage} - ${defense} Enemy Armor)`;
      } else if (card.damageType === 'Magic') {
        const defense = this.currentEnemy.ward;
        finalDmg = Math.max(1, card.damage - defense);
        defenseType = ` (${card.damage} - ${defense} Enemy Ward)`;
      }

      this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - finalDmg);
      this.spawnFloatingText('enemy', `-${finalDmg}`, '#f87171');
      this.triggerHitAnimation('enemy');
      if (window.audioMgr) window.audioMgr.playSFX('enemyHit');

      this.combatLog.push(`💥 [${card.name}] dealt ${finalDmg} ${card.damageType || 'Physical'} damage${defenseType}!`);
    }

    // 2. Armor & Ward Gain
    if (card.armor > 0) {
      this.player.armor += card.armor;
      this.spawnFloatingText('player', `+${card.armor} Armor`, '#94a3b8');
      this.combatLog.push(`🛡️ Gained +${card.armor} Armor.`);
    }
    if (card.ward > 0) {
      this.player.ward += card.ward;
      this.spawnFloatingText('player', `+${card.ward} Ward`, '#c084fc');
      this.combatLog.push(`🔮 Gained +${card.ward} Ward.`);
    }

    // 3. Healing
    if (card.healing > 0) {
      const prev = this.player.hp;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + card.healing);
      const actualHeal = this.player.hp - prev;
      this.spawnFloatingText('player', `+${actualHeal} HP`, '#10b981');
      this.combatLog.push(`❤️ Restored +${actualHeal} Health.`);
    }

    // 4. Status Effects
    if (card.burn > 0) {
      this.currentEnemy.burn += card.burn;
      this.spawnFloatingText('enemy', `+${card.burn} Burn`, '#fb923c');
      this.combatLog.push(`🔥 Inflicted ${card.burn} Burn on enemy!`);
    }
    if (card.bleed > 0) {
      this.currentEnemy.bleed += card.bleed;
      this.spawnFloatingText('enemy', `+${card.bleed} Bleed`, '#f87171');
      this.combatLog.push(`🩸 Inflicted ${card.bleed} Bleed on enemy!`);
    }
    if (card.poison > 0) {
      this.currentEnemy.poison += card.poison;
      this.spawnFloatingText('enemy', `+${card.poison} Poison`, '#a3e635');
      this.combatLog.push(`☠️ Inflicted ${card.poison} Poison on enemy!`);
    }
    if (card.stunChance > 0) {
      const roll = Math.random() * 100;
      if (roll <= card.stunChance) {
        this.currentEnemy.isStunned = true;
        this.spawnFloatingText('enemy', `⚡ STUNNED!`, '#fde047');
        this.combatLog.push(`⚡ Enemy is STUNNED! Next enemy turn will be skipped.`);
      }
    }

    // 5. Scrap
    if (card.scrapGain > 0) {
      this.player.scrap += card.scrapGain;
      this.spawnFloatingText('player', `+${card.scrapGain} Scrap`, '#fbbf24');
      this.combatLog.push(`⚙️ Gained +${card.scrapGain} Scrap.`);
    }

    // 6. Draw Cards
    if (card.cardsToDraw > 0) {
      this.drawHand(card.cardsToDraw);
      this.combatLog.push(`🎴 Drew ${card.cardsToDraw} card(s).`);
    }

    // Check if card lethaled enemy
    if (this.currentEnemy.hp <= 0) {
      this.handleVictory();
      return;
    }

    this.renderCombatState();
  }

  /* ========================================================
     AUTOMATIC TURN RESOLUTION PIPELINE
     Executes Hero Strike -> Enemy DoTs -> Enemy Strike -> New Turn
     ======================================================== */
  async executeTurnSequence() {
    this.isResolvingTurn = true;
    const endTurnBtn = document.getElementById('combat-end-turn-btn');
    if (endTurnBtn) {
      endTurnBtn.disabled = true;
      endTurnBtn.innerHTML = `<span>⏳ Resolving Turn...</span>`;
    }

    if (window.audioMgr) window.audioMgr.playSFX('turnEnd');

    // ==========================================
    // PHASE 1: AUTOMATIC HERO STRIKE!
    // ==========================================
    this.updatePhaseIndicator(`⚔️ HERO STRIKE: ${this.selectedHero.name} strikes!`, 'phase-strike');

    // Trigger hero lunge and enemy hit animations
    this.triggerLungeAnimation('player');
    await this.delay(200);

    // Calculate Hero Strike Damage: Base Atk vs Enemy Armor
    const baseAtk = this.player.baseAtk;
    const enemyArmor = this.currentEnemy.armor;
    const finalHeroDmg = Math.max(1, baseAtk - enemyArmor);

    this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - finalHeroDmg);
    this.spawnFloatingText('enemy', `-${finalHeroDmg}`, '#fbbf24');
    this.triggerHitAnimation('enemy');
    if (window.audioMgr) window.audioMgr.playSFX('enemyHit');

    this.combatLog.push(`⚔️ Hero Strike! [${this.selectedHero.name}] dealt ${finalHeroDmg} damage (${baseAtk} ATK - ${enemyArmor} Enemy Armor).`);

    // Hero Passive Triggers on Strike
    if (this.selectedHero.name === 'Demonling') {
      this.currentEnemy.burn += 3;
      this.spawnFloatingText('enemy', `🔥 +3 Burn`, '#fb923c');
      this.combatLog.push(`🔥 Demonling trait ignited enemy for 3 Burn!`);
    } else if (this.selectedHero.name === 'Hunter The Hedgehog') {
      this.currentEnemy.bleed += 4;
      this.spawnFloatingText('enemy', `🩸 +4 Bleed`, '#f87171');
      this.combatLog.push(`🩸 Hunter trait inflicted 4 Bleed on enemy!`);
    } else if (this.selectedHero.name === 'Scrap Goblin') {
      this.player.scrap += 1;
      this.spawnFloatingText('player', `⚙️ +1 Scrap`, '#fbbf24');
      this.combatLog.push(`⚙️ Scrap Goblin salvaged 1 Scrap from the strike!`);
    }

    this.renderCombatState();

    // Check Victory after Hero Strike
    if (this.currentEnemy.hp <= 0) {
      this.handleVictory();
      return;
    }

    await this.delay(650);

    // ==========================================
    // PHASE 2: STATUS DoTS ON ENEMY
    // ==========================================
    if (this.currentEnemy.burn > 0 || this.currentEnemy.bleed > 0 || this.currentEnemy.poison > 0) {
      this.updatePhaseIndicator(`🔥 Status effects ticking on ${this.currentEnemy.name}...`, 'phase-strike');

      if (this.currentEnemy.burn > 0) {
        const bDmg = this.currentEnemy.burn;
        this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - bDmg);
        this.spawnFloatingText('enemy', `-${bDmg} Burn`, '#fb923c');
        this.combatLog.push(`🔥 Burn ticked for ${bDmg} damage on ${this.currentEnemy.name}.`);
        this.currentEnemy.burn = Math.max(0, this.currentEnemy.burn - 1);
      }

      if (this.currentEnemy.bleed > 0) {
        const blDmg = this.currentEnemy.bleed;
        this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - blDmg);
        this.spawnFloatingText('enemy', `-${blDmg} Bleed`, '#f87171');
        this.combatLog.push(`🩸 Bleed ticked for ${blDmg} damage on ${this.currentEnemy.name}.`);
      }

      if (this.currentEnemy.poison > 0) {
        const pDmg = this.currentEnemy.poison;
        this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - pDmg);
        this.spawnFloatingText('enemy', `-${pDmg} Poison`, '#a3e635');
        this.combatLog.push(`☠️ Poison ticked for ${pDmg} damage on ${this.currentEnemy.name}.`);
      }

      this.triggerHitAnimation('enemy');
      this.renderCombatState();

      if (this.currentEnemy.hp <= 0) {
        this.handleVictory();
        return;
      }

      await this.delay(650);
    }

    // ==========================================
    // PHASE 3: ENEMY ATTACK / TURN
    // ==========================================
    this.updatePhaseIndicator(`⚠️ ENEMY PHASE: ${this.currentEnemy.name} attacks!`, 'phase-enemy');

    if (this.currentEnemy.isStunned) {
      this.combatLog.push(`⚡ ${this.currentEnemy.name} is stunned! Turn skipped.`);
      this.spawnFloatingText('enemy', `⚡ Turn Skipped`, '#fde047');
      this.currentEnemy.isStunned = false;
      this.renderCombatState();
    } else {
      this.triggerLungeAnimation('enemy');
      await this.delay(200);

      const enemyDmg = this.currentEnemy.atk;
      let remainingDmg = enemyDmg;
      let armorAbsorbed = 0;
      let wardAbsorbed = 0;

      // Armor mitigates first
      if (this.player.armor > 0) {
        armorAbsorbed = Math.min(this.player.armor, remainingDmg);
        this.player.armor -= armorAbsorbed;
        remainingDmg -= armorAbsorbed;
      }

      // Ward mitigates next if any
      if (this.player.ward > 0 && remainingDmg > 0) {
        wardAbsorbed = Math.min(this.player.ward, remainingDmg);
        this.player.ward -= wardAbsorbed;
        remainingDmg -= wardAbsorbed;
      }

      // Remaining damage hits Player Health
      if (remainingDmg > 0) {
        this.player.hp = Math.max(0, this.player.hp - remainingDmg);
        this.spawnFloatingText('player', `-${remainingDmg}`, '#ef4444');
      }

      if (armorAbsorbed > 0 || wardAbsorbed > 0) {
        const blockTotal = armorAbsorbed + wardAbsorbed;
        this.spawnFloatingText('player', `🛡️ Blocked ${blockTotal}`, '#38bdf8');
      }

      this.triggerHitAnimation('player');
      if (window.audioMgr) window.audioMgr.playSFX('enemyHit');

      this.combatLog.push(
        `💔 [${this.currentEnemy.name}] struck player for ${enemyDmg} damage (${armorAbsorbed} absorbed by Armor, ${wardAbsorbed} by Ward, ${remainingDmg} to HP).`
      );

      this.renderCombatState();

      if (this.player.hp <= 0) {
        this.handleDefeat();
        return;
      }
    }

    await this.delay(650);

    // ==========================================
    // PHASE 4: STATUS DoTS ON PLAYER
    // ==========================================
    if (this.player.burn > 0 || this.player.bleed > 0) {
      if (this.player.burn > 0) {
        this.player.hp = Math.max(0, this.player.hp - this.player.burn);
        this.spawnFloatingText('player', `-${this.player.burn} Burn`, '#fb923c');
        this.combatLog.push(`🔥 Burn ticked for ${this.player.burn} damage on Player.`);
        this.player.burn = Math.max(0, this.player.burn - 1);
      }
      if (this.player.bleed > 0) {
        this.player.hp = Math.max(0, this.player.hp - this.player.bleed);
        this.spawnFloatingText('player', `-${this.player.bleed} Bleed`, '#f87171');
        this.combatLog.push(`🩸 Bleed ticked for ${this.player.bleed} damage on Player.`);
      }

      this.renderCombatState();
      if (this.player.hp <= 0) {
        this.handleDefeat();
        return;
      }
      await this.delay(500);
    }

    // ==========================================
    // PHASE 5: START NEW TURN (MANA REFILLED)
    // ==========================================
    this.turn++;
    this.player.mana = this.player.maxMana;

    // Draw 2 cards standard (or 3 for Lost Spirit)
    const cardsToDraw = this.selectedHero.name === 'Lost Spirit' ? 3 : 2;
    this.drawHand(cardsToDraw);

    // Hero Turn Start Passives
    if (this.selectedHero.name === 'Necri') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2);
      this.spawnFloatingText('player', `+2 HP Regen`, '#10b981');
      if (this.hand.length < 5) {
        const skel = this.cards.find(c => c.name === 'Skeleton');
        if (skel) this.hand.push(skel);
      }
    } else if (this.selectedHero.name === 'Demonling' && this.hand.length < 5) {
      const demonName = Math.random() < 0.75 ? "Lil' Demon" : "Daddy Demon";
      const demonCard = this.cards.find(c => c.name.includes('Demon')) || this.cards[0];
      if (demonCard) this.hand.push(demonCard);
    } else if (this.selectedHero.name === 'Hunter The Hedgehog' && this.hand.length < 5) {
      const quill = this.cards.find(c => c.name === 'Quill') || this.cards[0];
      if (quill) this.hand.push(quill);
    }

    if (window.audioMgr) window.audioMgr.playSFX('turnStart');
    this.combatLog.push(`--- 🌟 Round ${this.turn} Begins (Mana Refilled to ${this.player.maxMana}) ---`);
    this.updatePhaseIndicator(`Round ${this.turn}: Play Cards or End Turn`, 'phase-player');

    this.isResolvingTurn = false;
    if (endTurnBtn) {
      endTurnBtn.disabled = false;
      endTurnBtn.innerHTML = `
        <span class="btn-sword">⚔️</span>
        <span class="btn-text">End Turn & Hero Strike</span>
        <span class="btn-arrow">➔</span>
      `;
    }

    this.renderCombatState();
  }

  handleVictory() {
    this.battleEnded = true;
    this.isResolvingTurn = false;
    this.combatLog.push(`🏆 VICTORY! Vanquished ${this.currentEnemy.name}! Gained +25 Gold & +5 Gems.`);

    if (window.audioMgr) {
      window.audioMgr.playSFX('goldGain');
      window.audioMgr.playFanfare('Legendary');
    }

    // Award Rewards to Pack Binder/Gacha state
    if (window.packSim) {
      window.packSim.gold = (window.packSim.gold || 0) + 25;
      window.packSim.gems = (window.packSim.gems || 0) + 5;
      window.packSim.saveState();
      window.packSim.updateCurrencyDisplays();
    }

    // Display Result Overlay
    this.showResultOverlay(
      '🏆',
      'VICTORY!',
      `You vanquished ${this.currentEnemy.name} in the dungeon depths!`,
      true
    );

    this.renderCombatState();
  }

  handleDefeat() {
    this.battleEnded = true;
    this.isResolvingTurn = false;
    this.combatLog.push(`💀 DEFEAT! ${this.selectedHero.name} has fallen in battle.`);

    this.showResultOverlay(
      '💀',
      'HERO FALLEN',
      `${this.selectedHero.name} succumbed to the horrors of the catacombs.`,
      false
    );

    this.renderCombatState();
  }

  showResultOverlay(icon, title, subtitle, isVictory) {
    const overlay = document.getElementById('combat-result-overlay');
    const iconEl = document.getElementById('combat-result-icon');
    const titleEl = document.getElementById('combat-result-title');
    const subtitleEl = document.getElementById('combat-result-subtitle');
    const rewardsEl = document.getElementById('combat-result-rewards');
    const nextBtn = document.getElementById('combat-overlay-next-btn');

    if (overlay) {
      overlay.style.display = 'flex';
      if (iconEl) iconEl.textContent = icon;
      if (titleEl) {
        titleEl.textContent = title;
        titleEl.style.color = isVictory ? '#fbbf24' : '#ef4444';
      }
      if (subtitleEl) subtitleEl.textContent = subtitle;
      if (rewardsEl) rewardsEl.style.display = isVictory ? 'flex' : 'none';
      if (nextBtn) nextBtn.style.display = isVictory ? 'inline-flex' : 'none';
    }
  }

  hideResultOverlay() {
    const overlay = document.getElementById('combat-result-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  updatePhaseIndicator(text, cssClass) {
    const el = document.getElementById('combat-phase-indicator');
    if (el) {
      el.textContent = text;
      el.className = `combat-phase-indicator ${cssClass}`;
    }
  }

  spawnFloatingText(targetSide, text, color = '#fff') {
    const anchorId = targetSide === 'player' ? 'player-floating-anchor' : 'enemy-floating-anchor';
    const anchor = document.getElementById(anchorId);
    if (!anchor) return;

    const floatEl = document.createElement('div');
    floatEl.className = 'floating-combat-text';
    floatEl.textContent = text;
    floatEl.style.color = color;
    // slight random offset so multiple numbers don't overlap completely
    const offsetX = (Math.random() - 0.5) * 30;
    floatEl.style.left = `${offsetX}px`;

    anchor.appendChild(floatEl);
    setTimeout(() => {
      if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
    }, 1000);
  }

  triggerLungeAnimation(side) {
    const cardId = side === 'player' ? 'player-combat-card' : 'enemy-combat-card';
    const card = document.getElementById(cardId);
    if (card) {
      const animClass = side === 'player' ? 'anim-hero-strike' : 'anim-enemy-strike';
      card.classList.remove(animClass);
      void card.offsetWidth; // Trigger reflow
      card.classList.add(animClass);
      setTimeout(() => card.classList.remove(animClass), 450);
    }
  }

  triggerHitAnimation(side) {
    const cardId = side === 'player' ? 'player-combat-card' : 'enemy-combat-card';
    const card = document.getElementById(cardId);
    if (card) {
      card.classList.remove('anim-take-hit');
      void card.offsetWidth;
      card.classList.add('anim-take-hit');
      setTimeout(() => card.classList.remove('anim-take-hit'), 400);
    }
  }

  shakeManaBar() {
    const manaFill = document.getElementById('player-mana-fill');
    if (manaFill) {
      manaFill.style.boxShadow = '0 0 15px #ef4444';
      setTimeout(() => {
        manaFill.style.boxShadow = '';
      }, 500);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  renderCombatState() {
    // 1. Header Toolbar Pills
    const turnHeaderPill = document.getElementById('combat-turn-header-pill');
    const turnNumCol = document.getElementById('combat-turn-num');
    const deckHeaderPill = document.getElementById('combat-deck-header-pill');
    const discardHeaderPill = document.getElementById('combat-discard-header-pill');
    const handCountLabel = document.getElementById('hand-count-label');
    const deckCountLabel = document.getElementById('deck-count-label');
    const discardCountLabel = document.getElementById('discard-count-label');

    if (turnHeaderPill) turnHeaderPill.textContent = this.turn;
    if (turnNumCol) turnNumCol.textContent = this.turn;
    if (deckHeaderPill) deckHeaderPill.textContent = this.deck.length;
    if (discardHeaderPill) discardHeaderPill.textContent = this.discard.length;
    if (handCountLabel) handCountLabel.textContent = this.hand.length;
    if (deckCountLabel) deckCountLabel.textContent = this.deck.length;
    if (discardCountLabel) discardCountLabel.textContent = this.discard.length;

    // 2. Player Hero Card
    const playerHeroTitle = document.getElementById('player-hero-title');
    const playerHeroName = document.getElementById('player-hero-name');
    const playerAvatarImg = document.getElementById('player-avatar-img');
    const playerHeroAtk = document.getElementById('player-hero-atk');
    const playerHpFill = document.getElementById('player-hp-fill');
    const playerHpGhost = document.getElementById('player-hp-ghost');
    const playerHpLabel = document.getElementById('player-hp-label');
    const playerManaFill = document.getElementById('player-mana-fill');
    const playerManaLabel = document.getElementById('player-mana-label');

    if (playerHeroTitle) playerHeroTitle.textContent = this.selectedHero.title || 'Champion';
    if (playerHeroName) playerHeroName.textContent = this.selectedHero.name;
    if (playerAvatarImg && this.selectedHero.sprite) playerAvatarImg.src = this.selectedHero.sprite;
    if (playerHeroAtk) playerHeroAtk.textContent = this.player.baseAtk;

    const hpPercent = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
    if (playerHpFill) playerHpFill.style.width = `${hpPercent}%`;
    if (playerHpGhost) playerHpGhost.style.width = `${hpPercent}%`;
    if (playerHpLabel) playerHpLabel.textContent = `${this.player.hp} / ${this.player.maxHp} HP`;

    const manaPercent = Math.max(0, (this.player.mana / this.player.maxMana) * 100);
    if (playerManaFill) playerManaFill.style.width = `${manaPercent}%`;
    if (playerManaLabel) playerManaLabel.textContent = `${this.player.mana} / ${this.player.maxMana} Mana`;

    // Player Status Badges
    const badgePlayerArmor = document.getElementById('player-badge-armor');
    const badgePlayerWard = document.getElementById('player-badge-ward');
    const badgePlayerScrap = document.getElementById('player-badge-scrap');
    const badgePlayerBurn = document.getElementById('player-badge-burn');
    const badgePlayerBleed = document.getElementById('player-badge-bleed');

    if (badgePlayerArmor) {
      badgePlayerArmor.style.display = this.player.armor > 0 ? 'inline-flex' : 'none';
      badgePlayerArmor.innerHTML = `🛡️ Armor: <strong>${this.player.armor}</strong>`;
    }
    if (badgePlayerWard) {
      badgePlayerWard.style.display = this.player.ward > 0 ? 'inline-flex' : 'none';
      badgePlayerWard.innerHTML = `🔮 Ward: <strong>${this.player.ward}</strong>`;
    }
    if (badgePlayerScrap) {
      badgePlayerScrap.style.display = this.player.scrap > 0 ? 'inline-flex' : 'none';
      badgePlayerScrap.innerHTML = `⚙️ Scrap: <strong>${this.player.scrap}</strong>`;
    }
    if (badgePlayerBurn) {
      badgePlayerBurn.style.display = this.player.burn > 0 ? 'inline-flex' : 'none';
      badgePlayerBurn.innerHTML = `🔥 Burn: <strong>${this.player.burn}</strong>`;
    }
    if (badgePlayerBleed) {
      badgePlayerBleed.style.display = this.player.bleed > 0 ? 'inline-flex' : 'none';
      badgePlayerBleed.innerHTML = `🩸 Bleed: <strong>${this.player.bleed}</strong>`;
    }

    // 3. Enemy Card
    const enemyRankBadge = document.getElementById('enemy-rank-badge');
    const enemyDisplayName = document.getElementById('enemy-display-name');
    const enemyAvatarImg = document.getElementById('enemy-avatar-img');
    const enemyIntentVal = document.getElementById('enemy-intent-val');
    const enemyHpFill = document.getElementById('enemy-hp-fill');
    const enemyHpGhost = document.getElementById('enemy-hp-ghost');
    const enemyHpLabel = document.getElementById('enemy-hp-label');
    const enemyDefenseSummary = document.getElementById('enemy-defense-summary');

    if (enemyRankBadge) {
      enemyRankBadge.textContent = this.currentEnemy.rank || 'Foe';
      enemyRankBadge.className = `entity-role-tag ${this.currentEnemy.rank === 'Act Boss' ? 'rank-boss' : 'rank-normal'}`;
    }
    if (enemyDisplayName) enemyDisplayName.textContent = this.currentEnemy.name;
    if (enemyAvatarImg && this.currentEnemy.sprite) enemyAvatarImg.src = this.currentEnemy.sprite;
    if (enemyIntentVal) {
      enemyIntentVal.textContent = this.currentEnemy.isStunned 
        ? '⚡ Stunned (Action Skipped)'
        : (this.currentEnemy.intent || `Strikes for ${this.currentEnemy.atk} DMG`);
    }

    const enemyHpPercent = Math.max(0, (this.currentEnemy.hp / this.currentEnemy.maxHp) * 100);
    if (enemyHpFill) enemyHpFill.style.width = `${enemyHpPercent}%`;
    if (enemyHpGhost) enemyHpGhost.style.width = `${enemyHpPercent}%`;
    if (enemyHpLabel) enemyHpLabel.textContent = `${this.currentEnemy.hp} / ${this.currentEnemy.maxHp} HP`;
    if (enemyDefenseSummary) enemyDefenseSummary.textContent = `Armor: ${this.currentEnemy.armor} | Ward: ${this.currentEnemy.ward}`;

    // Enemy Status Badges
    const badgeEnemyArmor = document.getElementById('enemy-badge-armor');
    const badgeEnemyWard = document.getElementById('enemy-badge-ward');
    const badgeEnemyBurn = document.getElementById('enemy-badge-burn');
    const badgeEnemyBleed = document.getElementById('enemy-badge-bleed');
    const badgeEnemyPoison = document.getElementById('enemy-badge-poison');
    const badgeEnemyStun = document.getElementById('enemy-badge-stun');

    if (badgeEnemyArmor) {
      badgeEnemyArmor.style.display = this.currentEnemy.armor > 0 ? 'inline-flex' : 'none';
      badgeEnemyArmor.innerHTML = `🛡️ Armor: <strong>${this.currentEnemy.armor}</strong>`;
    }
    if (badgeEnemyWard) {
      badgeEnemyWard.style.display = this.currentEnemy.ward > 0 ? 'inline-flex' : 'none';
      badgeEnemyWard.innerHTML = `🔮 Ward: <strong>${this.currentEnemy.ward}</strong>`;
    }
    if (badgeEnemyBurn) {
      badgeEnemyBurn.style.display = this.currentEnemy.burn > 0 ? 'inline-flex' : 'none';
      badgeEnemyBurn.innerHTML = `🔥 Burn: <strong>${this.currentEnemy.burn}</strong>`;
    }
    if (badgeEnemyBleed) {
      badgeEnemyBleed.style.display = this.currentEnemy.bleed > 0 ? 'inline-flex' : 'none';
      badgeEnemyBleed.innerHTML = `🩸 Bleed: <strong>${this.currentEnemy.bleed}</strong>`;
    }
    if (badgeEnemyPoison) {
      badgeEnemyPoison.style.display = this.currentEnemy.poison > 0 ? 'inline-flex' : 'none';
      badgeEnemyPoison.innerHTML = `☠️ Poison: <strong>${this.currentEnemy.poison}</strong>`;
    }
    if (badgeEnemyStun) {
      badgeEnemyStun.style.display = this.currentEnemy.isStunned ? 'inline-flex' : 'none';
    }

    // 4. Hand Shelf with Affordability Styling
    const handContainer = document.getElementById('combat-hand-cards');
    if (handContainer) {
      handContainer.innerHTML = this.hand.map((card, idx) => {
        const canAfford = this.player.mana >= card.cost;
        const cardHTML = window.compendium ? window.compendium.generateCardHTML(card, false) : `<div>${card.name}</div>`;
        return `
          <div class="combat-card-playable ${canAfford ? 'can-afford' : 'cannot-afford'}" 
               data-hand-index="${idx}" 
               title="${canAfford ? 'Click to play this card' : `Requires ${card.cost} Mana (Have ${this.player.mana})`}">
            ${cardHTML}
          </div>
        `;
      }).join('');

      handContainer.querySelectorAll('.combat-card-playable.can-afford').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.dataset.handIndex, 10);
          this.playCard(idx);
        });
      });
    }

    // 5. Chronicle Log
    const logBox = document.getElementById('combat-log-box');
    if (logBox) {
      logBox.innerHTML = this.combatLog.slice(-12).map(line => {
        let style = 'color: #cbd5e1;';
        if (line.includes('⚔️ Hero Strike')) style = 'color: #fbbf24; font-weight: 700;';
        else if (line.includes('🏆 VICTORY')) style = 'color: #34d399; font-weight: 800;';
        else if (line.includes('💀 DEFEAT')) style = 'color: #ef4444; font-weight: 800;';
        else if (line.includes('💔')) style = 'color: #f87171;';
        else if (line.includes('🔥')) style = 'color: #fb923c;';
        else if (line.includes('🩸')) style = 'color: #fca5a5;';
        else if (line.includes('☠️')) style = 'color: #a3e635;';
        else if (line.includes('🛡️') || line.includes('🔮')) style = 'color: #38bdf8;';
        else if (line.includes('🌟 Round')) style = 'color: #a5b4fc; font-weight: 700; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.2rem;';
        return `<div style="${style}">${line}</div>`;
      }).join('');
      logBox.scrollTop = logBox.scrollHeight;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.combatDemo = new CombatDemo();
});
