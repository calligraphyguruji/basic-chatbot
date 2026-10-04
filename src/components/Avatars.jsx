
/**
 * UserAvatar Component
 * Circular emerald green badge with white person silhouette.
 */
export function UserAvatar() {
  return (
    <div className="avatar user-avatar" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        width="22"
        height="22"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="7" r="4.5" />
        <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

/**
 * BotAvatar Component
 * Circular emerald green badge with white friendly robot head.
 */
export function BotAvatar() {
  return (
    <div className="avatar bot-avatar" aria-hidden="true">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
      >
        {/* Antenna */}
        <circle cx="16" cy="4" r="2" fill="#ffffff" />
        <line x1="16" y1="6" x2="16" y2="9" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        {/* Robot Head Body */}
        <rect x="5" y="9" width="22" height="18" rx="5" fill="#ffffff" />
        {/* Side Ears */}
        <rect x="3" y="15" width="2" height="6" rx="1" fill="#ffffff" />
        <rect x="27" y="15" width="2" height="6" rx="1" fill="#ffffff" />
        {/* Eyes (green cutout) */}
        <circle cx="11.5" cy="16" r="2.2" fill="#1b8755" />
        <circle cx="20.5" cy="16" r="2.2" fill="#1b8755" />
        {/* Mouth (green smile line) */}
        <path d="M12 21.5c1.2 1.2 2.8 1.5 4 1.5s2.8-.3 4-1.5" stroke="#1b8755" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
