/**
 * AnimatedTabs - a tab strip with a sliding indicator.
 *
 * Adapted from the 21st.dev component "Animated Tabs" (21st id 24930, by
 * educalvolpz): https://21st.dev/community/components/educalvolpz/animated-tabs/default
 * The original animates its indicator with motion/react layoutId. This version
 * keeps the same props (tabs, activeTab, defaultTab, onChange, variant,
 * className) and the same behavior, a segment or underline indicator that
 * slides to the active tab with full keyboard navigation (arrows, Home, End),
 * but measures the active tab and moves one element with a CSS transform, so
 * the app takes on no new runtime dependency. The indicator and the active
 * tab take the ranch tokens. Under prefers-reduced-motion it jumps with no slide.
 */

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import './plan-widgets.css';

export interface AnimatedTabsProps {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  activeTab?: string;
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'segment' | 'underline';
  /** Accessible name for the tab list. */
  label?: string;
  className?: string;
}

export function AnimatedTabs({
  tabs,
  activeTab: controlled,
  defaultTab,
  onChange,
  variant = 'segment',
  label = 'Tabs',
  className = '',
}: AnimatedTabsProps) {
  const uid = useId();
  const [internal, setInternal] = useState(defaultTab ?? tabs[0]?.id ?? '');
  const active = controlled ?? internal;
  const listRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ x: number; w: number } | null>(null);
  const [ready, setReady] = useState(false);

  const pick = useCallback(
    (id: string) => {
      if (controlled === undefined) setInternal(id);
      onChange?.(id);
    },
    [controlled, onChange]
  );

  const measure = useCallback(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!list || !el) return;
    setBox((prev) => (prev && prev.x === el.offsetLeft && prev.w === el.offsetWidth ? prev : { x: el.offsetLeft, w: el.offsetWidth }));
  }, []);

  useLayoutEffect(measure, [measure, active, tabs.length]);

  useEffect(() => {
    // turn the slide on only after the first placement, so it never slides in from nothing
    const raf = requestAnimationFrame(() => setReady(true));
    const list = listRef.current;
    const ro = typeof ResizeObserver !== 'undefined' && list ? new ResizeObserver(measure) : null;
    if (list) ro?.observe(list);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); };
  }, [measure]);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    const tab = tabs[next];
    pick(tab.id);
    document.getElementById(`${uid}-tab-${tab.id}`)?.focus();
  };

  const style = box ? ({ '--at-x': `${box.x}px`, '--at-w': `${box.w}px` } as CSSProperties) : undefined;

  return (
    <div ref={listRef} role="tablist" aria-label={label} className={`at at-${variant}${ready ? ' is-ready' : ''} ${className}`.trim()} style={style}>
      {box && <span className="at-ind" aria-hidden="true" />}
      {tabs.map((tab, i) => {
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            id={`${uid}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            className={`at-tab${on ? ' is-on' : ''}`}
            onClick={() => pick(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
