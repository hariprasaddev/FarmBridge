import { useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import './Modal.css';

const SIZES = { sm: 'fb-modal-sm', md: 'fb-modal-md', lg: 'fb-modal-lg', xl: 'fb-modal-xl' };

/**
 * Accessible modal: closes on ESC / backdrop click, traps focus while open,
 * locks body scroll, announces itself to screen readers.
 *
 * @example
 * <Modal open={open} onClose={close} title="Review request" size="lg">
 *   …body…
 * </Modal>
 */
function Modal({
  open = false,
  onClose = () => {},
  title = '',
  subtitle = '',
  icon = null,
  size = 'md',
  children,
  footer = null,
  closeOnBackdrop = true,
}) {
  const panelRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Lock body scroll + remember the focused element.
  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      if (previousFocusRef.current?.focus) previousFocusRef.current.focus();
    };
  }, [open]);

  // ESC to close + simple focus trap.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Focus the panel on open.
  useEffect(() => {
    if (open && panelRef.current) panelRef.current.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fb-modal-overlay"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={`fb-modal ${SIZES[size] || SIZES.md}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        tabIndex={-1}
      >
        {(title || subtitle) && (
          <div className="fb-modal-header">
            <div>
              <div className="fb-modal-title">
                {icon && <span className="fb-modal-header-icon" aria-hidden="true">{icon}</span>}
                {title}
              </div>
              {subtitle && <div className="fb-modal-subtitle">{subtitle}</div>}
            </div>
            <button type="button" className="fb-modal-close" onClick={onClose} aria-label="Close dialog">
              <FaTimes size={16} />
            </button>
          </div>
        )}
        <div className="fb-modal-body">{children}</div>
        {footer && <div className="fb-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
