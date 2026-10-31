'use client';

import React from 'react';

interface HandAssetProps {
  layer: 'back' | 'front' | 'composite';
  className?: string;
  style?: React.CSSProperties;
  customSrc?: string;
}

/**
 * HandAsset – Continuous anatomical hand holding a smartphone.
 * Modeled on Shopify Editions Winter '26 aesthetic:
 * - Fingers wrap cleanly behind the phone body (layer="back")
 * - Thumb and palm thenar eminence wrap continuously over the front edge (layer="front")
 * - Shared coordinate frame (viewBox: 0 0 520 860) guarantees ZERO detachment
 * - Soft ambient occlusion and specular highlights
 */
export default function HandAsset({
  layer,
  className = '',
  style = {},
  customSrc,
}: HandAssetProps) {
  // If custom PNG/WebP provided, render it cleanly
  if (customSrc) {
    return (
      <img
        src={customSrc}
        alt="Hand holding phone"
        className={className}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          ...style,
        }}
        draggable={false}
      />
    );
  }

  // Common SVG filters and gradients
  const renderDefs = () => (
    <defs>
      {/* Warm skin tones base gradients */}
      <linearGradient id="skin-palm" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F5D0B5" />
        <stop offset="45%" stopColor="#E2AE8A" />
        <stop offset="85%" stopColor="#C98F6B" />
        <stop offset="100%" stopColor="#A86E4B" />
      </linearGradient>

      <linearGradient id="skin-thumb" x1="0%" y1="20%" x2="100%" y2="80%">
        <stop offset="0%" stopColor="#FFE0CA" />
        <stop offset="35%" stopColor="#F2BA95" />
        <stop offset="75%" stopColor="#D99B72" />
        <stop offset="100%" stopColor="#B3754F" />
      </linearGradient>

      <linearGradient id="skin-fingers" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8B594" />
        <stop offset="60%" stopColor="#D49973" />
        <stop offset="100%" stopColor="#A36946" />
      </linearGradient>

      <linearGradient id="nail-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFF2EA" stopOpacity="0.85" />
        <stop offset="50%" stopColor="#F7D8CA" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#EABCA7" stopOpacity="0.65" />
      </linearGradient>

      {/* Thumb contact shadow on phone glass */}
      <filter id="thumb-occlusion" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="3" dy="4" stdDeviation="5" floodColor="#0B0D14" floodOpacity="0.32" />
      </filter>

      {/* Finger shadow behind phone */}
      <filter id="finger-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="-4" dy="6" stdDeviation="6" floodColor="#05070D" floodOpacity="0.25" />
      </filter>
    </defs>
  );

  // 1. LAYER BACK: Fingers curling around the right edge and back palm
  if (layer === 'back') {
    return (
      <svg
        viewBox="0 0 520 860"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
          ...style,
        }}
        aria-hidden="true"
      >
        {renderDefs()}

        {/* Back Palm Support Mass */}
        <path
          d="M 120 740 C 130 680, 160 520, 240 480 C 330 440, 420 490, 440 600 C 455 680, 430 790, 390 860 L 110 860 Z"
          fill="url(#skin-palm)"
          opacity="0.9"
        />

        {/* Index Finger (Curling on top right edge ~y=300-360) */}
        <g filter="url(#finger-shadow)">
          <path
            d="M 432 312 C 452 308, 478 318, 484 336 C 488 348, 484 362, 466 368 C 448 374, 430 366, 428 350 Z"
            fill="url(#skin-fingers)"
          />
          {/* Index nail */}
          <path
            d="M 466 324 C 478 328, 482 336, 480 346 C 474 348, 465 342, 462 334 Z"
            fill="url(#nail-gradient)"
          />
        </g>

        {/* Middle Finger (Curling on mid right edge ~y=380-444) */}
        <g filter="url(#finger-shadow)">
          <path
            d="M 436 388 C 458 384, 486 394, 492 414 C 496 428, 490 442, 470 448 C 450 454, 432 444, 430 426 Z"
            fill="url(#skin-fingers)"
          />
          {/* Middle nail */}
          <path
            d="M 472 400 C 485 404, 489 414, 487 424 C 480 426, 471 420, 468 412 Z"
            fill="url(#nail-gradient)"
          />
        </g>

        {/* Ring Finger (Curling on lower right edge ~y=462-524) */}
        <g filter="url(#finger-shadow)">
          <path
            d="M 434 466 C 454 462, 480 472, 484 490 C 488 504, 480 518, 462 524 C 444 530, 428 520, 426 504 Z"
            fill="url(#skin-fingers)"
          />
          {/* Ring nail */}
          <path
            d="M 464 478 C 476 482, 480 490, 478 498 C 472 500, 464 496, 461 488 Z"
            fill="url(#nail-gradient)"
          />
        </g>

        {/* Pinky Finger (Curling on lower edge ~y=538-596) */}
        <g filter="url(#finger-shadow)">
          <path
            d="M 426 542 C 444 538, 466 548, 470 564 C 474 576, 466 588, 450 594 C 434 600, 420 592, 418 578 Z"
            fill="url(#skin-fingers)"
          />
          {/* Pinky nail */}
          <path
            d="M 452 552 C 462 556, 466 562, 464 570 C 458 572, 452 568, 449 562 Z"
            fill="url(#nail-gradient)"
          />
        </g>
      </svg>
    );
  }

  // 2. LAYER FRONT: Forearm, wrist, palm mass, and thumb resting seamlessly on the front bezel
  return (
    <svg
      viewBox="0 0 520 860"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        ...style,
      }}
      aria-hidden="true"
    >
      {renderDefs()}

      {/* Forearm & Wrist base entering from bottom left */}
      <g>
        {/* Soft forearm gradient fill */}
        <path
          d="M 30 860 C 50 780, 75 700, 95 640 C 115 580, 140 540, 165 520 C 190 500, 215 515, 225 540 C 235 565, 220 620, 210 670 C 195 730, 210 790, 240 860 Z"
          fill="url(#skin-palm)"
        />

        {/* Continuous Thenar muscle (base of thumb) extending naturally to thumb tip */}
        <g filter="url(#thumb-occlusion)">
          <path
            d="M 95 640
               C 85 580, 92 510, 115 450
               C 128 416, 148 385, 172 388
               C 192 390, 202 412, 196 442
               C 188 480, 165 530, 175 580
               C 185 630, 160 675, 135 705
               Z"
            fill="url(#skin-thumb)"
          />

          {/* Thumb knuckle & bone curvature highlight */}
          <path
            d="M 122 440 C 132 405, 155 394, 176 396 C 188 402, 192 418, 186 440 C 178 470, 156 505, 146 545"
            stroke="rgba(255, 255, 255, 0.42)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Thumb Fingernail (resting along phone bezel) */}
          <path
            d="M 166 400
               C 178 402, 186 414, 184 428
               C 178 434, 168 432, 162 422
               C 158 412, 160 402, 166 400 Z"
            fill="url(#nail-gradient)"
          />
          {/* Nail specular gleam */}
          <path
            d="M 174 404 C 180 408, 182 416, 180 422"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Skin crease folds for anatomical realism */}
          <path
            d="M 136 470 C 146 472, 158 478, 164 484"
            stroke="rgba(140, 75, 45, 0.35)"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 140 488 C 150 490, 160 496, 166 502"
            stroke="rgba(140, 75, 45, 0.28)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </g>
    </svg>
  );
}
