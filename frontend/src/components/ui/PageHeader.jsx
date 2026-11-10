import React from 'react';
import './PageHeader.css';

/**
 * PageHeader — Highland Field Ledger Header Component
 *
 * @param {string|React.ReactNode} title - Main page title
 * @param {string|React.ReactNode} [subtitle] - Descriptive subtitle / purpose statement
 * @param {string|{ icon?: React.ComponentType, label: string }} [badge] - Highland badge / pill tag
 * @param {React.ComponentType} [icon] - Main title icon
 * @param {React.ReactNode} [actions] - Right-aligned action buttons or selector controls
 * @param {React.ReactNode} [children] - Optional sub-content (inline stats or filters)
 * @param {string} [className] - Additional CSS class names
 */
export default function PageHeader({
  title,
  subtitle,
  description,
  badge,
  icon: TitleIcon,
  actions,
  children,
  className = '',
}) {
  const descText = subtitle || description;

  const renderBadge = () => {
    if (!badge) return null;
    if (typeof badge === 'string') {
      return (
        <div className="dalat-page-header-badge">
          <span>{badge}</span>
        </div>
      );
    }
    const BadgeIcon = badge.icon;
    return (
      <div className="dalat-page-header-badge">
        {BadgeIcon && <BadgeIcon size={14} strokeWidth={2.2} />}
        <span>{badge.label}</span>
      </div>
    );
  };

  return (
    <header className={`dalat-page-header ${className}`.trim()}>
      <div className="dalat-page-header-main">
        {renderBadge()}
        <div className="dalat-page-header-title-wrap">
          {TitleIcon && (
            <span className="dalat-page-header-icon" aria-hidden="true">
              <TitleIcon size={22} strokeWidth={2.2} />
            </span>
          )}
          <h1 className="dalat-page-header-title">{title}</h1>
        </div>
        {descText && (
          <p className="dalat-page-header-desc">{descText}</p>
        )}
      </div>

      {actions && (
        <div className="dalat-page-header-actions">
          {actions}
        </div>
      )}

      {children && (
        <div className="dalat-page-header-extra">
          {children}
        </div>
      )}
    </header>
  );
}
