// Decked Out - Audio Manager
// Plays authentic Godot game SFX and the official Decked Out Main Menu soundtrack
// Features millisecond-accurate cross-page persistence and audio restoration

class AudioManager {
  constructor() {
    this.sfxEnabled = true;
    this.bgmEnabled = false;
    this.volume = 0.5;
    this.bgmVolume = 0.35;
    
    // Audio clips cache (genuine Godot SFX)
    this.clips = {
      cardPlay: new Audio('assets/audio/Card_Play.mp3'),
      buttonClick: new Audio('assets/audio/Button_Click.mp3'),
      enemyHit: new Audio('assets/audio/Enemy_Hit.mp3'),
      enterShop: new Audio('assets/audio/Enter_Shop.mp3'),
      goldGain: new Audio('assets/audio/Gold_gain.mp3'),
      turnStart: new Audio('assets/audio/Turn_Start.mp3'),
      turnEnd: new Audio('assets/audio/Turn_End.mp3')
    };

    // Pre-configure clips
    Object.values(this.clips).forEach(audio => {
      audio.volume = this.volume;
      audio.preload = 'auto';
    });

    this.ctx = null;

    // Load SFX settings
    try {
      const savedSfx = localStorage.getItem('decked_sfx');
      if (savedSfx !== null) this.sfxEnabled = savedSfx === 'true';
    } catch (e) {}

    // Initialize Decked Out Main Menu BGM
    this.initBGM();
  }

  initWebAudio() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSFX(clipName) {
    if (!this.sfxEnabled) return;
    this.initWebAudio();
    const clip = this.clips[clipName];
    if (clip) {
      try {
        clip.currentTime = 0;
        clip.volume = this.volume;
        clip.play().catch(() => {});
      } catch (e) {}
    }
  }

  // Synthesized Fanfare for Legendary / Exotic Gacha pulls
  playFanfare(rarity = 'Exotic') {
    if (!this.sfxEnabled) return;
    this.initWebAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (this.lastFanfareTime && now - this.lastFanfareTime < 0.5) return;
    this.lastFanfareTime = now;

    const freqs = rarity === 'Exotic' 
      ? [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98] // C Major arpeggio
      : [440.00, 554.37, 659.25, 880.00, 1108.73];          // A Major chime

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = rarity === 'Exotic' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.25 * this.volume, now + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.0);
    });
  }

  // Pack rip tearing sound effect (with pre-cached noise buffer)
  playPackRip() {
    if (!this.sfxEnabled) return;
    this.initWebAudio();
    if (!this.ctx) return;

    if (!this.ripBuffer) {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
      this.ripBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this.ripBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.ripBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3200, this.ctx.currentTime + 0.15);
    filter.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3 * this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  /* ========================================================
     BACKGROUND MUSIC (Decked Out Main Menu Theme) & PERSISTENCE
     ======================================================== */
  initBGM() {
    this.bgm = new Audio('assets/audio/Decked_Out_Main_Menu.mp3');
    this.bgm.loop = true;
    this.bgm.volume = this.bgmVolume;
    this.bgm.preload = 'auto';

    let savedBgm = null;
    let savedTime = 0;
    let savedTimestamp = 0;

    try {
      savedBgm = localStorage.getItem('decked_bgm_enabled');
      savedTime = parseFloat(localStorage.getItem('decked_bgm_time') || '0');
      savedTimestamp = parseInt(localStorage.getItem('decked_bgm_timestamp') || '0', 10);
    } catch (e) {}

    // Default to true so game music greets players, unless explicitly muted
    this.bgmEnabled = savedBgm !== 'false';

    let targetTime = (Number.isFinite(savedTime) && savedTime > 0) ? savedTime : 0;
    if (savedTimestamp > 0 && targetTime > 0) {
      const elapsed = (Date.now() - savedTimestamp) / 1000;
      if (elapsed > 0 && elapsed < 60) {
        targetTime += elapsed;
      }
    }

    const applyTargetTime = () => {
      if (targetTime > 0) {
        if (this.bgm.duration && Number.isFinite(this.bgm.duration)) {
          this.bgm.currentTime = targetTime % this.bgm.duration;
        } else {
          this.bgm.currentTime = targetTime;
        }
      }
      if (this.bgmEnabled) {
        this.startBgmPlayback();
      }
    };

    if (this.bgm.readyState >= 1) {
      applyTargetTime();
    } else {
      this.bgm.addEventListener('loadedmetadata', applyTargetTime, { once: true });
      this.bgm.addEventListener('canplay', applyTargetTime, { once: true });
    }

    // Continuous time persistence while playing (throttled every 500ms)
    let lastSave = 0;
    this.bgm.addEventListener('timeupdate', () => {
      const now = Date.now();
      if (now - lastSave > 500 && this.bgmEnabled && !this.bgm.paused) {
        lastSave = now;
        this.saveBgmState();
      }
    });

    // Save on beforeunload / pagehide
    const saveHandler = () => this.saveBgmState();
    window.addEventListener('beforeunload', saveHandler);
    window.addEventListener('pagehide', saveHandler);
    document.addEventListener('visibilitychange', saveHandler);

    // Save when any navigation link is clicked
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href) {
        this.saveBgmState();
      }
    }, true);

    // Initial UI synchronization
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.updateBgmUi();
        this.updateSfxUi();
      });
    } else {
      this.updateBgmUi();
      this.updateSfxUi();
    }
  }

  saveBgmState() {
    if (this.bgm && !this.bgm.paused) {
      try {
        localStorage.setItem('decked_bgm_time', this.bgm.currentTime.toString());
        localStorage.setItem('decked_bgm_timestamp', Date.now().toString());
        localStorage.setItem('decked_bgm_enabled', 'true');
      } catch (e) {}
    }
  }

  startBgmPlayback() {
    this.bgmEnabled = true;
    try {
      localStorage.setItem('decked_bgm_enabled', 'true');
    } catch (e) {}

    this.updateBgmUi(true);

    const playPromise = this.bgm.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.updateBgmUi(true);
      }).catch(() => {
        // Autoplay policy prevented playback until user interaction
        this.updateBgmUi(true);
        const resumeOnGesture = () => {
          if (this.bgmEnabled && this.bgm.paused) {
            this.bgm.play().catch(() => {});
          }
          window.removeEventListener('pointerdown', resumeOnGesture);
          window.removeEventListener('keydown', resumeOnGesture);
          window.removeEventListener('click', resumeOnGesture);
          window.removeEventListener('touchstart', resumeOnGesture);
        };
        window.addEventListener('pointerdown', resumeOnGesture, { once: true });
        window.addEventListener('keydown', resumeOnGesture, { once: true });
        window.addEventListener('click', resumeOnGesture, { once: true });
        window.addEventListener('touchstart', resumeOnGesture, { once: true });
      });
    }
  }

  toggleBGM(forceState) {
    const target = forceState !== undefined ? forceState : !this.bgmEnabled;
    this.bgmEnabled = target;

    try {
      localStorage.setItem('decked_bgm_enabled', target ? 'true' : 'false');
    } catch (e) {}

    if (this.bgmEnabled) {
      this.startBgmPlayback();
    } else {
      this.bgm.pause();
      try {
        localStorage.setItem('decked_bgm_time', this.bgm.currentTime.toString());
        localStorage.setItem('decked_bgm_timestamp', Date.now().toString());
      } catch (e) {}
      this.updateBgmUi(false);
    }

    return this.bgmEnabled;
  }

  // Alias for backward compatibility
  toggleAmbient(forceState) {
    return this.toggleBGM(forceState);
  }

  updateBgmUi(isPlaying) {
    const state = isPlaying !== undefined ? isPlaying : this.bgmEnabled;
    const bgmBtn = document.getElementById('toggle-bgm-btn');
    if (bgmBtn) {
      bgmBtn.classList.toggle('playing', state);
      bgmBtn.innerHTML = state ? '🎵' : '🎼';
      bgmBtn.title = state ? 'Main Menu Music: ON (Click to mute)' : 'Main Menu Music: OFF (Click to play)';
    }
  }

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    try {
      localStorage.setItem('decked_sfx', this.sfxEnabled ? 'true' : 'false');
    } catch(e) {}
    this.updateSfxUi();
    return this.sfxEnabled;
  }

  updateSfxUi() {
    const sfxBtn = document.getElementById('toggle-sfx-btn');
    if (sfxBtn) {
      sfxBtn.innerHTML = this.sfxEnabled ? '🔊' : '🔇';
      sfxBtn.title = this.sfxEnabled ? 'Sound Effects: ON' : 'Sound Effects: OFF';
    }
  }
}

// Global singleton instance
window.audioMgr = new AudioManager();
