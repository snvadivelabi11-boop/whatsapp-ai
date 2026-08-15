import React, { useState, useEffect } from 'react';
import {
  Ticket,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

export default function Tickets({ setCurrentPage }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New ticket state
  const [newTicket, setNewTicket] = useState({
    user_name: '',
    phone_number: '',
    team_id: 'SIH_TM_1042',
    question: '',
    priority: 'HIGH'
  });

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await api.getTickets(filterStatus || undefined);
      setTickets(data || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [filterStatus]);

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      setUpdating(true);
      await api.updateTicket(ticketId, {
        status: newStatus,
        admin_notes: adminNote || undefined
      });
      setSelectedTicket(null);
      setAdminNote('');
      loadTickets();
    } catch (err) {
      alert('Failed to update ticket: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await api.createTicket({
        user_id: `user_${newTicket.phone_number.replace(/\D/g, '')}`,
        user_name: newTicket.user_name,
        phone_number: newTicket.phone_number,
        team_id: newTicket.team_id,
        question: newTicket.question,
        conversation_id: `conv_${newTicket.phone_number.replace(/\D/g, '')}`,
        priority: newTicket.priority
      });
      setIsCreateOpen(false);
      setNewTicket({ user_name: '', phone_number: '', team_id: 'SIH_TM_1042', question: '', priority: 'HIGH' });
      loadTickets();
    } catch (err) {
      alert('Failed to create ticket: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const text = (t.ticket_id + ' ' + t.user_name + ' ' + t.phone_number + ' ' + t.team_id + ' ' + t.question).toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="page-wrapper">
      {/* Header with Search & Filter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              className="input"
              placeholder="Search tickets by ID, name, question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '34px' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '11px' }} />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn btn-sm ${filterStatus === '' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus('')}
            >
              All ({tickets.length})
            </button>
            <button
              className={`btn btn-sm ${filterStatus === 'PENDING' ? 'btn-warning' : 'btn-secondary'}`}
              onClick={() => setFilterStatus('PENDING')}
            >
              Pending
            </button>
            <button
              className={`btn btn-sm ${filterStatus === 'RESOLVED' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus('RESOLVED')}
            >
              Resolved
            </button>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} />
          <span>Create Ticket</span>
        </button>
      </div>

      {/* Tickets Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Student / Team</th>
              <th>Question / Doubt</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading support tickets...
                </td>
              </tr>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No tickets found matching your filter.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => (
                <tr key={t.ticket_id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--cyan-400)' }}>
                    #{t.ticket_id}
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{t.user_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.phone_number} • {t.team_id}</div>
                  </td>
                  <td style={{ maxWidth: '350px' }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{t.question}</div>
                    {t.admin_notes && (
                      <div style={{ fontSize: '11.5px', color: 'var(--emerald-400)', marginTop: '4px' }}>
                        Note: {t.admin_notes}
                      </div>
                    )}
                  </td>
                  <td>
                    <Badge type={t.priority || 'MEDIUM'} />
                  </td>
                  <td>
                    <Badge status={t.status || 'PENDING'} />
                  </td>
                  <td style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedTicket(t);
                        setAdminNote(t.admin_notes || '');
                      }}
                    >
                      <span>Manage</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ticket Details & Resolution Modal */}
      <Modal
        isOpen={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
        title={`Ticket #${selectedTicket?.ticket_id}`}
      >
        {selectedTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-input)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Student Query</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                "{selectedTicket.question}"
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Asked by <b>{selectedTicket.user_name}</b> ({selectedTicket.phone_number}) from Team <b>{selectedTicket.team_id}</b>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Admin Resolution Notes
              </label>
              <textarea
                className="textarea"
                rows={3}
                placeholder="Explain the official resolution or instructions given to the student..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              {selectedTicket.status === 'PENDING' ? (
                <button
                  className="btn btn-primary"
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedTicket.ticket_id, 'RESOLVED')}
                >
                  <CheckCircle2 size={16} />
                  <span>Mark Resolved</span>
                </button>
              ) : (
                <button
                  className="btn btn-warning"
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedTicket.ticket_id, 'PENDING')}
                >
                  <Clock size={16} />
                  <span>Reopen Ticket</span>
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create Manual Ticket Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Support Ticket"
      >
        <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Student Name</label>
            <input
              type="text"
              required
              className="input"
              value={newTicket.user_name}
              onChange={(e) => setNewTicket({ ...newTicket, user_name: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Phone Number</label>
            <input
              type="text"
              required
              className="input"
              placeholder="+919876543210"
              value={newTicket.phone_number}
              onChange={(e) => setNewTicket({ ...newTicket, phone_number: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Team ID</label>
            <input
              type="text"
              required
              className="input"
              value={newTicket.team_id}
              onChange={(e) => setNewTicket({ ...newTicket, team_id: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Question / Escalation Reason</label>
            <textarea
              required
              className="textarea"
              value={newTicket.question}
              onChange={(e) => setNewTicket({ ...newTicket, question: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={updating}>Save Ticket</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
