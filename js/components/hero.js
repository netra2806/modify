export class Hero {
  constructor(containerEl, onShuffleAll, onExploreMoods, onOpenAudioModal) {
    this.container = containerEl;
    this.onShuffleAll = onShuffleAll;
    this.onExploreMoods = onExploreMoods;
    this.onOpenAudioModal = onOpenAudioModal;

    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="hero-section">
        <div class="hero-glow-blob" aria-hidden="true"></div>

        <div class="hero-badge">
          <span class="hero-pulse-dot" aria-hidden="true"></span>
          <span>Find Your Frequency</span>
        </div>

        <h1 class="hero-headline">
          Feel it. <span class="highlight">Play it.</span>
        </h1>

        <p class="hero-subtext">
          From Hindi hits to Marathi melodies and English anthems — there's a soundtrack for every version of you.
        </p>

        <div class="hero-actions">
          <button class="btn-primary hero-shuffle-btn" aria-label="Shuffle all tracks in catalogue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="16 3 21 3 21 8"></polyline>
              <line x1="4" y1="20" x2="21" y2="3"></line>
              <polyline points="21 16 21 21 16 21"></polyline>
              <line x1="15" y1="15" x2="21" y2="21"></line>
              <line x1="4" y1="4" x2="9" y2="9"></line>
            </svg>
            <span>Shuffle All 49 Tracks</span>
          </button>

          <button class="btn-secondary hero-explore-btn" aria-label="Explore the 8 mood categories">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="12 8 8 12 12 16 12 8"></polygon>
              <line x1="16" y1="12" x2="12" y2="12"></line>
            </svg>
            <span>Explore Moods</span>
          </button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const shuffleBtn = this.container.querySelector('.hero-shuffle-btn');
    const exploreBtn = this.container.querySelector('.hero-explore-btn');

    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        if (this.onShuffleAll) this.onShuffleAll();
      });
    }

    if (exploreBtn) {
      exploreBtn.addEventListener('click', () => {
        if (this.onExploreMoods) this.onExploreMoods();
      });
    }
  }
}
