export class SearchBar {
  constructor(containerEl, onSearch) {
    this.container = containerEl;
    this.onSearch = onSearch;
    this.query = '';

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="search-input-group">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" 
               class="search-input" 
               placeholder="Search songs, artists, moods, languages..." 
               aria-label="Search music library"
               autocomplete="off"
               spellcheck="false">
        <button class="search-clear-btn" style="display: none;" aria-label="Clear search input">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <span class="search-shortcut-badge" aria-hidden="true">/</span>
      </div>
    `;

    this.input = this.container.querySelector('.search-input');
    this.clearBtn = this.container.querySelector('.search-clear-btn');
    this.badge = this.container.querySelector('.search-shortcut-badge');

    this.attachEvents();
  }

  attachEvents() {
    this.input.addEventListener('input', (e) => {
      this.query = e.target.value.trim();
      this.updateClearBtn();
      if (this.onSearch) {
        this.onSearch(this.query);
      }
    });

    this.clearBtn.addEventListener('click', () => {
      this.input.value = '';
      this.query = '';
      this.updateClearBtn();
      this.input.focus();
      if (this.onSearch) {
        this.onSearch('');
      }
    });

    // Press '/' anywhere on page to focus search (unless in an input)
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== this.input) {
        if (!['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
          e.preventDefault();
          this.input.focus();
          this.input.select();
        }
      }
    });
  }

  setQuery(val) {
    this.input.value = val;
    this.query = val.trim();
    this.updateClearBtn();
    if (this.onSearch) {
      this.onSearch(this.query);
    }
  }

  updateClearBtn() {
    if (this.query.length > 0) {
      this.clearBtn.style.display = 'flex';
      this.badge.style.display = 'none';
    } else {
      this.clearBtn.style.display = 'none';
      this.badge.style.display = 'inline-block';
    }
  }
}
