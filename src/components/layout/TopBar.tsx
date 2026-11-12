/**
 * TopBar — the phone/tablet header (below lg): brand on the left, Settings on
 * the right. Hidden on desktop, where the Sidebar carries both.
 */

import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { DebtsyCow } from '../ui/DebtsyCow';

export function TopBar() {
  return (
    <div className="rui-topbar">
      <Link to="/dashboard" className="rui-brand rui-brand-sm" aria-label="Debtsy home">
        <DebtsyCow size={32} animated={false} />
        <span className="rui-wordmark">Debtsy</span>
      </Link>
      <Link to="/settings" className="rui-icon-btn" aria-label="Settings">
        <Settings size={22} aria-hidden="true" />
      </Link>
    </div>
  );
}
