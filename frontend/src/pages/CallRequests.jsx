import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  CheckCircle2,
  Clock,
  PhoneForwarded,
  Search,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

export default function CallRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await api.getCallRequests(filterStatus || undefined);
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to load call requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filterStatus]);

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      setUpdating(true);
      await api.updateCallRequest(requestId, {
        status: newStatus,
        admin_notes: adminNote || undefined
      });
      setSelectedReq(null);
      setAdminNote('');
      loadRequests();
    } catch (err) {
      alert('Failed to update call request: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const text = (r.request_id + ' ' + r.name + ' ' + r.phone + ' ' + r.team_id + ' ' + r.reason).toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="page-wrapper">
      {/* Search & Filter Bar */}
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
              placeholder="Search call requests by name, phone, reason..."
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
              All ({requests.length})
            </button>
            <button
              className={`btn btn-sm ${filterStatus === 'PENDING' ? 'btn-warning' : 'btn-secondary'}`}
              onClick={() => setFilterStatus('PENDING')}
            >
              Pending
            </button>
            <button
              className={`btn btn-sm ${filterStatus === 'CONTACTED' ? 'btn-secondary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus('CONTACTED')}
            >
              Contacted
            </button>
            <button
              className={`btn btn-sm ${filterStatus === 'RESOLVED' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus('RESOLVED')}
            >
              Resolved
            </button>
          </div>
        </div>
      </div>

      {/* Call Requests Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Student Name</th>
              <th>Phone Number</th>
              <th>Team ID</th>
              <th>Reason for Call</th>
              <th>Status</th>
              <th>Requested At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading call requests...
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No call requests found.
                </td>
              </tr>
            ) : (
              filteredRequests.map((r) => (
                <tr key={r.request_id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--rose-400)' }}>
                    #{r.request_id}
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {r.name}
                  </td>
                  <td>
                    <a
                      href={`tel:${r.phone}`}
                      style={{ color: 'var(--emerald-400)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <PhoneCall size={13} />
                      <span>{r.phone}</span>
                    </a>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cyan-400)' }}>
                    {r.team_id}
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ color: 'var(--text-primary)' }}>{r.reason}</div>
                    {r.admin_notes && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Note: {r.admin_notes}
                      </div>
                    )}
                  </td>
                  <td>
                    <Badge status={r.status || 'PENDING'} />
                  </td>
                  <td style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {r.created_at ? new Date(r.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedReq(r);
                        setAdminNote(r.admin_notes || '');
                      }}
                    >
                      <span>Update</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Call Request Status Modal */}
      <Modal
        isOpen={Boolean(selectedReq)}
        onClose={() => setSelectedReq(null)}
        title={`Call Request #${selectedReq?.request_id}`}
      >
        {selectedReq && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-input)', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {selectedReq.name} ({selectedReq.phone})
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--cyan-400)', marginTop: '2px' }}>
                Team: {selectedReq.team_id}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                <b>Reason:</b> {selectedReq.reason}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Call Summary / Admin Notes
              </label>
              <textarea
                className="textarea"
                rows={3}
                placeholder="Log notes from your phone call with the student..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button
                className="btn btn-warning btn-sm"
                disabled={updating}
                onClick={() => handleUpdateStatus(selectedReq.request_id, 'CONTACTED')}
              >
                <PhoneForwarded size={14} />
                <span>Mark Contacted</span>
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={updating}
                onClick={() => handleUpdateStatus(selectedReq.request_id, 'RESOLVED')}
              >
                <CheckCircle2 size={14} />
                <span>Mark Resolved</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
