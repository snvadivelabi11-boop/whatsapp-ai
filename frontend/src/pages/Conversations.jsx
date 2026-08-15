import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Phone,
  Users2,
  Clock,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Search
} from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';

export default function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await api.getConversations();
      setConversations(data || []);
      if (data && data.length > 0 && !selectedConv) {
        setSelectedConv(data[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId) => {
    try {
      setLoadingMsgs(true);
      const data = await api.getConversationMessages(convId);
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to load messages for conv:', convId, err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.conversation_id);
    }
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendAdminReply = async (e) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedConv) return;
    try {
      setSendingReply(true);
      await api.sendAdminReply(selectedConv.conversation_id, {
        message: adminReplyText,
        admin_name: 'SIH Admin'
      });
      setAdminReplyText('');
      await loadMessages(selectedConv.conversation_id);
      loadConversations();
    } catch (err) {
      alert('Failed to send admin message: ' + err.message);
    } finally {
      setSendingReply(false);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const text = (c.user_name + ' ' + c.phone + ' ' + (c.last_message || '')).toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="page-wrapper" style={{ height: 'calc(100vh - 68px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        gap: '20px',
        flex: 1,
        minHeight: 0,
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden'
      }}>
        {/* Left Panel: Conversation Threads List */}
        <div style={{
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0c121e'
        }}>
          {/* Search bar */}
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input"
                placeholder="Search chats by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '13px' }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active conversations yet.<br />
                <span style={{ fontSize: '11.5px', marginTop: '6px', display: 'inline-block' }}>
                  Use the <b>Chat Simulator</b> to start a chat!
                </span>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?.conversation_id === conv.conversation_id;
                return (
                  <div
                    key={conv.conversation_id}
                    onClick={() => setSelectedConv(conv)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: isSelected ? 'var(--emerald-400)' : 'var(--text-primary)' }}>
                        {conv.user_name || 'Student'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {conv.last_updated ? new Date(conv.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {conv.phone}
                    </div>
                    <div style={{
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {conv.last_message || 'Started conversation'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Active Conversation View */}
        {selectedConv ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header with Student & Team Info */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#0f172a'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--wa-green-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '15px'
                }}>
                  {(selectedConv.user_name || 'S').charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>
                    {selectedConv.user_name || 'Student'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{selectedConv.phone}</span>
                    <span>•</span>
                    <span style={{ color: 'var(--emerald-400)' }}>WhatsApp Connected</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Badge status={selectedConv.status || 'ACTIVE'} />
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              backgroundColor: 'var(--wa-bg)',
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0)',
              backgroundSize: '20px 20px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {loadingMsgs ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                  Loading chat history...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto', fontSize: '13px' }}>
                  No messages recorded in this conversation yet.
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isAdmin = msg.sender === 'admin';

                  return (
                    <div
                      key={msg.message_id || Math.random()}
                      className={
                        isUser
                          ? 'chat-bubble-in'
                          : isAdmin
                          ? 'chat-bubble-admin'
                          : 'chat-bubble-out'
                      }
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        fontWeight: '600',
                        marginBottom: '4px',
                        opacity: 0.85
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isUser ? <User size={12} /> : isAdmin ? <ShieldCheck size={12} /> : <Sparkles size={12} />}
                          {isUser ? (selectedConv.user_name || 'Student') : isAdmin ? 'Admin' : 'SIH AI Helpdesk'}
                        </span>
                        <span style={{ fontSize: '10px', marginLeft: '12px' }}>
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div>{msg.message}</div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Admin Reply Input Box */}
            <form
              onSubmit={handleSendAdminReply}
              style={{
                padding: '14px 18px',
                borderTop: '1px solid var(--border-color)',
                backgroundColor: '#0f172a',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}
            >
              <input
                type="text"
                className="input"
                placeholder="Type admin reply (will be sent to student's WhatsApp)..."
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                disabled={sendingReply}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sendingReply || !adminReplyText.trim()}
              >
                <Send size={16} />
                <span>{sendingReply ? 'Sending...' : 'Reply'}</span>
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Select a conversation to view chat history
          </div>
        )}
      </div>
    </div>
  );
}
