// Decked Out - Main Web Application Controller
// Orchestrates seamless PJAX page navigation, audio persistence, scroll spy & UI interactions

class AppController {
  constructor() {
    this.activeSection = 'hero';
    this.init();
  }

  init() {
    this.ensureNavLinks();
    this.bindNavigation();
    this.bindScrollSpy();
    this.bindAudioControls();
    this.bindWishlistButtons();
    this.setupToasts();
    this.initPjax();
  }

  ensureNavLinks() {
    // Ensure Lore tab is rendered even if the host page was served from an older browser cache
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !navLinks.querySelector('a[href="lore.html"]')) {
      const dungeonLi = Array.from(navLinks.querySelectorAll('li')).find(li => li.querySelector('a[href="dungeon.html"]'));
      const specsLi = Array.from(navLinks.querySelectorAll('li')).find(li => li.querySelector('a[href="specs.html"]'));
      const loreLi = document.createElement('li');
      const isLore = window.location.pathname.endsWith('lore.html');
      loreLi.innerHTML = `<a href="lore.html" class="nav-link${isLore ? ' active' : ''}">Lore</a>`;
      if (specsLi) {
        navLinks.insertBefore(loreLi, specsLi);
      } else if (dungeonLi && dungeonLi.nextSibling) {
        navLinks.insertBefore(loreLi, dungeonLi.nextSibling);
      } else {
        navLinks.appendChild(loreLi);
      }
    }

    const footerLinks = document.querySelector('.footer-links');
    if (footerLinks && !footerLinks.querySelector('a[href="lore.html"]')) {
      const specsA = footerLinks.querySelector('a[href="specs.html"]');
      const loreA = document.createElement('a');
      loreA.href = 'lore.html';
      loreA.textContent = 'Lore';
      if (specsA) {
        footerLinks.insertBefore(loreA, specsA);
      } else {
        footerLinks.appendChild(loreA);
      }
    }
  }

  bindNavigation() {
    // Smooth scrolling for navigation links with hash
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
      if (!mobileToggle.dataset.bound) {
        mobileToggle.dataset.bound = 'true';
        mobileToggle.addEventListener('click', () => {
          navMenu.classList.toggle('mobile-open');
        });

        // Close mobile menu on outside tap
        document.addEventListener('click', (e) => {
          if (navMenu.classList.contains('mobile-open')) {
            if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
              navMenu.classList.remove('mobile-open');
            }
          }
        });
      }
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
              } else if (link.getAttribute('href').startsWith('#')) {
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
      sfxBtn.onclick = () => {
        const enabled = window.audioMgr.toggleSFX();
        this.showToast(enabled ? '🔊 Sound Effects Enabled' : '🔇 Sound Effects Muted');
      };
    }

    const bgmBtn = document.getElementById('toggle-bgm-btn');
    if (bgmBtn && window.audioMgr) {
      bgmBtn.onclick = () => {
        const isPlaying = window.audioMgr.toggleBGM();
        this.showToast(isPlaying ? '🎵 Playing Decked Out Main Menu Theme' : '🎼 Music Paused');
      };
      window.audioMgr.updateBgmUi();
      window.audioMgr.updateSfxUi();
    }
  }

  bindWishlistButtons() {
    const steamUrl = 'https://store.steampowered.com/app/4298040/Decked_Out/';
    document.querySelectorAll('.btn-wishlist, [data-action="wishlist"]').forEach(btn => {
      if (btn.dataset.boundWishlist) return;
      btn.dataset.boundWishlist = 'true';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.audioMgr) window.audioMgr.playSFX('goldGain');
        this.showToast('⭐ Opening Decked Out on Steam...');
        window.open(steamUrl, '_blank', 'noopener,noreferrer');
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

  /* ========================================================
     SEAMLESS PJAX CLIENT-SIDE PAGE TRANSITIONS
     Maintains active audio & background music without interruption
     ======================================================== */
  initPjax() {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
      return;
    }

    window.addEventListener('popstate', () => {
      this.loadPage(window.location.href, false);
    });

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      const href = link.getAttribute('href');
      if (!href) return;

      if (href.startsWith('#')) return;

      if (link.target === '_blank' || link.hostname !== window.location.hostname) return;

      if (href.match(/\.(png|jpe?g|gif|svg|pdf|zip|mp3|wav|ogg)$/i)) return;

      const targetUrl = new URL(link.href, window.location.href);

      if (targetUrl.pathname === window.location.pathname) {
        if (targetUrl.hash) {
          const el = document.getElementById(targetUrl.hash.slice(1));
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth' });
            return;
          }
        }
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      e.preventDefault();
      if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
      this.loadPage(link.href, true);
    });
  }

  async loadPage(url, pushState = true) {
    try {
      const pageContainer = document.getElementById('page-content');
      if (!pageContainer) {
        window.location.href = url;
        return;
      }

      pageContainer.style.opacity = '0.4';
      pageContainer.style.transition = 'opacity 0.12s ease';

      const res = await fetch(url);
      if (!res.ok) {
        window.location.href = url;
        return;
      }

      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const newContent = doc.getElementById('page-content');
      if (!newContent) {
        window.location.href = url;
        return;
      }

      // Update page title
      document.title = doc.title;

      // Swap page content
      pageContainer.innerHTML = newContent.innerHTML;
      pageContainer.style.opacity = '1';

      // Sync navbar & footer if changed
      const newNav = doc.querySelector('.nav-links');
      const curNav = document.querySelector('.nav-links');
      if (newNav && curNav && newNav.innerHTML !== curNav.innerHTML) {
        curNav.innerHTML = newNav.innerHTML;
      }
      const newFooter = doc.querySelector('.footer-links');
      const curFooter = document.querySelector('.footer-links');
      if (newFooter && curFooter && newFooter.innerHTML !== curFooter.innerHTML) {
        curFooter.innerHTML = newFooter.innerHTML;
      }

      this.ensureNavLinks();

      // Update history
      if (pushState) {
        window.history.pushState({}, '', url);
      }

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Update active nav link
      this.updateNavbarActive(url);

      // Close mobile menu if open
      const navMenu = document.querySelector('.nav-links');
      if (navMenu) navMenu.classList.remove('mobile-open');

      // Re-bind base interactions
      this.bindNavigation();
      this.bindScrollSpy();
      this.bindWishlistButtons();

      // Extract current page filename
      const targetUrl = new URL(url, window.location.href);
      const pageName = targetUrl.pathname.split('/').pop() || 'index.html';

      // Initialize page-specific controllers
      await this.initPageControllers(pageName);

      // Re-sync audio buttons
      if (window.audioMgr) {
        window.audioMgr.updateBgmUi();
        window.audioMgr.updateSfxUi();
      }
    } catch (e) {
      console.warn('PJAX fetch failed, navigating normally:', e);
      window.location.href = url;
    }
  }

  updateNavbarActive(url) {
    const targetUrl = new URL(url, window.location.href);
    let pageName = targetUrl.pathname.split('/').pop() || 'index.html';
    if (!pageName || pageName === '/') pageName = 'index.html';

    document.querySelectorAll('.nav-links .nav-link').forEach(link => {
      const linkHref = link.getAttribute('href');
      if (!linkHref) return;
      const linkPage = linkHref.split('#')[0].split('/').pop() || 'index.html';
      if (linkPage === pageName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  async initPageControllers(pageName) {
    if (!pageName || pageName === '/' || pageName === 'index.html') {
      return;
    }

    if (pageName === 'cards.html') {
      if (!window.GAME_CARDS) await this.loadScript('js/data.js?v=4');
      if (!window.CompendiumManager) await this.loadScript('js/compendium.js?v=4');
      if (window.CompendiumManager) {
        window.compendium = new CompendiumManager();
      }
    } else if (pageName === 'heroes.html' || pageName === 'relics.html') {
      if (!window.GAME_HEROES) await this.loadScript('js/data.js?v=4');
      if (!window.HeroesRelicsManager) await this.loadScript('js/heroes-relics.js?v=4');
      if (window.HeroesRelicsManager) {
        window.heroesRelics = new HeroesRelicsManager();
      }
    } else if (pageName === 'deck-builder.html') {
      if (!window.GAME_CARDS) await this.loadScript('js/data.js?v=4');
      if (!window.CompendiumManager) await this.loadScript('js/compendium.js?v=4');
      if (!window.DeckBuilder) await this.loadScript('js/deck-builder.js?v=4');
      if (window.DeckBuilder) {
        window.deckBuilder = new DeckBuilder();
      }
    } else if (pageName === 'combat.html') {
      if (!window.GAME_CARDS) await this.loadScript('js/data.js?v=4');
      if (!window.CompendiumManager) await this.loadScript('js/compendium.js?v=4');
      if (!window.CombatDemo) await this.loadScript('js/combat-demo.js?v=4');
      if (window.CombatDemo) {
        window.combatDemo = new CombatDemo();
      }
    } else if (pageName === 'dungeon.html') {
      if (!window.DUNGEON_DATA) await this.loadScript('js/data.js?v=4');
      if (!window.DungeonMapManager) await this.loadScript('js/dungeon-map.js?v=4');
      if (window.DungeonMapManager) {
        window.dungeonMap = new DungeonMapManager();
      }
    } else if (pageName === 'lore.html') {
      const pills = document.querySelectorAll('.lore-nav-pill');
      pills.forEach(pill => {
        pill.addEventListener('click', () => {
          if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
          pills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
        });
      });
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const cleanSrc = src.split('?')[0];
      const existing = document.querySelector(`script[src*="${cleanSrc}"]`);
      if (existing) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = (err) => reject(err);
      document.body.appendChild(s);
    });
  }
}

window.showToast = (msg, type) => {
  if (window.appController) window.appController.showToast(msg, type);
};

window.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
});
