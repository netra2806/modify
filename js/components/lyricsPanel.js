import { lyricsProvider } from '../services/lyricsProvider.js';
import { audioEngine } from '../services/audioEngine.js';
import { renderTrackArtwork } from './artwork.js';
import { storage } from '../services/storage.js';

export class LyricsPanel {
  constructor(overlayEl) {
    this.overlay = overlayEl;
    this.currentTrack = null;
    this.lyricsData = null;
    this.isLoading = false;
    this.isOpen = false;
    this.lyricsMode = storage.getPreferences().lyricsMode || 'synced'; // 'synced' | 'full'
    this.useDevanagari = storage.getPreferences().useDevanagari || false;
    this.activeLineIndex = -1;
    this.activeStanzaIndex = -1;
    this.lastScrollTime = 0;

    this.initElements();
    this.bindAudioEvents();
  }

  initElements() {
    this.headerEl = this.overlay.querySelector('.lyrics-header');
    this.viewportEl = this.overlay.querySelector('.lyrics-viewport');
    this.contentWrapEl = this.overlay.querySelector('.lyrics-content-wrap');

    // Close button
    const closeBtn = this.overlay.querySelector('.lyrics-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  bindAudioEvents() {
    audioEngine.on('timeupdate', ({ currentTime }) => {
      if (!this.isOpen || this.lyricsMode !== 'synced' || !this.lyricsData?.isSynced) return;
      this.syncPlayback(currentTime);
    });

    audioEngine.on('trackchange', ({ track }) => {
      if (this.isOpen) {
        this.loadLyricsForTrack(track);
      }
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Highlight button in player
    const triggerBtn = document.querySelector('.lyrics-trigger-btn');
    if (triggerBtn) triggerBtn.classList.add('active');

    if (audioEngine.currentTrack) {
      this.loadLyricsForTrack(audioEngine.currentTrack);
    }
  }

  close() {
    this.isOpen = false;
    this.overlay.classList.remove('open');
    document.body.style.overflow = '';

    const triggerBtn = document.querySelector('.lyrics-trigger-btn');
    if (triggerBtn) triggerBtn.classList.remove('active');
  }

  async loadLyricsForTrack(track) {
    if (!track) return;
    this.currentTrack = track;
    this.isLoading = true;
    this.activeLineIndex = -1;
    this.activeStanzaIndex = -1;
    this.renderHeader();
    this.renderLoading();

    try {
      this.lyricsData = await lyricsProvider.getLyrics(track, this.useDevanagari);
    } catch (e) {
      console.warn('Lyrics load error:', e);
      this.lyricsData = null;
    }

    this.isLoading = false;
    this.renderHeader();
    this.renderBody();

    // Trigger initial sync to current time
    if (this.lyricsData?.isSynced) {
      this.syncPlayback(audioEngine.currentTime);
    }
  }

  renderHeader() {
    if (!this.headerEl || !this.currentTrack) return;

    const canDevanagari = Boolean(this.lyricsData?.canToggleDevanagari || this.currentTrack.devanagariTitle);

    this.headerEl.innerHTML = `
      <div class="lyrics-track-info">
        <div class="lyrics-track-art">
          ${renderTrackArtwork(this.currentTrack, 44)}
        </div>
        <div class="lyrics-track-text">
          <div class="lyrics-track-title">${escapeHtml(this.currentTrack.title)}</div>
          <div class="lyrics-track-artist">${escapeHtml(this.currentTrack.artist)}</div>
        </div>
      </div>

      <div class="lyrics-controls-bar">
        <!-- Mode Toggle: Synced vs Full -->
        <div class="lyrics-mode-toggle" role="group" aria-label="Lyrics display mode">
          <button class="mode-toggle-btn ${this.lyricsMode === 'synced' ? 'active' : ''}" data-mode="synced">
            Synced
          </button>
          <button class="mode-toggle-btn ${this.lyricsMode === 'full' ? 'active' : ''}" data-mode="full">
            Full Text
          </button>
        </div>

        <!-- Devanagari script toggle if Hindi/Marathi song -->
        ${canDevanagari ? `
          <button class="devanagari-toggle-btn ${this.useDevanagari ? 'active' : ''}" aria-label="Toggle Devanagari Hindi/Marathi Script">
            <span>अ/A</span>
            <span>${this.useDevanagari ? 'देवनागरी' : 'Latin'}</span>
          </button>
        ` : ''}

        <button class="lyrics-close-btn" aria-label="Close Lyrics View" title="Close (Esc)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    // Mode toggle listeners
    this.headerEl.querySelectorAll('.mode-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.lyricsMode = btn.getAttribute('data-mode');
        storage.savePreferences({ lyricsMode: this.lyricsMode });
        this.renderHeader();
        this.renderBody();
      });
    });

    // Devanagari toggle listener
    const devBtn = this.headerEl.querySelector('.devanagari-toggle-btn');
    if (devBtn) {
      devBtn.addEventListener('click', () => {
        this.useDevanagari = !this.useDevanagari;
        storage.savePreferences({ useDevanagari: this.useDevanagari });
        this.loadLyricsForTrack(this.currentTrack);
      });
    }

    // Close button listener
    const closeBtn = this.headerEl.querySelector('.lyrics-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }

  renderLoading() {
    if (!this.contentWrapEl) return;
    this.contentWrapEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px; padding: 40px 0; max-width: 600px;">
        <div style="height: 36px; width: 60%; background: var(--bg-surface); border-radius: 8px; animation: pulse-glow 1.5s infinite;"></div>
        <div style="height: 36px; width: 85%; background: var(--bg-surface); border-radius: 8px; animation: pulse-glow 1.5s infinite; animation-delay: 0.2s;"></div>
        <div style="height: 36px; width: 70%; background: var(--bg-surface); border-radius: 8px; animation: pulse-glow 1.5s infinite; animation-delay: 0.4s;"></div>
        <div style="height: 36px; width: 90%; background: var(--bg-surface); border-radius: 8px; animation: pulse-glow 1.5s infinite; animation-delay: 0.6s;"></div>
      </div>
    `;
  }

  renderBody() {
    if (!this.contentWrapEl) return;

    if (!this.lyricsData || !this.lyricsData.hasLyrics) {
      // Graceful fallback according to PHASE 7 & 8 specs
      const externalSearch = this.lyricsData?.sourceUrl || `https://www.musixmatch.com/search/${encodeURIComponent(this.currentTrack.title)}`;
      this.contentWrapEl.innerHTML = `
        <div class="lyrics-unavailable">
          <div class="lyrics-unavailable-icon">📜</div>
          <h3 class="lyrics-unavailable-msg">Lyrics aren't available for this track yet.</h3>
          <p class="lyrics-unavailable-sub">
            We only display authentic, licensed lyric data. You can search or view licensed lyrics on authorized partner databases.
          </p>
          <a href="${externalSearch}" target="_blank" rel="noopener noreferrer" class="lyrics-external-btn">
            <span>Search on Musixmatch</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      `;
      return;
    }

    if (this.lyricsMode === 'full' || !this.lyricsData.isSynced) {
      // Full plain lyrics display
      const isDev = this.lyricsData.isDevanagari;
      this.contentWrapEl.innerHTML = `
        <div class="lyrics-full-mode ${isDev ? 'devanagari-text' : ''}">
          ${escapeHtml(this.lyricsData.plainLyrics)}
        </div>
        <div class="lyrics-source-footer">
          <span>Source: ${escapeHtml(this.lyricsData.source)}</span>
          <a href="${this.lyricsData.sourceUrl}" target="_blank" rel="noopener noreferrer" class="lyrics-source-link">
            Verify Licensing
          </a>
        </div>
      `;
      return;
    }

    // Synced Karaoke Mode with Stanza Grouping
    const lines = this.lyricsData.syncedLines;
    const isDev = this.lyricsData.isDevanagari;

    // Group lines into stanzas
    const stanzas = [];
    let currentStanzaLines = [];
    let currentStanzaId = -1;

    lines.forEach((line, index) => {
      if (currentStanzaId !== line.stanzaIndex && currentStanzaLines.length > 0) {
        stanzas.push({ id: currentStanzaId, lines: currentStanzaLines });
        currentStanzaLines = [];
      }
      currentStanzaId = line.stanzaIndex;
      currentStanzaLines.push({ ...line, globalIndex: index });
    });
    if (currentStanzaLines.length > 0) {
      stanzas.push({ id: currentStanzaId, lines: currentStanzaLines });
    }

    this.contentWrapEl.innerHTML = `
      <div class="lyrics-synced-container ${isDev ? 'devanagari-text' : ''}">
        ${stanzas.map(stanza => `
          <div class="lyric-stanza" data-stanza-id="${stanza.id}">
            ${stanza.lines.map(line => `
              <div class="lyric-line" 
                   data-line-index="${line.globalIndex}"
                   data-time="${line.time}"
                   title="Click to jump to ${formatSeconds(line.time)}">
                ${escapeHtml(line.text)}
              </div>
            `).join('')}
          </div>
        `).join('')}

        <div class="lyrics-source-footer">
          <span>Source: ${escapeHtml(this.lyricsData.source)}</span>
          <a href="${this.lyricsData.sourceUrl}" target="_blank" rel="noopener noreferrer" class="lyrics-source-link">
            Verify Licensing
          </a>
        </div>
      </div>
    `;

    // Click line to seek audio position
    this.contentWrapEl.querySelectorAll('.lyric-line').forEach(lineEl => {
      lineEl.addEventListener('click', () => {
        const timeSec = parseFloat(lineEl.getAttribute('data-time'));
        if (!isNaN(timeSec)) {
          audioEngine.seek(timeSec);
          if (!audioEngine.isPlaying) {
            audioEngine.play();
          }
        }
      });
    });
  }

  syncPlayback(currentTime) {
    if (!this.lyricsData?.syncedLines || this.lyricsData.syncedLines.length === 0) return;
    const lines = this.lyricsData.syncedLines;

    // Find the active line index: the latest line with timestamp <= currentTime
    let activeIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (currentTime >= lines[i].time) {
        activeIdx = i;
      } else {
        break;
      }
    }

    if (activeIdx === this.activeLineIndex) return;
    this.activeLineIndex = activeIdx;

    const lineElements = this.contentWrapEl.querySelectorAll('.lyric-line');
    lineElements.forEach((el, idx) => {
      el.classList.remove('active', 'upcoming');
      if (idx === this.activeLineIndex) {
        el.classList.add('active');
      } else if (idx > this.activeLineIndex && idx <= this.activeLineIndex + 3) {
        el.classList.add('upcoming');
      }
    });

    // Update active stanza
    if (activeIdx >= 0 && lines[activeIdx]) {
      const stanzaId = lines[activeIdx].stanzaIndex;
      if (stanzaId !== this.activeStanzaIndex) {
        this.activeStanzaIndex = stanzaId;
        this.contentWrapEl.querySelectorAll('.lyric-stanza').forEach(s => {
          s.classList.toggle('active-stanza', parseInt(s.getAttribute('data-stanza-id'), 10) === stanzaId);
        });
      }
    }

    // Auto-scroll to center the active line smoothly
    const activeEl = lineElements[activeIdx];
    if (activeEl && this.viewportEl) {
      const now = performance.now();
      if (now - this.lastScrollTime > 150) {
        this.lastScrollTime = now;
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }
}

function formatSeconds(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
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
