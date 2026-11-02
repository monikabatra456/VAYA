'use client';

import React, { useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface SecretAdminTriggerProps {
  children: ReactNode;
}

export default function SecretAdminTrigger({ children }: SecretAdminTriggerProps) {
  const router = useRouter();
  const clickTimestampsRef = useRef<number[]>([]);

  const handleClick = () => {
    const now = Date.now();
    // Keep only timestamps occurring within the last 600ms
    const recentClicks = clickTimestampsRef.current.filter((t) => now - t <= 600);
    recentClicks.push(now);
    clickTimestampsRef.current = recentClicks;

    // Trigger navigation on 3 clicks within 600ms window
    if (recentClicks.length >= 3) {
      clickTimestampsRef.current = [];
      router.push('/admin/login');
    }
  };

  return (
    <span
      onClick={handleClick}
      style={{
        cursor: 'inherit',
        userSelect: 'none',
        display: 'inline',
      }}
    >
      {children}
    </span>
  );
}
