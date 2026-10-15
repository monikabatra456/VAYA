/* ─── VAYA Logo Mark ────────────────────────────────────────────
   V-shape + inverted triangle forming an hourglass, sand/hill at
   base, dashed flight path, tiny plane icon. CC0 / original SVG.
─────────────────────────────────────────────────────────────── */

export const VAYALogoMark = ({ size = 48, animated = false, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 72"
    width={size}
    height={size * (72 / 64)}
    className={className}
    aria-label="VAYA logo mark"
    role="img"
  >
    <defs>
      <linearGradient id="sandGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F6A81C" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#F08A24" stopOpacity="0.7" />
      </linearGradient>
      <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0B2D5B" />
        <stop offset="100%" stopColor="#27B2C9" />
      </linearGradient>
      <marker id="planeHead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="#F6A81C" />
      </marker>
    </defs>

    {/* Outer V (top hourglass half) */}
    <path
      d="M4,6 L32,42 L60,6"
      fill="none"
      stroke="url(#vGrad)"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={animated ? 'logo-v-stroke' : ''}
      strokeDasharray="80"
      strokeDashoffset={animated ? '80' : '0'}
    />

    {/* Inverted triangle (bottom hourglass half) */}
    <path
      d="M8,50 L32,22 L56,50 Z"
      fill="none"
      stroke="url(#vGrad)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={animated ? 'logo-tri-stroke' : ''}
      strokeDasharray="100"
      strokeDashoffset={animated ? '100' : '0'}
    />

    {/* Sand / hill fill inside bottom triangle */}
    <path
      d="M8,50 Q20,44 32,46 Q44,44 56,50 Z"
      fill="url(#sandGrad)"
      className={animated ? 'logo-sand-fill' : ''}
      opacity={animated ? 0 : 1}
    />

    {/* Dashed flight path (arc from top-right to vanishing point) */}
    <path
      id="flightPath"
      d="M56,10 Q52,28 32,36"
      fill="none"
      stroke="#27B2C9"
      strokeWidth="1.5"
      strokeDasharray="4 3"
      strokeLinecap="round"
      className={animated ? 'logo-path-stroke' : ''}
      strokeDashoffset={animated ? '50' : '0'}
    />

    {/* Tiny plane icon (simplified side-view) */}
    <g className={animated ? 'logo-plane' : ''} transform={animated ? 'translate(56,10)' : 'translate(34,34)'}>
      <path
        d="M-6,0 L2,0 Q5,-1 5,0 Q5,1 2,0 L-6,0 Z
           M-6,0 L-8,-2 L-8,-1 L-6,0 Z
           M-6,0 L-8,2 L-8,1 L-6,0 Z"
        fill="#F6A81C"
        transform="scale(0.9)"
      />
    </g>
  </svg>
);

export default VAYALogoMark;
