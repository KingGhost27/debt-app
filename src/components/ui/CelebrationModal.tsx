/**
 * CelebrationModal
 *
 * Milestone celebration: a ranch celebration. The active theme's scene sits at the
 * top with Debtsy and the theme friend (or the full herd for big wins), confetti
 * falls behind, and the ShareCard below can be saved or shared. Built on ModalShell
 * (focus trap, Escape, scroll lock); motion is off under prefers-reduced-motion.
 *
 * Two modes:
 *  - Two-animal: theme mascot + Debtsy (for progress/interest/streak milestones)
 *  - Full herd: all 10 animals (for individual debt paid off + debt free)
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { toPng } from 'html-to-image';
import { Star, Sparkles, Coins, CircleDollarSign, Download, Share2, Copy, Loader2, TriangleAlert } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { RanchStrip } from '../ranch/RanchStrip';
import { RANCH_SCENES, sceneKeyForPreset } from '../../lib/ranchScenes';
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
  { className: 'decoration-coin',    content: 'coin', top: '6%',  left: '5%',  delay: '0s' },
  { className: 'decoration-twinkle', content: 'star', top: '3%',  left: '28%', delay: '0.3s' },
  { className: 'decoration-coin',    content: 'coin', top: '8%',  left: '55%', delay: '0.7s' },
  { className: 'decoration-twinkle', content: 'star', top: '5%',  left: '72%', delay: '1.1s' },
  { className: 'decoration-coin',    content: 'coin', top: '4%',  left: '88%', delay: '0.5s' },
  { className: 'decoration-twinkle', content: 'star', top: '18%', left: '3%',  delay: '1.4s' },
  { className: 'decoration-coin',    content: 'coin', top: '16%', left: '40%', delay: '0.9s' },
  { className: 'decoration-twinkle', content: 'star', top: '20%', left: '92%', delay: '0.2s' },
  { className: 'decoration-coin',    content: 'coin', top: '22%', left: '18%', delay: '1.8s' },
  { className: 'decoration-twinkle', content: 'star', top: '25%', left: '65%', delay: '1.6s' },
];

// Twinkling stars + coin pops for small milestone wins
const SMALL_WIN_DECORATIONS = [
  { className: 'decoration-twinkle', content: 'star', top: '6%',  left: '8%',  delay: '0s' },
  { className: 'decoration-coin',    content: 'coin', top: '4%',  left: '75%', delay: '0.4s' },
  { className: 'decoration-twinkle', content: 'star', top: '14%', left: '88%', delay: '0.9s' },
  { className: 'decoration-coin',    content: 'coin', top: '5%',  left: '50%', delay: '1.3s' },
  { className: 'decoration-twinkle', content: 'star', top: '12%', left: '22%', delay: '0.6s' },
  { className: 'decoration-coin',    content: 'coin', top: '9%',  left: '38%', delay: '1.7s' },
  { className: 'decoration-twinkle', content: 'star', top: '7%',  left: '62%', delay: '0.2s' },
];

// ─── Props ────────────────────────────────────────────────────────
interface CelebrationModalProps {
  event: MilestoneEvent;
  stats: CelebrationStats;
  themePreset: ThemePreset;
  onDismiss: () => void;
  /** Settings' "Test Celebrations": sample figures, so the card is labeled and Save/Share are off. */
  preview?: boolean;
}

export function CelebrationModal({ event, stats, themePreset, onDismiss, preview = false }: CelebrationModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const ThemeMascot = THEME_MASCOT[themePreset] || LunaBunny;

  // Theme colors
  const themeColors = THEME_PRESETS[themePreset as Exclude<ThemePreset, 'custom'>] || THEME_PRESETS.default;
  const themePrimary = themeColors.primary500;

  // Drawn mascots for the ShareCard: full herd, or the theme friend and Debtsy
  const shareAnimals = event.isFullHerd
    ? ALL_MASCOTS.map(({ Component }, i) => <Component key={i} size={34} animated={false} />)
    : [<ThemeMascot key="friend" size={84} animated={false} />, <DebtsyCow key="cow" size={84} animated={false} />];

  // Pre-capture card on mount so buttons are sync (preserves user-gesture for share)
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState(false);
  const [showDesktopShare, setShowDesktopShare] = useState(false);
  const [clipboardLabel, setClipboardLabel] = useState('Copy Image');

  const doCaptureCard = useCallback(async () => {
    if (preview || !cardRef.current) return;
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
  }, [preview]);

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
      setClipboardLabel('Copied!');
      setTimeout(() => setClipboardLabel('Copy Image'), 2500);
    } catch {
      // Clipboard API not supported — fall back to download with explanation
      triggerDownload(capturedUrl, 'cowculator-win.png');
      setClipboardLabel('Saved instead');
      setTimeout(() => setClipboardLabel('Copy Image'), 2500);
    }
  }, [capturedUrl]);

  const handleTwitterShare = useCallback(() => {
    const text = encodeURIComponent(
      `${event.headline} Tracking my debt-free journey on cowculator.net`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener');
  }, [event.headline]);

  const handleFacebookShare = useCallback(() => {
    const url = encodeURIComponent('https://cowculator.net');
    const quote = encodeURIComponent(`${event.headline} Tracking my debt-free journey on Cowculator!`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, '_blank', 'noopener');
  }, [event.headline]);

  const scene = RANCH_SCENES[sceneKeyForPreset(themePreset)];
  const ui = scene.ui;
  const decoIcon = (kind: string, i: number) => {
    const gold = kind === 'coin';
    const Icon = gold ? (i % 2 ? Coins : CircleDollarSign) : (i % 3 === 0 ? Sparkles : Star);
    return <Icon size={gold ? 22 : 20} className={`cel-deco${gold ? ' gold' : ''}`} aria-hidden="true" />;
  };

  const behind = (
    <>
      <div className="mdl-back cel-scrim" onClick={onDismiss} aria-hidden="true" />

      {/* Confetti layer — infinite rain for big wins, one-pass fade for milestones */}
      <div className={`cel-back${event.isFullHerd ? '' : ' confetti-layer-finite'}`} aria-hidden="true">
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
      <div className="cel-back" aria-hidden="true">
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
                  {decoIcon(d.content, i)}
                </div>
              ))}
            </>
          : SMALL_WIN_DECORATIONS.map((d, i) => (
              <div key={i} className={d.className} style={{ top: d.top, left: d.left, animationDelay: d.delay }}>
                {decoIcon(d.content, i)}
              </div>
            ))}
      </div>
    </>
  );

  return (
    <ModalShell onClose={onDismiss} size="md" bare padded={false} label="Milestone celebration" closeLabel="Close celebration" behind={behind}>
      {/* The theme's ranch scene with the animals standing on the hill */}
      <div className="cel-scene">
        <RanchStrip sceneKey={sceneKeyForPreset(themePreset)} />
        <div className="cel-herd" aria-hidden="true">
          {event.isFullHerd ? (
            ALL_MASCOTS.map(({ Component, delay }, i) => (
              <div key={i} className="animate-mascot-bounce-in" style={{ animationDelay: `${delay}ms` }}>
                <Component size={38} animated />
              </div>
            ))
          ) : (
            <>
              <div className="animate-mascot-bounce-in" style={{ animationDelay: '0ms' }}><ThemeMascot size={72} animated /></div>
              <div className="animate-mascot-bounce-in" style={{ animationDelay: '150ms' }}><DebtsyCow size={72} animated /></div>
            </>
          )}
        </div>
      </div>

      <div className="cel-body">
        <ShareCard
          ref={cardRef}
          event={event}
          stats={stats}
          themePrimary={themePrimary}
          animals={shareAnimals}
          preview={preview}
          palette={{ accent: ui.btnBg, accentInk: ui.btnFg, ink: ui.ink, ink2: ui.ink2, page: ui.page, page2: ui.page2, line: ui.line }}
        />

        {preview ? (
          <>
            <div className="cel-btns">
              <button type="button" disabled className="mdl-btn"><Download size={18} />Save Card</button>
              <button type="button" disabled className="mdl-btn ghost"><Share2 size={18} />Share</button>
            </div>
            <p style={{ margin: 0, textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--ranch-ink2)' }}>
              Preview with sample figures. Real wins use your numbers and can be saved or shared.
            </p>
          </>
        ) : showDesktopShare ? (
          <div className="cel-btns">
            <button type="button" onClick={handleTwitterShare} className="mdl-btn">Share on X</button>
            <button type="button" onClick={handleFacebookShare} className="mdl-btn">Share on Facebook</button>
            <button type="button" onClick={handleClipboardCopy} className="mdl-btn ghost"><Copy size={18} />{clipboardLabel}</button>
            <button type="button" onClick={handleDownload} className="mdl-btn ghost"><Download size={18} />Save</button>
            <button type="button" onClick={() => setShowDesktopShare(false)} className="tut-skip cel-back-link" style={{ gridColumn: '1 / -1' }}>Back</button>
          </div>
        ) : (
          <div className="cel-btns">
            <button
              type="button"
              onClick={captureError ? doCaptureCard : handleDownload}
              disabled={!captureError && !capturedUrl}
              className={`mdl-btn${captureError ? ' danger' : ''}`}
            >
              {captureError ? <><TriangleAlert size={18} />Retry</> : capturedUrl ? <><Download size={18} />Save Card</> : <><Loader2 size={18} className="animate-spin" />Getting ready…</>}
            </button>
            <button type="button" onClick={handleShare} disabled={!capturedUrl} className="mdl-btn ghost">
              <Share2 size={18} />Share
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
