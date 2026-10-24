const FAVOURITES_KEY = 'modify_favourites_v1';
const RECENTLY_PLAYED_KEY = 'modify_recent_v1';
const PREFERENCES_KEY = 'modify_preferences_v1';

export const storage = {
  getFavourites() {
    try {
      const data = localStorage.getItem(FAVOURITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isFavourite(trackId) {
    const favs = this.getFavourites();
    return favs.includes(trackId);
  },

  toggleFavourite(trackId) {
    let favs = this.getFavourites();
    const index = favs.indexOf(trackId);
    let isFav = false;

    if (index > -1) {
      favs.splice(index, 1);
      isFav = false;
    } else {
      favs.unshift(trackId);
      isFav = true;
    }

    try {
      localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favs));
    } catch (e) {
      console.warn('Failed to save favourites to localStorage', e);
    }

    window.dispatchEvent(new CustomEvent('modify:favourites-changed', {
      detail: { trackId, isFavourite: isFav, count: favs.length }
    }));

    return isFav;
  },

  getRecentlyPlayed() {
    try {
      const data = localStorage.getItem(RECENTLY_PLAYED_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addRecentlyPlayed(trackId) {
    if (!trackId) return;
    let recent = this.getRecentlyPlayed();
    // Remove if already exists so we can move it to the top
    recent = recent.filter(id => id !== trackId);
    recent.unshift(trackId);
    // Keep top 20
    if (recent.length > 20) {
      recent = recent.slice(0, 20);
    }
    try {
      localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(recent));
    } catch (e) {
      console.warn('Failed to save recently played', e);
    }

    window.dispatchEvent(new CustomEvent('modify:recent-changed', {
      detail: { trackId, recent }
    }));
  },

  getPreferences() {
    const defaults = {
      volume: 0.85,
      muted: false,
      shuffle: false,
      repeat: 'all', // 'off' | 'all' | 'one'
      useDevanagari: false,
      lyricsMode: 'synced', // 'synced' | 'full'
      audioSourceMode: 'frequency' // 'frequency' | 'custom'
    };
    try {
      const data = localStorage.getItem(PREFERENCES_KEY);
      return data ? { ...defaults, ...JSON.parse(data) } : defaults;
    } catch {
      return defaults;
    }
  },

  savePreferences(prefs) {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...prefs };
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save preferences', e);
    }
  }
};
