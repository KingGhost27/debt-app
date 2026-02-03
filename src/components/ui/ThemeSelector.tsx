/**
 * Theme Selector Component - Kawaii Edition
 *
 * Cute theme selection with character-based presets.
 * Features playful animations and delightful interactions.
 */

import { useState } from 'react';
import { Check, Palette, Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme, THEME_PRESETS, THEME_METADATA } from '../../hooks/useTheme';
import type { ThemePreset } from '../../types';
import { THEME_DECORATIONS } from '../../lib/themes';

export function ThemeSelector() {
  const { currentPreset, setPreset, setCustomFromColor, theme, isDarkMode, toggleDarkMode } = useTheme();
  const [showCustom, setShowCustom] = useState(currentPreset === 'custom');
  const [customColor, setCustomColor] = useState(
    theme?.customColors?.primary500 || '#a855f7'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
          <Palette size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Theme & Colors</h3>
          <p className="text-sm text-gray-500">Make it yours!</p>
        </div>
      </div>

      {/* Dark Mode Toggle */}
      <div className="card hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
              isDarkMode
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                : 'bg-gradient-to-br from-amber-400 to-orange-500'
            }`}>
              {isDarkMode ? (
                <Moon size={24} className="text-white" />
              ) : (
                <Sun size={24} className="text-white" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {isDarkMode ? 'Night Mode' : 'Day Mode'}
              </p>
              <p className="text-sm text-gray-500">
                {isDarkMode ? 'Cozy vibes for evening' : 'Bright and cheerful'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-16 h-9 rounded-full transition-all duration-300 ${
              isDarkMode
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                : 'bg-gradient-to-r from-gray-200 to-gray-300'
            }`}
          >
            <span
              className={`absolute top-1.5 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
                isDarkMode ? 'translate-x-8' : 'translate-x-1.5'
              }`}
            >
              {isDarkMode ? (
                <Moon size={12} className="text-indigo-500" />
              ) : (
                <Sun size={12} className="text-amber-500" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Theme Presets Grid */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles size={14} />
          Character Themes
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {presetKeys.map((preset) => {
            const meta = THEME_METADATA[preset];
            const colors = THEME_PRESETS[preset];
            const decorations = THEME_DECORATIONS[preset];
            const isSelected = currentPreset === preset && !showCustom;

            return (
              <button
                key={preset}
                onClick={() => handlePresetSelect(preset)}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-300 group overflow-hidden ${
                  isSelected
                    ? 'border-primary-400 bg-primary-50 shadow-lg shadow-primary-200/50'
                    : 'border-gray-100 bg-white hover:border-primary-200 hover:shadow-md'
                }`}
              >
                {/* Background gradient on hover/select */}
                <div
                  className={`absolute inset-0 opacity-0 transition-opacity ${
                    isSelected ? 'opacity-100' : 'group-hover:opacity-50'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${colors.gradientTo}40, ${colors.gradientFrom}30)`,
                  }}
                />

                {/* Content */}
                <div className="relative z-10">
                  {/* Color dots */}
                  <div className="flex -space-x-1 mb-3">
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-110"
                      style={{ backgroundColor: colors.primary500 }}
                    />
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-110"
                      style={{ backgroundColor: colors.primary300, transitionDelay: '50ms' }}
                    />
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-110"
                      style={{ backgroundColor: colors.accent, transitionDelay: '100ms' }}
                    />
                  </div>

                  {/* Theme info */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-lg transition-transform ${isSelected ? 'animate-kawaii-bounce' : ''}`}>
                      {meta.emoji}
                    </span>
                    <span className="font-semibold text-sm text-gray-900">{meta.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{meta.description}</p>

                  {/* Floating emoji decoration */}
                  <span className="absolute top-2 right-2 text-sm opacity-30">
                    {decorations.floatingEmojis[0]}
                  </span>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center animate-pop-in">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Theme */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Palette size={14} />
          Custom Theme
        </h4>
        <button
          onClick={() => setShowCustom(true)}
          className={`w-full relative p-4 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden ${
            showCustom || currentPreset === 'custom'
              ? 'border-primary-400 bg-primary-50 shadow-lg'
              : 'border-gray-100 bg-white hover:border-primary-200 hover:shadow-md'
          }`}
        >
          {/* Rainbow gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 opacity-30" />

          <div className="relative z-10 flex items-center gap-4">
            {/* Color preview */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
              <span className="text-xl">🎨</span>
            </div>

            <div className="flex-1">
              <span className="font-semibold text-gray-900">Create Your Own</span>
              <p className="text-sm text-gray-500">Pick any color you love!</p>
            </div>

            {(showCustom || currentPreset === 'custom') && (
              <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center animate-pop-in">
                <Check size={14} className="text-white" />
              </div>
            )}
          </div>
        </button>

        {/* Custom color picker */}
        {showCustom && (
          <div className="mt-3 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm animate-slide-up space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              Pick your favorite color
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-16 h-16 rounded-2xl border-2 border-gray-200 cursor-pointer hover:border-primary-300 transition-colors"
                  style={{ padding: '2px' }}
                />
                <Sparkles size={14} className="absolute -top-1 -right-1 text-primary-400 animate-kawaii-pulse" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  placeholder="#a855f7"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-mono focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
                />
              </div>
            </div>

            {/* Quick color suggestions */}
            <div className="flex flex-wrap gap-2">
              {['#f472b6', '#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'].map((color) => (
                <button
                  key={color}
                  onClick={() => handleCustomColorChange(color)}
                  className={`w-8 h-8 rounded-xl border-2 transition-all hover:scale-110 ${
                    customColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles size={12} />
              We'll create a beautiful palette from your color!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
