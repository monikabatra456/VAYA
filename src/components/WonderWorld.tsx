// src/components/WonderWorld.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Playfair_Display } from 'next/font/google';
import { DESTINATIONS, HUB, INDIA_POLYGON, type Destination } from '@/data/destinations';
import { latLonToVec3, vec3ToLatLon, focusAngles, arcPoints, isPointInPolygon } from './wonder/geo';
import './wonder/wonder.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
});

const INITIAL_PITCH = (18 * Math.PI) / 180; // 18 degrees latitude tilt
const WATERMARK_CHARS = 'THE WONDER WORLD'.split('');

export interface WonderWorldProps {
  onWaitlist?: () => void;
}

export default function WonderWorld({ onWaitlist }: WonderWorldProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leaderSvgRef = useRef<SVGSVGElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  // UI State
  const [isRevealed, setIsRevealed] = useState(false);
  const [activeModal, setActiveModal] = useState<Destination | null>(null);
  const [modalOrigin, setModalOrigin] = useState<{ x: number; y: number } | null>(null);
  const [tapTooltip, setTapTooltip] = useState<{ x: number; y: number; text: string; id: number } | null>(null);
  const [hoveredDestId, setHoveredDestId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hoveredWmIdx, setHoveredWmIdx] = useState<number | null>(null);

  // Refs for animation loop
  const hoveredDestIdRef = useRef<string | null>(null);
  const isRevealedRef = useRef(false);
  isRevealedRef.current = isRevealed;

  const isAnimatingRef = useRef(false);
  const guideOpacityRef = useRef(0);

  const [goldenDashOffset, setGoldenDashOffset] = useState(0);
  const goldenDashObj = useRef({ offset: 0 });

  const targetCamZ = useRef(3.3);
  const currentCamZ = useRef(3.3);

  // Globe rotation (yaw, pitch)
  const rot = useRef({
    yaw: 0,
    pitch: INITIAL_PITCH,
    velYaw: 0,
    velPitch: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    totalMove: 0,
    isHoveringCard: false,
    idleTimer: null as ReturnType<typeof setTimeout> | null,
  });

  // Card Ring Orbit State (~75s per loop)
  const ringRotRef = useRef(0);
  const ringVelRef = useRef(0);
  const isDraggingRingRef = useRef(false);
  const isCardHoveredRef = useRef(false);

  // Plane & Trail DOM references
  const planeElRef = useRef<HTMLDivElement | null>(null);
  const trailElsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Card runtime positions & flight progress
  interface CardRuntime {
    dest: Destination;
    fly: number; // 0 (hidden at India hub pin) -> 1 (in orbit ring)
    index: number;
  }

  const cardsRef = useRef<CardRuntime[]>(
    DESTINATIONS.map((dest, index) => ({
      dest,
      fly: 0,
      index,
    }))
  );

  const cardElsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const pinElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const hubPinElRef = useRef<HTMLDivElement | null>(null);

  // Three.js scene references
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    globeGroup: THREE.Group;
    earthMesh: THREE.Mesh;
    cloudMesh?: THREE.Mesh;
    cloudShadowMesh?: THREE.Mesh;
    rimMesh?: THREE.Mesh;
    arcLines: Map<string, { line: THREE.Line; pts: THREE.Vector3[]; maxPts: number }>;
    planeSprite?: THREE.Sprite;
    raycaster: THREE.Raycaster;
  } | null>(null);

  // Dimensions
  const [dims, setDims] = useState({
    width: 1440,
    height: 900,
    globeD: 440,
    globeR: 220,
    cx: 720,
    cy: 508,
    ringCx: 720,
    ringCy: 508,
    rx: 422,
    ry: 118,
    goldenCx: 720,
    goldenCy: 525,
    goldenRx: 429,
    goldenRy: 121,
    goldenLen: 1950,
  });
  const dimsRef = useRef(dims);
  dimsRef.current = dims;

  // Initial India rotation angles
  const INDIA_ANGLES = useMemo(() => focusAngles(HUB.lat, HUB.lon), []);

  useEffect(() => {
    rot.current.yaw = INDIA_ANGLES.yaw;
    rot.current.pitch = INITIAL_PITCH;
  }, [INDIA_ANGLES]);

  // Load earth-water.png for land tap detection
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/wonder/earth-water.png';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || 1600;
      c.height = img.naturalHeight || 800;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        offscreenCanvasRef.current = c;
        offscreenCtxRef.current = ctx;
      }
    };
  }, []);

  // ── Layout Dimensions Calculation (Change 1: clearance >= 40px guaranteed) ─
  const updateDims = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const W = rect.width || window.innerWidth;
    const H = rect.height || window.innerHeight;

    // Globe diameter = 48-50% of section height on desktop, clamped on narrow mobile viewports
    const globeD = Math.min(Math.round(W * 0.76), Math.round(H * 0.49));
    const globeR = globeD / 2;

    const cx = W / 2;

    // Measure actual header height to guarantee >= 44px clearance between subtitle and ring top
    const headEl = section.querySelector<HTMLElement>('.ww-head');
    const headRect = headEl ? headEl.getBoundingClientRect() : null;
    const headSectionBottom = headRect ? headRect.bottom - rect.top : 210;
    // Ring top is cy - (globeR + 28). Required: (cy - globeR - 28) - headSectionBottom >= 44px
    const minCyForClearance = Math.round(headSectionBottom + globeR + 28 + 44);
    const cy = Math.max(minCyForClearance, Math.round(H * 0.535));

    // Golden Orbit Ring & Card Orbit Ring: (cx, cy + 0.08R), rx = 1.95R, ry = 0.55R
    const goldenCx = cx;
    const goldenCy = cy + 0.08 * globeR;
    const goldenRx = 1.95 * globeR;
    const goldenRy = 0.55 * globeR;

    // Ramanujan ellipse circumference approximation
    const hRam = Math.pow(goldenRx - goldenRy, 2) / Math.pow(goldenRx + goldenRy, 2);
    const goldenLen = Math.PI * (goldenRx + goldenRy) * (1 + (3 * hRam) / (10 + Math.sqrt(4 - 3 * hRam)));

    const ringCx = goldenCx;
    const ringCy = goldenCy;
    const rx = goldenRx;
    const ry = goldenRy;

    const newDims = {
      width: W,
      height: H,
      globeD,
      globeR,
      cx,
      cy,
      ringCx,
      ringCy,
      rx,
      ry,
      goldenCx,
      goldenCy,
      goldenRx,
      goldenRy,
      goldenLen,
    };

    setDims(newDims);
    dimsRef.current = newDims;

    const three = threeRef.current;
    if (three) {
      three.renderer.setSize(W, H, false);
      three.camera.aspect = W / H;
      three.camera.updateProjectionMatrix();

      // Fit globe precisely within canvas bounds and vertical center
      const dist = 3.3;
      const visibleH = 2 * dist * Math.tan(((34 / 2) * Math.PI) / 180);
      const pxPerUnit = H / visibleH;
      const scaleFactor = (globeD / pxPerUnit) / 2.0;
      three.globeGroup.scale.setScalar(scaleFactor);
      three.globeGroup.position.y = -((cy - H / 2) / pxPerUnit);
    }
  }, []);

  useEffect(() => {
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, [updateDims]);

  // Touch devices: gentle auto-sweep on watermark when section enters viewport (Change 2)
  useEffect(() => {
    const wmEl = watermarkRef.current;
    if (!wmEl) return;
    const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isTouch || prefersReduced) return;

    let played = false;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !played) {
        played = true;
        const letters = wmEl.querySelectorAll<HTMLElement>('.ww-wm-char:not(.ww-wm-space)');
        if (letters.length > 0) {
          gsap.timeline({ delay: 0.5 })
            .to(letters, {
              color: '#C4782A',
              opacity: 0.45,
              y: -3,
              duration: 0.35,
              stagger: {
                each: 0.05,
                yoyo: true,
                repeat: 1,
              },
              ease: 'power2.out',
            });
        }
      }
    }, { threshold: 0.25 });

    obs.observe(wmEl);
    return () => obs.disconnect();
  }, []);

  // ── Trigger India Reveal Toggle ───────────────────────────────────────────
  const toggleIndiaReveal = useCallback(() => {
    if (isAnimatingRef.current) return;

    if (!isRevealedRef.current) {
      // ── OPEN RING ──
      isAnimatingRef.current = true;
      setIsRevealed(true);
      isRevealedRef.current = true;

      // Focus India smoothly
      gsap.killTweensOf(rot.current);
      gsap.to(rot.current, {
        yaw: INDIA_ANGLES.yaw,
        pitch: INITIAL_PITCH,
        duration: 1.0,
        ease: 'power2.inOut',
      });

      // Animate flight arcs drawing outward
      const three = threeRef.current;
      if (three) {
        let i = 0;
        three.arcLines.forEach((arcData) => {
          const obj = { count: 0 };
          const delay = 0.15 + i * 0.08;
          i++;
          gsap.to(obj, {
            count: arcData.maxPts,
            duration: 1.1,
            delay,
            ease: 'power2.out',
            onUpdate: () => {
              arcData.line.geometry.setDrawRange(0, Math.floor(obj.count));
            },
          });
        });
      }

      // Golden Ring: animate stroke-dashoffset in 1.2s
      const gLen = dimsRef.current.goldenLen;
      goldenDashObj.current.offset = gLen;
      setGoldenDashOffset(gLen);
      gsap.to(goldenDashObj.current, {
        offset: 0,
        duration: 1.2,
        ease: 'power2.out',
        onUpdate: () => {
          setGoldenDashOffset(goldenDashObj.current.offset);
        },
      });

      // Fade in orbit guide line
      gsap.to(guideOpacityRef, {
        current: 1,
        duration: 0.8,
        ease: 'power2.out',
      });

      // Cards fly OUT of the India pin into orbit ring positions
      cardsRef.current.forEach((card, idx) => {
        card.fly = 0;
        gsap.to(card, {
          fly: 1,
          duration: 0.95,
          delay: 0.2 + idx * 0.08,
          ease: 'back.out(1.4)',
          onComplete: () => {
            if (idx === cardsRef.current.length - 1) {
              isAnimatingRef.current = false;
            }
          },
        });
      });
    } else {
      // ── CLOSE RING ──
      isAnimatingRef.current = true;
      setIsRevealed(false);
      isRevealedRef.current = false;

      // Golden Ring: animate stroke-dashoffset back
      const gLen = dimsRef.current.goldenLen;
      gsap.to(goldenDashObj.current, {
        offset: gLen,
        duration: 0.6,
        ease: 'power2.in',
        onUpdate: () => {
          setGoldenDashOffset(goldenDashObj.current.offset);
        },
      });

      // Fade out orbit guide
      gsap.to(guideOpacityRef, {
        current: 0,
        duration: 0.5,
        ease: 'power2.in',
      });

      // Clear flight arcs
      const three = threeRef.current;
      if (three) {
        three.arcLines.forEach((arcData) => {
          arcData.line.geometry.setDrawRange(0, 0);
        });
        if (three.planeSprite) three.planeSprite.visible = false;
      }

      // Cards fly back INTO the pin
      cardsRef.current.forEach((card, idx) => {
        gsap.to(card, {
          fly: 0,
          duration: 0.5,
          delay: idx * 0.05,
          ease: 'power2.in',
          onComplete: () => {
            card.fly = 0;
            if (idx === cardsRef.current.length - 1) {
              isAnimatingRef.current = false;
            }
          },
        });
      });
    }
  }, [INDIA_ANGLES]);

  // ── Tap Raycasting ────────────────────────────────────────────────────────
  const handleTapOnGlobe = useCallback((screenX: number, screenY: number) => {
    const three = threeRef.current;
    const canvas = canvasRef.current;
    if (!three || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((screenX - rect.left) / rect.width) * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1
    );

    three.raycaster.setFromCamera(mouse, three.camera);
    const intersects = three.raycaster.intersectObject(three.earthMesh);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const localPoint = three.globeGroup.worldToLocal(hit.point.clone());
      const { lat, lon } = vec3ToLatLon(localPoint);

      const hubVec = latLonToVec3(HUB.lat, HUB.lon, 1);
      const isNearHub = localPoint.distanceTo(hubVec) < 0.28;
      const insideIndia = isPointInPolygon(lat, lon, INDIA_POLYGON);

      if (insideIndia || isNearHub) {
        toggleIndiaReveal();
        return;
      }

      const ctx = offscreenCtxRef.current;
      const offCanvas = offscreenCanvasRef.current;
      if (ctx && offCanvas) {
        const W = offCanvas.width;
        const H = offCanvas.height;
        const u = ((lon + 180) % 360) / 360;
        const v = (90 - lat) / 180;
        const px = Math.floor(u * W);
        const py = Math.floor(v * H);

        try {
          const pixel = ctx.getImageData(px, py, 1, 1).data;
          const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
          if (brightness < 128) {
            const stage = stageRef.current;
            if (stage) {
              const stageRect = stage.getBoundingClientRect();
              setTapTooltip({
                x: screenX - stageRect.left,
                y: screenY - stageRect.top,
                text: 'Coming soon',
                id: Date.now(),
              });
            }
          }
        } catch {
          // Ignore
        }
      }
    }
  }, [toggleIndiaReveal]);

  // ── Pointer Drag & Tilt Return ────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('.ww-card') ||
      target.closest('.ww-hub-pin') ||
      target.closest('.ww-ctrl-btn') ||
      target.closest('.ww-cta-btn-pill') ||
      target.closest('.ww-wm-char')
    ) {
      return;
    }

    rot.current.isDragging = true;
    setHasInteracted(true);
    rot.current.dragStartX = e.clientX;
    rot.current.dragStartY = e.clientY;
    rot.current.lastX = e.clientX;
    rot.current.lastY = e.clientY;
    rot.current.lastTime = performance.now();
    rot.current.velYaw = 0;
    rot.current.velPitch = 0;
    rot.current.totalMove = 0;

    if (rot.current.idleTimer) {
      clearTimeout(rot.current.idleTimer);
      rot.current.idleTimer = null;
    }

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!rot.current.isDragging) return;
    const dx = e.clientX - rot.current.lastX;
    const dy = e.clientY - rot.current.lastY;
    const moveDist = Math.hypot(e.clientX - rot.current.dragStartX, e.clientY - rot.current.dragStartY);
    rot.current.totalMove = Math.max(rot.current.totalMove, moveDist);

    const now = performance.now();
    const dt = Math.max(1, now - rot.current.lastTime);
    rot.current.velYaw = (dx / dt) * 0.009;
    rot.current.velPitch = (dy / dt) * 0.008;
    rot.current.lastX = e.clientX;
    rot.current.lastY = e.clientY;
    rot.current.lastTime = now;

    // Drag tilt is clamped to +-35 degrees
    const maxPitch = (35 * Math.PI) / 180;
    rot.current.yaw += dx * 0.0085;
    rot.current.pitch = Math.max(-maxPitch, Math.min(maxPitch, rot.current.pitch + dy * 0.0075));
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!rot.current.isDragging) return;
    rot.current.isDragging = false;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (rot.current.totalMove < 6) {
      handleTapOnGlobe(e.clientX, e.clientY);
    }

    // After release for 2.5s, ease tilt back to 18 degrees and resume auto-rotate
    if (rot.current.idleTimer) clearTimeout(rot.current.idleTimer);
    rot.current.idleTimer = setTimeout(() => {
      gsap.to(rot.current, {
        pitch: INITIAL_PITCH,
        duration: 1.4,
        ease: 'power2.out',
      });
    }, 2500);
  }, [handleTapOnGlobe]);

  // ── Wheel Event (Plain wheel scrolls page, ONLY Ctrl+wheel zooms) ─────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.08 : -0.08;
      setZoomLevel((prev) => {
        const next = Math.max(1.0, Math.min(2.2, Number((prev + zoomFactor).toFixed(2))));
        targetCamZ.current = 3.3 / next;
        return next;
      });
    }
  }, []);

  // Button Zoom Handlers (+ / − / X)
  const handleZoomIn = () => {
    setHasInteracted(true);
    setZoomLevel((prev) => {
      const next = Math.min(2.2, Number((prev + 0.3).toFixed(1)));
      targetCamZ.current = 3.3 / next;
      return next;
    });
  };

  const handleZoomOut = () => {
    setHasInteracted(true);
    setZoomLevel((prev) => {
      const next = Math.max(1.0, Number((prev - 0.3).toFixed(1)));
      targetCamZ.current = 3.3 / next;
      return next;
    });
  };

  // Reset zoom & view button (X)
  const handleResetView = () => {
    setZoomLevel(1.0);
    targetCamZ.current = 3.3;

    gsap.killTweensOf(currentCamZ);
    gsap.to(currentCamZ, {
      current: 3.3,
      duration: 0.45,
      ease: 'power2.out',
    });

    // Smoothly recenter globe
    gsap.killTweensOf(rot.current);
    gsap.to(rot.current, {
      yaw: INDIA_ANGLES.yaw,
      pitch: INITIAL_PITCH,
      duration: 0.8,
      ease: 'power2.out',
    });

    rot.current.isHoveringCard = false;
    rot.current.isDragging = false;
    isCardHoveredRef.current = false;
    hoveredDestIdRef.current = null;
    setHoveredDestId(null);

    if (!isRevealedRef.current) {
      toggleIndiaReveal();
    }
  };

  // ── Card Hover & Click Handlers ───────────────────────────────────────────
  const handleCardMouseEnter = (card: CardRuntime) => {
    hoveredDestIdRef.current = card.dest.id;
    setHoveredDestId(card.dest.id);
    isCardHoveredRef.current = true;
    rot.current.isHoveringCard = true;

    // Focus destination pin smoothly (~650ms)
    const destAngles = focusAngles(card.dest.lat, card.dest.lon);
    gsap.killTweensOf(rot.current);
    gsap.to(rot.current, {
      yaw: destAngles.yaw,
      pitch: destAngles.pitch,
      duration: 0.65,
      ease: 'power2.out',
    });
  };

  const handleCardMouseLeave = () => {
    hoveredDestIdRef.current = null;
    setHoveredDestId(null);
    isCardHoveredRef.current = false;
    rot.current.isHoveringCard = false;

    if (rot.current.idleTimer) clearTimeout(rot.current.idleTimer);
    rot.current.idleTimer = setTimeout(() => {
      gsap.to(rot.current, {
        pitch: INITIAL_PITCH,
        duration: 1.2,
        ease: 'power2.out',
      });
    }, 1800);
  };

  const handleCardClick = (card: CardRuntime, e: React.MouseEvent) => {
    if (card.dest.locked) {
      onWaitlist?.();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setModalOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setActiveModal(card.dest);
  };

  useEffect(() => {
    if (!activeModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeModal]);

  // ── Watermark Per-Letter Ripple Helpers (Change 2) ────────────────────────
  const checkWatermarkHover = useCallback((clientX: number, clientY: number) => {
    if (rot.current.isDragging || isCardHoveredRef.current) {
      setHoveredWmIdx((prev) => (prev !== null ? null : prev));
      return;
    }
    if (typeof document === 'undefined') return;
    const els = document.elementsFromPoint(clientX, clientY);
    for (const el of els) {
      if (el.classList.contains('ww-wm-char') && !el.classList.contains('ww-wm-space')) {
        const idxStr = el.getAttribute('data-idx');
        if (idxStr !== null) {
          const idx = parseInt(idxStr, 10);
          setHoveredWmIdx((prev) => (prev !== idx ? idx : prev));
          return;
        }
      }
    }
    setHoveredWmIdx((prev) => (prev !== null ? null : prev));
  }, []);

  const getCharStyle = (index: number) => {
    if (hoveredWmIdx === null) {
      return {
        color: 'rgba(168, 128, 84, 0.16)',
        opacity: 1,
        transform: 'translateY(0px)',
      };
    }
    const dist = Math.abs(index - hoveredWmIdx);
    if (dist === 0) {
      return {
        color: '#C4782A',
        opacity: 0.45,
        transform: 'translateY(-4px)',
      };
    }
    if (dist === 1) {
      return {
        color: '#D48938',
        opacity: 0.32,
        transform: 'translateY(-2.4px)',
      };
    }
    if (dist === 2) {
      return {
        color: '#DCA258',
        opacity: 0.22,
        transform: 'translateY(-1.2px)',
      };
    }
    return {
      color: 'rgba(168, 128, 84, 0.16)',
      opacity: 0.16,
      transform: 'translateY(0px)',
    };
  };

  // ── Three.js Scene Setup (Change 3: Volumetric 4K Clouds & 4K Earth) ───────
  useEffect(() => {
    let disposed = false;
    let animId = 0;
    let isVisible = true;

    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    updateDims();
    const { width: stageW, height: stageH } = dimsRef.current;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(stageW, stageH, false);
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, stageW / stageH, 0.1, 100);
    camera.position.set(0, 0, currentCamZ.current);

    // Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Initial globe group scale and vertical center alignment
    const dist = 3.3;
    const visibleH = 2 * dist * Math.tan(((34 / 2) * Math.PI) / 180);
    const pxPerUnit = stageH / visibleH;
    const scaleFactor = (dimsRef.current.globeD / pxPerUnit) / 2.0;
    globeGroup.scale.setScalar(scaleFactor);
    globeGroup.position.y = -((dimsRef.current.cy - stageH / 2) / pxPerUnit);

    // Texture Loader
    const isTablet = typeof window !== 'undefined' && window.innerWidth < 1024 && window.innerWidth >= 768;
    const earthSrc = isTablet ? '/wonder/earth-2k.webp' : '/wonder/earth-4k.webp';
    const texLoader = new THREE.TextureLoader();

    // 4K Ultra-Sharp NASA Blue Marble / SolarSystemScope Earth Daymap
    const earthTexture = texLoader.load(earthSrc, (tex) => {
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
    });

    const bumpTexture = texLoader.load('/wonder/earth-bump.png', (tex) => {
      tex.needsUpdate = true;
    });

    const earthGeo = new THREE.SphereGeometry(1, 96, 96);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.022,
      roughness: 0.78,
      metalness: 0.0,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // Atmospheric blue-white fresnel rim glow + warm key light rim (hugging earth surface)
    const rimGeo = new THREE.SphereGeometry(1.006, 64, 64);
    const rimMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float rim = 1.0 - max(0.0, dot(normal, viewDir));
          rim = pow(rim, 3.4);
          float goldenFactor = clamp(normal.x * 0.7 + normal.y * 0.7, 0.0, 1.0);
          vec3 rimColor = mix(vec3(0.55, 0.78, 1.0), vec3(1.0, 0.90, 0.65), goldenFactor);
          gl_FragColor = vec4(rimColor, rim * 0.25);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    globeGroup.add(rimMesh);

    // Lights: warm key light from upper-right, soft fill on terminator side (IMG-TARGET)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.20);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffe2a8, 1.25);
    sunLight.position.set(3.5, 3.5, 3.0);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xcfe6ff, 0.28);
    fillLight.position.set(-3.0, -2.0, 2.0);
    scene.add(fillLight);

    // ── Flight Arcs from Hub ────────────────────────────────────────────────
    const arcLines = new Map<string, { line: THREE.Line; pts: THREE.Vector3[]; maxPts: number }>();
    const hubVec = latLonToVec3(HUB.lat, HUB.lon, 1.002);

    DESTINATIONS.forEach((dest) => {
      const destVec = latLonToVec3(dest.lat, dest.lon, 1.002);
      const pts = arcPoints(hubVec, destVec, 64);
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      geom.setDrawRange(0, 0);

      const mat = new THREE.LineBasicMaterial({
        color: 0xc4782a,
        transparent: true,
        opacity: 0.85,
        linewidth: 1.5,
      });

      const line = new THREE.Line(geom, mat);
      globeGroup.add(line);
      arcLines.set(dest.id, { line, pts, maxPts: pts.length });
    });

    const raycaster = new THREE.Raycaster();
    threeRef.current = {
      renderer,
      scene,
      camera,
      globeGroup,
      earthMesh,
      rimMesh,
      arcLines,
      raycaster,
    };

    const obs = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    obs.observe(stage);

    // ── Render & Animation Loop ─────────────────────────────────────────────
    const animate = () => {
      if (disposed) return;
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const now = performance.now();

      // Smooth camera zoom lerp (~350ms)
      if (!gsap.isTweening(currentCamZ)) {
        currentCamZ.current += (targetCamZ.current - currentCamZ.current) * 0.16;
      }
      camera.position.z = currentCamZ.current;
      (window as any).__ww_camera_z = currentCamZ.current;

      // Auto-rotation when idle
      if (!rot.current.isDragging && !rot.current.isHoveringCard) {
        rot.current.yaw += 0.0012;
      }

      if (!rot.current.isDragging && Math.abs(rot.current.velYaw) > 0.0001) {
        rot.current.yaw += rot.current.velYaw;
        rot.current.velYaw *= 0.94;
      }
      if (!rot.current.isDragging && Math.abs(rot.current.velPitch) > 0.0001) {
        rot.current.pitch += rot.current.velPitch;
        rot.current.velPitch *= 0.92;
      }

      // Single sphere rotates as one unified planet (clouds locked to terrain)
      globeGroup.rotation.set(rot.current.pitch, rot.current.yaw, 0);

      // Render Three.js scene (NO recreation, smooth 60fps)
      renderer.render(scene, camera);

      // ── Card Ring Orbit Mechanics ─────────────────────────────────────────
      if (isRevealedRef.current) {
        if (!isCardHoveredRef.current && !isDraggingRingRef.current) {
          ringRotRef.current += 0.0014;
        }
        if (!isDraggingRingRef.current && Math.abs(ringVelRef.current) > 0.00005) {
          ringRotRef.current += ringVelRef.current;
          ringVelRef.current *= 0.92;
        }
      }

      const sw = dimsRef.current.width;
      const sh = dimsRef.current.height;
      const cameraDir = new THREE.Vector3(0, 0, 1);

      // ── Project Hub Pin to DOM Screen Space ───────────────────────────────
      const hubPos = latLonToVec3(HUB.lat, HUB.lon, 1.004);
      const hubWorld = hubPos.clone();
      globeGroup.localToWorld(hubWorld);
      const hubNormal = hubPos.clone().applyEuler(globeGroup.rotation).normalize();
      const isHubVisible = hubNormal.dot(cameraDir) > 0.15;

      const hubNdc = hubWorld.project(camera);
      const hubScreenX = (hubNdc.x * 0.5 + 0.5) * sw;
      const hubScreenY = (-hubNdc.y * 0.5 + 0.5) * sh;

      if (hubPinElRef.current) {
        hubPinElRef.current.style.left = `${hubScreenX.toFixed(1)}px`;
        hubPinElRef.current.style.top = `${hubScreenY.toFixed(1)}px`;
        hubPinElRef.current.style.opacity = isHubVisible ? '1' : '0';
        hubPinElRef.current.style.pointerEvents = isHubVisible ? 'auto' : 'none';
      }

      // ── Destination Pins (ONLY visible for hovered card) ──────────────────
      const activeHoverId = hoveredDestIdRef.current;

      DESTINATIONS.forEach((dest) => {
        const pinEl = pinElsRef.current.get(dest.id);
        if (!pinEl) return;

        const isHoveredCard = isRevealedRef.current && activeHoverId === dest.id;

        if (!isHoveredCard) {
          pinEl.style.display = 'none';
          pinEl.style.opacity = '0';
          return;
        }

        const pinVec = latLonToVec3(dest.lat, dest.lon, 1.004);
        const pinWorld = pinVec.clone();
        globeGroup.localToWorld(pinWorld);
        const pinNormal = pinVec.clone().applyEuler(globeGroup.rotation).normalize();
        const isFacing = pinNormal.dot(cameraDir) > 0.05;

        const pinNdc = pinWorld.project(camera);
        const pinScreenX = (pinNdc.x * 0.5 + 0.5) * sw;
        const pinScreenY = (-pinNdc.y * 0.5 + 0.5) * sh;

        pinEl.style.display = isFacing ? 'block' : 'none';
        pinEl.style.left = `${pinScreenX.toFixed(1)}px`;
        pinEl.style.top = `${pinScreenY.toFixed(1)}px`;
        pinEl.style.opacity = isFacing ? '1' : '0';
      });

      // ── Golden Orbit Plane & Trail ─────────────────────────────────────────
      const { goldenCx, goldenCy, goldenRx, goldenRy } = dimsRef.current;
      const planeLoopSec = 18.0;
      const uPlane = ((now / 1000) / planeLoopSec) % 1;
      const theta = uPlane * 2 * Math.PI;

      const xUnrot = goldenCx + goldenRx * Math.cos(theta);
      const yUnrot = goldenCy + goldenRy * Math.sin(theta);
      const dxUnrot = -goldenRx * Math.sin(theta);
      const dyUnrot = goldenRy * Math.cos(theta);

      const alpha = -10 * Math.PI / 180;
      const relX = xUnrot - goldenCx;
      const relY = yUnrot - goldenCy;

      const planeX = goldenCx + relX * Math.cos(alpha) - relY * Math.sin(alpha);
      const planeY = goldenCy + relX * Math.sin(alpha) + relY * Math.cos(alpha);

      const tx = dxUnrot * Math.cos(alpha) - dyUnrot * Math.sin(alpha);
      const ty = dxUnrot * Math.sin(alpha) + dyUnrot * Math.cos(alpha);
      const planeAngle = (Math.atan2(ty, tx) * 180) / Math.PI;

      const isBackPlane = Math.sin(theta) < 0;

      if (planeElRef.current) {
        planeElRef.current.style.left = `${planeX.toFixed(1)}px`;
        planeElRef.current.style.top = `${planeY.toFixed(1)}px`;
        planeElRef.current.style.transform = `translate(-50%, -50%) rotate(${planeAngle.toFixed(1)}deg)`;
        planeElRef.current.style.zIndex = isBackPlane ? '4' : '16';
        planeElRef.current.style.opacity = isRevealedRef.current ? '1' : '0';
      }

      for (let k = 1; k <= 4; k++) {
        const dotEl = trailElsRef.current[k - 1];
        if (!dotEl) continue;
        const trailTheta = theta - (k * 0.045);
        const txU = goldenCx + goldenRx * Math.cos(trailTheta);
        const tyU = goldenCy + goldenRy * Math.sin(trailTheta);
        const tRelX = txU - goldenCx;
        const tRelY = tyU - goldenCy;
        const tX = goldenCx + tRelX * Math.cos(alpha) - tRelY * Math.sin(alpha);
        const tY = goldenCy + tRelX * Math.sin(alpha) + tRelY * Math.cos(alpha);
        const tBack = Math.sin(trailTheta) < 0;

        dotEl.style.left = `${tX.toFixed(1)}px`;
        dotEl.style.top = `${tY.toFixed(1)}px`;
        dotEl.style.zIndex = tBack ? '4' : '16';
        dotEl.style.opacity = isRevealedRef.current ? `${(0.75 - k * 0.15).toFixed(2)}` : '0';
      }

      // ── Orbiting Cards along Ring with 3D Depth ────────────────────────────
      const leaderLines: string[] = [];
      const numCards = cardsRef.current.length;
      const angleStep = (2 * Math.PI) / numCards;

      cardsRef.current.forEach((card, i) => {
        const el = cardElsRef.current[i];
        if (!el) return;

        const f = card.fly;
        const isCardActive = f > 0.005;
        el.style.display = isCardActive ? 'flex' : 'none';
        if (!isCardActive) return;

        const cardAngle = ringRotRef.current + i * angleStep;

        const xU = goldenCx + goldenRx * Math.cos(cardAngle);
        const yU = goldenCy + goldenRy * Math.sin(cardAngle);
        const dX = xU - goldenCx;
        const dY = yU - goldenCy;

        const orbitTargetX = goldenCx + dX * Math.cos(alpha) - dY * Math.sin(alpha);
        const orbitTargetY = goldenCy + dX * Math.sin(alpha) + dY * Math.cos(alpha);

        const sinVal = Math.sin(cardAngle);
        const isBack = sinVal < 0;
        const depthT = (sinVal + 1) / 2;

        const baseScale = 0.78 + 0.22 * depthT;
        const baseOpacity = 0.60 + 0.40 * depthT;

        const isHovered = activeHoverId === card.dest.id;
        const totalScale = (baseScale * (isHovered ? 1.08 : 1.0)) * f;
        const finalOpacity = Math.min(1, (isHovered ? 1.0 : baseOpacity) * f * 1.2);

        const curX = hubScreenX + (orbitTargetX - hubScreenX) * f;
        const curY = hubScreenY + (orbitTargetY - hubScreenY) * f;

        el.style.transform = `translate(${curX.toFixed(1)}px, ${curY.toFixed(1)}px) translate(-50%, -50%) scale(${totalScale.toFixed(3)})`;
        el.style.opacity = finalOpacity.toFixed(3);
        el.style.pointerEvents = f > 0.8 ? 'auto' : 'none';

        if (isHovered) {
          el.style.zIndex = '45';
        } else if (isBack) {
          el.style.zIndex = '5';
        } else {
          el.style.zIndex = '25';
        }

        if (isHovered && f > 0.5) {
          const pinEl = pinElsRef.current.get(card.dest.id);
          if (pinEl && pinEl.style.display !== 'none') {
            const pinX = parseFloat(pinEl.style.left);
            const pinY = parseFloat(pinEl.style.top);
            if (!isNaN(pinX) && !isNaN(pinY)) {
              leaderLines.push(
                `<line x1="${curX.toFixed(1)}" y1="${curY.toFixed(1)}" x2="${pinX.toFixed(1)}" y2="${pinY.toFixed(1)}" stroke="#E98B2A" stroke-width="2" stroke-dasharray="4 4" opacity="1.0" />`
              );
            }
          }
        }
      });

      if (leaderSvgRef.current) {
        leaderSvgRef.current.innerHTML = leaderLines.join('');
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      obs.disconnect();
      renderer.dispose();
      scene.clear();
    };
  }, [updateDims]);

  const isZoomed = zoomLevel > 1.05;

  return (
    <section
      id="wonder"
      ref={sectionRef}
      className="ww-section"
      onPointerMove={(e) => checkWatermarkHover(e.clientX, e.clientY)}
      onPointerLeave={() => setHoveredWmIdx(null)}
    >
      {/* Soft gradient blend between Section 2 & Section 3 */}
      <div className="ww-top-blend" aria-hidden="true" />

      {/* 4 Soft Blurred White Cloud Blobs in Sky */}
      <div className="ww-cloud-blobs" aria-hidden="true">
        <div className="ww-cloud-blob ww-cloud-blob-1" />
        <div className="ww-cloud-blob ww-cloud-blob-2" />
        <div className="ww-cloud-blob ww-cloud-blob-3" />
        <div className="ww-cloud-blob ww-cloud-blob-4" />
      </div>

      {/* Landscape: Alpine Lake Sunset Overlook at bottom */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/wonder/Alpine Lake Sunset Overlook.png"
        alt="Alpine Lake Sunset Overlook"
        className="ww-bg-landscape"
      />

      {/* Soft warm light glow on right side of background (Scope Lock B) */}
      <div className="ww-right-glow" aria-hidden="true" />

      {/* Watermark: Per-letter interactive hover ripple (Change 2) */}
      <div
        ref={watermarkRef}
        className={`ww-watermark-wrapper ${playfair.className}`}
        suppressHydrationWarning
        aria-label="THE WONDER WORLD"
      >
        {WATERMARK_CHARS.map((char, index) => {
          const isSpace = char === ' ';
          const charStyle = getCharStyle(index);

          return (
            <span
              key={index}
              data-idx={index}
              className={`ww-wm-char ${isSpace ? 'ww-wm-space' : ''}`}
              aria-hidden="true"
              onMouseEnter={() => !isSpace && setHoveredWmIdx(index)}
              onMouseLeave={() => setHoveredWmIdx(null)}
              style={charStyle}
            >
              {isSpace ? '\u00A0' : char}
            </span>
          );
        })}
      </div>

      {/* Top Header (Change 1: z-index 55, higher stacking context, fades to 0.15 on max zoom) */}
      <header className={`ww-head ${isZoomed ? 'ww-head--zoomed' : ''}`}>
        <div className="ww-eyebrow">
          <span>—</span>
          <span>THE WONDER WORLD</span>
          <span>—</span>
        </div>
        <h2 className="ww-title">
          One world. Endless <span className="ww-accent-word">wonders.</span>
        </h2>
        <p className="ww-subtitle">
          Pick a place. Vaya shows you what it is really like, today.
        </p>
      </header>

      {/* Globe Stage Area */}
      <div
        ref={stageRef}
        className="ww-stage-area"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Soft elliptical ground shadow under globe */}
        <div
          className="ww-globe-shadow"
          style={{
            left: `${dims.cx}px`,
            top: `${dims.cy + dims.globeR + 24}px`,
            width: `${dims.globeD * 0.60}px`,
            height: '28px',
          }}
          aria-hidden="true"
        />

        {/* Circular SVG Text Ring: "STAND IN • STEP OUT •" concentric at globeR + 28px, 40s/loop */}
        <svg
          className="ww-text-ring"
          viewBox="0 0 600 600"
          style={{
            left: `${dims.cx}px`,
            top: `${dims.cy}px`,
            width: `${dims.globeD + 56}px`,
            height: `${dims.globeD + 56}px`,
            opacity: isZoomed ? 0 : 0.85,
            transition: 'opacity 0.35s ease',
          }}
          aria-hidden="true"
        >
          <defs>
            <path
              id="wwTextRingPath"
              d="M 300,300 m -260,0 a 260,260 0 1,1 520,0 a 260,260 0 1,1 -520,0"
            />
          </defs>
          <g className="ww-text-ring-spin">
            <text>
              <textPath href="#wwTextRingPath" startOffset="0%">
                STAND IN • STEP OUT • STAND IN • STEP OUT • STAND IN • STEP OUT •
              </textPath>
            </text>
          </g>
        </svg>

        {/* ── GOLDEN ORBIT RING: BACK HALF (Layer below canvas, z-index 4) ── */}
        <svg
          className="ww-golden-orbit-back"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 4,
            overflow: 'visible',
            opacity: isRevealed && !isZoomed ? 1 : 0,
            transition: 'opacity 0.35s ease',
          }}
          aria-hidden="true"
        >
          <defs>
            <clipPath id="wwGoldenOrbitClipBack">
              <rect
                x={dims.goldenCx - dims.goldenRx - 100}
                y={dims.goldenCy - dims.goldenRy - 100}
                width={(dims.goldenRx + 100) * 2}
                height={dims.goldenRy + 100}
              />
            </clipPath>
            <linearGradient id="wwGoldenRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffd45a" />
              <stop offset="50%" stopColor="#ffb020" />
              <stop offset="100%" stopColor="#ffd45a" />
            </linearGradient>
            <filter id="wwGoldGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(255, 190, 60, 0.85)" />
            </filter>
          </defs>

          <g transform={`rotate(-10, ${dims.goldenCx}, ${dims.goldenCy})`}>
            <ellipse
              cx={dims.goldenCx}
              cy={dims.goldenCy}
              rx={dims.goldenRx}
              ry={dims.goldenRy}
              fill="none"
              stroke="url(#wwGoldenRingGrad)"
              strokeWidth="3"
              filter="url(#wwGoldGlow)"
              clipPath="url(#wwGoldenOrbitClipBack)"
              strokeDasharray={dims.goldenLen}
              strokeDashoffset={goldenDashOffset}
            />
          </g>
        </svg>

        {/* Full-bleed Canvas: Crisp Three.js Earth Globe (z-index 10) */}
        <canvas
          ref={canvasRef}
          className="ww-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label="3D Earth Globe. Drag to spin, tap India to explore"
        />

        {/* ── GOLDEN ORBIT RING: FRONT HALF (Layer above canvas, z-index 15) ── */}
        <svg
          className="ww-golden-orbit-front"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 15,
            overflow: 'visible',
            opacity: isRevealed && !isZoomed ? 1 : 0,
            transition: 'opacity 0.35s ease',
          }}
          aria-hidden="true"
        >
          <defs>
            <clipPath id="wwGoldenOrbitClipFront">
              <rect
                x={dims.goldenCx - dims.goldenRx - 100}
                y={dims.goldenCy}
                width={(dims.goldenRx + 100) * 2}
                height={dims.goldenRy + 100}
              />
            </clipPath>
          </defs>

          <g transform={`rotate(-10, ${dims.goldenCx}, ${dims.goldenCy})`}>
            <ellipse
              cx={dims.goldenCx}
              cy={dims.goldenCy}
              rx={dims.goldenRx}
              ry={dims.goldenRy}
              fill="none"
              stroke="url(#wwGoldenRingGrad)"
              strokeWidth="3"
              filter="url(#wwGoldGlow)"
              clipPath="url(#wwGoldenOrbitClipFront)"
              strokeDasharray={dims.goldenLen}
              strokeDashoffset={goldenDashOffset}
            />
          </g>
        </svg>

        {/* Orange Airplane Silhouette */}
        <div
          ref={planeElRef}
          className="ww-golden-plane"
          style={{
            opacity: isRevealed && !isZoomed ? 1 : 0,
          }}
          aria-hidden="true"
        >
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <path
              d="M 32 17 C 29 15.5 25 15 20 15 L 14 5 L 11 5 L 14 15 L 6 15 L 4 11 L 2 11 L 3.5 17 L 2 23 L 4 23 L 6 19 L 14 19 L 11 29 L 14 29 L 20 19 C 25 19 29 18.5 32 17 Z"
              fill="#E98B2A"
              filter="drop-shadow(0 2px 5px rgba(233, 139, 42, 0.45))"
            />
          </svg>
        </div>

        {/* Fading dotted trail behind airplane */}
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            ref={(el) => {
              trailElsRef.current[idx] = el;
            }}
            className="ww-trail-dot"
            style={{
              width: `${3.5 - idx * 0.6}px`,
              height: `${3.5 - idx * 0.6}px`,
              opacity: isRevealed && !isZoomed ? 0.7 - idx * 0.15 : 0,
            }}
            aria-hidden="true"
          />
        ))}

        {/* Vertical Zoom Controls (+ / − / X) */}
        <div className="ww-right-controls">
          <button
            type="button"
            className="ww-ctrl-btn"
            aria-label="Zoom in"
            disabled={zoomLevel >= 2.2}
            onClick={handleZoomIn}
          >
            +
          </button>
          <button
            type="button"
            className="ww-ctrl-btn"
            aria-label="Zoom out"
            disabled={zoomLevel <= 1.0}
            onClick={handleZoomOut}
          >
            −
          </button>
          {(isZoomed || isRevealed) && (
            <button
              type="button"
              className="ww-ctrl-btn ww-ctrl-btn--reset"
              aria-label="Reset view"
              onClick={handleResetView}
              title="Reset view"
            >
              ✕
            </button>
          )}
        </div>

        {/* DOM Pins Layer */}
        <div className="ww-pins-layer">
          {/* Hub Pin: VAYA Header Logo */}
          <div
            ref={hubPinElRef}
            className="ww-hub-pin"
            title="India · Tap to explore"
            onClick={toggleIndiaReveal}
          >
            <div className="ww-hub-ripple" />
            <div className="ww-hub-ripple" />
            <div className="ww-hub-pin-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/vaya-logo-500.webp"
                alt="VAYA Hub Pin"
                className="ww-hub-logo-img"
              />
            </div>
          </div>

          {/* Destination Pins (shown only for hovered card) */}
          {DESTINATIONS.map((dest) => (
            <div
              key={dest.id}
              ref={(el) => {
                if (el) pinElsRef.current.set(dest.id, el);
              }}
              className="ww-pin"
              title={dest.name}
            >
              <div className="ww-pin-inner" />
            </div>
          ))}
        </div>

        {/* Dotted Leader Line (Only for hovered card) */}
        <svg ref={leaderSvgRef} className="ww-leader-lines" aria-hidden="true" />

        {/* Orbiting Destination Cards */}
        <div
          className="ww-cards-container"
          style={{
            opacity: isZoomed ? 0 : 1,
            pointerEvents: isZoomed ? 'none' : 'auto',
            transition: 'opacity 0.35s ease',
          }}
        >
          {cardsRef.current.map((card, i) => {
            const dest = card.dest;

            return (
              <button
                key={dest.id}
                ref={(el) => {
                  cardElsRef.current[i] = el;
                }}
                type="button"
                className={`ww-card ${hoveredDestId === dest.id ? 'ww-card--active' : ''}`}
                aria-label={`View details for ${dest.name}`}
                onMouseEnter={() => handleCardMouseEnter(card)}
                onMouseLeave={handleCardMouseLeave}
                onClick={(e) => handleCardClick(card, e)}
              >
                {/* 4:3 Aspect Ratio Photo on Top */}
                <div className="ww-card-photo-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dest.img}
                    alt={dest.name}
                    className="ww-card-photo"
                    onError={(e) => {
                      const t = e.currentTarget as HTMLImageElement;
                      if (!t.src.endsWith('.jpg')) {
                        t.src = `/wonder/cards/${dest.id}.jpg`;
                      }
                    }}
                  />
                  <div className="ww-card-chip">{dest.best}</div>
                </div>

                {/* Footer: teal pin icon, bold name, muted subtitle, 30px circular orange arrow */}
                <div className="ww-card-footer">
                  <div className="ww-card-footer-info">
                    <div className="ww-card-title-row">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="ww-card-teal-pin" aria-hidden="true">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#1E6F7A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="9" r="2.5" fill="#1E6F7A"/>
                      </svg>
                      <span className="ww-card-name">{dest.name}</span>
                    </div>
                    <span className="ww-card-subtitle">{dest.place}</span>
                  </div>

                  <div className="ww-card-arrow-circle" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 11L11 3M11 3H5.5M11 3v5.5"
                        stroke="#C4782A"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tap Tooltip Pill on Land */}
        {tapTooltip && (
          <div
            key={tapTooltip.id}
            className="ww-tap-tooltip"
            style={{ left: `${tapTooltip.x}px`, top: `${tapTooltip.y}px` }}
          >
            <span className="ww-tap-tooltip-dot" />
            <span>{tapTooltip.text}</span>
          </div>
        )}
      </div>

      {/* Bottom Bar: Hint & Dark Navy Glass CTA Pill */}
      <footer className="ww-bottom-bar">
        <div className={`ww-hint ${hasInteracted ? "ww-hint-dimmed" : ""}`.trim()}>
          {isRevealed
            ? 'Hover a card to pause & focus · Tap a card to explore · Tap India pin to close'
            : 'Drag to spin · Ctrl + scroll or +/- to zoom · Tap India pin to explore'}
        </div>

        {/* Dark Navy Glass CTA Pill */}
        <div className="ww-cta-pill">
          <div className="ww-cta-left">
            <span className="ww-cta-bar" aria-hidden="true" />
            <span className="ww-cta-label">Your wonder is</span>
            <span className="ww-accent-word ww-cta-accent">waiting</span>
          </div>

          <button type="button" className="ww-cta-btn-pill" onClick={onWaitlist}>
            <span>Join Waitlist</span>
            <span className="ww-cta-circle-arrow" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 11L11 3M11 3H5.5M11 3v5.5"
                  stroke="#0F1C33"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>
      </footer>

      {/* Detail Modal Panel */}
      {activeModal && (
        <div
          className="ww-modal-scrim"
          onClick={() => setActiveModal(null)}
          role="presentation"
        >
          <div
            className="ww-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wwModalTitle"
            onClick={(e) => e.stopPropagation()}
            style={{
              transformOrigin: modalOrigin
                ? `${modalOrigin.x}px ${modalOrigin.y}px`
                : 'center center',
            }}
          >
            <button
              type="button"
              className="ww-modal-close"
              aria-label="Close"
              onClick={() => setActiveModal(null)}
            >
              ✕
            </button>

            <div className="ww-modal-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeModal.img}
                alt={activeModal.name}
                className="ww-modal-photo"
              />
            </div>

            <div className="ww-modal-right">
              <div>
                <span className="ww-modal-tag">{activeModal.cat}</span>
                <h3 id="wwModalTitle" className="ww-modal-name">
                  {activeModal.name}
                </h3>
                <p className="ww-modal-loc">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{
                      display: 'inline',
                      marginRight: 4,
                      verticalAlign: -1,
                      color: 'var(--ww-teal)',
                    }}
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
                  </svg>
                  {activeModal.place}
                </p>

                {activeModal.best && (
                  <div className="ww-modal-best-chip">
                    <span>BEST TIME:</span>
                    <span>{activeModal.best}</span>
                  </div>
                )}

                <p className="ww-modal-desc">{activeModal.description}</p>
              </div>

              <button
                type="button"
                className="ww-modal-plan-btn"
                onClick={() => {
                  setActiveModal(null);
                  onWaitlist?.();
                }}
              >
                Plan this with Vaya ↗
              </button>
            </div>
          </div>
        </div>
      )}


    </section>
  );
}
