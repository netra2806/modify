import { storage } from './storage.js';

class AudioEngine {
  constructor() {
    this.currentTrack = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 200;
    this.volume = 0.85;
    this.isMuted = false;
    this.playbackMode = 'frequency'; // 'frequency' (WebAudio harmonic engine) | 'custom' (user loaded file)
    
    // HTML5 Audio element for custom user audio files
    this.htmlAudio = new Audio();
    this.customAudioUrl = null;
    this.customAudioFileName = null;
    this.userFilesMap = new Map(); // trackId -> { url, name }

    // Web Audio API context for harmonic frequency synthesis
    this.audioCtx = null;
    this.synthMasterGain = null;
    this.synthInterval = null;
    this.freqTimer = null;
    this.lastTickTime = 0;

    this.listeners = new Map();
    this.initHtmlAudio();
  }

  initHtmlAudio() {
    this.htmlAudio.addEventListener('timeupdate', () => {
      if (this.playbackMode === 'custom') {
        this.currentTime = this.htmlAudio.currentTime;
        this.duration = this.htmlAudio.duration || this.duration;
        this.emit('timeupdate', { currentTime: this.currentTime, duration: this.duration });
      }
    });

    this.htmlAudio.addEventListener('ended', () => {
      if (this.playbackMode === 'custom') {
        this.isPlaying = false;
        this.emit('ended', { track: this.currentTrack });
      }
    });

    this.htmlAudio.addEventListener('error', (e) => {
      console.warn('HTML Audio error:', e);
    });
  }

  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.synthMasterGain = this.audioCtx.createGain();
        this.synthMasterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.18, this.audioCtx.currentTime);
        this.synthMasterGain.connect(this.audioCtx.destination);
      }
    } else if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Set user local audio file for a specific track
   */
  setCustomAudioFile(trackId, file) {
    if (!file) return;
    if (this.userFilesMap.has(trackId)) {
      URL.revokeObjectURL(this.userFilesMap.get(trackId).url);
    }
    const objectUrl = URL.createObjectURL(file);
    this.userFilesMap.set(trackId, {
      url: objectUrl,
      name: file.name
    });

    if (this.currentTrack && this.currentTrack.id === trackId) {
      const wasPlaying = this.isPlaying;
      this.loadTrack(this.currentTrack, wasPlaying);
    }

    this.emit('custom-audio-loaded', { trackId, fileName: file.name });
  }

  hasCustomAudio(trackId) {
    return this.userFilesMap.has(trackId);
  }

  getCustomAudioInfo(trackId) {
    return this.userFilesMap.get(trackId) || null;
  }

  /**
   * Load track into the player
   */
  loadTrack(track, autoPlay = false) {
    if (!track) return;
    const isNewTrack = !this.currentTrack || this.currentTrack.id !== track.id;

    if (this.isPlaying) {
      this.pause();
    }

    this.currentTrack = track;
    this.duration = track.durationSec || 200;

    // Check if user has uploaded a custom audio file for this track
    const customInfo = this.userFilesMap.get(track.id);
    if (customInfo) {
      this.playbackMode = 'custom';
      this.htmlAudio.src = customInfo.url;
      this.htmlAudio.currentTime = isNewTrack ? 0 : this.currentTime;
      this.customAudioFileName = customInfo.name;
    } else {
      this.playbackMode = 'frequency';
      if (isNewTrack) {
        this.currentTime = 0;
      }
      this.customAudioFileName = null;
    }

    this.emit('trackchange', {
      track: this.currentTrack,
      playbackMode: this.playbackMode,
      customFileName: this.customAudioFileName
    });

    if (autoPlay) {
      this.play();
    }
  }

  async play() {
    if (!this.currentTrack) return;
    this.isPlaying = true;

    if (this.playbackMode === 'custom') {
      try {
        await this.htmlAudio.play();
      } catch (err) {
        console.warn('Playback prevented or file error:', err);
      }
    } else {
      // Harmonic frequency synthesis
      this.ensureAudioContext();
      this.startFrequencyAudio();
    }

    storage.addRecentlyPlayed(this.currentTrack.id);
    this.emit('play', { track: this.currentTrack });
  }

  pause() {
    this.isPlaying = false;
    if (this.playbackMode === 'custom') {
      this.htmlAudio.pause();
    } else {
      this.stopFrequencyAudio();
    }
    this.emit('pause', { track: this.currentTrack });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(seconds) {
    const clamped = Math.max(0, Math.min(seconds, this.duration));
    this.currentTime = clamped;

    if (this.playbackMode === 'custom') {
      this.htmlAudio.currentTime = clamped;
    }

    this.emit('seeked', { currentTime: this.currentTime, duration: this.duration });
    this.emit('timeupdate', { currentTime: this.currentTime, duration: this.duration });
  }

  setVolume(val) {
    const clamped = Math.max(0, Math.min(val, 1));
    this.volume = clamped;
    this.htmlAudio.volume = this.isMuted ? 0 : this.volume;

    if (this.synthMasterGain && this.audioCtx) {
      this.synthMasterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.18, this.audioCtx.currentTime);
    }

    storage.savePreferences({ volume: this.volume });
    this.emit('volumechange', { volume: this.volume, isMuted: this.isMuted });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.setVolume(this.volume);
    storage.savePreferences({ muted: this.isMuted });
    this.emit('volumechange', { volume: this.volume, isMuted: this.isMuted });
    return this.isMuted;
  }

  /* --- Acoustic Harmonic Mood Synthesizer --- */
  startFrequencyAudio() {
    this.stopFrequencyAudio();
    this.lastTickTime = performance.now();

    // Timer tick to advance currentTime and trigger notes
    this.freqTimer = setInterval(() => {
      if (!this.isPlaying) return;
      const now = performance.now();
      const deltaSec = (now - this.lastTickTime) / 1000;
      this.lastTickTime = now;

      this.currentTime += deltaSec;
      if (this.currentTime >= this.duration) {
        this.currentTime = this.duration;
        this.pause();
        this.emit('ended', { track: this.currentTrack });
        return;
      }

      this.emit('timeupdate', { currentTime: this.currentTime, duration: this.duration });
    }, 100);

    // Periodic harmonic tone generation matching mood frequency
    this.playMoodHarmonics();
    this.synthInterval = setInterval(() => {
      if (this.isPlaying && this.playbackMode === 'frequency') {
        this.playMoodHarmonics();
      }
    }, 3200);
  }

  stopFrequencyAudio() {
    if (this.freqTimer) {
      clearInterval(this.freqTimer);
      this.freqTimer = null;
    }
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  playMoodHarmonics() {
    if (!this.audioCtx || this.isMuted || !this.synthMasterGain) return;

    const moodChords = {
      Happy: [261.63, 329.63, 392.00, 523.25], // C Major
      Chill: [220.00, 261.63, 329.63, 392.00], // A Minor 7
      Energetic: [293.66, 369.99, 440.00, 587.33], // D Major Power
      Romantic: [329.63, 392.00, 493.88, 659.25], // E Minor Warmth
      Sad: [196.00, 233.08, 293.66, 349.23], // G Minor Melancholy
      Focus: [174.61, 220.00, 261.63, 349.23], // F Major Zen Ambient
      Party: [349.23, 440.00, 523.25, 659.25], // F Major 7 Club
      Travel: [246.94, 293.66, 369.99, 493.88] // B Minor Flow
    };

    const mood = this.currentTrack?.mood || 'Chill';
    const freqs = moodChords[mood] || moodChords.Chill;
    const now = this.audioCtx.currentTime;

    freqs.forEach((freq, idx) => {
      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        // Lowpass filter for smooth, warm acoustic aesthetic
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800 + idx * 200, now);
        filter.Q.setValueAtTime(1.5, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12 / (idx + 1), now + 0.4 + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.synthMasterGain);

        osc.start(now + idx * 0.15);
        osc.stop(now + 3.1);
      } catch (e) {
        // Silently catch audio ctx quirks
      }
    });
  }

  /* --- Event Emitter --- */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in event listener for ${event}:`, e);
        }
      }
    }
  }
}

export const audioEngine = new AudioEngine();
