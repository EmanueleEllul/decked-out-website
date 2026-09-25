// Decked Out - Main Web Application Controller
// Orchestrates tab switching, global sound toggles, and toast alerts

class AppController {
  constructor() {
    this.activeTab = 'compendium';
    this.init();
  }

  init() {
    this.bindNavigation();
    this.bindAudioControls();
    this.setupToasts();
    
    // Check URL hash for direct tab linking (e.g. #packs, #deckbuilder, #combat)
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`tab-${hash}`)) {
      this.switchTab(hash);
    }
  }

  bindNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab) {
          window.audioMgr.playSFX('buttonClick');
          this.switchTab(tab);
        }
      });
    });

    // Quick jump action buttons in hero banner or links
    document.querySelectorAll('[data-jump-tab]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = el.dataset.jumpTab;
        if (tab) {
          window.audioMgr.playSFX('buttonClick');
          this.switchTab(tab);
          const target = document.getElementById(`tab-${tab}`);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }

  switchTab(tabName) {
    const panes = document.querySelectorAll('.tab-pane');
    panes.forEach(p => p.classList.remove('active'));

    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(b => b.classList.remove('active'));

    const targetPane = document.getElementById(`tab-${tabName}`);
    const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);

    if (targetPane) targetPane.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');

    this.activeTab = tabName;
    window.location.hash = tabName;
  }

  bindAudioControls() {
    const sfxBtn = document.getElementById('toggle-sfx-btn');
    if (sfxBtn) {
      sfxBtn.addEventListener('click', () => {
        const enabled = window.audioMgr.toggleSFX();
        sfxBtn.innerHTML = enabled ? '🔊' : '🔇';
        sfxBtn.title = enabled ? 'Sound Effects: ON' : 'Sound Effects: OFF';
        this.showToast(enabled ? '🔊 SFX Enabled' : '🔇 SFX Muted');
      });
    }

    const bgmBtn = document.getElementById('toggle-bgm-btn');
    if (bgmBtn) {
      bgmBtn.addEventListener('click', () => {
        window.audioMgr.toggleAmbient();
        const isPlaying = window.audioMgr.bgmEnabled;
        bgmBtn.classList.toggle('playing', isPlaying);
        bgmBtn.innerHTML = isPlaying ? '🎵' : '🎼';
        bgmBtn.title = isPlaying ? 'Ambient Music: ON' : 'Ambient Music: OFF';
        this.showToast(isPlaying ? '🎵 Ambient Soundscape Started' : '🎼 Ambient Soundscape Stopped');
      });
    }
  }

  setupToasts() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    window.showToast = (message, type = 'info') => {
      this.showToast(message, type);
    };
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'warning' ? '⚠️' : '✨';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
});
