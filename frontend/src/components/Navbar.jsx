import React from 'react';
import { RefreshCw, ShieldCheck, Database, Cloud } from 'lucide-react';

export default function Navbar({ title, subtitle, onRefresh, isRefreshing, healthData }) {
  const isCloud = healthData?.services?.firebase_mode === 'cloud_firestore';
  const isOpenRouterOk = healthData?.services?.openrouter_configured;

  return (
    <header style={{
      height: '68px',
      backgroundColor: 'var(--bg-main)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div>
        <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Firebase Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: '6px',
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          {isCloud ? <Cloud size={14} color="var(--cyan-400)" /> : <Database size={14} color="var(--emerald-400)" />}
          <span>{isCloud ? 'Firestore Cloud' : 'Local DB Store'}</span>
        </div>

        {/* AI Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: '6px',
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <ShieldCheck size={14} color={isOpenRouterOk ? 'var(--emerald-400)' : 'var(--amber-400)'} />
          <span>{isOpenRouterOk ? 'OpenRouter Active' : 'SIH Grounded Engine'}</span>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm"
            title="Refresh live data"
          >
            <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
}
