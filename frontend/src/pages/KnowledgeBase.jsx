import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Trash2, Edit3, FileText, Tag, Filter } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

const CATEGORIES = [
  'All',
  'SIH',
  'Rules',
  'Submission',
  'Technical',
  'Presentation',
  'FAQ',
  'Team',
  'General'
];

export default function KnowledgeBase() {
  const [staticFiles, setStaticFiles] = useState([]);
  const [dynamicItems, setDynamicItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dynamic'); // 'dynamic' | 'static'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Rules',
    content: '',
    tagsText: ''
  });

  const loadKnowledge = async () => {
    try {
      setLoading(true);
      const data = await api.getKnowledge();
      setStaticFiles(data?.static_files || []);
      setDynamicItems(data?.dynamic_items || []);
    } catch (err) {
      console.error('Failed to load knowledge:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledge();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'Rules',
      content: '',
      tagsText: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category || 'General',
      content: item.content,
      tagsText: (item.tags || []).join(', ')
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this knowledge base article?')) return;
    try {
      await api.deleteKnowledge(id);
      loadKnowledge();
    } catch (err) {
      alert('Failed to delete item: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const tags = formData.tagsText
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const payload = {
        title: formData.title,
        category: formData.category,
        content: formData.content,
        tags
      };

      if (editingItem) {
        await api.updateKnowledge(editingItem.id, payload);
      } else {
        await api.createKnowledge(payload);
      }

      setIsModalOpen(false);
      loadKnowledge();
    } catch (err) {
      alert('Failed to save knowledge item: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredDynamic = dynamicItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const text = (item.title + ' ' + item.content + ' ' + (item.tags || []).join(' ')).toLowerCase();
    const matchesSearch = text.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredStatic = staticFiles.filter(file => {
    const text = (file.title + ' ' + file.content + ' ' + file.source).toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="page-wrapper">
      {/* Tab Switcher & Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'dynamic' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('dynamic')}
          >
            <Tag size={16} />
            <span>Dynamic Articles ({dynamicItems.length})</span>
          </button>
          <button
            className={`btn ${activeTab === 'static' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('static')}
          >
            <FileText size={16} />
            <span>Core Markdown Files ({staticFiles.length})</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              className="input"
              placeholder="Search knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '34px' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '11px' }} />
          </div>

          {activeTab === 'dynamic' && (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={16} />
              <span>Add Knowledge</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills (for dynamic articles) */}
      {activeTab === 'dynamic' && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexShrink: 0 }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content Rendering */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading knowledge base articles...
        </div>
      ) : activeTab === 'dynamic' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
          {filteredDynamic.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No dynamic knowledge articles found. Click "Add Knowledge" to create one.
            </div>
          ) : (
            filteredDynamic.map((item) => (
              <div key={item.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>
                  <Badge type={item.category || 'General'} />
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {item.content}
                </p>

                {item.tags && item.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {item.tags.map((tag, idx) => (
                      <span key={idx} style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        color: 'var(--cyan-400)',
                        border: '1px solid rgba(6, 182, 212, 0.2)'
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-color)',
                  marginTop: 'auto'
                }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Updated {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'recently'}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEdit(item)}
                      title="Edit article"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(item.id)}
                      title="Delete article"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Static Markdown Core Files */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredStatic.map((file) => (
            <div key={file.id} className="glass-card">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--emerald-400)" />
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    knowledge/{file.source}
                  </h3>
                </div>
                <span className="badge badge-cyan">Static System Knowledge</span>
              </div>
              <pre style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                backgroundColor: 'var(--bg-input)',
                padding: '16px',
                borderRadius: '8px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}>
                {file.content}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Knowledge Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Knowledge Article' : 'Add Knowledge Article'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Article Title</label>
            <input
              type="text"
              required
              className="input"
              placeholder="e.g. Mentor Substitution Rule"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category</label>
            <select
              className="select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Content / Guidelines (Plain text or Markdown)
            </label>
            <textarea
              required
              className="textarea"
              rows={5}
              placeholder="Enter official guidelines or answer that the AI should use..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Tags (Comma separated)
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. mentor, change, rule, emergency"
              value={formData.tagsText}
              onChange={(e) => setFormData({ ...formData, tagsText: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>Save Knowledge</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
