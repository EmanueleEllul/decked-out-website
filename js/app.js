// Decked Out - Main Web Application Controller
// Orchestrates smooth page navigation, scroll spy, ambient audio & UI interactions

class AppController {
  constructor() {
    this.activeSection = 'hero';
    this.init();
  }

  init() {
    this.bindNavigation();
    this.bindScrollSpy();
    this.bindAudioControls();
    this.bindWishlistButtons();
    this.setupToasts();
  }

  bindNavigation() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href').replace('#', '');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          e.preventDefault();
          if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
          
          const headerOffset = 70;
          const elementPosition = targetEl.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Close mobile menu if open
          const navMenu = document.querySelector('.nav-links');
          if (navMenu && navMenu.classList.contains('mobile-open')) {
            navMenu.classList.remove('mobile-open');
          }
        }
      });
    });

    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-links');
    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('mobile-open');
      });
    }
  }

  bindScrollSpy() {
    const sections = document.querySelectorAll('section[id], header[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    if ('IntersectionObserver' in window && sections.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(link => {
              if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });
          }
        });
      }, {
        rootMargin: '-20% 0px -70% 0px'
      });

      sections.forEach(s => observer.observe(s));
    }
  }

  bindAudioControls() {
    const sfxBtn = document.getElementById('toggle-sfx-btn');
    if (sfxBtn && window.audioMgr) {
      sfxBtn.addEventListener('click', () => {
        const enabled = window.audioMgr.toggleSFX();
        sfxBtn.innerHTML = enabled ? '🔊' : '🔇';
        sfxBtn.title = enabled ? 'Sound Effects: ON' : 'Sound Effects: OFF';
        this.showToast(enabled ? '🔊 SFX Enabled' : '🔇 SFX Muted');
      });
    }

    const bgmBtn = document.getElementById('toggle-bgm-btn');
    if (bgmBtn && window.audioMgr) {
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

  bindWishlistButtons() {
    document.querySelectorAll('.btn-wishlist, [data-action="wishlist"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.audioMgr) window.audioMgr.playSFX('goldGain');
        this.showToast('⭐ Opening Decked Out on Steam...');
      });
    });
  }

  setupToasts() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;';
      document.body.appendChild(container);
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-pill ${type}`;
    toast.style.cssText = 'background: rgba(15, 23, 42, 0.95); border: 1px solid var(--border-glow, #f59e0b); color: #fff; padding: 10px 18px; border-radius: 9999px; font-size: 0.88rem; font-weight: 600; box-shadow: 0 10px 25px rgba(0,0,0,0.5); backdrop-filter: blur(8px); animation: toastFadeIn 0.3s ease; pointer-events: auto;';
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

window.showToast = (msg, type) => {
  if (window.appController) window.appController.showToast(msg, type);
};

window.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
});
