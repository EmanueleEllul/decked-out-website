// Decked Out - Interactive Obsidian Wiki & Game Guide Viewer
// Renders all 38 Obsidian notes with markdown tables, wikilinks, callouts & instant documentation search

class WikiViewer {
  constructor() {
    this.wikiData = window.OBSIDIAN_WIKI || [];
    this.activeArticle = null;
    this.allArticles = [];

    // Flatten all articles
    this.wikiData.forEach(cat => {
      cat.articles.forEach(art => {
        this.allArticles.push({ ...art, categoryName: cat.category });
      });
    });

    this.init();
  }

  init() {
    this.renderCategorySidebar();
    this.bindEvents();

    // Load first article by default (Game Overview)
    if (this.allArticles.length > 0) {
      this.displayArticle(this.allArticles[0].id);
    }
  }

  bindEvents() {
    const searchInput = document.getElementById('wiki-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        this.filterWikiArticles(query);
      });
    }
  }

  renderCategorySidebar() {
    const sidebar = document.getElementById('wiki-sidebar-categories');
    if (!sidebar) return;

    sidebar.innerHTML = this.wikiData.map(cat => `
      <div class="wiki-cat-group" style="margin-bottom: 1.5rem;">
        <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-faint); letter-spacing: 0.08em; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
          <span>${cat.icon}</span>
          <span>${cat.category}</span>
        </h4>
        <div style="display: flex; flex-direction: column; gap: 0.2rem;">
          ${cat.articles.map(art => `
            <button class="wiki-art-link ${this.activeArticle?.id === art.id ? 'active' : ''}" data-article-id="${art.id}" style="background: transparent; border: none; text-align: left; padding: 0.4rem 0.6rem; border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--text-muted); cursor: pointer; transition: all 0.2s ease;">
              ${art.title}
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');

    sidebar.querySelectorAll('.wiki-art-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.articleId;
        window.audioMgr.playSFX('buttonClick');
        this.displayArticle(id);
      });
    });
  }

  filterWikiArticles(query) {
    const sidebar = document.getElementById('wiki-sidebar-categories');
    if (!sidebar) return;

    if (!query) {
      this.renderCategorySidebar();
      return;
    }

    const matches = this.allArticles.filter(art => 
      art.title.toLowerCase().includes(query) || 
      art.content.toLowerCase().includes(query)
    );

    sidebar.innerHTML = `
      <div style="margin-bottom: 1rem;">
        <span style="font-size: 0.78rem; color: var(--text-faint);">Found ${matches.length} articles matching "${query}"</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.25rem;">
        ${matches.map(art => `
          <button class="wiki-art-link" data-article-id="${art.id}" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); text-align: left; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.85rem; color: #fff; cursor: pointer;">
            <strong>${art.title}</strong>
            <span style="display: block; font-size: 0.72rem; color: var(--text-muted);">${art.categoryName}</span>
          </button>
        `).join('')}
      </div>
    `;

    sidebar.querySelectorAll('.wiki-art-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.articleId;
        window.audioMgr.playSFX('buttonClick');
        this.displayArticle(id);
      });
    });
  }

  displayArticle(articleId) {
    const art = this.allArticles.find(a => a.id === articleId);
    if (!art) return;

    this.activeArticle = art;

    // Highlight active link in sidebar
    document.querySelectorAll('.wiki-art-link').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.articleId === articleId);
      if (btn.classList.contains('active')) {
        btn.style.color = '#fbbf24';
        btn.style.background = 'rgba(245, 158, 11, 0.15)';
      } else {
        btn.style.color = 'var(--text-muted)';
        btn.style.background = 'transparent';
      }
    });

    const display = document.getElementById('wiki-article-display');
    if (!display) return;

    const renderedHTML = this.parseMarkdown(art.content);

    display.innerHTML = `
      <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 2rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; font-size: 0.8rem; color: var(--primary);">
          <span>${art.icon || '📄'}</span>
          <span style="text-transform: uppercase; font-weight: 700; letter-spacing: 0.08em;">${art.categoryName}</span>
          ${art.tags && art.tags.length ? `• <span style="color: var(--text-faint);">${art.tags.map(t => '#' + t).join(' ')}</span>` : ''}
        </div>
        <div class="wiki-content-rendered" style="line-height: 1.7; color: #cbd5e1;">
          ${renderedHTML}
        </div>
      </div>
    `;

    // Connect internal wikilinks
    display.querySelectorAll('.wiki-internal-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTitle = link.dataset.target.toLowerCase();
        const target = this.allArticles.find(a => 
          a.title.toLowerCase() === targetTitle || 
          a.title.toLowerCase().includes(targetTitle)
        );
        if (target) {
          window.audioMgr.playSFX('buttonClick');
          this.displayArticle(target.id);
        }
      });
    });
  }

  parseMarkdown(md) {
    let html = md;

    // Callouts [!NOTE], [!CAUTION], [!TIP], [!IMPORTANT], [!WARNING]
    html = html.replace(/>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*?)(?=(?:\n\n|\n[^\s>]|$))/gi, (m, type, content) => {
      const colors = {
        'NOTE': '#38bdf8',
        'TIP': '#4ade80',
        'IMPORTANT': '#fbbf24',
        'WARNING': '#f97316',
        'CAUTION': '#ef4444'
      };
      const c = colors[type.toUpperCase()] || '#38bdf8';
      return `<div style="border-left: 4px solid ${c}; background: ${c}15; padding: 0.85rem 1.25rem; border-radius: 4px; margin: 1.25rem 0;">
        <strong style="color: ${c}; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.25rem;">${type}</strong>
        <div style="font-size: 0.9rem; color: #e2e8f0;">${content.replace(/>\s*/g, '')}</div>
      </div>`;
    });

    // Code blocks
    html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre style="background: #090c12; border: 1px solid var(--border-subtle); padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 1.25rem 0; font-family: var(--font-mono); font-size: 0.85rem; color: #e2e8f0;"><code>$2</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 0.15rem 0.4rem; border-radius: 4px; font-family: var(--font-mono); font-size: 0.85em; color: #fcd34d;">$1</code>');

    // Wikilinks [[Page Name|Label]] or [[Page Name]]
    html = html.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, target, label) => {
      const text = label || target;
      return `<a href="#" class="wiki-internal-link" data-target="${target}" style="color: #38bdf8; text-decoration: underline; text-underline-offset: 3px; font-weight: 600;">${text}</a>`;
    });

    // Headers
    html = html.replace(/^# (.*$)/gim, '<h1 style="font-size: 1.85rem; color: #fff; margin: 1.5rem 0 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 1.45rem; color: #fff; margin: 1.5rem 0 0.75rem;">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 1.15rem; color: #fcd34d; margin: 1.25rem 0 0.5rem;">$1</h3>');

    // Markdown tables
    html = html.replace(/\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/g, (match, headerLine, bodyLines) => {
      const headers = headerLine.split('|').map(h => h.trim()).filter(h => h.length > 0);
      const rows = bodyLines.trim().split('\n').map(line => {
        return line.split('|').map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
      });

      return `
        <div style="overflow-x: auto; margin: 1.5rem 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left;">
            <thead>
              <tr style="background: rgba(255, 255, 255, 0.05); border-bottom: 2px solid var(--border-strong);">
                ${headers.map(h => `<th style="padding: 0.65rem 0.85rem; color: #fff; font-weight: 700;">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  ${r.map(cell => `<td style="padding: 0.55rem 0.85rem; color: #cbd5e1;">${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    });

    // Unordered lists
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li style="margin-left: 1.5rem; margin-bottom: 0.35rem;">$1</li>');

    // Bold & italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #fff; font-weight: 700;">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em style="color: #e2e8f0;">$1</em>');

    // Paragraphs
    html = html.split('\n\n').map(para => {
      if (para.startsWith('<') || para.trim().startsWith('<h') || para.trim().startsWith('<pre') || para.trim().startsWith('<div') || para.trim().startsWith('<table') || para.trim().startsWith('<li')) {
        return para;
      }
      return `<p style="margin-bottom: 1rem;">${para.trim()}</p>`;
    }).join('\n');

    return html;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.wikiViewer = new WikiViewer();
});
