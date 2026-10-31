'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MeetPhoneScreenProps {
  activeStep: number; // 0: Smarter Travel, 1: Data-Driven Decisions, 2: Better Experiences
  isSectionInView: boolean;
  onWaitlist?: () => void;
  onVideoTimeUpdate?: (step: number, currentTime: number) => void;
}

const BAR_DATA = [
  { day: 'Mon', height: 26, isWeekend: false },
  { day: 'Tue', height: 20, isWeekend: false },
  { day: 'Wed', height: 35, isWeekend: false },
  { day: 'Thu', height: 28, isWeekend: false },
  { day: 'Fri', height: 68, isWeekend: false },
  { day: 'Sat', height: 96, isWeekend: true },
  { day: 'Sun', height: 82, isWeekend: true },
];

export default function MeetPhoneScreen({
  activeStep,
  isSectionInView,
  onWaitlist,
  onVideoTimeUpdate,
}: MeetPhoneScreenProps) {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  // Logo intro: 1.2s scale + fade on dark app background
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const [showLogoIntro, setShowLogoIntro] = useState(true);
  const [logoIntroFading, setLogoIntroFading] = useState(false);

  // Step 3 animation triggers
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [alertCardVisible, setAlertCardVisible] = useState(false);

  // Initial 1.2s VAYA logo intro: scale + fade on brand app background
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setLogoIntroFading(true);
    }, 1200);

    const hideTimer = setTimeout(() => {
      setShowLogoIntro(false);
    }, 1500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Video playback management tied to activeStep and intro state
  useEffect(() => {
    if (!isSectionInView || (showLogoIntro && !logoIntroFading)) {
      video1Ref.current?.pause();
      video2Ref.current?.pause();
      return;
    }

    if (activeStep === 0) {
      if (video1Ref.current) {
        video1Ref.current.currentTime = 0;
        video1Ref.current.play().catch(() => {});
      }
      video2Ref.current?.pause();
    } else if (activeStep === 1) {
      if (video2Ref.current) {
        video2Ref.current.currentTime = 0;
        video2Ref.current.play().catch(() => {});
      }
      video1Ref.current?.pause();
    } else {
      video1Ref.current?.pause();
      video2Ref.current?.pause();
    }
  }, [activeStep, isSectionInView, showLogoIntro, logoIntroFading]);

  // Step 3 bar and card entrance animation
  useEffect(() => {
    if (activeStep === 2) {
      // Trigger bars growing
      const t1 = setTimeout(() => setBarsAnimated(true), 100);
      // Trigger card sliding in
      const t2 = setTimeout(() => setAlertCardVisible(true), 320);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setBarsAnimated(false);
      setAlertCardVisible(false);
    }
  }, [activeStep]);

  return (
    <div