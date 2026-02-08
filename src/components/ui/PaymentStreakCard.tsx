/**
 * Payment Streak Card - Kawaii Edition
 *
 * Displays the user's consecutive payment streak with
 * motivational messages and a flame visual.
 */

import { Flame, Zap, CheckCircle } from 'lucide-react';
import type { StreakData } from '../../lib/milestones';

interface PaymentStreakCardProps {
  streak: StreakData;
}

function getStreakMessage(months: number): { message: string; intensity: 'none' | 'low' | 'medium' | 'high' } {
  if (months === 0) return { message: 'Start your streak!', intensity: 'none' };
  if (months <= 2) return { message: 'Keep it going!', intensity: 'low' };
  if (months <= 5) return { message: 'On fire!', intensity: 'medium' };
  return { message: 'Unstoppable!', intensity: 'high' };
}

export function PaymentStreakCard({ streak }: PaymentStreakCardProps) {
  const { message, intensity } = getStreakMessage(streak.consecutiveMonths);

  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-3xl p-5 text-white shadow-lg shadow-primary-500/20">
      <div className="flex items-center justify-between">
        {/* Left: Flame + streak count */}
        <div className="flex items-center gap-3">
          <div className={`relative ${intensity === 'high' ? 'animate-heartbeat' : intensity === 'medium' ? 'animate-kawaii-pulse' : ''}`}>
            <Flame
              size={36}
              className={`${streak.consecutiveMonths > 0 ? 'text-yellow-300' : 'text-white/40'} drop-shadow-lg`}
              fill={streak.consecutiveMonths > 0 ? 'currentColor' : 'none'}
            />
            {intensity === 'high' && (
              <Flame
                size={20}
                className="absolute -top-2 -right-1 text-orange-300 animate-kawaii-sparkle"
                fill="currentColor"
              />
            )}
          </div>
          <div>
            <div className="text-3xl font-black tabular-nums">
              {streak.consecutiveMonths}
              <span className="text-base font-semibold ml-1 text-white/80">
                {streak.consecutiveMonths === 1 ? 'month' : 'months'}
              </span>
            </div>
            <p className="text-sm font-medium text-white/80">{message}</p>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="text-right space-y-1">
          {streak.currentMonthOnTrack && (
            <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold">
              <CheckCircle size={12} />
              On track
            </div>
          )}
          <div className="text-xs text-white/70">
            <Zap size={10} className="inline mr-1" />
            {streak.totalCompletedPayments} total payments
          </div>
          {streak.longestStreak > streak.consecutiveMonths && (
            <div className="text-xs text-white/60">
              Best: {streak.longestStreak} months
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
