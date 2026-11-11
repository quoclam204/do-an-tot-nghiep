import React from 'react';
import './EmptyState.css';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  type = 'empty', // 'empty' | 'filter' | 'error'
}) {
  return (
    <div className={`dalat-empty-state ${type}`}>
      {Icon && (
        <div className="dalat-empty-icon-wrap" aria-hidden="true">
          <Icon size={26} strokeWidth={2} />
        </div>
      )}
      {title && <h3 className="dalat-empty-title">{title}</h3>}
      {description && <p className="dalat-empty-desc">{description}</p>}
      {(primaryAction || secondaryAction) && (
        <div className="dalat-empty-actions">
          {primaryAction && (
            <button
              type="button"
              className="dalat-empty-btn-primary"
              onClick={primaryAction.onClick}
            >
              {primaryAction.icon && (
                <primaryAction.icon size={16} strokeWidth={2.2} />
              )}
              <span>{primaryAction.label}</span>
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              className="dalat-empty-btn-secondary"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.icon && (
                <secondaryAction.icon size={16} strokeWidth={2.2} />
              )}
              <span>{secondaryAction.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
