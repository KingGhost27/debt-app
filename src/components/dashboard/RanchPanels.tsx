/**
 * Ranch panels for the dashboard: a plank-tab heading and the panel that
 * sits on the scene's ground color. `RanchSection` is the collapsible
 * version used for the longer modules (charts, history, calendar).
 */

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export function Plank({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <span className="dash-plank">
      {icon}
      {children}
    </span>
  );
}

export function RanchSection({
  title,
  note,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  note?: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="dash-panel dash-section">
      <button type="button" className="dash-section-btn" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Plank icon={icon}>{title}</Plank>
        {note && <span className="dash-note">{note}</span>}
        <ChevronDown size={20} className={`dash-chev${open ? ' is-open' : ''}`} aria-hidden="true" />
      </button>
      <div className={`dash-collapse${open ? ' is-open' : ''}`}>
        <div className="dash-collapse-in">{children}</div>
      </div>
    </section>
  );
}
