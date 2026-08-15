import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Ticket,
  PhoneCall,
  Users,
  Users2,
  BookOpen,
  Settings,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, stats }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'conversations', label: 'Conversations', icon: MessageSquare, badge: stats?.total_conversations },
    { id: 'playground', label: 'Chat Simulator', icon: Bot, highlight: true },
    { id: 'tickets', label: 'Support Tickets', icon: Ticket, badge: stats?.pending_tickets, badgeColor: 'badge-amber' },
    { id: 'call_requests', label: 'Call Requests', icon: PhoneCall, badge: stats?.pending_call_requests, badgeColor: 'badge-rose' },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'teams', label: 'Teams', icon: Users2 },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'settings', label: 'Settings & Status', icon: Settings },
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0f172a',
          fontWeight: 'bold'
        }}>
          <Sparkles size={20} />
        </div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            SIH AI Helpdesk
          </div>
          <div style={{ fontSize: '11px', color: 'var(--emerald-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--emerald-400)', display: 'inline-block' }}></span>
            WhatsApp Portal Active
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                color: isActive ? 'var(--emerald-400)' : 'var(--text-secondary)',
                fontWeight: isActive ? '600' : '500',
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={18} color={isActive ? 'var(--emerald-400)' : 'currentColor'} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`badge ${item.badgeColor || 'badge-slate'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                  {item.badge}
                </span>
              )}
              {item.highlight && !isActive && (
                <span style={{ fontSize: '9px', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: 'var(--cyan-400)', padding: '2px 5px', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                  TEST
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-color)',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <div>Smart India Hackathon 2025-26</div>
        <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>FastAPI + OpenRouter + Firebase</div>
      </div>
    </aside>
  );
}
