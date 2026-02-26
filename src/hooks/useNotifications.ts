/**
 * useNotifications
 *
 * Manages bill reminder notification settings (stored in localStorage)
 * and fires OS notifications once per day on app load for upcoming items.
 */

import { useState, useEffect } from 'react';
import { differenceInDays, parseISO, addDays, addWeeks, addMonths, addYears, isBefore } from 'date-fns';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../lib/calculations';
import type { Subscription, SubscriptionFrequency } from '../types';

const LS_SETTINGS_KEY = 'debtsy_notification_settings';
const LS_LAST_CHECK_KEY = 'debtsy_last_notify_check';

export interface NotificationSettings {
  enabled: boolean;
  daysInAdvance: number;       // How many days ahead to remind (1, 3, 5, 7)
  remindSubscriptions: boolean;
  remindPayments: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  daysInAdvance: 3,
  remindSubscriptions: true,
  remindPayments: true,
};

function loadSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function getNextBillingDate(subscription: Subscription): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let date = parseISO(subscription.nextBillingDate);
  const { value, unit } = subscription.frequency as SubscriptionFrequency;
  while (isBefore(date, today)) {
    if (unit === 'days') date = addDays(date, value);
    else if (unit === 'weeks') date = addWeeks(date, value);
    else if (unit === 'months') date = addMonths(date, value);
    else if (unit === 'years') date = addYears(date, value);
  }
  return date;
}

/** Settings management — use in SettingsPage */
export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(loadSettings);

  const save = (updates: Partial<NotificationSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(next));
  };

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) return 'denied';
    const result = await Notification.requestPermission();
    if (result === 'granted') save({ enabled: true });
    return result;
  };

  const permissionState: NotificationPermission =
    'Notification' in window ? Notification.permission : 'denied';

  return { settings, save, requestPermission, permissionState };
}

/** Daily check — call this once from Layout (inside AppProvider) */
export function useNotificationChecker() {
  const { subscriptions, debts } = useApp();

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const settings = loadSettings();
    if (!settings.enabled) return;

    // Only fire once per calendar day
    const today = new Date().toDateString();
    if (localStorage.getItem(LS_LAST_CHECK_KEY) === today) return;
    localStorage.setItem(LS_LAST_CHECK_KEY, today);

    const daysAhead = settings.daysInAdvance;

    // --- Subscription reminders ---
    if (settings.remindSubscriptions) {
      subscriptions
        .filter((s) => s.isActive)
        .forEach((sub) => {
          const next = getNextBillingDate(sub);
          const days = differenceInDays(next, new Date());
          if (days >= 0 && days <= daysAhead) {
            const when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
            new Notification(`💳 ${sub.name} renews ${when}`, {
              body: `${formatCurrency(sub.amount)} will be charged`,
              icon: '/icon-192.png',
              tag: `sub-${sub.id}`,
            });
          }
        });
    }

    // --- Debt payment reminders ---
    if (settings.remindPayments) {
      const now = new Date();
      debts.forEach((debt) => {
        if (!debt.dueDay) return;
        // Calculate this month's due date; if past, use next month's
        let dueDate = new Date(now.getFullYear(), now.getMonth(), debt.dueDay);
        if (dueDate < now) dueDate = new Date(now.getFullYear(), now.getMonth() + 1, debt.dueDay);
        const days = differenceInDays(dueDate, now);
        if (days >= 0 && days <= daysAhead) {
          const when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
          new Notification(`📅 ${debt.name} payment due ${when}`, {
            body: `Minimum payment: ${formatCurrency(debt.minimumPayment)}`,
            icon: '/icon-192.png',
            tag: `debt-${debt.id}`,
          });
        }
      });
    }
  }, [subscriptions, debts]);
}
