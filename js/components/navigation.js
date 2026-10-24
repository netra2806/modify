import { MOODS } from '../data/moods.js';
import { storage } from '../services/storage.js';

export class Navigation {
  constructor(sidebarEl, mobileNavEl, onNavigate, onSelectMoodShortcut) {
    this.sidebarEl = sidebarEl;
    this.mobileNavEl = mobileNavEl;
    this.onNavigate = onNavigate;
    this.onSelectMoodShortcut = onSelectMoodShortcut;
    this.activeTab = 'home'; // 'home' | 'moods' | 'mix' | 'favourites'

    this.render();
    this.updateFavCount();

    window.addEventListener('modify:favourites-changed', () => {
      this.updateFavCount();
    });
  }

  setActiveTab(tab) {
    this.activeTab = tab;
    this.updateActiveClasses();
  }

  updateFavCount() {
    const favCount = storage.getFavourites().length;
    const badgeEls = document.querySelectorAll('.fav-count-badge');
    badgeEls.forEach(badge => {
      badge.textContent = favCount;
      badge.style.display = favCount > 0 ? 'inline-block' : 'none';
    });
  }

  updateActiveClasses() {
    // Sidebar items
    if (this.sidebarEl) {
      this.sidebarEl.querySelectorAll('.nav-item').forEach(btn => {
        const tab = btn.getAttribute('data-tab');
        btn.classList.toggle('active', tab === this.activeTab);
      });
    }

    // Mobile nav items
    if (this.mobileNavEl) {
      this.mobileNavEl.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        const tab = btn.getAttribute('data-tab');
        btn.classList.toggle('active', tab === this.activeTab);
      });
    }
  }

  render() {
    // Sidebar content
    if (this.sidebarEl) {
      this.sidebarEl.innerHTML = `
        <div class="brand-container">
          <div class="brand-logo-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#101114" stroke-width="2.5" stroke-linecap="round">
              <path d="M2 12h2M6 8v8M10 4v16M14 7v10M18 10v4M22 12h-2"></path>
            </svg>
          </div>
          <div class="brand-text-wrap">
            <span class="brand-name">MODIFY</span>
            <span class="brand-tagline">Find your frequency</span>
          </div>
        </div>

        <nav class="nav-menu" role="navigation" aria-label="Main Navigation">
          <button class="nav-item ${this.activeTab === 'home' ? 'active' : ''}" data-tab="home">
            <svg class="nav-icon" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <span>Home</span>
          </button>

          <button class="nav-item ${this.activeTab === 'moods' ? 'active' : ''}" data-tab="moods">
            <svg class="nav-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
            <span>Explore Moods</span>
          </button>

          <button class="nav-item ${this.activeTab === 'mix' ? 'active' : ''}" data-tab="mix">
            <svg class="nav-icon" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            <span>Your Mix</span>
          </button>

          <button class="nav-item ${this.activeTab === 'favourites' ? 'active' : ''}" data-tab="favourites">
            <svg class="nav-icon" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            <span>Favourites</span>
            <span class="nav-badge fav-count-badge" style="display: none;">0</span>
          </button>
        </nav>

        <div class="sidebar-section-title">Mood Frequencies</div>
        <div class="sidebar-mood-list">
          ${MOODS.map(m => `
            <button class="sidebar-mood-item" data-mood="${m.id}">
              <span aria-hidden="true">${m.emoji}</span>
              <span>${m.name}</span>
            </button>
          `).join('')}
        </div>

        <div class="sidebar-footer">
          <div>MODIFY v1.0 • 49 Curated Tracks</div>
          <div style="margin-top: 4px;">Hindi, Marathi & English</div>
        </div>
      `;
    }

    // Mobile nav bottom content
    if (this.mobileNavEl) {
      this.mobileNavEl.innerHTML = `
        <button class="mobile-nav-btn ${this.activeTab === 'home' ? 'active' : ''}" data-tab="home" aria-label="Home">
          <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
          <span>Home</span>
        </button>

        <button class="mobile-nav-btn ${this.activeTab === 'moods' ? 'active' : ''}" data-tab="moods" aria-label="Explore Moods">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path></svg>
          <span>Moods</span>
        </button>

        <button class="mobile-nav-btn ${this.activeTab === 'mix' ? 'active' : ''}" data-tab="mix" aria-label="Your Mix">
          <svg viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          <span>Your Mix</span>
        </button>

        <button class="mobile-nav-btn ${this.activeTab === 'favourites' ? 'active' : ''}" data-tab="favourites" aria-label="Favourites">
          <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          <span>Favourites</span>
        </button>
      `;
    }

    this.attachEvents();
  }

  attachEvents() {
    const handleNavClick = (tab) => {
      this.setActiveTab(tab);
      if (this.onNavigate) this.onNavigate(tab);
    };

    // Sidebar items
    if (this.sidebarEl) {
      this.sidebarEl.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => handleNavClick(btn.getAttribute('data-tab')));
      });

      this.sidebarEl.querySelectorAll('.sidebar-mood-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const moodId = btn.getAttribute('data-mood');
          if (this.onSelectMoodShortcut) this.onSelectMoodShortcut(moodId);
        });
      });
    }

    // Mobile nav
    if (this.mobileNavEl) {
      this.mobileNavEl.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => handleNavClick(btn.getAttribute('data-tab')));
      });
    }
  }
}
