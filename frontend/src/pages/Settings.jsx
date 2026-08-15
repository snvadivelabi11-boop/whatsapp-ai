import React from 'react';
import {
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  Terminal,
  Shield,
  Key,
  Database,
  ExternalLink
} from 'lucide-react';
import Badge from '../components/Badge';

export default function SettingsPage({ healthData }) {
  const isCloud = healthData?.services?.firebase_mode === 'cloud_firestore';
  const isOpenRouterOk = healthData?.services?.openrouter_configured;
  const isWhatsAppOk = healthData?.services?.whatsapp_configured;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard: ' + text);
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {/* Service Health & Credentials Checklist */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Shield size={18} color="var(--emerald-400)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
              System Status & Credentials
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* OpenRouter */}
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--bg-input)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  OpenRouter AI Engine
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Model: {healthData?.services?.openrouter_model || 'deepseek/deepseek-chat'}
                </div>
              </div>
              <Badge status={isOpenRouterOk ? 'ACTIVE' : 'PENDING'} />
            </div>

            {/* Firebase */}
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--bg-input)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  Database (Firestore / Local)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Mode: {isCloud ? 'Firebase Firestore Cloud' : 'Local JSON Data Store'}
                </div>
              </div>
              <Badge status={isCloud ? 'ACTIVE' : 'OFFLINE'} />
            </div>

            {/* WhatsApp */}
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--bg-input)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  WhatsApp Cloud API
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Webhook verification & outbound messages
                </div>
              </div>
              <Badge status={isWhatsAppOk ? 'ACTIVE' : 'PENDING'} />
            </div>
          </div>
        </div>

        {/* WhatsApp Cloud API Webhook Instructions */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Terminal size={18} color="var(--cyan-400)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
              WhatsApp Webhook Configuration
            </h3>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>
              To receive live WhatsApp messages from students, configure the webhook in the <b>Meta for Developers Portal</b>:
            </p>

            <div>
              <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Callback URL (with ngrok/public domain)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  className="input"
                  value="https://your-domain.ngrok-free.app/api/whatsapp/webhook"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                />
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => copyToClipboard('https://your-domain.ngrok-free.app/api/whatsapp/webhook')}
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Verify Token
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  className="input"
                  value="sih_ai_verify_token_secure_2025"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                />
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => copyToClipboard('sih_ai_verify_token_secure_2025')}
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div style={{ padding: '10px', backgroundColor: 'rgba(6, 182, 212, 0.08)', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <div style={{ fontWeight: '600', color: 'var(--cyan-400)', fontSize: '12px', marginBottom: '2px' }}>
                Webhook Event Subscription:
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Subscribe to <code>messages</code> field under WhatsApp Cloud API settings.
              </div>
            </div>
          </div>
        </div>

        {/* REST API Reference Card */}
        <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
            FastAPI Backend Endpoints
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ padding: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--emerald-400)', fontWeight: 'bold' }}>GET</span> /health
            </div>
            <div style={{ padding: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--cyan-400)', fontWeight: 'bold' }}>POST</span> /api/chat
            </div>
            <div style={{ padding: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--emerald-400)', fontWeight: 'bold' }}>GET/POST</span> /api/whatsapp/webhook
            </div>
            <div style={{ padding: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--emerald-400)', fontWeight: 'bold' }}>GET</span> /api/stats
            </div>
            <div style={{ padding: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--emerald-400)', fontWeight: 'bold' }}>GET</span> /api/conversations
            </div>
            <div style={{ padding: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--cyan-400)', fontWeight: 'bold' }}>POST</span> /api/conversations/{'{id}'}/reply
            </div>
            <div style={{ padding: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--emerald-400)', fontWeight: 'bold' }}>GET/POST</span> /api/tickets
            </div>
            <div style={{ padding: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--emerald-400)', fontWeight: 'bold' }}>GET/POST</span> /api/call-requests
            </div>
            <div style={{ padding: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--emerald-400)', fontWeight: 'bold' }}>GET/POST</span> /api/knowledge
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
