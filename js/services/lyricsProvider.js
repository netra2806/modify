import { CURATED_LYRICS } from '../data/curatedLyrics.js';

class LyricsProvider {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Parse LRC formatted string into structured timestamped lines
   * @param {string} lrcString
   * @returns {Array<{ time: number, text: string, stanzaIndex: number }>}
   */
  parseLRC(lrcString) {
    if (!lrcString || typeof lrcString !== 'string') return [];

    const lines = lrcString.split(/\r?\n/);
    const parsed = [];
    const timestampRegex = /\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Extract all timestamps in the line (some LRC files have multiple timestamps per line)
      const matches = [...trimmed.matchAll(timestampRegex)];
      if (matches.length === 0) continue;

      const text = trimmed.replace(timestampRegex, '').trim();
      // Skip metadata tags like [ar: Artist], [ti: Title], etc.
      if (!text && matches.length > 0 && trimmed.startsWith('[') && trimmed.includes(':')) {
        continue;
      }

      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const fraction = match[3] ? parseFloat('0.' + match[3]) : 0;
        const timeInSeconds = minutes * 60 + seconds + fraction;

        parsed.push({
          time: timeInSeconds,
          text: text
        });
      }
    }

    // Sort by timestamp
    parsed.sort((a, b) => a.time - b.time);

    // Group into stanzas based on pauses (> 5.5s gap between lines)
    let currentStanza = 0;
    for (let i = 0; i < parsed.length; i++) {
      if (i > 0) {
        const gap = parsed[i].time - parsed[i - 1].time;
        if (gap > 5.5) {
          currentStanza++;
        }
      }
      parsed[i].stanzaIndex = currentStanza;
    }

    return parsed;
  }

  /**
   * Cleans primary artist name for search matching (e.g. "Arijit Singh, Shreya Ghoshal" -> "Arijit Singh")
   */
  getPrimaryArtist(artistStr) {
    if (!artistStr) return '';
    return artistStr.split(/,|&|feat\.|ft\.|and|\//i)[0].trim();
  }

  /**
   * Fetch lyrics for a song from curated cache or LRCLIB API
   */
  async getLyrics(song, useDevanagari = false) {
    if (!song) return null;

    const cacheKey = `${song.id}_${useDevanagari ? 'dev' : 'lat'}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check pre-cached verified database first
    const curated = CURATED_LYRICS[song.title];
    if (curated) {
      let lrcText = curated.syncedLyrics;
      if (useDevanagari && curated.devanagariLyrics) {
        lrcText = curated.devanagariLyrics;
      }

      const parsedLines = lrcText ? this.parseLRC(lrcText) : [];
      const result = {
        hasLyrics: Boolean(lrcText || curated.plainLyrics),
        isSynced: parsedLines.length > 0,
        syncedLines: parsedLines,
        plainLyrics: curated.plainLyrics || (parsedLines.length > 0 ? parsedLines.map(l => l.text).join('\n') : ''),
        source: curated.source || 'Verified Source',
        sourceUrl: curated.sourceUrl || `https://www.musixmatch.com/search/${encodeURIComponent(song.title)}`,
        canToggleDevanagari: Boolean(curated.devanagariLyrics),
        isDevanagari: useDevanagari && Boolean(curated.devanagariLyrics)
      };

      this.cache.set(cacheKey, result);
      return result;
    }

    // Attempt live LRCLIB lookup
    const primaryArtist = this.getPrimaryArtist(song.artist);
    const cleanTitle = song.title.replace(/[’']/g, "'").trim();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Try exact match endpoint
      const getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(primaryArtist)}`;
      let res = await fetch(getUrl, {
        headers: { 'User-Agent': 'ModifyMusicDiscovery/1.0' },
        signal: controller.signal
      });

      let data = null;
      if (res.ok) {
        data = await res.json();
      } else {
        // Fallback to LRCLIB search endpoint
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle + ' ' + primaryArtist)}`;
        const searchRes = await fetch(searchUrl, {
          headers: { 'User-Agent': 'ModifyMusicDiscovery/1.0' },
          signal: controller.signal
        });
        if (searchRes.ok) {
          const list = await searchRes.json();
          if (Array.isArray(list) && list.length > 0) {
            // Find best matching track
            data = list.find(item => item.syncedLyrics || item.plainLyrics) || list[0];
          }
        }
      }

      clearTimeout(timeoutId);

      if (data && (data.syncedLyrics || data.plainLyrics)) {
        const parsedLines = data.syncedLyrics ? this.parseLRC(data.syncedLyrics) : [];
        const result = {
          hasLyrics: true,
          isSynced: parsedLines.length > 0,
          syncedLines: parsedLines,
          plainLyrics: data.plainLyrics || parsedLines.map(l => l.text).join('\n'),
          source: 'LRCLIB (Open Lyrics Database)',
          sourceUrl: 'https://lrclib.net',
          canToggleDevanagari: false,
          isDevanagari: false
        };
        this.cache.set(cacheKey, result);
        return result;
      }
    } catch (e) {
      console.warn(`[LyricsProvider] Live fetch failed for "${song.title}":`, e.message);
    }

    // Graceful fallback when no authorized lyrics are available
    const fallbackResult = {
      hasLyrics: false,
      isSynced: false,
      syncedLines: [],
      plainLyrics: '',
      message: "Lyrics aren't available for this track yet.",
      source: 'External Licensing Directory',
      sourceUrl: `https://www.musixmatch.com/search/${encodeURIComponent(song.title + ' ' + song.artist)}`,
      geniusUrl: `https://genius.com/search?q=${encodeURIComponent(song.title + ' ' + song.artist)}`,
      canToggleDevanagari: false,
      isDevanagari: false
    };

    this.cache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}

export const lyricsProvider = new LyricsProvider();
