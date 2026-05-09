/**
 * FontsShowcasePage — internal /fonts route for picking the Cowculator brand font
 *
 * Round 2: focused exclusively on puffy / balloon / inflated display fonts
 * (the Bagel Fat One vibe, but going further). Two sections:
 *   1. Live previews of free Google Fonts that lean puffy
 *   2. Premium picks worth considering, with links to source foundries
 */

import { useEffect, useMemo, useState } from 'react';

type Vibe = 'inflated' | 'chunky' | 'cartoon' | 'curvy';

type LiveFont = {
  name: string;
  family: string;
  googleParam: string;
  vibe: Vibe;
  weights: number[];
  notes: string;
};

const LIVE_FONTS: LiveFont[] = [
  {
    name: 'Bagel Fat One',
    family: '"Bagel Fat One"',
    googleParam: 'Bagel+Fat+One',
    vibe: 'inflated',
    weights: [400],
    notes: 'Your current favorite. Pure inflated-balloon energy. The benchmark.',
  },
  {
    name: 'Shrikhand',
    family: '"Shrikhand"',
    googleParam: 'Shrikhand',
    vibe: 'inflated',
    weights: [400],
    notes: 'Indian Type Foundry. High-contrast thick rounded — arguably MORE balloon than Bagel. Named after a Gujarati dessert.',
  },
  {
    name: 'Bubblegum Sans',
    family: '"Bubblegum Sans"',
    googleParam: 'Bubblegum+Sans',
    vibe: 'cartoon',
    weights: [400],
    notes: 'Y2K bubble-gum cartoon. Lighter and more playful than Bagel. Saturday morning cartoon vibe.',
  },
  {
    name: 'Luckiest Guy',
    family: '"Luckiest Guy"',
    googleParam: 'Luckiest+Guy',
    vibe: 'cartoon',
    weights: [400],
    notes: 'Comic-book bold cartoon caps. Scoops of personality, slightly old-school.',
  },
  {
    name: 'Bowlby One',
    family: '"Bowlby One"',
    googleParam: 'Bowlby+One',
    vibe: 'inflated',
    weights: [400],
    notes: 'Giant rounded — cousin of the SC version. Massive dimensional presence.',
  },
  {
    name: 'Sansita Swashed',
    family: '"Sansita Swashed"',
    googleParam: 'Sansita+Swashed:wght@400;700;900',
    vibe: 'curvy',
    weights: [400, 700, 900],
    notes: 'Curvy swashed alternates. Goes elegant + bubbly. Heavy weights are very puffy.',
  },
  {
    name: 'Patua One',
    family: '"Patua One"',
    googleParam: 'Patua+One',
    vibe: 'chunky',
    weights: [400],
    notes: 'Chunky slab — bridges puffy and stable. Strong as a logo lockup.',
  },
  {
    name: 'Carter One',
    family: '"Carter One"',
    googleParam: 'Carter+One',
    vibe: 'cartoon',
    weights: [400],
    notes: 'Mid-century pulp / ice-cream sign vibe. Tighter, more refined puffy.',
  },
  {
    name: 'Lemon',
    family: '"Lemon"',
    googleParam: 'Lemon',
    vibe: 'curvy',
    weights: [400],
    notes: 'Vintage-curvy display. A bit citrus-y, a bit retro candy-shop.',
  },
  {
    name: 'Modak',
    family: '"Modak"',
    googleParam: 'Modak',
    vibe: 'inflated',
    weights: [400],
    notes: 'WILDLY chunky cartoon. Bigger, bolder, sillier than Bagel. Hero only.',
  },
  {
    name: 'Lilita One',
    family: '"Lilita One"',
    googleParam: 'Lilita+One',
    vibe: 'chunky',
    weights: [400],
    notes: 'Condensed cartoon chunk. Reads like a Pixar movie title.',
  },
  {
    name: 'Titan One',
    family: '"Titan One"',
    googleParam: 'Titan+One',
    vibe: 'chunky',
    weights: [400],
    notes: 'Bold rounded with confidence. Animation-poster feel.',
  },
  {
    name: 'Knewave',
    family: '"Knewave"',
    googleParam: 'Knewave',
    vibe: 'curvy',
    weights: [400],
    notes: 'Brush-marker bubble. Hand-drawn energy, slight skater vibe.',
  },
  {
    name: 'Bungee',
    family: '"Bungee"',
    googleParam: 'Bungee',
    vibe: 'chunky',
    weights: [400],
    notes: 'Geometric playful — modern signage. Designed for vertical/horizontal stacking.',
  },
  {
    name: 'Black Han Sans',
    family: '"Black Han Sans"',
    googleParam: 'Black+Han+Sans',
    vibe: 'inflated',
    weights: [400],
    notes: 'Korean-inspired thick puffy. Massive vertical strokes. Different feel — try it.',
  },
];

// ─── Premium / non-Google fonts worth considering, with where to find them ────
type PremiumFont = {
  name: string;
  designer: string;
  source: string;            // human-readable source label
  url: string;
  price: string;
  description: string;
  vibe: Vibe;
};

const PREMIUM_FONTS: PremiumFont[] = [
  {
    name: 'Cooper Black',
    designer: 'Oswald Cooper (1922)',
    source: 'Adobe Fonts',
    url: 'https://fonts.adobe.com/fonts/cooper-black',
    price: 'Free with Adobe Creative Cloud',
    description: 'The OG puffy serif — the font that started the whole "soft chunky" lineage. Used on every album cover in the 70s, very current again.',
    vibe: 'inflated',
  },
  {
    name: 'FatFrank',
    designer: 'Jeff Schreiber',
    source: 'Adobe Fonts',
    url: 'https://fonts.adobe.com/fonts/fatfrank',
    price: 'Free with Adobe Creative Cloud',
    description: 'Big-boned and friendly with rounded corners. Modern puffy sans — feels confident without being silly.',
    vibe: 'chunky',
  },
  {
    name: 'RNS Obesa',
    designer: 'Round Saturday',
    source: 'Round Saturday / DaFont',
    url: 'https://www.dfonts.org/fonts/rns-obesa-fat-font/',
    price: 'Free for personal use',
    description: 'Plump, chubby, full of curves with sharp vertices. Very expressive — feels like a candy logo.',
    vibe: 'inflated',
  },
  {
    name: 'Puffy Klocky',
    designer: 'Pixelbuddha',
    source: 'Pixelbuddha',
    url: 'https://pixelbuddha.net/fonts/2884-puffy-kloky-bubble-font',
    price: '~$24',
    description: 'Graffiti × bubble hybrid. Streetwear / sticker culture energy. Edgier than Bagel.',
    vibe: 'inflated',
  },
  {
    name: 'Bublont',
    designer: 'Kaustubh Adhav',
    source: 'Creative Market',
    url: 'https://creativemarket.com/',
    price: '~$15',
    description: 'Four layered styles: Filled, Outline, Shadow, Color. Stack them for true 3D balloon effect.',
    vibe: 'inflated',
  },
  {
    name: 'Baby Balloon',
    designer: 'Dumadistyle',
    source: 'Creative Market',
    url: 'https://creativemarket.com/',
    price: '~$18',
    description: 'Three layered versions (regular, outline, inner shadow). Letters look like shiny inflated balloons.',
    vibe: 'inflated',
  },
  {
    name: 'Marshmallow',
    designer: 'Various',
    source: 'Creative Market',
    url: 'https://creativemarket.com/',
    price: '~$15-20',
    description: 'Thick, soft, pillowy with subtle shading. Looks like the surface of an actual marshmallow.',
    vibe: 'inflated',
  },
  {
    name: 'Jelly Belly',
    designer: 'Various',
    source: 'Envato Elements',
    url: 'https://elements.envato.com/',
    price: 'Subscription (~$16/mo)',
    description: 'Soft, gelatinous, wobbly letterforms with translucent highlights. Squish-tastic.',
    vibe: 'inflated',
  },
  {
    name: 'Chubby Cheeks',
    designer: 'Various',
    source: 'Creative Market / Envato',
    url: 'https://creativemarket.com/',
    price: '~$15',
    description: 'Bold puffy display with exaggerated roundness. Carefully shaded for 3D feel.',
    vibe: 'inflated',
  },
  {
    name: 'Double Bubble 3D',
    designer: 'HipFonts',
    source: 'HipFonts',
    url: 'https://hipfonts.com/portfolio/double-bubble-3d-typeface/',
    price: 'Premium',
    description: 'Outline + regular versions for layered 3D bubble effects. The bubbliest, fluffiest.',
    vibe: 'inflated',
  },
  {
    name: 'Hubble Bubble',
    designer: 'Artcoast Fonts',
    source: 'Creative Market / Envato',
    url: 'https://creativemarket.com/artcoastfonts/10853973-Hubble-Bubble-Font',
    price: '~$14',
    description: '70s × bubble vibe. Decorative, playful, nostalgic.',
    vibe: 'curvy',
  },
  {
    name: 'Kelsi',
    designer: 'Misha Vlasov',
    source: 'PixelSurplus',
    url: 'https://pixelsurplus.com/products/kelsi-free-graffiti-style-bubble-font',
    price: 'FREE',
    description: 'Filled + outlined versions. Cute graffiti-bubble — try it free, low risk.',
    vibe: 'inflated',
  },
];

const VIBE_META: Record<Vibe, { label: string; emoji: string; color: string }> = {
  inflated: { label: 'Inflated / Balloon', emoji: '🎈', color: '#ec4899' },
  chunky: { label: 'Chunky', emoji: '🍩', color: '#f97316' },
  cartoon: { label: 'Cartoon', emoji: '💫', color: '#a855f7' },
  curvy: { label: 'Curvy / Vintage', emoji: '🍭', color: '#d946ef' },
};

const VIBE_ORDER: Vibe[] = ['inflated', 'chunky', 'cartoon', 'curvy'];

export function FontsShowcasePage() {
  const [filter, setFilter] = useState<'all' | Vibe>('all');
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('cowculator_font_favs');
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  });
  const [previewText, setPreviewText] = useState('Cowculator');

  useEffect(() => {
    const families = LIVE_FONTS.map((f) => `family=${f.googleParam}`).join('&');
    const href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.fontsShowcase = '1';
    document.head.appendChild(link);
    document.title = 'Bubble Font Showcase v2 — Cowculator';
    return () => { link.remove(); };
  }, []);

  useEffect(() => {
    localStorage.setItem('cowculator_font_favs', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const toggleFav = (name: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const filteredLive = useMemo(() => {
    const list = filter === 'all' ? LIVE_FONTS : LIVE_FONTS.filter((f) => f.vibe === filter);
    return [...list].sort((a, b) => {
      const af = favorites.has(a.name) ? 0 : 1;
      const bf = favorites.has(b.name) ? 0 : 1;
      if (af !== bf) return af - bf;
      return VIBE_ORDER.indexOf(a.vibe) - VIBE_ORDER.indexOf(b.vibe);
    });
  }, [filter, favorites]);

  const filteredPremium = useMemo(() => {
    return filter === 'all' ? PREMIUM_FONTS : PREMIUM_FONTS.filter((f) => f.vibe === filter);
  }, [filter]);

  return (
    <div
      className="min-h-screen w-full"
      style={{
        fontFamily: '"Quicksand", system-ui, sans-serif',
        background: 'linear-gradient(180deg, #ffe4ef 0%, #fef0f6 40%, #fff7fb 100%)',
        color: '#3b0764',
      }}
    >
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-pink-100/70">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: '"Bagel Fat One", sans-serif', color: '#9d174d' }}>
              🎈 Bubble Fonts v2
            </h1>
            <p className="text-sm text-pink-900/70 mt-0.5">{LIVE_FONTS.length} free puffy fonts to preview + {PREMIUM_FONTS.length} premium picks. Click 💖 to favorite.</p>
          </div>
          <input
            type="text"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="Try your own text…"
            className="px-4 py-2 rounded-full bg-white/90 border-2 border-pink-100 focus:border-pink-300 outline-none text-sm font-semibold w-full sm:w-64"
          />
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-3 flex flex-wrap gap-2 text-xs font-semibold">
          <FilterPill label={`All (${LIVE_FONTS.length + PREMIUM_FONTS.length})`} active={filter === 'all'} onClick={() => setFilter('all')} />
          {VIBE_ORDER.map((v) => {
            const count = LIVE_FONTS.filter((f) => f.vibe === v).length + PREMIUM_FONTS.filter((f) => f.vibe === v).length;
            return (
              <FilterPill
                key={v}
                label={`${VIBE_META[v].emoji} ${VIBE_META[v].label} (${count})`}
                active={filter === v}
                onClick={() => setFilter(v)}
                color={VIBE_META[v].color}
              />
            );
          })}
          {favorites.size > 0 && (
            <span className="ml-auto text-pink-700 self-center">💖 {favorites.size} favorite{favorites.size === 1 ? '' : 's'}</span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        {/* SECTION 1: live previews */}
        <SectionHeader emoji="✨" title="Free & live preview" subtitle="All free via Google Fonts. Drop-in ready." />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-16">
          {filteredLive.map((font) => (
            <LiveFontCard
              key={font.name}
              font={font}
              previewText={previewText}
              isFav={favorites.has(font.name)}
              onToggleFav={() => toggleFav(font.name)}
            />
          ))}
        </div>

        {/* SECTION 2: premium picks */}
        <SectionHeader emoji="💎" title="Premium picks worth checking out" subtitle="Can't render live (different licenses). Click each to view on the source site." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPremium.map((font) => (
            <PremiumFontCard
              key={font.name}
              font={font}
              isFav={favorites.has(font.name)}
              onToggleFav={() => toggleFav(font.name)}
            />
          ))}
        </div>

        <footer className="mt-16 text-center text-sm text-pink-900/60">
          Free fonts via Google Fonts · Premium fonts via foundries listed · For Cowculator brand selection
        </footer>
      </main>
    </div>
  );
}

function SectionHeader({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" style={{ fontFamily: '"Fredoka", sans-serif', color: '#9d174d' }}>
        <span>{emoji}</span>
        <span>{title}</span>
      </h2>
      <p className="text-sm text-pink-900/60 mt-1">{subtitle}</p>
    </div>
  );
}

function FilterPill({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full transition-all"
      style={{
        backgroundColor: active ? (color ?? '#9d174d') : 'rgba(255,255,255,0.7)',
        color: active ? 'white' : '#831843',
        border: `2px solid ${active ? (color ?? '#9d174d') : 'rgba(244,114,182,0.3)'}`,
      }}
    >
      {label}
    </button>
  );
}

function LiveFontCard({
  font,
  previewText,
  isFav,
  onToggleFav,
}: {
  font: LiveFont;
  previewText: string;
  isFav: boolean;
  onToggleFav: () => void;
}) {
  const meta = VIBE_META[font.vibe];
  return (
    <article
      className="rounded-3xl bg-white/85 backdrop-blur-sm shadow-md border-2 p-6 transition-all hover:shadow-xl"
      style={{ borderColor: isFav ? meta.color : 'transparent' }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
            {meta.emoji} {meta.label}
          </p>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5" style={{ fontFamily: '"Fredoka", sans-serif' }}>
            {font.name}
          </h2>
        </div>
        <button
          onClick={onToggleFav}
          className="text-2xl transition-transform hover:scale-110 active:scale-95"
          aria-label={isFav ? 'Unfavorite' : 'Favorite'}
        >
          {isFav ? '💖' : '🤍'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl bg-pink-50/60 p-4">
          <p className="text-[10px] uppercase tracking-wider text-pink-600/70 font-bold mb-1">Hero</p>
          <p
            className="leading-tight"
            style={{
              fontFamily: `${font.family}, sans-serif`,
              fontSize: '3rem',
              fontWeight: font.weights[font.weights.length - 1] ?? 400,
              color: '#831843',
            }}
          >
            {previewText || 'Cowculator'}
          </p>
        </div>

        <div className="rounded-2xl bg-purple-50/60 p-4">
          <p className="text-[10px] uppercase tracking-wider text-purple-600/70 font-bold mb-1">Headline</p>
          <p
            style={{
              fontFamily: `${font.family}, sans-serif`,
              fontSize: '1.5rem',
              fontWeight: font.weights[Math.min(1, font.weights.length - 1)] ?? 400,
              color: '#581c87',
              lineHeight: 1.2,
            }}
          >
            Free debt payoff calculator
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-600 italic leading-relaxed">{font.notes}</p>
    </article>
  );
}

function PremiumFontCard({
  font,
  isFav,
  onToggleFav,
}: {
  font: PremiumFont;
  isFav: boolean;
  onToggleFav: () => void;
}) {
  const meta = VIBE_META[font.vibe];
  return (
    <article
      className="rounded-2xl bg-white/85 backdrop-blur-sm shadow-md border-2 p-5 flex flex-col h-full transition-all hover:shadow-lg"
      style={{ borderColor: isFav ? meta.color : 'transparent' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
            {meta.emoji} {meta.label}
          </p>
          <h3 className="text-base font-bold text-slate-900 mt-0.5" style={{ fontFamily: '"Fredoka", sans-serif' }}>
            {font.name}
          </h3>
          <p className="text-[11px] text-slate-500">by {font.designer}</p>
        </div>
        <button
          onClick={onToggleFav}
          className="text-xl transition-transform hover:scale-110 active:scale-95"
          aria-label={isFav ? 'Unfavorite' : 'Favorite'}
        >
          {isFav ? '💖' : '🤍'}
        </button>
      </div>

      <p className="text-xs text-slate-700 leading-relaxed flex-1 mb-3">{font.description}</p>

      <div className="text-[11px] text-slate-500 mb-3">
        <p><strong>Source:</strong> {font.source}</p>
        <p><strong>Price:</strong> {font.price}</p>
      </div>

      <a
        href={font.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-xs font-semibold py-2 rounded-full text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: meta.color }}
      >
        View on {font.source} →
      </a>
    </article>
  );
}
