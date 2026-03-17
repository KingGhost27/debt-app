/**
 * CelebrationModal
 *
 * Full-screen milestone celebration overlay. Fires confetti, shows kawaii
 * animal parade, ShareCard for download/social sharing.
 *
 * Two modes:
 *  - Two-animal: theme mascot + Debtsy (for progress/interest/streak milestones)
 *  - Full herd: all 10 animals (for individual debt paid off + debt free)
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { toPng } from 'html-to-image';
import type { MilestoneEvent, CelebrationStats } from '../../types/celebrations';
import type { ThemePreset } from '../../types';
import { ShareCard } from './ShareCard';
import { DebtsyCow } from './DebtsyCow';
import { THEME_PRESETS } from '../../lib/themes';
import {
  LunaBunny,
  BooBoo,
  ShadowBunny,
  LiloOtter,
  SunshineChick,
  CherryKitty,
  MochiFrog,
  ChaiBear,
  MapleFox,
} from './mascots';

// ─── Theme → mascot map ────────────────────────────────────────────
type MascotComponent = React.ComponentType<{ size?: number; className?: string; animated?: boolean }>;

const THEME_MASCOT: Record<ThemePreset, MascotComponent> = {
  default: LunaBunny,
  'my-melody': BooBoo,
  kuromi: ShadowBunny,
  cinnamoroll: LiloOtter,
  pompompurin: SunshineChick,
  'hello-kitty': CherryKitty,
  keroppi: MochiFrog,
  chococat: ChaiBear,
  maple: MapleFox,
  custom: LunaBunny,
};

const ALL_MASCOTS: Array<{ Component: MascotComponent; delay: number }> = [
  { Component: LunaBunny, delay: 0 },
  { Component: BooBoo, delay: 60 },
  { Component: ShadowBunny, delay: 120 },
  { Component: LiloOtter, delay: 180 },
  { Component: SunshineChick, delay: 240 },
  { Component: DebtsyCow, delay: 300 },
  { Component: CherryKitty, delay: 360 },
  { Component: MochiFrog, delay: 420 },
  { Component: ChaiBear, delay: 480 },
  { Component: MapleFox, delay: 540 },
];

// ─── Theme → emoji for ShareCard (SVG-safe, no canvas taint) ──────
const THEME_ANIMAL_EMOJI: Record<ThemePreset, string> = {
  default: '🐰',
  'my-melody': '🐷',
  kuromi: '🌙',
  cinnamoroll: '🦦',
  pompompurin: '🐥',
  'hello-kitty': '🐱',
  keroppi: '🐸',
  chococat: '🐻',
  maple: '🦊',
  custom: '🐰',
};

/** All 10 herd animals in parade order for the full-herd ShareCard */
const FULL_HERD_EMOJIS = ['🐰', '🐷', '🌙', '🦦', '🐥', '🐄', '🐱', '🐸', '🐻', '🦊'];

// ─── Confetti generator ────────────────────────────────────────────
const CONFETTI_COLORS = ['#a855f7', '#f9a8d4', '#fbbf24', '#34d399', '#60a5fa', '#fb923c'];
const CONFETTI_COUNT = 80;

function generateConfetti() {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 4}s`,
    duration: `${2.5 + Math.random() * 2.5}s`,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    width: `${6 + Math.floor(Math.random() * 7)}px`,
    height: `${6 + Math.floor(Math.random() * 7)}px`,
    isCircle: Math.random() > 0.5,
    rotate: `${Math.floor(Math.random() * 360)}deg`,
    drift: `${10 + Math.floor(Math.random() * 24)}px`,
  }));
}

// Generate once outside component to keep stable across renders
const CONFETTI_PIECES = generateConfetti();

// ─── Fireworks ────────────────────────────────────────────────────
const FIREWORK_POSITIONS_BIG = [
  { top: '10%', left: '15%', delay: '0s', size: 60 },
  { top: '20%', left: '80%', delay: '0.4s', size: 50 },
  { top: '5%', left: '50%', delay: '0.8s', size: 70 },
  { top: '15%', left: '35%', delay: '1.2s', size: 45 },
  { top: '8%', left: '65%', delay: '1.6s', size: 55 },
];

// Money decorations for big wins (debt paid off / debt free) — layered with ring fireworks
const BIG_WIN_MONEY_DECORATIONS = [
  { className: 'decoration-coin',    content: '💰', top: '6%',  left: '5%',  delay: '0s' },
  { className: 'decoration-twinkle', content: '⭐', top: '3%',  left: '28%', delay: '0.3s' },
  { className: 'decoration-coin',    content: '🪙', top: '8%',  left: '55%', delay: '0.7s' },
  { className: 'decoration-twinkle', content: '✨', top: '5%',  left: '72%', delay: '1.1s' },
  { className: 'decoration-coin',    content: '💵', top: '4%',  left: '88%', delay: '0.5s' },
  { className: 'decoration-twinkle', content: '💫', top: '18%', left: '3%',  delay: '1.4s' },
  { className: 'decoration-coin',    content: '💸', top: '16%', left: '40%', delay: '0.9s' },
  { className: 'decoration-twinkle', content: '⭐', top: '20%', left: '92%', delay: '0.2s' },
  { className: 'decoration-coin',    content: '🪙', top: '22%', left: '18%', delay: '1.8s' },
  { className: 'decoration-twinkle', content: '✨', top: '25%', left: '65%', delay: '1.6s' },
];

// Twinkling stars + coin pops for small milestone wins
const SMALL_WIN_DECORATIONS = [
  { className: 'decoration-twinkle', content: '⭐', top: '6%',  left: '8%',  delay: '0s' },
  { className: 'decoration-coin',    content: '🪙', top: '4%',  left: '75%', delay: '0.4s' },
  { className: 'decoration-twinkle', content: '✨', top: '14%', left: '88%', delay: '0.9s' },
  { className: 'decoration-coin',    content: '💰', top: '5%',  left: '50%', delay: '1.3s' },
  { className: 'decoration-twinkle', content: '💫', top: '12%', left: '22%', delay: '0.6s' },
  { className: 'decoration-coin',    content: '💵', top: '9%',  left: '38%', delay: '1.7s' },
  { className: 'decoration-twinkle', content: '⭐', top: '7%',  left: '62%', delay: '0.2s' },
];

// ─── Props ────────────────────────────────────────────────────────
interface CelebrationModalProps {
  event: MilestoneEvent;
  stats: CelebrationStats;
  themePreset: ThemePreset;
  onDismiss: () => void;
}

export function CelebrationModal({ event, stats, themePreset, onDismiss }: CelebrationModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const ThemeMascot = THEME_MASCOT[themePreset] || LunaBunny;

  // Theme colors
  const themeColors = THEME_PRESETS[themePreset as Exclude<ThemePreset, 'custom'>] || THEME_PRESETS.default;
  const themePrimary = themeColors.primary500;

  // Animal emojis for the ShareCard — full herd or theme animal + cow
  const themeEmoji = THEME_ANIMAL_EMOJI[themePreset] || '🐰';
  const animalEmojis = event.isFullHerd ? FULL_HERD_EMOJIS : [themeEmoji, '🐄'];

  // Pre-capture card on mount so buttons are sync (preserves user-gesture for share)
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState(false);
  const [showDesktopShare, setShowDesktopShare] = useState(false);
  const [clipboardLabel, setClipboardLabel] = useState('📋 Copy Image');

  const doCaptureCard = useCallback(async () => {
    if (!cardRef.current) return;
    setCaptureError(false);
    try {
      const opts = { pixelRatio: 2, skipFonts: true, cacheBust: true };
      await toPng(cardRef.current, opts); // prime pass — loads fonts/images
      const url = await toPng(cardRef.current, opts);
      setCapturedUrl(url);
    } catch (err) {
      console.error('Card capture failed:', err);
      setCaptureError(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(doCaptureCard, 400);
    return () => clearTimeout(timer);
  }, [doCaptureCard]);

  // Convert data URL → Blob without fetch (avoids CSP issues)
  function dataUrlToBlob(dataUrl: string): Blob {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)![1];
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  // Append to DOM before click — required for cross-browser downloads
  function triggerDownload(dataUrl: string, filename: string) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleDownload = useCallback(() => {
    if (!capturedUrl) return;
    triggerDownload(capturedUrl, 'cowculator-win.png');
  }, [capturedUrl]);

  const handleShare = useCallback(async () => {
    if (!capturedUrl) return;
    const blob = dataUrlToBlob(capturedUrl);
    const file = new File([blob], 'cowculator-win.png', { type: 'image/png' });

    // Mobile: Web Share API with files — opens native OS share sheet (Instagram, TikTok, etc.)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'My Cowculator Win!', text: event.headline });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        // Web Share failed — fall through to desktop options
      }
    }

    // Desktop: show explicit share options panel instead of silently falling through
    setShowDesktopShare(true);
  }, [capturedUrl, event.headline]);

  const handleClipboardCopy = useCallback(async () => {
    if (!capturedUrl) return;
    const blob = dataUrlToBlob(capturedUrl);
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setClipboardLabel('✅ Copied!');
      setTimeout(() => setClipboardLabel('📋 Copy Image'), 2500);
    } catch {
      // Clipboard API not supported — fall back to download with explanation
      triggerDownload(capturedUrl, 'cowculator-win.png');
      setClipboardLabel('⬇️ Saved instead');
      setTimeout(() => setClipboardLabel('📋 Copy Image'), 2500);
    }
  }, [capturedUrl]);

  const handleTwitterShare = useCallback(() => {
    const text = encodeURIComponent(
      `${event.headline} 🐄 Tracking my debt-free journey on cowculator.net`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener');
  }, [event.headline]);

  const handleFacebookShare = useCallback(() => {
    const url = encodeURIComponent('https://cowculator.net');
    const quote = encodeURIComponent(`${event.headline} 🐄 Tracking my debt-free journey on Cowculator!`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, '_blank', 'noopener');
  }, [event.headline]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Milestone celebration"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onDismiss}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${themePrimary}33, ${themeColors.gradientFrom}cc)`,
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Confetti layer — infinite rain for big wins, one-pass fade for milestones */}
      <div
        style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
        className={event.isFullHerd ? undefined : 'confetti-layer-finite'}
      >
        {(event.isFullHerd ? CONFETTI_PIECES : CONFETTI_PIECES.slice(0, 40)).map((p) => (
          <div
            key={p.id}
            className="confetti-piece"
            style={{
              left: p.left,
              top: '-20px',
              width: p.width,
              height: p.height,
              backgroundColor: p.color,
              borderRadius: p.isCircle ? '50%' : '2px',
              animationDelay: p.delay,
              animationDuration: p.duration,
              animationIterationCount: event.isFullHerd ? 'infinite' : '1',
              ['--drift' as string]: p.drift,
            }}
          />
        ))}
      </div>

      {/* Fireworks / decorations layer */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {event.isFullHerd
          ? <>
              {FIREWORK_POSITIONS_BIG.map((fw, i) => (
                <div
                  key={`fw-${i}`}
                  className="firework-burst"
                  style={{
                    top: fw.top,
                    left: fw.left,
                    width: fw.size,
                    height: fw.size,
                    borderRadius: '50%',
                    border: `3px solid ${CONFETTI_COLORS[i % CONFETTI_COLORS.length]}`,
                    animationDelay: fw.delay,
                    animationDuration: '1.5s',
                    animationIterationCount: 'infinite',
                  }}
                />
              ))}
              {BIG_WIN_MONEY_DECORATIONS.map((d, i) => (
                <div key={`money-${i}`} className={d.className} style={{ top: d.top, left: d.left, animationDelay: d.delay }}>
                  {d.content}
                </div>
              ))}
            </>
          : SMALL_WIN_DECORATIONS.map((d, i) => (
              <div
                key={i}
                className={d.className}
                style={{
                  top: d.top,
                  left: d.left,
                  animationDelay: d.delay,
                }}
              >
                {d.content}
              </div>
            ))}
      </div>

      {/* Content card */}
      <div
        className="animate-celebration-slide-up relative z-[1] w-full max-w-[320px] sm:max-w-[420px] max-h-[calc(100dvh-32px)] overflow-y-auto overflow-x-hidden flex flex-col items-center gap-3 sm:gap-4 pt-3 sm:pt-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animal parade — offset right by button column width so it centers over the card */}
        <div
          className="flex items-end justify-center flex-wrap sm:flex-nowrap pr-0 sm:pr-[106px]"
          style={{
            gap: event.isFullHerd ? 3 : 10,
            flexWrap: event.isFullHerd ? 'wrap' : 'nowrap',
            maxWidth: event.isFullHerd ? 260 : 160,
          }}
        >
          {event.isFullHerd ? (
            ALL_MASCOTS.map(({ Component, delay }, i) => (
              <div
                key={i}
                className="animate-mascot-bounce-in"
                style={{ animationDelay: `${delay}ms` }}
              >
                <Component size={36} animated />
              </div>
            ))
          ) : (
            <>
              <div className="animate-mascot-bounce-in" style={{ animationDelay: '0ms' }}>
                <ThemeMascot size={56} animated />
              </div>
              <div className="animate-mascot-bounce-in" style={{ animationDelay: '150ms' }}>
                <DebtsyCow size={56} animated />
              </div>
            </>
          )}
        </div>

        {/* Card + buttons — stacked on mobile, side by side on desktop */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-[10px] w-full items-stretch">

          {/* ShareCard — takes most of the width */}
          <div className="flex-1 min-w-0">
            <ShareCard
              ref={cardRef}
              event={event}
              stats={stats}
              themePrimary={themePrimary}
              animalEmojis={animalEmojis}
            />
          </div>

          {/* Button column — horizontal on mobile, vertical on desktop */}
          <div className="flex flex-row sm:flex-col gap-2 sm:gap-2 justify-center sm:w-[96px] sm:flex-shrink-0">
            {showDesktopShare ? (
              /* Share options — stacked vertically in the same narrow column */
              <>
                <button onClick={handleTwitterShare} style={{ width: '100%', padding: '9px 6px', borderRadius: 12, border: 'none', background: '#000', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', lineHeight: 1.2 }}>
                  𝕏 Twitter
                </button>
                <button onClick={handleFacebookShare} style={{ width: '100%', padding: '9px 6px', borderRadius: 12, border: 'none', background: '#1877F2', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', lineHeight: 1.2 }}>
                  f Facebook
                </button>
                <button onClick={handleClipboardCopy} style={{ width: '100%', padding: '9px 6px', borderRadius: 12, border: `1.5px solid ${themePrimary}`, background: 'white', color: themePrimary, fontSize: 11, fontWeight: 700, cursor: 'pointer', lineHeight: 1.2 }}>
                  {clipboardLabel}
                </button>
                <button onClick={handleDownload} style={{ width: '100%', padding: '9px 6px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 11, fontWeight: 700, cursor: 'pointer', lineHeight: 1.2 }}>
                  ⬇️ Save
                </button>
                <button onClick={() => setShowDesktopShare(false)} style={{ background: 'none', border: 'none', fontSize: 10, color: '#d1d5db', cursor: 'pointer', padding: '2px' }}>
                  ← back
                </button>
              </>
            ) : (
              /* Default: Save + Share stacked */
              <>
                <button
                  onClick={captureError ? doCaptureCard : handleDownload}
                  disabled={!captureError && !capturedUrl}
                  className="flex-1 sm:flex-none"
                  style={{
                    width: undefined,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: 'none',
                    background: captureError ? '#ef4444' : capturedUrl ? themePrimary : '#d1d5db',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: captureError || capturedUrl ? 'pointer' : 'wait',
                    lineHeight: 1.3,
                    transition: 'background 0.3s',
                  }}
                >
                  {captureError ? '⚠️ Retry' : capturedUrl ? '⬇️ Save Card' : '⏳ Getting ready…'}
                </button>
                <button
                  onClick={handleShare}
                  disabled={!capturedUrl}
                  className="flex-1 sm:flex-none"
                  style={{
                    width: undefined,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: `2px solid ${capturedUrl ? themePrimary : '#d1d5db'}`,
                    background: 'white',
                    color: capturedUrl ? themePrimary : '#9ca3af',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: capturedUrl ? 'pointer' : 'wait',
                    lineHeight: 1.3,
                    transition: 'color 0.3s, border-color 0.3s',
                  }}
                >
                  📤 Share
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
