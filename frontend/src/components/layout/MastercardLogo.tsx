/**
 * Module: src/components/layout/MastercardLogo.tsx
 *
 * Purpose:
 * Clean, mathematically precise SVG representation of the iconic
 * Mastercard interlocking circles brand mark. Used in the sidebar,
 * header, and hero sections to deliver an authentic Mastercard theme.
 *
 * Layer: COMPONENT / LAYOUT
 */

'use client';

import React from 'react';

interface MastercardLogoProps {
  size?: number;
  className?: string;
  withWordmark?: boolean;
  wordmarkClassName?: string;
}

export default function MastercardLogo({
  size = 32,
  className = '',
  withWordmark = false,
  wordmarkClassName = '',
}: MastercardLogoProps) {
  // Natural aspect ratio is 44:28
  const width = Math.round(size * (44 / 28));
  const height = size;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 44 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-label="Mastercard"
      >
        {/* Left Red Circle */}
        <circle cx="14" cy="14" r="14" fill="#EB001B" />
        
        {/* Right Yellow/Orange Circle */}
        <circle cx="30" cy="14" r="14" fill="#F79E1B" fillOpacity="0.96" />
        
        {/* Center Interlocking Lens (Intersection of both circles r=14 at x=14 and x=30) */}
        <path
          d="M 22 2.51 A 14 14 0 0 1 22 25.49 A 14 14 0 0 1 22 2.51 Z"
          fill="#FF5F00"
        />
      </svg>

      {withWordmark && (
        <span
          className={`font-semibold tracking-tight leading-none lowercase ${wordmarkClassName}`}
          style={{ fontFamily: 'var(--font-sans)', letterSpacing: '-0.03em' }}
        >
          mastercard
        </span>
      )}
    </div>
  );
}
