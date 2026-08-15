import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'emerald', subtitle, onClick }) {
  const colorStyles = {
    emerald: { bg: 'rgba(16, 185, 129, 0.12)', color: 'var(--emerald-400)', border: 'rgba(16, 185, 129, 0.25)' },
    cyan: { bg: 'rgba(6, 182, 212, 0.12)', color: 'var(--cyan-400)', border: 'rgba(6, 182, 212, 0.25)' },
    amber: { bg: 'rgba(245, 158, 11, 0.12)', color: 'var(--amber-400)', border: 'rgba(245, 158, 11, 0.25)' },
    rose: { bg: 'rgba(239, 68, 68, 0.12)', color: 'var(--rose-400)', border: 'rgba(239, 68, 68, 0.25)' },
    blue: { bg: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.25)' },
  };

  const current = colorStyles[color] || colorStyles.emerald;

  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div
        className="stat-icon-wrapper"
        style={{
          backgroundColor: current.bg,
          color: current.color,
          border: `1px solid ${current.border}`
        }}
      >
        {Icon && <Icon size={24} />}
      </div>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
          {title}
        </div>
        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {value !== undefined ? value : '--'}
        </div>
        {subtitle && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
