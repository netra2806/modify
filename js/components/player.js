import { audioEngine } from '../services/audioEngine.js';
import { storage } from '../services/storage.js';
import { renderTrackArtwork } from './artwork.js';
import { toast } from './toast.js';

export class Player {
  constructor(barEl, onNextTrack, onPrevTrack, onToggleLyrics) {
    this.barEl = barEl;
    this.onNextTrack = onNextTrack;
    this.onPrevTrack = onPrevTrack;
    this.onToggleLyrics = onToggleLyrics;

    this.isDraggingProgress = false;
    this.isShuffle = storage.getPreferences().shuffle || false;
    this.repeatMode = storage.getPreferences().repeat || 'all'; // 'off' | 'all' | 'one'

    this.initElements();
    this.bindEvents();
    this.initCustomAudioModal();
  }

  initElements() {
    // Left
    this.artContainer = this.barEl.querySelector('.player-art-wrap');
    this.titleEl = this.barEl.querySelector('.player-title');
    this.artistEl = this.barEl.querySelector('.player-artist');
    this.sourceBadgeEl = this.barEl.querySelector('.player-source-badge');

    // Controls
    this.playBtn = this.barEl.querySelector('.btn-play-main');
    this.prevBtn = this.barEl.querySelector('.btn-prev');
    this.nextBtn = this.barEl.querySelector('.btn-next');
    this.shuffleBtn = this.barEl.querySelector('.btn-shuffle');
    this.repeatBtn = this.barEl.querySelector('.btn-repeat');

    // Scrubber
    this.progressTrack = this.barEl.querySelector('.progress-track');
    this.progressFill = this.barEl.querySelector('.progress-fill');
    this.progressThumb = this.barEl.querySelector('.progress-thumb');
    this.timeCurrentEl = this.barEl.querySelector('.time-current');
    this.timeTotalEl = this.barEl.querySelector('.time-total');

    // Right Actions
    this.lyricsBtn = this.barEl.querySelector('.lyrics-trigger-btn');
    this.favBtn = this.barEl.querySelector('.player-fav-btn');
    this.volumeBtn = this.barEl.querySelector('.volume-btn');
    this.volumeSlider = this.barEl.querySelector('.volume-slider');

    // Set initial volume
    const prefs = storage.getPreferences();
    if (this.volumeSlider) {
      this.volumeSlider.value = prefs.volume;
      audioEngine.setVolume(prefs.volume);
    }
    if (this.shuffleBtn) {
      this.shuffleBtn.classList.toggle('active', this.isShuffle);
    }
    this.updateRepeatButton();
  }

  bindEvents() {
    // Play/Pause
    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => audioEngine.togglePlay());
    }

    // Prev/Next
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        if (this.onPrevTrack) this.onPrevTrack();
      });
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        if (this.onNextTrack) this.onNextTrack();
      });
    }

    // Shuffle
    if (this.shuffleBtn) {
      this.shuffleBtn.addEventListener('click', () => {
        this.isShuffle = !this.isShuffle;
        this.shuffleBtn.classList.toggle('active', this.isShuffle);
        storage.savePreferences({ shuffle: this.isShuffle });
        toast.show(this.isShuffle ? 'Shuffle enabled' : 'Shuffle disabled', 'info', 2000);
      });
    }

    // Repeat
    if (this.repeatBtn) {
      this.repeatBtn.addEventListener('click', () => {
        if (this.repeatMode === 'off') {
          this.repeatMode = 'all';
        } else if (this.repeatMode === 'all') {
          this.repeatMode = 'one';
        } else {
          this.repeatMode = 'off';
        }
        storage.savePreferences({ repeat: this.repeatMode });
        this.updateRepeatButton();
        const msg = this.repeatMode === 'one' ? 'Repeat track' : this.repeatMode === 'all' ? 'Repeat all' : 'Repeat off';
        toast.show(msg, 'info', 2000);
      });
    }

    // Scrubber drag / click
    if (this.progressTrack) {
      const handleSeek = (e) => {
        const rect = this.progressTrack.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const seekTime = pos * (audioEngine.duration || 1);
        audioEngine.seek(seekTime);
      };

      this.progressTrack.addEventListener('mousedown', (e) => {
        this.isDraggingProgress = true;
        handleSeek(e);
      });

      window.addEventListener('mousemove', (e) => {
        if (this.isDraggingProgress) {
          handleSeek(e);
        }
      });

      window.addEventListener('mouseup', () => {
        this.isDraggingProgress = false;
      });
    }

    // Volume Slider
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => {
        audioEngine.setVolume(parseFloat(e.target.value));
      });
    }

    // Mute Button
    if (this.volumeBtn) {
      this.volumeBtn.addEventListener('click', () => {
        const isMuted = audioEngine.toggleMute();
        this.updateVolumeIcon(isMuted ? 0 : audioEngine.volume);
      });
    }

    // Lyrics Button
    if (this.lyricsBtn) {
      this.lyricsBtn.addEventListener('click', () => {
        if (this.onToggleLyrics) this.onToggleLyrics();
      });
    }

    // Art click opens lyrics
    if (this.artContainer) {
      this.artContainer.addEventListener('click', () => {
        if (this.onToggleLyrics) this.onToggleLyrics();
      });
    }

    // Favourite Button in Player
    if (this.favBtn) {
      this.favBtn.addEventListener('click', () => {
        if (!audioEngine.currentTrack) return;
        const isFav = storage.toggleFavourite(audioEngine.currentTrack.id);
        this.favBtn.classList.toggle('active', isFav);
        toast.show(
          isFav ? `Added "${audioEngine.currentTrack.title}" to Favourites` : `Removed from Favourites`,
          isFav ? 'success' : 'info'
        );
      });
    }

    // Audio Engine Listeners
    audioEngine.on('play', () => this.updatePlayState(true));
    audioEngine.on('pause', () => this.updatePlayState(false));
    audioEngine.on('trackchange', ({ track, playbackMode, customFileName }) => {
      this.updateTrackInfo(track, playbackMode, customFileName);
    });
    audioEngine.on('timeupdate', ({ currentTime, duration }) => {
      if (!this.isDraggingProgress) {
        this.updateProgress(currentTime, duration);
      }
    });
    audioEngine.on('volumechange', ({ volume, isMuted }) => {
      this.updateVolumeIcon(isMuted ? 0 : volume);
      if (this.volumeSlider) this.volumeSlider.value = isMuted ? 0 : volume;
    });
    audioEngine.on('ended', () => {
      if (this.repeatMode === 'one') {
        audioEngine.seek(0);
        audioEngine.play();
      } else if (this.onNextTrack) {
        this.onNextTrack();
      }
    });

    // Audio source badge click opens upload modal
    if (this.sourceBadgeEl) {
      this.sourceBadgeEl.addEventListener('click', () => {
        if (audioEngine.currentTrack) {
          this.openAudioModal(audioEngine.currentTrack);
        }
      });
    }
  }

  updateTrackInfo(track, playbackMode, customFileName) {
    if (!track) return;

    if (this.artContainer) {
      this.artContainer.innerHTML = renderTrackArtwork(track, 56);
    }
    if (this.titleEl) {
      this.titleEl.textContent = track.title;
      this.titleEl.title = track.title;
    }
    if (this.artistEl) {
      this.artistEl.textContent = track.artist;
      this.artistEl.title = track.artist;
    }
    if (this.timeTotalEl) {
      this.timeTotalEl.textContent = track.duration || '3:30';
    }

    if (this.sourceBadgeEl) {
      if (playbackMode === 'custom') {
        this.sourceBadgeEl.innerHTML = `<span>📁 File: ${escapeHtml(customFileName || 'Audio')}</span>`;
        this.sourceBadgeEl.title = 'Playing your uploaded audio file. Click to change.';
      } else {
        this.sourceBadgeEl.innerHTML = `<span>⚡ Frequency Mode</span>`;
        this.sourceBadgeEl.title = 'Acoustic frequency audio active. Click to load your own audio file.';
      }
    }

    if (this.favBtn) {
      this.favBtn.classList.toggle('active', storage.isFavourite(track.id));
    }
  }

  updatePlayState(isPlaying) {
    if (!this.playBtn) return;
    this.playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    this.playBtn.innerHTML = isPlaying
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
  }

  updateProgress(current, duration) {
    if (!duration || duration <= 0) return;
    const pct = Math.min(100, (current / duration) * 100);

    if (this.progressFill) this.progressFill.style.width = `${pct}%`;
    if (this.progressThumb) this.progressThumb.style.left = `${pct}%`;
    if (this.timeCurrentEl) this.timeCurrentEl.textContent = formatTime(current);
    if (this.timeTotalEl) this.timeTotalEl.textContent = formatTime(duration);
  }

  updateVolumeIcon(vol) {
    if (!this.volumeBtn) return;
    if (vol <= 0) {
      this.volumeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path></svg>';
    } else if (vol < 0.5) {
      this.volumeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
    } else {
      this.volumeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
    }
  }

  updateRepeatButton() {
    if (!this.repeatBtn) return;
    this.repeatBtn.classList.toggle('active', this.repeatMode !== 'off');
    if (this.repeatMode === 'one') {
      this.repeatBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path><text x="12" y="14" font-size="8" font-weight="bold" fill="currentColor" text-anchor="middle">1</text></svg>';
    } else {
      this.repeatBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>';
    }
  }

  /* --- Personal Audio File Modal --- */
  initCustomAudioModal() {
    this.modalEl = document.getElementById('custom-audio-modal');
    if (!this.modalEl) return;

    this.modalTrackTitleEl = this.modalEl.querySelector('.modal-track-name');
    this.dropZone = this.modalEl.querySelector('.drop-zone');
    this.fileInput = this.modalEl.querySelector('#audio-file-input');
    const closeBtn = this.modalEl.querySelector('.modal-close-btn');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeAudioModal());
    }

    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.closeAudioModal();
      }
    });

    if (this.dropZone && this.fileInput) {
      this.dropZone.addEventListener('click', () => this.fileInput.click());

      this.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileSelected(e.target.files[0]);
        }
      });

      this.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.dropZone.classList.add('drag-over');
      });

      this.dropZone.addEventListener('dragleave', () => {
        this.dropZone.classList.remove('drag-over');
      });

      this.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileSelected(e.dataTransfer.files[0]);
        }
      });
    }
  }

  openAudioModal(track) {
    this.targetModalTrack = track;
    if (this.modalTrackTitleEl) {
      this.modalTrackTitleEl.textContent = track.title + ' — ' + track.artist;
    }
    if (this.modalEl) {
      this.modalEl.classList.add('open');
    }
  }

  closeAudioModal() {
    if (this.modalEl) {
      this.modalEl.classList.remove('open');
    }
    this.targetModalTrack = null;
  }

  handleFileSelected(file) {
    if (!this.targetModalTrack || !file) return;

    audioEngine.setCustomAudioFile(this.targetModalTrack.id, file);
    toast.show(`Loaded "${file.name}" for "${this.targetModalTrack.title}"!`, 'success');
    this.closeAudioModal();
  }
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
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
