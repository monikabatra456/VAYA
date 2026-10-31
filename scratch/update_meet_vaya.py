with open('src/components/MeetVaya.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Normalize
code = code.replace("\r\n", "\n")

old_reveal = """  // Text Reveal Logic
  const applyRevealProgress = useCallback((p: number) => {
    const clampedP = Math.max(0, Math.min(1, p));
    const n = HEADLINE_WORDS.length; // 15

    // 1. Headline words reveal in window [0.7*i/n, 0.7*i/n + 0.3]
    wordElsRef.current.forEach((el, i) => {
      if (!el) return;
      const start = 0.7 * (i / n);
      const end = start + 0.3;
      let wp = 0;
      if (clampedP <= start) wp = 0;
      else if (clampedP >= end) wp = 1;
      else wp = (clampedP - start) / 0.3;

      const opacity = 0.12 + 0.88 * wp;
      const translateY = 24 * (1 - wp);
      const blur = 8 * (1 - wp);

      el.style.opacity = `${opacity}`;
      el.style.transform = `translateY(${translateY}px)`;
      el.style.filter = blur > 0.1 ? `blur(${blur}px)` : 'none';

      // One-time gold shimmer sweep (1.2s) when "VAYA" completes (i=0, wp=1)
      if (i === 0 && wp >= 0.99 && !shimmerTriggeredRef.current) {
        shimmerTriggeredRef.current = true;
        el.classList.add('shimmer');
      }
    });

    // 2. Subtext line-by-line mask slide-up once headline passes 90%
    const subProgress = Math.max(0, Math.min(1, (clampedP - 0.90) / 0.10));
    subtextLinesRef.current.forEach((lineEl, idx) => {
      if (!lineEl) return;
      const lStart = idx === 0 ? 0 : 0.28;
      const lEnd = idx === 0 ? 0.72 : 1.0;
      let lp = 0;
      if (subProgress <= lStart) lp = 0;
      else if (subProgress >= lEnd) lp = 1;
      else lp = (subProgress - lStart) / (lEnd - lStart);

      lineEl.style.transform = `translateY(${(1 - lp) * 100}%)`;
      lineEl.style.opacity = `${lp}`;
    });

    // 3. Gold divider line draws with scaleX 0 -> 1
    if (goldLineRef.current) {
      goldLineRef.current.style.transform = `scaleX(${subProgress})`;
    }

    // 4. The 3 pills enter with an 80ms stagger
    featureItemRefs.current.forEach((pillEl, idx) => {
      if (!pillEl) return;
      const pStart = 0.90 + idx * 0.03;
      const pEnd = Math.min(1.0, pStart + 0.04);
      let pp = 0;
      if (clampedP <= pStart) pp = 0;
      else if (clampedP >= pEnd) pp = 1;
      else pp = (clampedP - pStart) / (pEnd - pStart);

      pillEl.style.opacity = `${pp}`;
      pillEl.style.transform = `translateY(${(1 - pp) * 16}px)`;
    });
  }, []);"""

new_reveal = """  // Text Reveal Logic
  const applyRevealProgress = useCallback((p: number) => {
    const clampedP = Math.max(0, Math.min(1, p));
    const n = HEADLINE_WORDS.length; // 15

    // 1. Headline words reveal: translateY(24px) -> 0, opacity 0 -> 1 (no filter blur)
    wordElsRef.current.forEach((el, i) => {
      if (!el) return;
      const start = 0.52 * (i / (n - 1));
      const end = start + 0.20;
      let wp = 0;
      if (clampedP <= start) wp = 0;
      else if (clampedP >= end) wp = 1;
      else wp = (clampedP - start) / 0.20;

      el.style.opacity = `${wp}`;
      el.style.transform = `translateY(${24 * (1 - wp)}px)`;

      // One-time gold shimmer sweep (1.2s) when "VAYA" completes (i=0, wp=1)
      if (i === 0 && wp >= 0.99 && !shimmerTriggeredRef.current) {
        shimmerTriggeredRef.current = true;
        el.classList.add('shimmer');
      }
    });

    // 2. Paragraph lines slide up (translateY 100% -> 0 inside mask) once headline completes (p >= 0.72)
    const subProgress = Math.max(0, Math.min(1, (clampedP - 0.72) / 0.28));
    subtextLinesRef.current.forEach((lineEl, idx) => {
      if (!lineEl) return;
      const lStart = idx === 0 ? 0 : 0.35;
      const lEnd = idx === 0 ? 0.65 : 1.0;
      let lp = 0;
      if (subProgress <= lStart) lp = 0;
      else if (subProgress >= lEnd) lp = 1;
      else lp = (subProgress - lStart) / (lEnd - lStart);

      lineEl.style.transform = `translateY(${(1 - lp) * 100}%)`;
      lineEl.style.opacity = `${lp}`;
    });

    // 3. Gold divider line draws with scaleX 0 -> 1
    if (goldLineRef.current) {
      goldLineRef.current.style.transform = `scaleX(${subProgress})`;
    }

    // 4. The 3 pills enter with stagger
    featureItemRefs.current.forEach((pillEl, idx) => {
      if (!pillEl) return;
      const pStart = 0.50 + idx * 0.15;
      const pEnd = Math.min(1.0, pStart + 0.20);
      let pp = 0;
      if (subProgress <= pStart) pp = 0;
      else if (subProgress >= pEnd) pp = 1;
      else pp = (subProgress - pStart) / (pEnd - pStart);

      pillEl.style.opacity = `${pp}`;
      pillEl.style.transform = `translateY(${(1 - pp) * 16}px)`;
    });
  }, []);"""

old_steps = """    // 0.72 - 1.00: Step 2 Better Experiences
    tl.call(() => updateActiveFeature(2), [], 0.72);"""

new_steps = """    // 0.72 - 1.00: Step 2 Better Experiences
    tl.call(() => updateActiveFeature(2), [], 0.72);

    // Text block exit: translateY 0 -> -30px and opacity 1 -> 0 when scrolling out of section
    tl.to('.mv-left-col', {
      y: -30,
      opacity: 0,
      duration: 0.12,
      ease: 'power2.in',
    }, 0.88);"""

if old_reveal in code:
    code = code.replace(old_reveal, new_reveal)
    print("Replaced applyRevealProgress successfully")
else:
    print("WARNING: old_reveal not found")

if old_steps in code:
    code = code.replace(old_steps, new_steps)
    print("Added exit animation to tl successfully")
else:
    print("WARNING: old_steps not found")

# Restore CRLF
code = code.replace("\n", "\r\n")

with open('src/components/MeetVaya.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Updated src/components/MeetVaya.tsx")

