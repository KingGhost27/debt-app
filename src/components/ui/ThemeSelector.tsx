/**
 * Theme Selector Component
 *
 * Displays theme presets as visual cards for selection.
 * Includes custom color picker for advanced customization.
 * Now includes dark mode toggle.
 */

import { useState } from 'react';
import { Check, Palette, Moon, Sun } from 'lucide-react';
import { useTheme, THEME_PRESETS, THEME_METADATA } from '../../hooks/useTheme';
import type { ThemePreset } from '../../types';

export function ThemeSelector() {
  const { currentPreset, setPreset, setCustomFromColor, theme, isDarkMode, toggleDarkMode } = useTheme();
  const [showCustom, setShowCustom] = useState(currentPreset === 'custom');
  const [customColor, setCustomColor] = useState(
    theme?.customColors?.primary500 || '#8b5cf6'
  );

  const presetKeys = Object.keys(THEME_PRESETS) as Exclude<ThemePreset, 'custom'>[];

  const handlePresetSelect = (preset: Exclude<ThemePreset, 'custom'>) => {
    setShowCustom(false);
    setPreset(preset);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    setCustomFromColor(color);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Palette size={20} />
        Theme
      </h3>

      {/* Dark Mode Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          {isDarkMode ? (
            <Moon size={24} className="text-primary-500" />
          ) : (
            <Sun size={24} className="text-amber-500" />
          )}
          <div>
            <p className="font-medium">Dark Mode</p>
            <p className="text-sm text-gray-500">
              {isDarkMode ? 'Easier on the eyes at night' : 'Switch to dark theme'}
            </p>
          </div>
        </div>
        <button
          onClick={toggleDarkMode}
          className={`relative w-14 h-8 rounded-full transition-colors ${
            isDarkMode ? 'bg-primary-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
              isDarkMode ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Preset themes */}
      <div className="grid grid-cols-1 gap-3">
        {presetKeys.map((preset) => {
          const meta = THEME_METADATA[preset];
          const colors = THEME_PRESETS[preset];
          const isSelected = currentPreset === preset && !showCustom;

          return (
            <button
              key={preset}
              onClick={() => handlePresetSelect(preset)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Color preview circles */}
                <div className="flex -space-x-1">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: colors.primary500 }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: colors.primary300 }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: colors.accent }}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.emoji}</span>
                    <span className="font-medium">{meta.name}</span>
                  </div>
                  <p className="text-sm text-gray-500">{meta.description}</p>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {/* Custom theme option */}
        <button
          onClick={() => setShowCustom(true)}
          className={`relative p-4 rounded-xl border-2 text-left transition-all ${
            showCustom || currentPreset === 'custom'
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1">
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: customColor }}
              />
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎨</span>
                <span className="font-medium">Custom</span>
              </div>
              <p className="text-sm text-gray-500">Choose your own colors</p>
            </div>

            {(showCustom || currentPreset === 'custom') && (
              <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                <Check size={14} className="text-white" />
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Custom color picker */}
      {showCustom && (
        <div className="p-4 bg-gray-50 rounded-xl space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Pick your primary color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={customColor}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              placeholder="#8b5cf6"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
            />
          </div>
          <p className="text-xs text-gray-500">
            The app will generate a full color palette from your chosen color.
          </p>
        </div>
      )}
    </div>
  );
}
