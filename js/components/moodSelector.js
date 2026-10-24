import { MOODS } from '../data/moods.js';

export class MoodSelector {
  constructor(containerEl, onSelectMood) {
    this.container = containerEl;
    this.onSelectMood = onSelectMood;
    this.activeMood = null;
    this.trackCounts = {};
  }

  setTrackCounts(counts) {
    this.trackCounts = counts;
    this.render();
  }

  setActiveMood(moodId) {
    this.activeMood = moodId ? moodId.toLowerCase() : null;
    this.render();
    this.updateAmbientGlow();
  }

  updateAmbientGlow() {
    const ambientEl = document.querySelector('.ambient-glow');
    if (!ambientEl) return;

    if (!this.activeMood) {
      ambientEl.style.setProperty('--ambient-color', 'rgba(184, 243, 91, 0.12)');
      return;
    }

    const current = MOODS.find(m => m.id.toLowerCase() === this.activeMood);
    if (current) {
      ambientEl.style.setProperty('--ambient-color', current.gradient.includes('rgba') ? current.borderColor : 'rgba(184, 243, 91, 0.2)');
    }
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = MOODS.map(mood => {
      const isActive = this.activeMood === mood.id.toLowerCase();
      const count = this.trackCounts[mood.name] || 0;

      return `
        <div class="mood-card ${isActive ? 'active' : ''}" 
             data-mood-id="${mood.id}"
             style="--mood-gradient: ${mood.gradient}; --mood-border: ${mood.borderColor};"
             role="button"
             tabindex="0"
             aria-pressed="${isActive}"
             aria-label="Mood category ${mood.name}: ${mood.tagline}, ${count} songs">
          <div class="mood-card-header">
            <span class="mood-emoji" aria-hidden="true">${mood.emoji}</span>
            <span class="mood-track-count">${count} tracks</span>
          </div>
          <div class="mood-name">${mood.name}</div>
          <div class="mood-tagline">${mood.tagline}</div>
        </div>
      `;
    }).join('');

    this.attachEvents();
  }

  attachEvents() {
    this.container.querySelectorAll('.mood-card').forEach(card => {
      const clickHandler = () => {
        const moodId = card.getAttribute('data-mood-id');
        // Toggle if clicking active mood
        const newMood = this.activeMood === moodId.toLowerCase() ? null : moodId;
        this.setActiveMood(newMood);
        if (this.onSelectMood) {
          this.onSelectMood(newMood);
        }
      };

      card.addEventListener('click', clickHandler);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          clickHandler();
        }
      });
    });
  }
}
