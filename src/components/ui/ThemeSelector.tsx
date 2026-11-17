/**
 * Theme Selector: ranch edition.
 *
 * Day/Night is a SegmentedControl. Each theme is a tile carrying a live
 * thumbnail of its own ranch scene (RanchStrip at tile size, friend included),
 * the theme name, and a Pro badge where the theme is locked. Locked tiles open
 * the upgrade modal; "Create Your Own" keeps the free-form color picker.
 *
 * Lavender Dream and Midnight Grape share one tile: with Pro, switching to
 * Night turns Lavender Dream into Midnight Grape, name and scene. Without Pro,
 * Night is the plain dark mode and a line under the switch says what Pro adds.
 * Styles: pages/settings.css (section 5).
 */

import { useEffect, useState } from 'react';
import { Check, Palette, Moon, Sun, Lock } from 'lucide-react';
import { useTheme, THEME_METADATA } from '../../hooks/useTheme';
import { DAY_FACE, NIGHT_FACE, PICKER_PRESETS, themeWithDarkMode, themeWithTile, tileFace } from '../../lib/themes';
import type { ThemePreset } from '../../types';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { UpgradeModal } from './UpgradeModal';
import { SegmentedControl } from './SegmentedControl';
import { RanchStrip } from '../ranch/RanchStrip';
import { sceneKeyForPreset } from '../../lib/ranchScenes';
import '../../pages/settings.css';

const QUICK_COLORS = ['#f472b6', '#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

export function ThemeSelector() {
  const { currentPreset, setTheme, setCustomFromColor, theme, isDarkMode } = useTheme();
  const [showCustom, setShowCustom] = useState(currentPreset === 'custom');
  const [customColor, setCustomColor] = useState(
    theme?.customColors?.primary500 || '#a855f7'
  );
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { isThemeLocked } = useFeatureGate();

  // Midnight Grape is Lavender Dream's night face, and it comes with Pro.
  const hasNightFace = !isThemeLocked(NIGHT_FACE);
  const current = theme ?? { preset: DAY_FACE, darkMode: false };
  const nightFaceTeaser = !hasNightFace && isDarkMode && currentPreset === DAY_FACE && !showCustom;

  // A Pro account still sitting on Lavender Dream at night (it got Pro after
  // switching to night, or its theme was saved by an older build) is given the
  // night face, so the tile, the scene and the name agree.
  const needsNightFace = hasNightFace && current.preset === DAY_FACE && Boolean(current.darkMode);
  useEffect(() => {
    if (needsNightFace) setTheme(themeWithDarkMode(current, true, true));
    // Runs only when the condition flips; `current` is read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsNightFace]);

  const handlePresetSelect = (tile: Exclude<ThemePreset, 'custom'>) => {
    if (isThemeLocked(tile)) {
      setShowUpgrade(true);
      return;
    }
    setShowCustom(false);
    setTheme(themeWithTile(current, tile, hasNightFace));
  };

  const handleModeChange = (night: boolean) => {
    if (night !== isDarkMode) setTheme(themeWithDarkMode(current, night, hasNightFace));
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    setCustomFromColor(color);
  };

  const customOn = showCustom || currentPreset === 'custom';

  return (
    <div className="th">
      {/* Day / Night */}
      <div className="th-mode">
        <div className="set-row-copy">
          <p className="th-mode-t">{isDarkMode ? 'Night Mode' : 'Day Mode'}</p>
          <p className="set-hint">{isDarkMode ? 'Cozy vibes for evening' : 'Bright and cheerful'}</p>
        </div>
        <SegmentedControl
          label="Day or night mode"
          value={isDarkMode ? 'night' : 'day'}
          onValueChange={(v) => handleModeChange(v === 'night')}
          options={[
            { value: 'day', label: <><Sun size={16} /> Day</> },
            { value: 'night', label: <><Moon size={16} /> Night</> },
          ]}
        />
      </div>
      {nightFaceTeaser && (
        <button type="button" className="th-night-pro" onClick={() => setShowUpgrade(true)}>
          <Lock size={14} strokeWidth={2.5} aria-hidden="true" />
          With Pro, Lavender Dream turns into Midnight Grape at night.
        </button>
      )}

      {/* Presets */}
      <div className="grid gap-3">
        <h3 className="th-h">Color Vibes</h3>
        <div className="th-grid">
          {PICKER_PRESETS.map((tile) => {
            const preset = tileFace(tile, isDarkMode, hasNightFace);
            const meta = THEME_METADATA[preset];
            const isSelected = currentPreset === preset && !showCustom;
            const locked = isThemeLocked(preset);

            return (
              <button
                key={tile}
                type="button"
                onClick={() => handlePresetSelect(tile)}
                aria-pressed={isSelected}
                aria-label={`${meta.name}${locked ? ', Pro theme' : ''}${isSelected ? ', selected' : ''}`}
                className={`th-tile${isSelected ? ' is-on' : ''}`}
              >
                <span className="th-prev" aria-hidden="true">
                  <RanchStrip sceneKey={sceneKeyForPreset(preset)} />
                  {locked && <span className="rui-badge soon th-lock"><Lock size={12} strokeWidth={2.5} />Pro</span>}
                  {isSelected && <span className="th-sel"><Check size={16} strokeWidth={3} /></span>}
                </span>
                <span className="th-copy">
                  <span className="th-name">{meta.name}</span>
                  <span className="th-desc">{meta.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Theme */}
      <div className="grid gap-3">
        <h3 className="th-h">Custom Theme</h3>
        <button type="button" onClick={() => setShowCustom(true)} aria-pressed={customOn} className={`th-custom${customOn ? ' is-on' : ''}`}>
          <span className="th-wheel"><Palette size={22} /></span>
          <span className="th-custom-copy">
            <span className="th-name">Create Your Own</span>
            <span className="set-hint">Pick any color you love!</span>
          </span>
          {customOn && <span className="th-sel" style={{ position: 'static' }}><Check size={16} strokeWidth={3} /></span>}
        </button>

        {showCustom && (
          <div className="th-picker">
            <label className="set-label" htmlFor="th-color">Pick your favorite color</label>
            <div className="th-picker-row">
              <input
                id="th-color"
                type="color"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="th-color"
                aria-label="Theme color"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                placeholder="#a855f7"
                aria-label="Theme color as hex"
                className="set-input th-hex"
              />
            </div>
            <div className="th-sw" role="group" aria-label="Quick colors">
              {QUICK_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleCustomColorChange(color)}
                  aria-label={`Use ${color}`}
                  aria-pressed={customColor === color}
                  className={customColor === color ? 'is-on' : ''}
                  style={{ '--c': color } as React.CSSProperties}
                />
              ))}
            </div>
            <p className="set-hint">We'll create a beautiful palette from your color!</p>
          </div>
        )}
      </div>

      {showUpgrade && <UpgradeModal onDismiss={() => setShowUpgrade(false)} />}
    </div>
  );
}
