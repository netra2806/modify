import { renderTrackArtwork } from './artwork.js';
import { storage } from '../services/storage.js';
import { audioEngine } from '../services/audioEngine.js';
import { toast } from './toast.js';

export class TrackList {
  constructor(containerEl, onPlayTrack, onOpenAudioModal) {
    this.container = containerEl;
    this.onPlayTrack = onPlayTrack;
    this.onOpenAudioModal = onOpenAudioModal;
    this.tracks = [];
    this.currentTrackId = null;
    this.isPlaying = false;

    // Listen to audio engine events
    audioEngine.on('play', ({ track }) => {
      this.currentTrackId = track?.id;
      this.isPlaying = true;
      this.updatePlayingState();
    });

    audioEngine.on('pause', () => {
      this.isPlaying = false;
      this.updatePlayingState();
    });

    audioEngine.on('trackchange', ({ track }) => {
      this.currentTrackId = track?.id;
      this.updatePlayingState();
    });

    // Close open dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.stream-menu-wrap')) {
        document.querySelectorAll('.stream-menu-wrap.open').forEach(el => el.classList.remove('open'));
      }
    });
  }

  setTracks(tracks) {
    this.tracks = tracks || [];
    this.render();
  }

  updatePlayingState() {
    if (!this.container) return;
    this.container.querySelectorAll('.track-row').forEach(row => {
      const trackId = row.getAttribute('data-track-id');
      const isCurrent = trackId === this.currentTrackId;
      const playBtn = row.querySelector('.track-row-play-btn');

      if (isCurrent) {
        row.classList.add('playing');
        if (playBtn) {
          playBtn.setAttribute('aria-label', this.isPlaying ? 'Pause' : 'Play');
          playBtn.innerHTML = this.isPlaying 
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>'
            : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
        }
      } else {
        row.classList.remove('playing');
        if (playBtn) {
          playBtn.setAttribute('aria-label', 'Play');
          playBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
        }
      }
    });
  }

  render() {
    if (!this.container) return;

    if (this.tracks.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3 class="empty-state-title">No frequencies found</h3>
          <p class="empty-state-text">We couldn't find any songs matching your current filters or search term.</p>
          <div class="empty-suggestions">
            <button class="suggestion-chip" data-suggest="Happy">Try Happy</button>
            <button class="suggestion-chip" data-suggest="Marathi">Try Marathi</button>
            <button class="suggestion-chip" data-suggest="Arijit Singh">Try Arijit Singh</button>
            <button class="suggestion-chip" data-suggest="All">Reset Filters</button>
          </div>
        </div>
      `;

      this.container.querySelectorAll('.suggestion-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = btn.getAttribute('data-suggest');
          window.dispatchEvent(new CustomEvent('modify:apply-suggestion', { detail: { value: val } }));
        });
      });
      return;
    }

    const html = `
      <div class="track-list-header">
        <div>#</div>
        <div>Title & Artist</div>
        <div>Album</div>
        <div>Language</div>
        <div>Time</div>
        <div style="text-align: right;">Actions</div>
      </div>
      <div class="track-rows-wrap" role="list">
        ${this.tracks.map((track, idx) => {
          const isPlaying = this.currentTrackId === track.id && this.isPlaying;
          const isFav = storage.isFavourite(track.id);
          const hasCustom = audioEngine.hasCustomAudio(track.id);
          const langClass = `badge-${track.language.toLowerCase()}`;

          return `
            <div class="track-row ${isPlaying ? 'playing' : ''}" 
                 data-track-id="${track.id}"
                 role="listitem"
                 tabindex="0">
              
              <!-- Number / Play Trigger -->
              <div class="track-num-cell">
                <span class="track-index-text">${idx + 1}</span>
                <button class="track-row-play-btn" aria-label="${isPlaying ? 'Pause' : 'Play'} ${escapeHtml(track.title)}">
                  ${isPlaying 
                    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>'
                    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>'
                  }
                </button>
              </div>

              <!-- Main Info (Art + Title + Artist) -->
              <div class="track-main-cell">
                <div class="track-art-wrap">
                  ${renderTrackArtwork(track, 48)}
                </div>
                <div class="track-text-details">
                  <div class="track-title">
                    <span>${escapeHtml(track.title)}</span>
                    ${track.devanagariTitle ? `<span class="track-devanagari-title">(${escapeHtml(track.devanagariTitle)})</span>` : ''}
                    ${hasCustom ? `<span class="custom-audio-pill" title="Personal audio file loaded">Audio File</span>` : ''}
                  </div>
                  <div class="track-artist">
                    <span>${escapeHtml(track.artist)}</span>
                  </div>
                </div>
              </div>

              <!-- Album Cell -->
              <div class="track-album-cell" title="${escapeHtml(track.album)}">
                ${escapeHtml(track.album)}
              </div>

              <!-- Language Badge -->
              <div class="track-badge-cell">
                <span class="badge-tag ${langClass}">${escapeHtml(track.language)}</span>
              </div>

              <!-- Duration -->
              <div class="track-duration-cell">
                ${track.duration}
              </div>

              <!-- Actions Cell -->
              <div class="track-actions-cell">
                <!-- Favourite Button -->
                <button class="fav-btn ${isFav ? 'active' : ''}" 
                        data-track-id="${track.id}" 
                        aria-label="${isFav ? 'Remove from favourites' : 'Add to favourites'}"
                        title="${isFav ? 'Remove from favourites' : 'Add to favourites'}">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>

                <!-- Stream & Info Dropdown -->
                <div class="stream-menu-wrap">
                  <button class="stream-menu-btn" aria-label="Listen on streaming platforms" title="Listen on official authorized services">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="19" cy="12" r="1"></circle>
                      <circle cx="5" cy="12" r="1"></circle>
                    </svg>
                  </button>
                  <div class="stream-dropdown">
                    <span class="stream-dropdown-title">Stream Track</span>
                    <a href="${track.streaming.spotify}" target="_blank" rel="noopener noreferrer" class="stream-link-item">
                      <span>🟢 Spotify</span>
                    </a>
                    <a href="${track.streaming.youtube}" target="_blank" rel="noopener noreferrer" class="stream-link-item">
                      <span>🔴 YouTube Music</span>
                    </a>
                    <a href="${track.streaming.jiosaavn}" target="_blank" rel="noopener noreferrer" class="stream-link-item">
                      <span>🔵 JioSaavn</span>
                    </a>
                    <a href="${track.streaming.apple}" target="_blank" rel="noopener noreferrer" class="stream-link-item">
                      <span>🍎 Apple Music</span>
                    </a>
                    <div style="border-top: 1px solid var(--border-subtle); margin: 4px 0;"></div>
                    <button class="stream-link-item upload-audio-btn" data-track-id="${track.id}">
                      <span>📁 Pair Your Audio File</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEvents();
  }

  attachEvents() {
    // Play row triggers
    this.container.querySelectorAll('.track-row').forEach(row => {
      const trackId = row.getAttribute('data-track-id');
      const track = this.tracks.find(t => t.id === trackId);
      if (!track) return;

      const triggerPlay = () => {
        if (this.onPlayTrack) {
          this.onPlayTrack(track);
        }
      };

      row.querySelector('.track-row-play-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        triggerPlay();
      });

      row.addEventListener('dblclick', triggerPlay);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          triggerPlay();
        }
      });
    });

    // Favourite buttons
    this.container.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trackId = btn.getAttribute('data-track-id');
        const track = this.tracks.find(t => t.id === trackId);
        const isFav = storage.toggleFavourite(trackId);

        btn.classList.toggle('active', isFav);
        toast.show(
          isFav ? `Added "${track?.title}" to Favourites` : `Removed "${track?.title}" from Favourites`,
          isFav ? 'success' : 'info'
        );
      });
    });

    // Dropdown open/close
    this.container.querySelectorAll('.stream-menu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wrap = btn.closest('.stream-menu-wrap');
        const isOpen = wrap.classList.contains('open');
        document.querySelectorAll('.stream-menu-wrap.open').forEach(el => el.classList.remove('open'));
        if (!isOpen) {
          wrap.classList.add('open');
        }
      });
    });

    // Upload audio triggers
    this.container.querySelectorAll('.upload-audio-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wrap = btn.closest('.stream-menu-wrap');
        wrap.classList.remove('open');
        const trackId = btn.getAttribute('data-track-id');
        const track = this.tracks.find(t => t.id === trackId);
        if (this.onOpenAudioModal && track) {
          this.onOpenAudioModal(track);
        }
      });
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}
