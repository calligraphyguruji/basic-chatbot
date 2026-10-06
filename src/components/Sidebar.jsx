import { useState, useMemo } from 'react';
import { useAuth } from '../context/useAuth';

function Sidebar({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onTogglePin,
  onOpenAuth,
  onOpenSettings,
  onOpenMemory,
  searchQuery,
  onSearchChange,
}) {
  const { user, logout } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);

  // Group conversations by Today, Yesterday, Previous 7 Days, Older
  const grouped = useMemo(() => {
    const today = [];
    const yesterday = [];
    const last7Days = [];
    const older = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const startOfYesterday = startOfToday - oneDayMs;
    const startOf7Days = startOfToday - 7 * oneDayMs;

    conversations.forEach((conv) => {
      const time = new Date(conv.updated_at || conv.created_at).getTime();
      if (time >= startOfToday) {
        today.push(conv);
      } else if (time >= startOfYesterday) {
        yesterday.push(conv);
      } else if (time >= startOf7Days) {
        last7Days.push(conv);
      } else {
        older.push(conv);
      }
    });

    return [
      { title: 'Today', items: today },
      { title: 'Yesterday', items: yesterday },
      { title: 'Previous 7 Days', items: last7Days },
      { title: 'Older', items: older },
    ].filter((g) => g.items.length > 0);
  }, [conversations]);

  const handleStartRename = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = async (id, e) => {
    e?.preventDefault();
    if (editTitle.trim()) {
      await onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-mobile-overlay" onClick={onClose} />}

      <aside className={`assistant-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Top Header */}
        <div className="sidebar-top">
          <button className="new-chat-btn" onClick={onNewChat} aria-label="Start new chat">
            <span className="plus-icon">+</span>
            <span>New Chat</span>
          </button>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="sidebar-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search conversation history"
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => onSearchChange('')} aria-label="Clear search">
              ×
            </button>
          )}
        </div>

        {/* Conversations List */}
        <div className="sidebar-conversations-list">
          {conversations.length === 0 ? (
            <div className="sidebar-empty-state">
              {user ? 'No conversations found.' : 'Sign in to save and browse your chat history across devices.'}
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.title} className="sidebar-group">
                <div className="sidebar-group-heading">{group.title}</div>
                {group.items.map((conv) => {
                  const isActive = conv.id === activeId;
                  const isEditing = conv.id === editingId;
                  const isMenuOpen = conv.id === menuOpenId;

                  return (
                    <div
                      key={conv.id}
                      className={`conversation-item ${isActive ? 'active' : ''} ${conv.pinned ? 'pinned' : ''}`}
                      onClick={() => onSelectConversation(conv.id)}
                    >
                      <div className="conv-icon-title">
                        <span className="conv-lead-icon">{conv.pinned ? '📌' : '💬'}</span>
                        {isEditing ? (
                          <form onSubmit={(e) => handleSaveRename(conv.id, e)} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              className="rename-input"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onBlur={(e) => handleSaveRename(conv.id, e)}
                              autoFocus
                            />
                          </form>
                        ) : (
                          <span className="conv-title" title={conv.title}>
                            {conv.title}
                          </span>
                        )}
                      </div>

                      {/* Dropdown Menu Trigger */}
                      <div className="conv-actions-wrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="conv-more-btn"
                          onClick={() => setMenuOpenId(isMenuOpen ? null : conv.id)}
                          aria-label="Conversation options"
                        >
                          •••
                        </button>

                        {isMenuOpen && (
                          <div className="conv-dropdown-menu">
                            <button
                              type="button"
                              className="conv-menu-item"
                              onClick={(e) => handleStartRename(conv, e)}
                            >
                              ✏️ Rename
                            </button>
                            <button
                              type="button"
                              className="conv-menu-item"
                              onClick={() => {
                                onTogglePin(conv.id, !conv.pinned);
                                setMenuOpenId(null);
                              }}
                            >
                              {conv.pinned ? '📍 Unpin' : '📌 Pin'}
                            </button>
                            <button
                              type="button"
                              className="conv-menu-item danger"
                              onClick={() => {
                                onDeleteConversation(conv.id);
                                setMenuOpenId(null);
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Bottom User Profile Section */}
        <div className="sidebar-bottom">
          {user ? (
            <div className="user-profile-bar">
              <div className="user-avatar-badge" title={user.name}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-info-text">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
              <div className="user-profile-actions">
                <button
                  type="button"
                  className="icon-profile-btn"
                  onClick={onOpenMemory}
                  title="Personalized AI Memory"
                  aria-label="Open Memory"
                >
                  🧠
                </button>
                <button
                  type="button"
                  className="icon-profile-btn"
                  onClick={onOpenSettings}
                  title="Settings"
                  aria-label="Open Settings"
                >
                  ⚙️
                </button>
                <button
                  type="button"
                  className="icon-profile-btn"
                  onClick={logout}
                  title="Sign out"
                  aria-label="Sign out"
                >
                  🚪
                </button>
              </div>
            </div>
          ) : (
            <div className="sidebar-guest-cta">
              <button className="primary-action-btn w-full" onClick={onOpenAuth}>
                Sign In / Register
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
