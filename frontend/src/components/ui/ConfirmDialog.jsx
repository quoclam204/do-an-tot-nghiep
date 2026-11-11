import React, { useEffect, useRef } from 'react';
import './ConfirmDialog.css';
import { IconAlertTriangle, IconTrash, IconInfo } from '../icons';

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  tip,
  confirmLabel = 'Xác nhận xóa',
  cancelLabel = 'Hủy bỏ, giữ lại',
  variant = 'danger',
  confirmIcon: CustomIcon,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelBtnRef = useRef(null);

  // Focus management & Escape key handling for accessibility
  useEffect(() => {
    if (!isOpen) return;

    // Focus cancel button by default (safer for elder users to prevent accidental destruction)
    const timer = setTimeout(() => {
      if (cancelBtnRef.current) {
        cancelBtnRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        e.preventDefault();
        onCancel?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const DefaultIcon = variant === 'danger' ? IconTrash : variant === 'warning' ? IconAlertTriangle : IconInfo;
  const ActiveIcon = CustomIcon || DefaultIcon;

  return (
    <div
      className="dalat-confirm-backdrop"
      onClick={() => {
        if (!isLoading) onCancel?.();
      }}
    >
      <div
        ref={dialogRef}
        className="dalat-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dalat-confirm-dialog-title"
        aria-describedby="dalat-confirm-dialog-desc"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="dalat-confirm-header">
          <div className={`dalat-confirm-icon-wrap ${variant}`} aria-hidden="true">
            <ActiveIcon size={22} strokeWidth={2.2} />
          </div>
          <div className="dalat-confirm-content">
            <h3 id="dalat-confirm-dialog-title" className="dalat-confirm-title">
              {title}
            </h3>
            <div id="dalat-confirm-dialog-desc" className="dalat-confirm-desc">
              {description}
            </div>
            {tip && <div className="dalat-confirm-tip">{tip}</div>}
          </div>
        </div>

        <div className="dalat-confirm-actions">
          <button
            ref={cancelBtnRef}
            type="button"
            className="dalat-confirm-btn cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`dalat-confirm-btn ${variant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {ActiveIcon && <ActiveIcon size={16} strokeWidth={2.2} />}
            <span>{isLoading ? 'Đang thực hiện...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
