/**
 * Onboarding Page
 *
 * Shown to new users after email confirmation.
 * Collects their display name so the app can greet them personally.
 *
 * Ranch edition: the welcome is the ranch scene of the active theme (RanchStrip, tall)
 * with the greeting in the sky and Debtsy beside the theme's friend. Styles: pages/onboarding.css.
 */

import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { DebtsyCow } from '../components/ui/DebtsyCow';
import { RanchStrip } from '../components/ranch/RanchStrip';
import { sceneKeyForPreset } from '../lib/ranchScenes';
import { useTheme } from '../hooks/useTheme';
import './onboarding.css';
import '../components/layout/ranch-ui.css';

interface OnboardingPageProps {
  onComplete: (name: string) => void;
  onSkip: () => void;
}

export function OnboardingPage({ onComplete, onSkip }: OnboardingPageProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentPreset } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    await onComplete(trimmed);
    setIsSubmitting(false);
  };

  return (
    <div className="ob">
      <div className="ob-hero">
        <RanchStrip sceneKey={sceneKeyForPreset(currentPreset)}>
          <div className="ob-sky ob-rise">
            <h1 className="ob-h1">Welcome to Cowculator!</h1>
            <p className="ob-tag">You're one step away from crushing your debt</p>
          </div>
          <div className="ob-cow" aria-hidden="true"><DebtsyCow size={128} /></div>
        </RanchStrip>
      </div>

      <main className="ob-main">
        <div className="rui-card ob-card ob-rise" style={{ animationDelay: '.12s', ['--rui-card-shadow' as string]: '0 2px 4px var(--ranch-sh), 0 24px 40px -24px var(--ranch-sh)' }}>
          {/* Step indicator: one step, so one node and the label */}
          <div className="ob-steps" role="img" aria-label="Step 1 of 1, quick setup">
            <span className="ob-node" aria-hidden="true">1</span>
            <span className="ob-rail" aria-hidden="true" />
            <span className="ob-step-t" aria-hidden="true">Step 1 of 1 — Quick Setup</span>
          </div>

          <div>
            <h2 className="ob-q">What should we call you?</h2>
            <p className="ob-note">We'll use this to personalize your experience</p>
          </div>

          <form onSubmit={handleSubmit} className="ob-form">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name or nickname"
              aria-label="Your first name or nickname"
              autoFocus
              maxLength={40}
              className="ob-input"
            />

            <button type="submit" disabled={isSubmitting || !name.trim()} className="ob-go">
              {isSubmitting ? (
                <>
                  <span className="ob-spin" aria-hidden="true" />
                  Setting up...
                </>
              ) : (
                <>
                  <span>Let's go!</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <button type="button" onClick={onSkip} className="ob-skip">Skip for now</button>
          <p className="ob-foot"><Check size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />You can always change this in Settings</p>
        </div>
      </main>
    </div>
  );
}
