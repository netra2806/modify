# MODIFY — Find Your Frequency 🎧

> **Feel it. Play it.**  
> *From Hindi hits to Marathi melodies and English anthems — there's a soundtrack for every version of you.*

MODIFY is a modern, responsive, and privacy-respecting music discovery web platform designed to match your emotional frequency with songs across **Hindi**, **Marathi**, and **English**.

Featuring **8 interactive mood categories**, **real-time synced karaoke lyrics**, **Devanagari script rendering**, **harmonic acoustic audio playback**, and **authorized streaming provider integration**.

---

## ✨ Features & Architecture

### 1. 🌈 8 Mood-Based Frequencies
- ☀️ **Happy** — Good vibes only
- 🌊 **Chill** — Slow down and breathe
- ⚡ **Energetic** — Turn it all the way up
- 💗 **Romantic** — For the butterflies
- 🌧️ **Sad** — Feel it, heal it
- 🌿 **Focus** — Get in your zone
- 🪩 **Party** — Main character energy
- 🚗 **Travel** — Road-trip soundtrack

Each mood features a distinctive aesthetic aura, atmospheric backdrop glow, and custom SVG vinyl artwork.

### 2. 🎶 Comprehensive Catalogue (49 Tracks)
Complete metadata integration directly from `data/MODIFY_Song_List.csv`:
- **Hindi Hits**: Arijit Singh, Mohit Chauhan, Jasleen Royal, Agnee, Lucky Ali, Alka Yagnik, etc.
- **Marathi Melodies**: Ajay–Atul, Bela Shende, Shankar Mahadevan, Avadhoot Gupte, Anand Shinde, Swapnil Bandodkar, etc.
- **English Anthems**: Imagine Dragons, Coldplay, Ed Sheeran, Billie Eilish, Dua Lipa, OneRepublic, Adele, etc.

### 3. 🎙️ Live Karaoke Lyrics Experience
- **Line-by-line synchronisation**: Active lyric line highlighted with brand lime-green accent (`#B8F35B`) and glowing focus.
- **Stanza grouping**: Natural spacing between verses and visual elevation of the active stanza.
- **Smooth auto-scrolling**: The viewport tracks playback smoothly without jarring jumps.
- **Click-to-seek**: Clicking on any lyric line seeks audio playback directly to that second.
- **Devanagari script support**: Full font rendering (`Noto Sans Devanagari`) and toggle between Devanagari (देवनागरी) and Latin/Roman transliteration for Hindi and Marathi songs.
- **Synced vs. Full Text mode**: Toggle between karaoke auto-follow and readable full text.
- **LRCLIB Integration & Fallback**: Real API queries with in-memory caching and graceful fallback notices with direct links to Musixmatch / Genius.

### 4. 🔊 Dual Audio Playback Engine
1. **MODIFY Acoustic Frequency Engine (Web Audio API)**:
   - Built-in harmonic synthesizer generating pleasant ambient chord progressions matching the mood's tempo and key.
   - 100% legal, zero external audio dependency, works offline, and advances playback position to drive live synchronized lyrics.
2. **Personal Authorised Audio File Loader**:
   - Allows users to drag-and-drop or load their own legally owned audio file (MP3, WAV, FLAC, M4A, OGG) to pair with any track.
   - Files are decoded entirely in the client's browser using HTML5 `<audio>` and `URL.createObjectURL` (zero server upload, total privacy).
3. **Direct Authorized Streaming Links**:
   - 1-click links for every song to stream on **Spotify**, **YouTube Music**, **Apple Music**, and **JioSaavn**.

### 5. ⌨️ Keyboard Accessibility
- `Space`: Play / Pause
- `← / →`: Seek -5s / +5s
- `M`: Toggle Mute
- `L`: Open / Toggle Lyrics Panel
- `/`: Quick focus search bar
- `Esc`: Close Lyrics Panel or Modals

---

## 🚀 Quick Start & Local Development

This project is built using modern vanilla Web standards (ES Modules, CSS3 Custom Properties, HTML5 Audio & Web Audio API) with **zero build step requirements**.

### Running Locally

You can use Python's built-in web server:

```bash
# Navigate to the project root
cd /path/to/moodify

# Start a local static HTTP server
python3 -m http.server 3000
```

Open your browser at:
```
http://localhost:3000
```

Alternatively, if you use Node.js:
```bash
npx serve .
```

---

## 🌐 Publishing to GitHub Pages

Because MODIFY requires zero build steps and uses standard relative imports, it is **100% ready for GitHub Pages**.

### Step-by-Step GitHub Pages Deployment:

1. **Initialize Git and commit the files**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of MODIFY music discovery website"
   ```

2. **Create a new repository on GitHub**:
   - Go to [GitHub.com/new](https://github.com/new)
   - Name your repository (e.g., `modify-music` or `moodify`)
   - Keep it Public (required for free GitHub Pages)
   - Do **not** initialize with a README (we already have one)

3. **Link your local repository and push**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/modify-music.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages**:
   - Go to your repository on GitHub.
   - Click **Settings** (gear icon) → **Pages** (in the left sidebar).
   - Under **Build and deployment** > **Source**, select **Deploy from a branch**.
   - Under **Branch**, select `main` and `/ (root)`.
   - Click **Save**.

5. **Your Site is Live**:
   Within 1–2 minutes, GitHub will publish your site to:
   ```
   https://YOUR_USERNAME.github.io/modify-music/
   ```

---

## 🔒 Legal & Licensing Compliance

- **No Unauthorized Audio Distribution**: MODIFY does not host, redistribute, scrape, or extract copyrighted MP3 or AAC recordings.
- **Audio Playback**: The platform utilizes client-side Web Audio harmonic mood synthesis for timecode demonstration, supports personal authorized file loading, and directs users to official licensed streaming platforms (Spotify, YouTube Music, Apple Music, JioSaavn).
- **Lyric Data**: Sourced from [LRCLIB](https://lrclib.net), an open community lyrics database. Where verified lyrics are unavailable, a clean message directs users to licensed publishers on Musixmatch and Genius. No artificial or hallucinated lyrics are displayed.

---

## 📂 Project Structure

```
moodify/
├── index.html                   # Semantic HTML5 root with SEO metadata
├── README.md                    # Project documentation & deployment guide
├── data/
│   ├── MODIFY_Song_List.csv     # Original 49-song catalogue
│   ├── MODIFY_Song_List.txt     # Grouped song catalogue
│   └── README.txt               # Dataset notes
├── css/
│   ├── variables.css            # Dark charcoal #101114 & Lime #B8F35B tokens
│   ├── reset.css                # Base reset & accessible styling
│   ├── layout.css               # Sidebar, topbar, grid & atmospheric glows
│   ├── components.css           # Mood cards, track list, hero & badges
│   ├── player.css               # Persistent bottom player & scrubber
│   ├── lyrics.css               # Live synced karaoke lyrics panel
│   └── responsive.css           # Mobile navigation bar & tablet layout
└── js/
    ├── app.js                   # Application bootstrap & coordinator
    ├── data/
    │   ├── songs.js             # 49 tracks with rich metadata & streaming URLs
    │   ├── moods.js             # 8 mood categories with color palettes
    │   └── curatedLyrics.js     # Pre-cached verified synced LRC data
    ├── services/
    │   ├── audioEngine.js       # Dual audio engine (Web Audio + HTML5 file loader)
    │   ├── lyricsProvider.js    # LRCLIB API client, LRC parser & caching
    │   └── storage.js           # LocalStorage favorites & preferences
    └── components/
        ├── artwork.js           # SVG album artwork generator
        ├── hero.js              # Hero banner component
        ├── moodSelector.js      # 8 interactive mood category cards
        ├── languageFilter.js    # Hindi, Marathi & English filter pills
        ├── trackList.js         # Interactive track list table & dropdowns
        ├── player.js            # Persistent player controls & audio modal
        ├── lyricsPanel.js       # Synced karaoke lyrics panel
        ├── search.js            # Live search input component
        ├── navigation.js        # Sidebar & mobile bottom nav
        └── toast.js             # Toast notification feedback
```

---

## 💻 Tech Stack
- **Structure**: Vanilla HTML5, Semantic Elements, ARIA accessibility attributes
- **Styling**: Modular CSS3, CSS Custom Properties, Glassmorphism, Micro-animations
- **Logic**: Vanilla ES2022 JavaScript Modules (zero build tools needed, fast & portable)
- **Audio**: Web Audio API (`AudioContext`, `BiquadFilterNode`, `OscillatorNode`) + HTML5 Audio
- **Lyrics**: LRCLIB REST API & LRC Timestamp parser
- **Typography**: Plus Jakarta Sans, Outfit, Noto Sans Devanagari, JetBrains Mono
