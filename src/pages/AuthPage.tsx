/**
 * Auth Page
 *
 * Login and sign-up screen with kawaii theme styling.
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const PW_RULES = [
  { label: 'At least 12 characters', test: (p: string) => p.length >= 12 },
  { label: 'Uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number (0-9)', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Symbol (e.g. !@#$)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pwRuleResults = PW_RULES.map((rule) => ({ ...rule, passed: rule.test(password) }));
  const passwordValid = pwRuleResults.every((r) => r.passed);
  const showPwRules = mode === 'signup' && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === 'signup' && !passwordValid) {
      setError('Please meet all password requirements.');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
      } else {
        setSuccessMsg('Account created! Check your email to confirm, then log in.');
        setMode('login');
      }
    }

    setIsSubmitting(false);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setSuccessMsg(null);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-4">

      {/* Floating decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {['🌸', '💖', '✨', '🌷', '💫', '🎀', '🌸', '💕'].map((emoji, i) => (
          <span
            key={i}
            className="absolute text-2xl opacity-20 animate-kawaii-float"
            style={{
              top: `${10 + (i * 11) % 80}%`,
              left: `${5 + (i * 13) % 90}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${5 + (i % 3) * 2}s`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="w-full max-w-sm relative">
        {/* Card */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-3xl shadow-xl shadow-primary-200/30 dark:shadow-black/30 border border-primary-100/50 dark:border-gray-800 p-8">

          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🌸</div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {mode === 'login' ? 'Welcome back!' : 'Create account'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {mode === 'login'
                ? 'Log in to your debt dashboard'
                : 'Start your debt-free journey'}
            </p>
          </div>

          {/* Success message */}
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm text-center">
              {successMsg}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-primary-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={12}
                className="w-full px-4 py-3 rounded-xl border border-primary-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
              />

              {/* Password requirements checklist — only shown on signup */}
              {showPwRules && (
                <ul className="mt-2 space-y-1">
                  {pwRuleResults.map((rule) => (
                    <li key={rule.label} className="flex items-center gap-2 text-xs">
                      <span className={rule.passed ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}>
                        {rule.passed ? '✓' : '○'}
                      </span>
                      <span className={rule.passed ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>
                        {rule.label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (mode === 'signup' && password.length > 0 && !passwordValid)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white font-semibold shadow-md shadow-primary-200/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? (mode === 'login' ? 'Logging in...' : 'Creating account...')
                : (mode === 'login' ? 'Log in' : 'Create account')}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={switchMode}
              className="text-primary-500 font-semibold hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
