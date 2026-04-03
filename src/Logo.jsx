export function LogoIcon({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="planeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      
      {/* Outer glow/blur effect */}
      <circle cx="50" cy="50" r="30" fill="url(#ringGrad)" opacity="0.2" filter="blur(10px)" />
      
      {/* Clean elegant ring */}
      <circle cx="50" cy="50" r="40" stroke="url(#ringGrad)" strokeWidth="6" />
      
      {/* Paper plane / Delta arrow */}
      <path d="M30 60 L75 25 L50 75 L43 55 Z" fill="url(#planeGrad)" />
      
      {/* Fold depth shadow */}
      <path d="M43 55 L75 25 L50 75 Z" fill="#000000" opacity="0.25" />
    </svg>
  );
}
