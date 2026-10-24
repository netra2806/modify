import { SONGS } from './data/songs.js';
import { MOODS, getMoodById } from './data/moods.js';
import { storage } from './services/storage.js';
import { audioEngine } from './services/audioEngine.js';
import { Hero } from './components/hero.js';
import { MoodSelector } from './components/moodSelector.js';
import { LanguageFilter } from './components/languageFilter.js';
import { TrackList } from './components/trackList.js';
import { Player } from './components/player.js';
import { LyricsPanel } from './components/lyricsPanel.js';
import { SearchBar } from './components/search.js';
import { Navigation } from './components/navigation.js';
import { toast } from './components/toast.js';

class ModifyApp {
  constructor() {
    this.allTracks = SONGS;
    this.filteredTracks = [...SONGS];
    this.activeMood = null;
    this.activeLanguage = 'All';
    this.searchQuery = '';
    this.currentTab = 'home';

    this.init();
  }

  init() {
    // 1. Navigation
    const sidebarEl = document.querySelector('.app-sidebar');
    const mobileNavEl = document.querySelector('.mobile-bottom-nav');
    this.navigation = new Navigation(
      sidebarEl,
      mobileNavEl,
      (tab) => this.handleNavigation(tab),
      (moodId) => this.handleMoodShortcut(moodId)
    );

    // 2. Search
    const searchContainer = document.querySelector('.search-wrapper');
    this.searchBar = new SearchBar(searchContainer, (query) => {
      this.searchQuery = query;
      this.applyFilters();
    });

    // 3. Hero Section
    const heroContainer = document.getElementById('hero-mount');
    this.hero = new Hero(
      heroContainer,
      () => this.shuffleAndPlay(),
      () => {
        const moodsSection = document.getElementById('moods-section');
        if (moodsSection) moodsSection.scrollIntoView({ behavior: 'smooth' });
      },
      (track) => this.player.openAudioModal(track)
    );

    // 4. Mood Selector
    const moodGridContainer = document.getElementById('mood-grid-mount');
    this.moodSelector = new MoodSelector(moodGridContainer, (moodId) => {
      this.activeMood = moodId;
      this.applyFilters();
    });

    // 5. Language Filter
    const langFilterContainer = document.getElementById('lang-filter-mount');
    this.languageFilter = new LanguageFilter(langFilterContainer, (lang) => {
      this.activeLanguage = lang;
      this.applyFilters();
    });

    // 6. Track List
    const trackListContainer = document.getElementById('track-list-mount');
    this.trackList = new TrackList(
      trackListContainer,
      (track) => this.playTrack(track),
      (track) => this.player.openAudioModal(track)
    );

    // 7. Lyrics Panel
    const lyricsOverlay = document.getElementById('lyrics-overlay');
    this.lyricsPanel = new LyricsPanel(lyricsOverlay);

    // 8. Persistent Bottom Player
    const playerBar = document.querySelector('.player-bar');
    this.player = new Player(
      playerBar,
      () => this.playNextTrack(),
      () => this.playPrevTrack(),
      () => this.lyricsPanel.toggle()
    );

    // 9. Shuffle Button inside filter bar
    const filterShuffleBtn = document.getElementById('filter-shuffle-btn');
    if (filterShuffleBtn) {
      filterShuffleBtn.addEventListener('click', () => {
        this.shuffleFilteredTracks();
      });
    }

    // 10. Global Custom Events
    window.addEventListener('modify:apply-suggestion', (e) => {
      const val = e.detail?.value;
      if (val === 'All') {
        this.resetAllFilters();
      } else if (['Happy', 'Chill', 'Energetic', 'Romantic', 'Sad', 'Focus', 'Party', 'Travel'].includes(val)) {
        this.activeMood = val.toLowerCase();
        this.moodSelector.setActiveMood(this.activeMood);
        this.searchBar.setQuery('');
        this.applyFilters();
      } else if (['Hindi', 'Marathi', 'English'].includes(val)) {
        this.activeLanguage = val;
        this.languageFilter.setActiveLanguage(val);
        this.searchBar.setQuery('');
        this.applyFilters();
      } else {
        this.searchBar.setQuery(val);
      }
    });

    // 11. Global Keyboard Controls
    this.initKeyboardControls();

    // 12. Calculate initial track counts and render initial track
    this.updateMoodCounts();
    this.updateLanguageCounts();
    this.applyFilters();

    // Load first track into player ready to play
    if (this.allTracks.length > 0) {
      this.player.updateTrackInfo(this.allTracks[0], 'frequency', null);
      audioEngine.loadTrack(this.allTracks[0], false);
    }
  }

  applyFilters() {
    let result = [...this.allTracks];

    // Handle tab filtering
    if (this.currentTab === 'favourites') {
      const favs = storage.getFavourites();
      result = result.filter(t => favs.includes(t.id));
    } else if (this.currentTab === 'mix') {
      result = this.generateYourMix();
    }

    // Filter by Mood
    if (this.activeMood) {
      result = result.filter(t => t.mood.toLowerCase() === this.activeMood.toLowerCase());
    }

    // Filter by Language
    if (this.activeLanguage && this.activeLanguage !== 'All') {
      result = result.filter(t => t.language.toLowerCase() === this.activeLanguage.toLowerCase());
    }

    // Filter by Search Query
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.mood.toLowerCase().includes(q) ||
        t.language.toLowerCase().includes(q) ||
        (t.album && t.album.toLowerCase().includes(q)) ||
        (t.devanagariTitle && t.devanagariTitle.includes(q)) ||
        (t.devanagariArtist && t.devanagariArtist.includes(q))
      );
    }

    this.filteredTracks = result;
    this.trackList.setTracks(this.filteredTracks);
    this.updateSectionHeaders();
    this.updateLanguageCounts();
  }

  updateSectionHeaders() {
    const titleEl = document.getElementById('catalog-title');
    const subtitleEl = document.getElementById('catalog-subtitle');
    const heroMount = document.getElementById('hero-mount');
    const moodsMount = document.getElementById('moods-section');

    if (this.currentTab === 'favourites') {
      if (heroMount) heroMount.style.display = 'none';
      if (moodsMount) moodsMount.style.display = 'none';
      if (titleEl) titleEl.textContent = 'Your Favourites';
      if (subtitleEl) subtitleEl.textContent = `${this.filteredTracks.length} tracks saved to your local frequency library`;
      return;
    }

    if (this.currentTab === 'mix') {
      if (heroMount) heroMount.style.display = 'none';
      if (moodsMount) moodsMount.style.display = 'none';
      if (titleEl) titleEl.textContent = 'Your Mix';
      if (subtitleEl) subtitleEl.textContent = 'Personalized blend curated from your favourite moods, languages, and recent frequencies';
      return;
    }

    if (this.currentTab === 'moods') {
      if (heroMount) heroMount.style.display = 'none';
      if (moodsMount) moodsMount.style.display = 'block';
    } else {
      if (heroMount) heroMount.style.display = 'block';
      if (moodsMount) moodsMount.style.display = 'block';
    }

    if (this.activeMood) {
      const moodObj = getMoodById(this.activeMood);
      if (titleEl) titleEl.textContent = `${moodObj ? moodObj.emoji : ''} ${moodObj ? moodObj.name : ''} Anthems`;
      if (subtitleEl) subtitleEl.textContent = moodObj ? `${moodObj.description} (${this.filteredTracks.length} tracks)` : '';
    } else if (this.searchQuery) {
      if (titleEl) titleEl.textContent = `Search: "${this.searchQuery}"`;
      if (subtitleEl) subtitleEl.textContent = `Found ${this.filteredTracks.length} matching tracks`;
    } else {
      if (titleEl) titleEl.textContent = 'All Frequencies';
      if (subtitleEl) subtitleEl.textContent = `49 Hindi, Marathi & English tracks across 8 curated moods`;
    }
  }

  updateMoodCounts() {
    const counts = {};
    MOODS.forEach(m => {
      counts[m.name] = this.allTracks.filter(t => t.mood.toLowerCase() === m.id.toLowerCase()).length;
    });
    this.moodSelector.setTrackCounts(counts);
  }

  updateLanguageCounts() {
    // Calculate counts based on current mood selection
    let base = [...this.allTracks];
    if (this.activeMood) {
      base = base.filter(t => t.mood.toLowerCase() === this.activeMood.toLowerCase());
    }
    if (this.currentTab === 'favourites') {
      const favs = storage.getFavourites();
      base = base.filter(t => favs.includes(t.id));
    }

    const counts = {
      All: base.length,
      Hindi: base.filter(t => t.language.toLowerCase() === 'hindi').length,
      Marathi: base.filter(t => t.language.toLowerCase() === 'marathi').length,
      English: base.filter(t => t.language.toLowerCase() === 'english').length
    };
    this.languageFilter.setCounts(counts);
  }

  generateYourMix() {
    const favs = storage.getFavourites();
    const recents = storage.getRecentlyPlayed();

    // Prefer tracks in favourites or recents, plus high-energy and chill balance
    const mix = [];
    const addedIds = new Set();

    // Add recent & favs
    [...favs, ...recents].forEach(id => {
      const trk = this.allTracks.find(t => t.id === id);
      if (trk && !addedIds.has(trk.id)) {
        mix.push(trk);
        addedIds.add(trk.id);
      }
    });

    // Fill the rest with a diverse mood/language mix
    this.allTracks.forEach(trk => {
      if (!addedIds.has(trk.id) && mix.length < 24) {
        mix.push(trk);
        addedIds.add(trk.id);
      }
    });

    return mix;
  }

  handleNavigation(tab) {
    this.currentTab = tab;
    this.searchQuery = '';
    this.searchBar.setQuery('');

    if (tab === 'home') {
      this.activeMood = null;
      this.moodSelector.setActiveMood(null);
    } else if (tab === 'moods') {
      const moodsSection = document.getElementById('moods-section');
      if (moodsSection) moodsSection.scrollIntoView({ behavior: 'smooth' });
    }

    this.applyFilters();
  }

  handleMoodShortcut(moodId) {
    this.currentTab = 'home';
    this.navigation.setActiveTab('home');
    this.activeMood = moodId;
    this.moodSelector.setActiveMood(moodId);
    this.searchBar.setQuery('');
    this.applyFilters();

    const trackSection = document.getElementById('catalog-section');
    if (trackSection) {
      trackSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  resetAllFilters() {
    this.activeMood = null;
    this.activeLanguage = 'All';
    this.searchQuery = '';
    this.moodSelector.setActiveMood(null);
    this.languageFilter.setActiveLanguage('All');
    this.searchBar.setQuery('');
    this.applyFilters();
  }

  playTrack(track) {
    if (!track) return;
    if (audioEngine.currentTrack?.id === track.id) {
      audioEngine.togglePlay();
    } else {
      audioEngine.loadTrack(track, true);
    }
  }

  playNextTrack() {
    const list = this.filteredTracks.length > 0 ? this.filteredTracks : this.allTracks;
    if (list.length === 0) return;

    if (this.player.isShuffle) {
      const randomIdx = Math.floor(Math.random() * list.length);
      audioEngine.loadTrack(list[randomIdx], true);
      return;
    }

    const currentIdx = list.findIndex(t => t.id === audioEngine.currentTrack?.id);
    const nextIdx = (currentIdx + 1) % list.length;
    audioEngine.loadTrack(list[nextIdx], true);
  }

  playPrevTrack() {
    const list = this.filteredTracks.length > 0 ? this.filteredTracks : this.allTracks;
    if (list.length === 0) return;

    if (audioEngine.currentTime > 3) {
      audioEngine.seek(0);
      return;
    }

    const currentIdx = list.findIndex(t => t.id === audioEngine.currentTrack?.id);
    const prevIdx = (currentIdx - 1 + list.length) % list.length;
    audioEngine.loadTrack(list[prevIdx], true);
  }

  shuffleAndPlay() {
    const randomIdx = Math.floor(Math.random() * this.allTracks.length);
    const track = this.allTracks[randomIdx];
    audioEngine.loadTrack(track, true);
    toast.show(`Shuffled to "${track.title}"`, 'info');
  }

  shuffleFilteredTracks() {
    if (this.filteredTracks.length === 0) return;
    const randomIdx = Math.floor(Math.random() * this.filteredTracks.length);
    const track = this.filteredTracks[randomIdx];
    audioEngine.loadTrack(track, true);
    toast.show(`Shuffled in selection: "${track.title}"`, 'info');
  }

  initKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        audioEngine.togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        audioEngine.seek(audioEngine.currentTime + 5);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        audioEngine.seek(audioEngine.currentTime - 5);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        const isMuted = audioEngine.toggleMute();
        toast.show(isMuted ? 'Muted' : 'Unmuted', 'info', 1500);
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        this.lyricsPanel.toggle();
      }
    });
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  window.modifyApp = new ModifyApp();
});
