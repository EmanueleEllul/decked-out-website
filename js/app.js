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
    this.updateNavbarActive(window.location.href);

    // Initialize controller for the active page on first load / direct access
    const pageName = window.location.pathname.split('/').pop() || 'index.html';
    this.initPageControllers(pageName);
  }

  ensureNavLinks() {
    // Legacy cache check: if page doesn't have events link in footer, add it
    const footerLinks = document.querySelector('.footer-links');
    if (footerLinks && !footerLinks.querySelector('a[href="events.html"]')) {
      const specsA = footerLinks.querySelector('a[href="specs.html"]');
      const eventsA = document.createElement('a');
      eventsA.href = 'events.html';
      eventsA.textContent = "Where's Next";
      if (specsA) {
        footerLinks.insertBefore(eventsA, specsA);
      } else {
        footerLinks.appendChild(eventsA);
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
        
        const closeMobileNav = () => {
          if (navMenu.classList.contains('mobile-open')) {
            navMenu.classList.remove('mobile-open');
            mobileToggle.textContent = '☰';
            mobileToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('nav-locked');
          }
        };

        const openMobileNav = () => {
          navMenu.classList.add('mobile-open');
          mobileToggle.textContent = '✕';
          mobileToggle.setAttribute('aria-expanded', 'true');
          document.body.classList.add('nav-locked');
        };

        mobileToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
          if (navMenu.classList.contains('mobile-open')) {
            closeMobileNav();
          } else {
            openMobileNav();
          }
        });

        // Close mobile menu on outside tap
        document.addEventListener('click', (e) => {
          if (navMenu.classList.contains('mobile-open')) {
            if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
              closeMobileNav();
            }
          }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            closeMobileNav();
          }
        });
      }
    }

    // Close mobile menu when clicking any dropdown item or direct nav-link
    document.querySelectorAll('.dropdown-item, .nav-link:not(.nav-dropdown-toggle)').forEach(item => {
      item.addEventListener('click', () => {
        const navMenu = document.querySelector('.nav-links');
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        if (navMenu && navMenu.classList.contains('mobile-open')) {
          navMenu.classList.remove('mobile-open');
          if (mobileToggle) mobileToggle.textContent = '☰';
          document.body.classList.remove('nav-locked');
        }
      });
    });
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
      container.className = 'toast-container-global';
      document.body.appendChild(container);
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-pill ${type}`;
    toast.style.cssText = 'background: #0d121c; border: 2px solid var(--primary, #f59e0b); color: #fff; padding: 8px 14px; border-radius: 0; font-family: var(--font-pixel, monospace); font-size: 0.62rem; font-weight: 600; letter-spacing: 0.04em; box-shadow: inset 1px 1px 0 rgba(255,255,255,0.1), 4px 4px 0 #000; animation: toastFadeIn 0.2s ease; pointer-events: auto;';
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

      // Ensure target stylesheets are loaded
      doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && !document.querySelector(`link[href="${href}"]`)) {
          const l = document.createElement('link');
          l.rel = 'stylesheet';
          l.href = href;
          document.head.appendChild(l);
        }
      });

      // Swap page content
      pageContainer.innerHTML = newContent.innerHTML;
      pageContainer.style.opacity = '1';

      // Execute any inline scripts in doc (e.g. initLoreApp)
      doc.querySelectorAll('script:not([src])').forEach(inlineScript => {
        try {
          const s = document.createElement('script');
          s.textContent = inlineScript.textContent;
          document.body.appendChild(s);
          s.remove();
        } catch (scriptErr) {
          console.warn('Inline script execution warning:', scriptErr);
        }
      });

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
      const mobileToggle = document.getElementById('mobile-menu-toggle');
      if (navMenu) navMenu.classList.remove('mobile-open');
      if (mobileToggle) {
        mobileToggle.textContent = '☰';
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
      document.body.classList.remove('nav-locked');

      // Re-bind base interactions
      this.bindNavigation();
      this.bindScrollSpy();
      this.bindWishlistButtons();

      // Extract current page filename
      const targetUrl = new URL(url, window.location.href);
      const pageName = targetUrl.pathname.split('/').pop() || 'index.html';

      // Clear stale page-specific controller instances before re-initializing
      window.compendium = null;
      window.heroesRelics = null;
      window.deckBuilder = null;
      window.combatDemo = null;
      window.dungeonMap = null;

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

    // Clear all active classes
    document.querySelectorAll('.nav-links .nav-link, .nav-dropdown-menu .dropdown-item').forEach(link => {
      link.classList.remove('active');
    });
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
      dropdown.classList.remove('active');
    });

    // Check dropdown items first
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
      let hasActiveChild = false;
      dropdown.querySelectorAll('.dropdown-item').forEach(item => {
        const itemHref = item.getAttribute('href');
        if (!itemHref) return;
        const itemPage = itemHref.split('#')[0].split('/').pop() || 'index.html';
        if (itemPage === pageName) {
          item.classList.add('active');
          hasActiveChild = true;
        }
      });
      if (hasActiveChild) {
        dropdown.classList.add('active');
        const toggle = dropdown.querySelector('.nav-dropdown-toggle');
        if (toggle) toggle.classList.add('active');
      }
    });

    // Check top-level nav links
    document.querySelectorAll('.nav-links > li > .nav-link:not(.nav-dropdown-toggle)').forEach(link => {
      const linkHref = link.getAttribute('href');
      if (!linkHref) return;
      const linkPage = linkHref.split('#')[0].split('/').pop() || 'index.html';
      if (linkPage === pageName) {
        link.classList.add('active');
      }
    });
  }

  async initPageControllers(pageName) {
    const cleanPage = (pageName || 'index.html').split('?')[0].split('#')[0];

    if (!cleanPage || cleanPage === 'index.html') {
      if (!window.GAME_CARDS || !window.GAME_HEROES || !window.GAME_RELICS || !window.GAME_ACTS) {
        await this.loadScript('js/data.js?v=44');
      }
      this.initHomePage();
      return;
    }

    if (cleanPage === 'cards.html') {
      if (!window.GAME_CARDS) await this.loadScript('js/data.js?v=44', () => !!window.GAME_CARDS);
      if (!window.CompendiumManager && typeof CompendiumManager === 'undefined') {
        await this.loadScript('js/compendium.js?v=44', () => !!window.CompendiumManager);
      }
      // Only create a new instance during PJAX navigation (not on fresh page load where
      // compendium.js self-initializes via its own DOMContentLoaded handler)
      if (!window.compendium || !document.getElementById('cards-display-grid')?.children.length) {
        const CompendiumClass = window.CompendiumManager || (typeof CompendiumManager !== 'undefined' ? CompendiumManager : null);
        if (CompendiumClass) {
          window.compendium = new CompendiumClass();
        }
      }
    } else if (cleanPage === 'heroes.html') {
      if (!window.GAME_HEROES) await this.loadScript('js/data.js?v=44', () => !!window.GAME_HEROES);
      if (!window.HeroesRelicsManager && typeof HeroesRelicsManager === 'undefined') {
        await this.loadScript('js/heroes-relics.js?v=44', () => !!window.HeroesRelicsManager);
      }
      if (!window.heroesRelics || !document.querySelector('.heroes-grid')?.children.length) {
        const HeroesClass = window.HeroesRelicsManager || (typeof HeroesRelicsManager !== 'undefined' ? HeroesRelicsManager : null);
        if (HeroesClass) window.heroesRelics = new HeroesClass();
      }
    } else if (cleanPage === 'relics.html') {
      if (!window.GAME_RELICS) await this.loadScript('js/data.js?v=44', () => !!window.GAME_RELICS);
      if (!window.HeroesRelicsManager && typeof HeroesRelicsManager === 'undefined') {
        await this.loadScript('js/heroes-relics.js?v=44', () => !!window.HeroesRelicsManager);
      }
      if (!window.heroesRelics || !document.querySelector('.relics-grid')?.children.length) {
        const HeroesClass = window.HeroesRelicsManager || (typeof HeroesRelicsManager !== 'undefined' ? HeroesRelicsManager : null);
        if (HeroesClass) window.heroesRelics = new HeroesClass();
      }
    } else if (cleanPage === 'deck-builder.html') {
      if (!window.GAME_CARDS) await this.loadScript('js/data.js?v=44', () => !!window.GAME_CARDS);
      if (!window.CompendiumManager && typeof CompendiumManager === 'undefined') {
        await this.loadScript('js/compendium.js?v=44', () => !!window.CompendiumManager);
      }
      if (!window.DeckBuilder && typeof DeckBuilder === 'undefined') {
        await this.loadScript('js/deck-builder.js?v=44', () => !!window.DeckBuilder);
      }
      if (!window.deckBuilder) {
        const BuilderClass = window.DeckBuilder || (typeof DeckBuilder !== 'undefined' ? DeckBuilder : null);
        if (BuilderClass) window.deckBuilder = new BuilderClass();
      }
    } else if (cleanPage === 'combat.html') {
      if (!window.GAME_CARDS) await this.loadScript('js/data.js?v=44', () => !!window.GAME_CARDS);
      if (!window.CompendiumManager && typeof CompendiumManager === 'undefined') {
        await this.loadScript('js/compendium.js?v=44', () => !!window.CompendiumManager);
      }
      if (!window.CombatDemo && typeof CombatDemo === 'undefined') {
        await this.loadScript('js/combat-demo.js?v=44', () => !!window.CombatDemo);
      }
      if (!window.combatDemo) {
        const CombatClass = window.CombatDemo || (typeof CombatDemo !== 'undefined' ? CombatDemo : null);
        if (CombatClass) window.combatDemo = new CombatClass();
      }
    } else if (cleanPage === 'dungeon.html') {
      if (!window.GAME_ACTS || !window.MYSTERY_EVENTS) await this.loadScript('js/data.js?v=44', () => !!(window.GAME_ACTS && window.MYSTERY_EVENTS));
      if (!window.DungeonMapManager && typeof DungeonMapManager === 'undefined') {
        await this.loadScript('js/dungeon-map.js?v=44', () => !!window.DungeonMapManager);
      }
      if (!window.dungeonMap) {
        const DungeonClass = window.DungeonMapManager || (typeof DungeonMapManager !== 'undefined' ? DungeonMapManager : null);
        if (DungeonClass) window.dungeonMap = new DungeonClass();
      }
    } else if (cleanPage === 'lore.html') {
      const pills = document.querySelectorAll('.lore-nav-pill');
      pills.forEach(pill => {
        pill.addEventListener('click', () => {
          if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
          pills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
        });
      });
      if (window.initLoreApp) {
        window.initLoreApp();
      }
    } else if (cleanPage === 'events.html') {
      this.initEventsPage();
    }
  }

  initEventsPage() {
    const filterButtons = document.querySelectorAll('.event-filter-btn');
    const eventCards = document.querySelectorAll('.event-entry-card');

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter || 'all';
        eventCards.forEach(card => {
          if (filter === 'all') {
            card.style.display = 'block';
          } else if (card.classList.contains(`${filter}-event`)) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });

    const copyBtn = document.getElementById('copy-discord-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
        const inviteUrl = 'https://discord.gg/aCPVFSYCFf';
        try {
          await navigator.clipboard.writeText(inviteUrl);
          this.showToast('Discord invite link copied to clipboard!');
        } catch (err) {
          const tempInput = document.createElement('input');
          tempInput.value = inviteUrl;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
          this.showToast('Discord invite link copied to clipboard!');
        }
      });
    }
  }

  initHomePage() {
    this.updateDynamicStats();
  }

  updateDynamicStats() {
    const cardsCount = (window.GAME_CARDS && window.GAME_CARDS.length) ? window.GAME_CARDS.length : 62;
    const heroesCount = (window.GAME_HEROES && window.GAME_HEROES.length) ? window.GAME_HEROES.length : 7;
    const relicsCount = (window.GAME_RELICS && window.GAME_RELICS.length) ? window.GAME_RELICS.length : 9;
    const actsCount = (window.GAME_ACTS && window.GAME_ACTS.length) ? window.GAME_ACTS.length : 3;

    // Hero CTA button: Explore X Cards
    const heroCardCount = document.getElementById('hero-card-count');
    if (heroCardCount) {
      heroCardCount.textContent = cardsCount;
    }

    // Hero Subtitle: lead X unique heroes to victory
    const heroCountSubtitle = document.getElementById('hero-count-subtitle');
    if (heroCountSubtitle) {
      heroCountSubtitle.textContent = heroesCount;
    }

    // Hero Pillar: X Asymmetric Champions
    const heroPillarCount = document.getElementById('hero-pillar-count');
    if (heroPillarCount) {
      heroPillarCount.textContent = heroesCount;
    }

    // Act Pillar: Branching X-Act Descent
    const actPillarCount = document.getElementById('act-pillar-count');
    if (actPillarCount) {
      actPillarCount.textContent = actsCount;
    }

    // Relic Pillar: Pair elemental combos with X ancient relics
    const relicPillarCount = document.getElementById('relic-pillar-count');
    if (relicPillarCount) {
      relicPillarCount.textContent = relicsCount;
    }
  }

  loadScript(src, readyCheck = null) {
    return new Promise((resolve, reject) => {
      const cleanSrc = src.split('?')[0];
      const existing = document.querySelector(`script[src*="${cleanSrc}"]`);

      const waitForReady = () => {
        if (!readyCheck) { resolve(); return; }
        let attempts = 0;
        const poll = () => {
          if (readyCheck()) { resolve(); return; }
          if (++attempts > 100) { resolve(); return; }
          setTimeout(poll, 100);
        };
        poll();
      };

      if (existing) {
        if (existing.dataset.loaded === 'true') {
          waitForReady();
          return;
        }
        existing.addEventListener('load', () => { existing.dataset.loaded = 'true'; waitForReady(); }, { once: true });
        existing.addEventListener('error', (err) => reject(err), { once: true });
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => {
        s.dataset.loaded = 'true';
        waitForReady();
      };
      s.onerror = (err) => reject(err);
      document.body.appendChild(s);
    });
  }
}

if (typeof window !== 'undefined') {
  window.AppController = AppController;
}

window.showToast = (msg, type) => {
  if (window.appController) window.appController.showToast(msg, type);
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      window.appController = new AppController();
    });
  } else {
    window.appController = new AppController();
  }
}
