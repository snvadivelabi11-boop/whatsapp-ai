import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  PhoneCall,
  Ticket
} from 'lucide-react';
import { api } from '../services/api';

export default function ChatPlayground({ onConversationUpdated }) {
  const [phone, setPhone] = useState('+919876500001');
  const [name, setName] = useState('Aarav Sharma');
  const [teamId, setTeamId] = useState('SIH_TM_1042');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'assistant',
      message: '👋 Welcome to SIH AI Helpdesk!\n\nI can help you with:\n\n1️⃣ SIH Information\n2️⃣ Project Doubts\n3️⃣ Technical Doubts\n4️⃣ Submission Help\n5️⃣ Team Support\n6️⃣ Contact Admin\n\nJust type your question.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText || message).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      sender: 'user',
      message: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory((prev) => [...prev, userMsg]);
    if (!customText) setMessage('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage({
        phone,
        name,
        team_id: teamId,
        message: textToSend
      });

      const botMsg = {
        sender: 'assistant',
        message: res.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistory((prev) => [...prev, botMsg]);
      if (onConversationUpdated) onConversationUpdated();
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'assistant',
          message: `❌ Error connecting to Helpdesk API: ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    { label: '👋 Start / Menu', prompt: 'Hi' },
    { label: '👥 Team Size & Gender Rule', prompt: 'How many members must be in a team and is a female mandatory?' },
    { label: '📊 Idea PPT Guidelines', prompt: 'What is the required format and slide structure for SIH Idea PPT?' },
    { label: '🏫 Inter-College Eligibility', prompt: 'Can students from different colleges form a single team?' },
    { label: '🏆 Prize Money', prompt: 'What is the prize amount for SIH winners?' },
    { label: '📞 Talk to Admin (Call Request)', prompt: 'I want to talk to admin' },
    { label: '🎫 Escalate Support Ticket', prompt: 'Can I change my registered mentor after internal hackathon?' },
    { label: '✅ Reply YES', prompt: 'YES' },
    { label: '❌ Reply NO', prompt: 'NO' },
  ];

  const handleResetChat = () => {
    setChatHistory([
      {
        sender: 'assistant',
        message: '👋 Welcome to SIH AI Helpdesk!\n\nI can help you with:\n\n1️⃣ SIH Information\n2️⃣ Project Doubts\n3️⃣ Technical Doubts\n4️⃣ Submission Help\n5️⃣ Team Support\n6️⃣ Contact Admin\n\nJust type your question.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Side: Student Profile & Simulator Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--emerald-400)" />
              <span>Simulated Student Profile</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Student Name
                </label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  WhatsApp Phone Number
                </label>
                <input
                  type="text"
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Assigned Team ID
                </label>
                <input
                  type="text"
                  className="input"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                />
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleResetChat}
                style={{ marginTop: '8px' }}
              >
                <RotateCcw size={14} />
                <span>Reset Chat Screen</span>
              </button>
            </div>
          </div>

          {/* Quick Test Prompt Pills */}
          <div className="glass-card">
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="var(--cyan-400)" />
              <span>Test Scenarios & Actions</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {samplePrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  disabled={loading}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--emerald-500)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div style={{ fontWeight: '600' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    "{item.prompt}"
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive WhatsApp Device Mockup */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '680px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {/* WhatsApp Header Bar */}
          <div style={{
            backgroundColor: 'var(--wa-green-dark)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                color: 'var(--wa-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                🤖
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>SIH AI Helpdesk</div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>online • Verified Helpdesk Bot</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', opacity: 0.85 }}>
              WhatsApp Webhook Mode
            </div>
          </div>

          {/* Messages Flow */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px',
            backgroundColor: 'var(--wa-bg)',
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 0)',
            backgroundSize: '20px 20px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {chatHistory.map((item, idx) => (
              <div
                key={idx}
                className={item.sender === 'user' ? 'chat-bubble-out' : 'chat-bubble-in'}
                style={{
                  alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: item.sender === 'user' ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)',
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{item.message}</div>
                <div style={{
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'right',
                  marginTop: '4px'
                }}>
                  {item.time}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-bubble-in" style={{ alignSelf: 'flex-start' }}>
                <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  SIH AI Helpdesk is typing...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            style={{
              padding: '12px 16px',
              backgroundColor: '#111b21',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              className="input"
              placeholder="Ask SIH doubt or test (e.g. 'Can we change mentor?', 'I want to talk to admin')..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !message.trim()}
              style={{ padding: '9px 18px' }}
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
