/**
 * ModalShell: the one ranch dialog frame.
 *
 * Portals to <body>, locks page scroll, traps Tab inside the sheet, closes on
 * Escape and on a backdrop click, and puts focus back where it was on close.
 * Phones get a bottom sheet, desktops a centered card. The title sits on a
 * wooden plank like the page headings; fields and buttons are styled in
 * modal.css. Entrance animation is off under prefers-reduced-motion.
 */

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './modal.css';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Open dialogs, topmost last: only the top one handles Escape and Tab. */
const openStack: symbol[] = [];

interface ModalShellProps {
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Accessible name when there is no visible header (`bare`). */
  label?: string;
  /** No header: a floating close button over the content (used by the celebration). */
  bare?: boolean;
  /** Rendered full-screen behind the sheet (confetti and the like). */
  behind?: ReactNode;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Footer row (buttons). Rendered under the scrolling body. */
  footer?: ReactNode;
  /** Wrap children in the padded scroll area (default). Pass false for custom bodies. */
  padded?: boolean;
  /** Label for the close button. */
  closeLabel?: string;
  children: ReactNode;
}

export function ModalShell({ onClose, title, subtitle, label, bare = false, behind, icon, size = 'lg', footer, padded = true, closeLabel = 'Close', children }: ModalShellProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  const titleId = useId();

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const me = Symbol('modal');
    openStack.push(me);
    document.body.classList.add('mdl-lock');
    const sheet = sheetRef.current;
    // focus the first field if there is one, otherwise the sheet itself
    const first = sheet?.querySelector<HTMLElement>('[data-autofocus], .mdl-scroll input:not([type=hidden]), .mdl-scroll select, .mdl-scroll textarea');
    (first ?? sheet)?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (openStack[openStack.length - 1] !== me) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !sheet) return;
      const items = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) { e.preventDefault(); return; }
      const a = items[0], z = items[items.length - 1];
      const cur = document.activeElement;
      if (e.shiftKey && (cur === a || cur === sheet)) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && cur === z) { e.preventDefault(); a.focus(); }
      else if (!sheet.contains(cur)) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      openStack.splice(openStack.indexOf(me), 1);
      if (openStack.length === 0) document.body.classList.remove('mdl-lock');
      prev?.focus?.({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div className="mdl">
      <div className="mdl-back" onClick={onClose} aria-hidden="true" />
      {behind}
      <div ref={sheetRef} className={`mdl-sheet mdl-${size}${bare ? ' is-bare' : ''}`} role="dialog" aria-modal="true" aria-labelledby={bare ? undefined : titleId} aria-label={bare ? label : undefined} tabIndex={-1}>
        {bare ? (
          <button type="button" className="mdl-x mdl-x-float" onClick={onClose} aria-label={closeLabel}><X size={22} /></button>
        ) : (
        <div className="mdl-head">
          <div className="mdl-head-copy">
            <h2 id={titleId} className="rui-plank mdl-plank">{icon}<span>{title}</span></h2>
            {subtitle && <p className="mdl-sub">{subtitle}</p>}
          </div>
          <button type="button" className="mdl-x" onClick={onClose} aria-label={closeLabel}><X size={22} /></button>
        </div>
        )}
        {padded ? <div className="mdl-scroll">{children}</div> : children}
        {footer && <div className="mdl-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
