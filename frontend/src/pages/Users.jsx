import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, Phone, Shield } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const text = (u.name + ' ' + u.phone + ' ' + (u.team_id || '') + ' ' + (u.role || '')).toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="page-wrapper">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <input
            type="text"
            className="input"
            placeholder="Search participants by name, phone, team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px' }}
          />
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '11px' }} />
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Total Participants: <b style={{ color: 'var(--text-primary)' }}>{filteredUsers.length}</b>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Participant Name</th>
              <th>WhatsApp Phone</th>
              <th>Team ID</th>
              <th>Role</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading participants...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No participants found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.user_id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cyan-400)' }}>
                    {u.user_id}
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{u.name}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--emerald-400)' }}>
                      <Phone size={13} />
                      <span>{u.phone}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                    {u.team_id || 'Unassigned'}
                  </td>
                  <td>
                    <span className="badge badge-slate">{u.role || 'Participant'}</span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
