import { getMoodById } from '../data/moods.js';

const MOOD_GRADIENTS = {
  Happy: ['#F59E0B', '#B8F35B', '#101114'],
  Chill: ['#06B6D4', '#3B82F6', '#101114'],
  Energetic: ['#F97316', '#EF4444', '#101114'],
  Romantic: ['#EC4899', '#BE185D', '#101114'],
  Sad: ['#8B5CF6', '#4F46E5', '#101114'],
  Focus: ['#10B981', '#047857', '#101114'],
  Party: ['#D946EF', '#9333EA', '#101114'],
  Travel: ['#F59E0B', '#EA580C', '#101114']
};

/**
 * Generates an SVG Data URI or inline HTML for a track cover
 * @param {object} track
 * @param {number} size
 * @returns {string} SVG HTML string
 */
export function renderTrackArtwork(track, size = 64, className = 'track-art') {
  if (!track) {
    return `<div class="${className} placeholder" style="width:${size}px; height:${size}px;"></div>`;
  }

  const moodColors = MOOD_GRADIENTS[track.mood] || ['#B8F35B', '#10B981', '#101114'];
  const [c1, c2, c3] = moodColors;
  const mood = getMoodById(track.mood);
  const emoji = mood ? mood.emoji : '🎵';
  
  // Deterministic seed based on track id/title for varied pattern geometry
  const seed = (track.title.charCodeAt(0) + (track.artist.charCodeAt(0) || 0)) % 4;

  return `
    <div class="${className}" style="width: ${size}px; height: ${size}px;" aria-label="Cover art for ${escapeHtml(track.title)}">
      <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="art-grad-${track.id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${c1}" stop-opacity="0.9" />
            <stop offset="50%" stop-color="${c2}" stop-opacity="0.7" />
            <stop offset="100%" stop-color="${c3}" stop-opacity="0.95" />
          </linearGradient>
          <radialGradient id="art-glow-${track.id}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25" />
            <stop offset="100%" stop-color="${c1}" stop-opacity="0" />
          </radialGradient>
        </defs>

        <!-- Background base -->
        <rect width="100" height="100" rx="16" fill="url(#art-grad-${track.id})" />

        <!-- Vinyl Grooves / Waveform rings -->
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1.2" />
        <circle cx="50" cy="50" r="32" fill="none" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.2" />
        <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.2" />

        <!-- Mood Visualizer Bars / Center Core -->
        <circle cx="50" cy="50" r="14" fill="#101114" stroke="${c1}" stroke-width="2" />
        <circle cx="50" cy="50" r="5" fill="#B8F35B" />

        <!-- Accent light overlay -->
        <rect width="100" height="100" rx="16" fill="url(#art-glow-${track.id})" />

        <!-- Subtle Mood Badge -->
        <text x="82" y="24" font-size="14" text-anchor="middle" opacity="0.9">${emoji}</text>
      </svg>
    </div>
  `;
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
