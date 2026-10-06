import { useState } from 'react';
import { useAuth } from '../context/useAuth';

function SettingsModal({ isOpen, onClose, onOpenMemory, theme, onToggleTheme }) {
  const { user, logout } = useAuth();
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card settings-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="settings-gear-icon">⚙️</span>
            <h2>Settings</h2>
          </div>
          <button className="icon-btn close-btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <div className="settings-section">
          <h3>Account</h3>
          <div className="settings-row">
            <div>
              <div className="settings-label">User Profile</div>
              <div className="settings-subtext">{user ? `${user.name} (${user.email})` : 'Guest Session'}</div>
            </div>
            {user && (
              <button
                type="button"
                className="secondary-action-btn"
                onClick={() => {
                  logout();
                  onClose();
                }}
              >
                Sign Out
              </button>
            )}
          </div>
        </div>

        <div className="settings-section">
          <h3>Appearance</h3>
          <div className="settings-row">
            <div>
              <div className="settings-label">Color Theme</div>
              <div className="settings-subtext">Toggle between Light and Dark interface</div>
            </div>
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>Personalization & Intelligence</h3>
          <div className="settings-row">
            <div>
              <div className="settings-label">Long-Term Memory</div>
              <div className="settings-subtext">Allow AI to remember your preferences across sessions</div>
            </div>
            <div className="toggle-switch-wrap">
              <input
                type="checkbox"
                id="memory-toggle"
                checked={personalizationEnabled}
                onChange={(e) => setPersonalizationEnabled(e.target.checked)}
                className="toggle-checkbox"
              />
              <label htmlFor="memory-toggle" className="toggle-label"></label>
            </div>
          </div>
          <div className="settings-row pt-2">
            <div>
              <div className="settings-label">Manage Stored Memories</div>
              <div className="settings-subtext">View and edit facts stored about you</div>
            </div>
            <button
              type="button"
              className="secondary-action-btn"
              onClick={() => {
                onClose();
                onOpenMemory();
              }}
            >
              Manage Memory
            </button>
          </div>
        </div>

        <div className="modal-footer-actions">
          <button type="button" className="primary-action-btn ml-auto" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
