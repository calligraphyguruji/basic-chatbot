import { useState, useEffect } from 'react';
import { AIService } from '../services/aiService';

function MemoryModal({ isOpen, onClose }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (isOpen) {
      AIService.getMemories()
        .then((data) => {
          if (active) {
            setMemories(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (active) {
            setError(err.message || 'Failed to load memory');
            setLoading(false);
          }
        });
    }
    return () => {
      active = false;
    };
  }, [isOpen]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    try {
      const created = await AIService.addMemory(newKey.trim(), newValue.trim(), 2);
      setMemories((prev) => [created, ...prev]);
      setNewKey('');
      setNewValue('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await AIService.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all learned memories?')) return;
    try {
      await AIService.clearAllMemories();
      setMemories([]);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card memory-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="memory-badge-icon">🧠</span>
            <h2>Personalized AI Memory</h2>
          </div>
          <button className="icon-btn close-btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <p className="modal-subtitle">
          Facts and preferences learned from your discussions. The AI references these automatically to tailor its responses.
        </p>

        {error && <div className="alert-error-box">{error}</div>}

        {/* Add Memory Form */}
        <form onSubmit={handleAdd} className="memory-add-form">
          <input
            type="text"
            className="text-input"
            placeholder="Key (e.g. learning, tech_stack)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
          <input
            type="text"
            className="text-input"
            placeholder="Preference (e.g. C++, React, concise code)"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
          <button type="submit" className="primary-action-btn" disabled={!newKey.trim() || !newValue.trim()}>
            + Add
          </button>
        </form>

        {/* List of Memories */}
        <div className="memory-list-container">
          {loading ? (
            <div className="memory-loading">Loading saved memories...</div>
          ) : memories.length === 0 ? (
            <div className="memory-empty-state">
              No memories saved yet. Talk about your goals, favorite programming languages, or projects, and the AI will remember!
            </div>
          ) : (
            <div className="memory-tags-grid">
              {memories.map((mem) => (
                <div key={mem.id} className="memory-chip">
                  <div className="memory-chip-content">
                    <strong className="mem-key">{mem.memory_key}:</strong>
                    <span className="mem-val">{mem.memory_value}</span>
                  </div>
                  <button
                    type="button"
                    className="memory-delete-btn"
                    onClick={() => handleDelete(mem.id)}
                    title="Delete memory"
                    aria-label={`Delete memory ${mem.memory_key}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer-actions">
          {memories.length > 0 && (
            <button type="button" className="danger-ghost-btn" onClick={handleClearAll}>
              Clear All Memory
            </button>
          )}
          <button type="button" className="secondary-action-btn ml-auto" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default MemoryModal;
