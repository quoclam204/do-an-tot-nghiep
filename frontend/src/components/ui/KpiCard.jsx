import React from 'react';
import './KpiCard.css';

/**
 * KpiGrid — Grid container for KPI Cards
 */
export function KpiGrid({ children, className = '' }) {
  return (
    <div className={`dalat-kpi-grid ${className}`.trim()}>
      {children}
    </div>
  );
}

/**
 * KpiCard — Highland Field Ledger KPI & Summary Stat Card
 *
 * @param {string} label - Top uppercase label / category
 * @param {string|number} value - Primary formatted metric number
 * @param {string} [unit] - Metric unit (đ, ha, kg, vụ...)
 * @param {React.ComponentType} [icon] - SVG Icon component
 * @param {'green'|'red'|'blue'|'purple'|'amber'|'neutral'} [variant='neutral'] - Semantic tone
 * @param {string|React.ReactNode} [subtext] - Explanatory footnote or breakdown
 * @param {React.ReactNode} [action] - Action button or detail link
 * @param {boolean} [highlight] - Special border highlight
 * @param {Function} [onClick] - Click handler for interactive cards
 * @param {string} [className] - Additional CSS class names
 * @param {React.ReactNode} [children] - Optional custom content
 */
export default function KpiCard({
  label,
  value,
  unit,
  icon: CardIcon,
  variant = 'neutral',
  subtext,
  action,
  highlight = false,
  onClick,
  className = '',
  children,
}) {
  const isClickable = Boolean(onClick);

  return (
    <div
      className={`dalat-kpi-card variant-${variant} ${isClickable ? 'is-clickable' : ''} ${highlight ? 'is-highlight' : ''} ${className}`.trim()}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
    >
      <div className="dalat-kpi-top-row">
        {label && <span className="dalat-kpi-label">{label}</span>}
        {CardIcon && (
          <div className="dalat-kpi-icon-wrap" aria-hidden="true">
            <CardIcon size={18} strokeWidth={2.2} />
          </div>
        )}
      </div>

      <div className="dalat-kpi-value-row">
        <span className="dalat-kpi-value">{value}</span>
        {unit && <span className="dalat-kpi-unit">{unit}</span>}
      </div>

      {(subtext || action) && (
        <div className="dalat-kpi-footer">
          {subtext && <div className="dalat-kpi-subtext">{subtext}</div>}
          {action && <div className="dalat-kpi-action">{action}</div>}
        </div>
      )}

      {children}
    </div>
  );
}
