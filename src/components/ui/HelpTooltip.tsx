/**
 * Help Tooltip Component
 *
 * Reusable tooltip/popover for displaying help text.
 * Shows as a modal on mobile, popover on desktop.
 */

import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

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
        className={`text-gray-400 hover:text-primary-500 transition-colors ${className}`}
        aria-label={`Help: ${title}`}
      >
        <HelpCircle size={16} />
      </button>

      {/* Mobile: Full modal */}
      {isOpen && isMobile && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-white w-full rounded-t-2xl p-4 pb-8 animate-slide-up">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{content}</p>
          </div>
        </div>
      )}

      {/* Desktop: Popover */}
      {isOpen && !isMobile && (
        <div
          ref={tooltipRef}
          className="absolute z-50 w-72 p-3 bg-white rounded-xl shadow-lg border border-gray-100 mt-2 left-0"
          style={{ transform: 'translateY(4px)' }}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-gray-600 text-xs leading-relaxed">{content}</p>
          {/* Arrow */}
          <div className="absolute -top-2 left-4 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45" />
        </div>
      )}
    </>
  );
}
