export class LanguageFilter {
  constructor(containerEl, onSelectLanguage) {
    this.container = containerEl;
    this.onSelectLanguage = onSelectLanguage;
    this.activeLanguage = 'All';
    this.counts = { All: 0, Hindi: 0, Marathi: 0, English: 0 };
  }

  setCounts(counts) {
    this.counts = { ...this.counts, ...counts };
    this.render();
  }

  setActiveLanguage(lang) {
    this.activeLanguage = lang || 'All';
    this.render();
  }

  render() {
    if (!this.container) return;

    const languages = [
      { id: 'All', label: 'All Languages' },
      { id: 'Hindi', label: 'Hindi (हिंदी)' },
      { id: 'Marathi', label: 'Marathi (मराठी)' },
      { id: 'English', label: 'English' }
    ];

    this.container.innerHTML = `
      <div class="pill-group" role="radiogroup" aria-label="Filter songs by language">
        ${languages.map(lang => {
          const isActive = this.activeLanguage === lang.id;
          const count = this.counts[lang.id] || 0;
          return `
            <button class="pill-btn ${isActive ? 'active' : ''}" 
                    data-lang-id="${lang.id}"
                    role="radio"
                    aria-checked="${isActive}">
              <span>${lang.label}</span>
              <span class="pill-count">(${count})</span>
            </button>
          `;
        }).join('')}
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    this.container.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang-id');
        this.setActiveLanguage(lang);
        if (this.onSelectLanguage) {
          this.onSelectLanguage(lang);
        }
      });
    });
  }
}
