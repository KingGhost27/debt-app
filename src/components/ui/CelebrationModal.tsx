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
const CONFETTI_COUNT = 60;

function generateConfetti() {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    duration: `${2 + Math.random() * 2}s`,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    width: `${6 + Math.floor(Math.random() * 6)}px`,
    height: `${6 + Math.floor(Math.random() * 6)}px`,
    isCircle: Math.random() > 0.5,
    rotate: `${Math.floor(Math.random() * 360)}deg`,
  }));
}

// Generate once outside component to keep stable across renders
const CONFETTI_PIECES = generateConfetti();

// ─── Fireworks ────────────────────────────────────────────────────
const FIREWORK_POSITIONS = [
  { top: '10%', left: '15%', delay: '0s', size: 60 },
  { top: '20%', left: '80%', delay: '0.4s', size: 50 },
  { top: '5%', left: '50%', delay: '0.8s', size: 70 },
  { top: '15%', left: '35%', delay: '1.2s', size: 45 },
  { top: '8%', left: '65%', delay: '1.6s', size: 55 },
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

      {/* Confetti layer */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {CONFETTI_PIECES.map((p) => (
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
              transform: `rotate(${p.rotate})`,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* Fireworks layer */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {FIREWORK_POSITIONS.map((fw, i) => (
          <div
            key={i}
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
      </div>

      {/* Content card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 420,
          width: '100%',
          maxHeight: 'calc(100dvh - 32px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          paddingTop: 20,
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-celebration-slide-up"
      >
        {/* Animal parade */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: event.isFullHerd ? 4 : 16,
            flexWrap: event.isFullHerd ? 'wrap' : 'nowrap',
            maxWidth: event.isFullHerd ? 340 : 200,
          }}
        >
          {event.isFullHerd ? (
            ALL_MASCOTS.map(({ Component, delay }, i) => (
              <div
                key={i}
                className="animate-mascot-bounce-in"
                style={{ animationDelay: `${delay}ms` }}
              >
                <Component size={56} animated />
              </div>
            ))
          ) : (
            <>
              <div className="animate-mascot-bounce-in" style={{ animationDelay: '0ms' }}>
                <ThemeMascot size={80} animated />
              </div>
              <div className="animate-mascot-bounce-in" style={{ animationDelay: '150ms' }}>
                <DebtsyCow size={80} animated />
              </div>
            </>
          )}
        </div>

        {/* Share card */}
        <ShareCard
          ref={cardRef}
          event={event}
          stats={stats}
          themePrimary={themePrimary}
          animalEmojis={animalEmojis}
        />

        {/* Action area — swaps between default buttons and share options in-place */}
        <div style={{ width: '100%' }} onClick={(e) => e.stopPropagation()}>
          {showDesktopShare ? (
            /* Share options — replaces the buttons, same slot, no layout shift */
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: '10px 12px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textAlign: 'center' }}>
                Share your win 🎉
              </div>
              {/* Social row */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleDownload} style={{ flex: 1, padding: '8px 6px', borderRadius: 10, border: 'none', background: themePrimary, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  ⬇️ Save
                </button>
                <button onClick={handleTwitterShare} style={{ flex: 1, padding: '8px 6px', borderRadius: 10, border: 'none', background: '#000', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  𝕏 Twitter
                </button>
                <button onClick={handleFacebookShare} style={{ flex: 1, padding: '8px 6px', borderRadius: 10, border: 'none', background: '#1877F2', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  f Facebook
                </button>
              </div>
              {/* Copy image */}
              <button onClick={handleClipboardCopy} style={{ padding: '7px 12px', borderRadius: 10, border: `1.5px solid ${themePrimary}`, background: 'white', color: themePrimary, fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                {clipboardLabel} <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>— paste into Instagram, etc.</span>
              </button>
              <button onClick={() => setShowDesktopShare(false)} style={{ background: 'none', border: 'none', fontSize: 11, color: '#d1d5db', cursor: 'pointer', padding: '0' }}>
                ← back
              </button>
            </div>
          ) : (
            /* Default: Save + Share buttons */
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={captureError ? doCaptureCard : handleDownload}
                disabled={!captureError && !capturedUrl}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 14,
                  border: 'none',
                  background: captureError ? '#ef4444' : capturedUrl ? themePrimary : '#d1d5db',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: captureError || capturedUrl ? 'pointer' : 'wait',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'background 0.3s',
                }}
              >
                {captureError ? '⚠️ Retry' : capturedUrl ? '⬇️ Save Card' : '⏳ Preparing…'}
              </button>
              <button
                onClick={handleShare}
                disabled={!capturedUrl}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 14,
                  border: `2px solid ${capturedUrl ? themePrimary : '#d1d5db'}`,
                  background: 'white',
                  color: capturedUrl ? themePrimary : '#9ca3af',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: capturedUrl ? 'pointer' : 'wait',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'color 0.3s, border-color 0.3s',
                }}
              >
                📤 Share
              </button>
            </div>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          style={{
            background: 'rgba(255,255,255,0.7)',
            border: 'none',
            borderRadius: 999,
            padding: '6px 20px',
            fontSize: 12,
            color: '#6b7280',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Keep going →
        </button>
      </div>
    </div>
  );
}
