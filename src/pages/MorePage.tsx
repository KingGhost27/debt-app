/**
 * More Page
 *
 * Hub page linking to Assets, Subscriptions, and Settings.
 */

import { Link } from 'react-router-dom';
import { Wallet, RefreshCw, Settings, ChevronRight } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';

const moreItems = [
  {
    to: '/assets',
    icon: <Wallet size={24} className="text-emerald-500" />,
    title: 'Assets',
    description: 'Track savings, investments, and net worth',
    gradient: 'from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20',
    borderColor: 'border-emerald-100 dark:border-emerald-800/50',
  },
  {
    to: '/subscriptions',
    icon: <RefreshCw size={24} className="text-purple-500" />,
    title: 'Subscriptions',
    description: 'Manage recurring services and costs',
    gradient: 'from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/20',
    borderColor: 'border-purple-100 dark:border-purple-800/50',
  },
  {
    to: '/settings',
    icon: <Settings size={24} className="text-primary-400" />,
    title: 'Settings',
    description: 'Themes, categories, and data management',
    gradient: 'from-primary-50 to-pink-50 dark:from-primary-900/30 dark:to-pink-900/20',
    borderColor: 'border-primary-100 dark:border-primary-800/50',
  },
];

export function MorePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="More" subtitle="Additional features" emoji="✨" />

      <div className="px-4 py-6 space-y-4">
        {moreItems.map((item) => (
          <Link key={item.to} to={item.to} className="block">
            <div className={`bg-gradient-to-br ${item.gradient} border ${item.borderColor} rounded-3xl p-5 hover:shadow-md transition-all`}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/80 dark:bg-gray-800/80 flex items-center justify-center shadow-sm">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
