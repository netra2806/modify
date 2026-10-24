export const MOODS = [
  {
    id: 'happy',
    name: 'Happy',
    tagline: 'Good vibes only',
    emoji: '☀️',
    description: 'Upbeat rhythms, sunshine melodies, and instant smile-inducing anthems.',
    color: '#EAB308',
    gradient: 'linear-gradient(135deg, rgba(234, 179, 8, 0.3), rgba(184, 243, 91, 0.2))',
    borderColor: 'rgba(234, 179, 8, 0.4)',
    accentColor: '#B8F35B'
  },
  {
    id: 'chill',
    name: 'Chill',
    tagline: 'Slow down and breathe',
    emoji: '🌊',
    description: 'Laid-back acoustic chords, serene vocals, and calming ambient warmth.',
    color: '#06B6D4',
    gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(59, 130, 246, 0.2))',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    accentColor: '#06B6D4'
  },
  {
    id: 'energetic',
    name: 'Energetic',
    tagline: 'Turn it all the way up',
    emoji: '⚡',
    description: 'High-octane beats, thumping basslines, and adrenaline-pumping anthems.',
    color: '#F97316',
    gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(239, 68, 68, 0.2))',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    accentColor: '#F97316'
  },
  {
    id: 'romantic',
    name: 'Romantic',
    tagline: 'For the butterflies',
    emoji: '💗',
    description: 'Soulful poetry, tender harmonies, and heart-melting romantic serenades.',
    color: '#EC4899',
    gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(244, 63, 94, 0.2))',
    borderColor: 'rgba(236, 72, 153, 0.4)',
    accentColor: '#EC4899'
  },
  {
    id: 'sad',
    name: 'Sad',
    tagline: 'Feel it, heal it',
    emoji: '🌧️',
    description: 'Poignant melodies, heartfelt lyrics, and a gentle companion for your thoughts.',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.2))',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    accentColor: '#8B5CF6'
  },
  {
    id: 'focus',
    name: 'Focus',
    tagline: 'Get in your zone',
    emoji: '🌿',
    description: 'Minimalist soundscapes, steady rhythms, and zero-distraction flow state tracks.',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2))',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    accentColor: '#10B981'
  },
  {
    id: 'party',
    name: 'Party',
    tagline: 'Main character energy',
    emoji: '🪩',
    description: 'Irresistible dancefloor drops, desi dhol beats, and club bangers.',
    color: '#D946EF',
    gradient: 'linear-gradient(135deg, rgba(217, 70, 239, 0.3), rgba(168, 85, 247, 0.2))',
    borderColor: 'rgba(217, 70, 239, 0.4)',
    accentColor: '#D946EF'
  },
  {
    id: 'travel',
    name: 'Travel',
    tagline: 'Road-trip soundtrack',
    emoji: '🚗',
    description: 'Open-road anthems, scenic guitars, and wanderlust vibrations for your journey.',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(234, 88, 12, 0.2))',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    accentColor: '#F59E0B'
  }
];

export function getMoodById(id) {
  if (!id) return null;
  return MOODS.find(m => m.id.toLowerCase() === id.toLowerCase()) || null;
}
