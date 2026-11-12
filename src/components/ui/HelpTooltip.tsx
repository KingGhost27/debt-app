/**
 * Help Tooltip Component
 *
 * Reusable tooltip/popover for displaying help text.
 * Shows as a modal on mobile, popover on desktop.
 */

import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { ModalShell } from './ModalShell';

interface HelpTooltipProps {
  title: string;
  content: string;
  className?: string;
}

export function HelpTooltip({ title, content, className = '' }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close on outside click (desktop only)
  useEffect(() => {
    if (!isOpen || isMobile) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMobile]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`ht-btn ${className}`}
        aria-label={`Help: ${title}`}
        aria-expanded={isOpen}
      >
        <HelpCircle size={16} />
      </button>

      {/* Mobile: bottom sheet */}
      {isOpen && isMobile && (
        <ModalShell onClose={() => setIsOpen(false)} size="sm" title={title}>
          <p className="mdl-note" style={{ fontSize: 16, color: 'var(--ranch-ink)' }}>{content}</p>
        </ModalShell>
      )}

      {/* Desktop: popover */}
      {isOpen && !isMobile && (
        <div ref={tooltipRef} className="ht-pop" role="dialog" aria-label={title}>
          <div className="ht-pop-h">
            <h4>{title}</h4>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close help"><X size={14} /></button>
          </div>
          <p>{content}</p>
        </div>
      )}
    </>
  );
}
