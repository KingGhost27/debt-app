/**
 * Onboarding Page
 *
 * Shown to new users after email confirmation.
 * Collects their display name so the app can greet them personally.
 */

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { DebtsyCow } from '../components/ui/DebtsyCow';

interface OnboardingPageProps {
  onComplete: (name: string) => void;
  onSkip: () => void;
}

export function OnboardingPage({ onComplete, onSkip }: OnboardingPageProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    await onComplete(trimmed);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-4">

      {/* Floating decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {['🌸', '💖', '✨', '🌷', '💫', '🎀', '🌸', '💕', '🐄', '⭐'].map((emoji, i) => (
          <span
            key={i}
            className="absolute text-2xl opacity-20 animate-kawaii-float"
            style={{
              top: `${10 + (i * 9) % 80}%`,
              left: `${5 + (i * 11) % 90}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${5 + (i % 3) * 2}s`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="w-full max-w-sm relative">
        {/* App identity */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="relative">
              <DebtsyCow size={88} />
              <span className="absolute -top-1 -right-2 text-2xl animate-kawaii-float" style={{ animationDuration: '2s' }}>✨</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Welcome to Cowculator!</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            You're one step away from crushing your debt 🐄💪
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-3xl shadow-xl shadow-primary-200/30 dark:shadow-black/30 border border-primary-100/50 dark:border-gray-800 p-8">

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Sparkles size={12} />
              Step 1 of 1 — Quick Setup
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">What should we call you?</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              We'll use this to personalize your experience
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your first name or nickname"
                autoFocus
                maxLength={40}
                className="w-full px-4 py-3 rounded-xl border border-primary-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition text-center text-lg font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white font-semibold shadow-md shadow-primary-200/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <span>Let's go!</span>
                  <span className="text-lg">🚀</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-5">
            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline underline-offset-2"
            >
              Skip for now
            </button>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          You can always change this in Settings ⚙️
        </p>
      </div>
    </div>
  );
}
