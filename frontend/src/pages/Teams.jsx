import React, { useState, useEffect } from 'react';
import { Users2, Plus, Search, Phone, School, Cpu, Code } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    team_id: '',
    team_name: '',
    leader_name: '',
    leader_phone: '',
    problem_statement: '',
    category: 'Software Edition',
    college: '',
    membersText: ''
  });

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await api.getTeams();
      setTeams(data || []);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const membersList = formData.membersText
        .split('\n')
        .map(m => m.trim())
        .filter(Boolean);

      await api.createTeam({
        team_id: formData.team_id || undefined,
        team_name: formData.team_name,
        leader_name: formData.leader_name,
        leader_phone: formData.leader_phone,
        problem_statement: formData.problem_statement,
        category: formData.category,
        college: formData.college,
        members: membersList
      });

      setIsModalOpen(false);
      setFormData({
        team_id: '',
        team_name: '',
        leader_name: '',
        leader_phone: '',
        problem_statement: '',
        category: 'Software Edition',
        college: '',
        membersText: ''
      });
      loadTeams();
    } catch (err) {
      alert('Failed to create team: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredTeams = teams.filter(t => {
    const text = (t.team_id + ' ' + t.team_name + ' ' + t.leader_name + ' ' + t.college + ' ' + (t.problem_statement || '')).toLowerCase();
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
            placeholder="Search teams by name, ID, college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px' }}
          />
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '11px' }} />
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          <span>Register Team</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading registered teams...
          </div>
        ) : filteredTeams.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No teams found matching search.
          </div>
        ) : (
          filteredTeams.map((team) => (
            <div key={team.team_id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-400)', fontWeight: '600' }}>
                    {team.team_id}
                  </span>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {team.team_name}
                  </h3>
                </div>
                <Badge type={team.category?.includes('Hardware') ? 'HARDWARE' : 'SOFTWARE'} />
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <School size={14} color="var(--text-muted)" />
                  <span>{team.college}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} color="var(--emerald-400)" />
                  <span>Leader: <b>{team.leader_name}</b> ({team.leader_phone})</span>
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-input)',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>Problem Statement</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{team.problem_statement || 'To be selected'}</div>
              </div>

              {team.members && team.members.length > 0 && (
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>Team Roster ({team.members.length} members)</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {team.members.map((m, idx) => (
                      <span key={idx} style={{
                        fontSize: '11.5px',
                        padding: '2px 8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)'
                      }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Register Team Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New SIH Team"
      >
        <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Team Name</label>
            <input
              type="text"
              required
              className="input"
              value={formData.team_name}
              onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Leader Name</label>
              <input
                type="text"
                required
                className="input"
                value={formData.leader_name}
                onChange={(e) => setFormData({ ...formData, leader_name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Leader Phone</label>
              <input
                type="text"
                required
                className="input"
                placeholder="+919876500000"
                value={formData.leader_phone}
                onChange={(e) => setFormData({ ...formData, leader_phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>College / Institute</label>
            <input
              type="text"
              required
              className="input"
              value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Problem Statement (PS)</label>
              <input
                type="text"
                required
                className="input"
                placeholder="e.g. SIH1620 - AI Helpdesk"
                value={formData.problem_statement}
                onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category</label>
              <select
                className="select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Software Edition">Software Edition</option>
                <option value="Hardware Edition">Hardware Edition</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Team Members (One per line, mandatory 1 female)
            </label>
            <textarea
              className="textarea"
              rows={4}
              placeholder="Member 1 (TL)&#10;Member 2&#10;Member 3&#10;Member 4&#10;Member 5&#10;Member 6"
              value={formData.membersText}
              onChange={(e) => setFormData({ ...formData, membersText: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>Save Team</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
