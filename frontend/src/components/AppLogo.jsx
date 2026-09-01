export default function AppLogo({ size = 36, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', borderRadius: `${size * 0.25}px`, ...style }}
    >
      <defs>
        <linearGradient id="headerBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="headerFrontCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </linearGradient>
        <linearGradient id="headerBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      <rect x="32" y="32" width="448" height="448" rx="116" fill="url(#headerBgGrad)" />
      <rect x="34" y="34" width="444" height="444" rx="114" stroke="rgba(255, 255, 255, 0.28)" strokeWidth="4" />

      <rect x="188" y="120" width="184" height="248" rx="36" fill="rgba(255, 255, 255, 0.2)" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="5" />
      <rect x="140" y="156" width="188" height="252" rx="36" fill="url(#headerFrontCardGrad)" />
      <rect x="194" y="136" width="80" height="36" rx="16" fill="#4f46e5" stroke="#ffffff" strokeWidth="4.5" />

      <rect x="176" y="214" width="116" height="20" rx="10" fill="#6366f1" />
      <rect x="176" y="254" width="84" height="18" rx="9" fill="#94a3b8" />
      <rect x="176" y="288" width="104" height="18" rx="9" fill="#cbd5e1" />

      <circle cx="346" cy="344" r="50" fill="url(#headerBadgeGrad)" stroke="#ffffff" strokeWidth="6.5" />
      <path d="M330 344h32M348 330l14 14-14 14" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
