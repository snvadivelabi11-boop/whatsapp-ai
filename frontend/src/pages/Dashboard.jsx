import React from 'react';
import {
  Users,
  Users2,
  MessageSquare,
  Sparkles,
  Ticket,
  PhoneCall,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';

export default function Dashboard({ stats, setCurrentPage, healthData }) {
  const isCloud = healthData?.services?.firebase_mode === 'cloud_firestore';

  return (
    <div className="page-wrapper">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-emerald">SIH 2025-26 Live</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              WhatsApp AI Helpdesk Command Center
            </span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Welcome to SIH Helpdesk Admin
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '650px' }}>
            Automated WhatsApp assistance for participating student teams. Monitoring inquiries, managing AI knowledge grounding, resolving escalations, and fulfilling callback requests.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={() => setCurrentPage('playground')}
          >
            <Sparkles size={16} />
            <span>Open Chat Simulator</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage('tickets')}
          >
            <Ticket size={16} />
            <span>View Tickets ({stats?.pending_tickets || 0})</span>
          </button>
        </div>
      </div>

      {/* Main 6 Statistics Grid */}
      <div className="stat-card-grid">
        <StatCard
          title="Total Users"
          value={stats?.total_users || 0}
          icon={Users}
          color="emerald"
          subtitle="Registered participants"
          onClick={() => setCurrentPage('users')}
        />
        <StatCard
          title="Total Teams"
          value={stats?.total_teams || 0}
          icon={Users2}
          color="cyan"
          subtitle="Shortlisted SIH teams"
          onClick={() => setCurrentPage('teams')}
        />
        <StatCard
          title="Total Inquiries"
          value={stats?.total_questions || 0}
          icon={MessageSquare}
          color="blue"
          subtitle="WhatsApp & Local chats"
          onClick={() => setCurrentPage('conversations')}
        />
        <StatCard
          title="AI Resolved"
          value={stats?.ai_resolved || 0}
          icon={Sparkles}
          color="emerald"
          subtitle="Automated answers"
        />
        <StatCard
          title="Pending Tickets"
          value={stats?.pending_tickets || 0}
          icon={Ticket}
          color="amber"
          subtitle="Requires admin review"
          onClick={() => setCurrentPage('tickets')}
        />
        <StatCard
          title="Pending Call Requests"
          value={stats?.pending_call_requests || 0}
          icon={PhoneCall}
          color="rose"
          subtitle="Student callbacks needed"
          onClick={() => setCurrentPage('call_requests')}
        />
      </div>

      {/* Quick Access & System Summary Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {/* Escalation & Support Status */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Action Items
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              backgroundColor: 'var(--bg-input)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--amber-400)' }}>
                  <Ticket size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {stats?.pending_tickets || 0} Escalated Support Tickets
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    Questions that AI could not resolve
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage('tickets')}>
                <span>Resolve</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              backgroundColor: 'var(--bg-input)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--rose-400)' }}>
                  <PhoneCall size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {stats?.pending_call_requests || 0} Student Call Requests
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    Teams requesting direct phone assistance
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage('call_requests')}>
                <span>Call Roster</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* System Architecture & Status */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Service Status & Integration
            </h3>
            <span className="badge badge-emerald">Online</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>AI Engine Provider</span>
              <span style={{ color: 'var(--emerald-400)', fontWeight: '600' }}>OpenRouter ({healthData?.services?.openrouter_model || 'deepseek/deepseek-chat'})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Database Mode</span>
              <span style={{ color: 'var(--cyan-400)', fontWeight: '600' }}>
                {isCloud ? 'Firebase Cloud Firestore' : 'Local Fallback Storage'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>WhatsApp Cloud API</span>
              <span style={{ color: healthData?.services?.whatsapp_configured ? 'var(--emerald-400)' : 'var(--amber-400)', fontWeight: '600' }}>
                {healthData?.services?.whatsapp_configured ? 'Configured & Active' : 'Simulated / Webhook Ready'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>RAG Knowledge Base</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Markdown Files + Firestore</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
