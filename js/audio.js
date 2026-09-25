// Decked Out - Audio Manager
// Plays genuine Godot game SFX and rich procedural synthesized audio

class AudioManager {
  constructor() {
    this.sfxEnabled = true;
    this.bgmEnabled = false;
    this.volume = 0.5;
    
    // Audio clips cache
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
    this.ambientOsc = null;
    this.ambientGain = null;

    // Load user settings
    try {
      const savedSfx = localStorage.getItem('decked_sfx');
      if (savedSfx !== null) this.sfxEnabled = savedSfx === 'true';
    } catch (e) {}
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

  // Ambient Dark Fantasy Synth Drone
  toggleAmbient(forceState) {
    this.initWebAudio();
    if (!this.ctx) return;

    const target = forceState !== undefined ? forceState : !this.bgmEnabled;
    this.bgmEnabled = target;

    if (this.bgmEnabled) {
      if (this.ambientOsc) return;
      const now = this.ctx.currentTime;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, now);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.12 * this.volume, now + 2);

      // Dual detuned oscillators for atmospheric dungeon mystery
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, now); // A2

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(165, now); // E3

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      this.ambientOsc = [osc1, osc2];
    } else {
      if (this.ambientGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.ambientGain.gain.exponentialRampToValueAtTime(0.001, now + 1);
        setTimeout(() => {
          if (this.ambientOsc) {
            this.ambientOsc.forEach(o => { try { o.stop(); } catch(e){} });
            this.ambientOsc = null;
          }
        }, 1100);
      }
    }
  }

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    try {
      localStorage.setItem('decked_sfx', this.sfxEnabled);
    } catch(e) {}
    return this.sfxEnabled;
  }
}

// Global instance
window.audioMgr = new AudioManager();
