'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Three.js 3D Plane Component with Sunrise Lighting & Curved Flight Path
// ─────────────────────────────────────────────────────────────────────────────
export default function ThreePlaneCanvas({ progress = 0, style = {}, onReady }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    planeGroup: null,
    raf: null,
    readyReported: false,
  });

  const progRef = useRef(progress);
  progRef.current = progress;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn('[ThreePlaneCanvas] WebGL not supported', e);
      if (onReady) onReady();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / Math.max(1, canvas.clientHeight),
      0.1,
      100
    );
    camera.position.set(0, 0, 10);

    // ── Sunrise Lighting ──────────────────────────────────────────────────
    // Warm key light from upper right (sunrise side)
    const keyLight = new THREE.DirectionalLight(0xffdfb3, 2.5);
    keyLight.position.set(6, 4, 5);
    scene.add(keyLight);

    // Cool fill light from left/under
    const fillLight = new THREE.DirectionalLight(0x93bfe3, 0.9);
    fillLight.position.set(-6, -2, -2);
    scene.add(fillLight);

    // Amber rim light
    const rimLight = new THREE.DirectionalLight(0xf6a81c, 1.2);
    rimLight.position.set(2, 6, -4);
    scene.add(rimLight);

    const ambientLight = new THREE.AmbientLight(0xdceaf5, 0.7);
    scene.add(ambientLight);

    // ── Build Sleek Procedural Jetliner Model ─────────────────────────────
    const planeGroup = new THREE.Group();

    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xfdfdfd,
      roughness: 0.35,
      metalness: 0.25,
    });
    const navyMat = new THREE.MeshStandardMaterial({
      color: 0x0b2d5b,
      roughness: 0.4,
      metalness: 0.2,
    });
    const tealMat = new THREE.MeshStandardMaterial({
      color: 0x27b2c9,
      roughness: 0.3,
      metalness: 0.4,
    });

    // Fuselage (cylinder + nose cone)
    const bodyGeo = new THREE.CylinderGeometry(0.32, 0.3, 3.2, 24);
    bodyGeo.rotateZ(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, whiteMat);
    planeGroup.add(body);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.32, 0.85, 24);
    noseGeo.rotateZ(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, whiteMat);
    nose.position.set(1.9, 0, 0);
    planeGroup.add(nose);

    // Cockpit windows band
    const windowGeo = new THREE.BoxGeometry(0.25, 0.12, 0.34);
    const windowMesh = new THREE.Mesh(windowGeo, navyMat);
    windowMesh.position.set(1.7, 0.1, 0);
    planeGroup.add(windowMesh);

    // Main swept wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0.6, 0);
    wingShape.lineTo(-0.8, 3.6);
    wingShape.lineTo(-1.2, 3.5);
    wingShape.lineTo(-0.4, 0);
    wingShape.closePath();

    const wingExtrude = new THREE.ExtrudeGeometry(wingShape, { depth: 0.05, bevelEnabled: false });
    wingExtrude.rotateX(Math.PI / 2);

    const rightWing = new THREE.Mesh(wingExtrude, whiteMat);
    rightWing.position.set(0, 0, 0);
    planeGroup.add(rightWing);

    const leftWing = rightWing.clone();
    leftWing.scale.set(1, 1, -1);
    planeGroup.add(leftWing);

    // Winglet accents (teal)
    const wingletGeo = new THREE.BoxGeometry(0.18, 0.35, 0.04);
    const rw = new THREE.Mesh(wingletGeo, tealMat);
    rw.position.set(-1.0, 0.18, 3.55);
    planeGroup.add(rw);
    const lw = rw.clone();
    lw.position.set(-1.0, 0.18, -3.55);
    planeGroup.add(lw);

    // Tail fin (vertical stabilizer with VAYA navy & teal accents)
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(-0.9, 1.25);
    finShape.lineTo(-1.25, 1.2);
    finShape.lineTo(-0.8, 0);
    finShape.closePath();
    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.04, bevelEnabled: false });
    const fin = new THREE.Mesh(finGeo, navyMat);
    fin.position.set(-1.0, 0.25, -0.02);
    planeGroup.add(fin);

    // Horizontal tail wings
    const hTailGeo = new THREE.BoxGeometry(0.4, 0.03, 1.8);
    const hTail = new THREE.Mesh(hTailGeo, whiteMat);
    hTail.position.set(-1.5, 0.15, 0);
    planeGroup.add(hTail);

    // Engines under wings
    const engineGeo = new THREE.CylinderGeometry(0.14, 0.13, 0.7, 16);
    engineGeo.rotateZ(Math.PI / 2);
    const engineR = new THREE.Mesh(engineGeo, whiteMat);
    engineR.position.set(0.1, -0.22, 1.1);
    planeGroup.add(engineR);

    const engineL = engineR.clone();
    engineL.position.set(0.1, -0.22, -1.1);
    planeGroup.add(engineL);

    // Initial orientation: pointing right along X axis
    planeGroup.rotation.y = 0;
    scene.add(planeGroup);

    stateRef.current = {
      scene,
      camera,
      renderer,
      planeGroup,
      readyReported: false,
    };

    const handleResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();

    let paused = false;
    const obs = new IntersectionObserver(
      ([entry]) => { paused = !entry.isIntersecting; },
      { threshold: 0 }
    );
    obs.observe(canvas);

    // ── Animation Loop ───────────────────────────────────────────────────
    const animate = () => {
      stateRef.current.raf = requestAnimationFrame(animate);
      if (paused) return;

      const p = Math.max(0, Math.min(1, progRef.current));

      // Flight Path:
      // Start: upper-left (-4.5, 1.0, 1.5)
      // Curves gently into valley vanishing centre (0.1, -0.4, -9.0)
      const t = p;
      // Bezier-like curve in 3D
      const startX = -4.2;
      const midX   = -1.5;
      const endX   = 0.05;

      const startY = 0.9;
      const midY   = 0.4;
      const endY   = -0.42;

      const startZ = 2.0;
      const endZ   = -14.0;

      const u = 1 - t;
      const curX = u * u * startX + 2 * u * t * midX + t * t * endX;
      const curY = u * u * startY + 2 * u * t * midY + t * t * endY;
      const curZ = THREE.MathUtils.lerp(startZ, endZ, t);

      planeGroup.position.set(curX, curY, curZ);

      // Scale = 1 / (1 + depth)
      const depth = t * 6.5;
      const scaleVal = 0.65 / (1.0 + depth);
      planeGroup.scale.set(scaleVal, scaleVal, scaleVal);

      // Gentle bank and roll:
      // Nose points slightly down-right into valley, gentle roll bank
      const bank = Math.sin(t * Math.PI) * 0.18; // roll bank into turn
      const pitch = -0.06 - t * 0.08;             // slight nose down into distance
      const yaw = Math.PI * 0.04 * (1 - t);       // slight yaw toward center

      planeGroup.rotation.set(pitch, yaw, bank);

      // Fade out opacity as it approaches vanishing distance
      const fade = Math.max(0, Math.min(1, (0.88 - p) / 0.15));
      whiteMat.opacity = fade;
      whiteMat.transparent = true;
      navyMat.opacity = fade;
      navyMat.transparent = true;
      tealMat.opacity = fade;
      tealMat.transparent = true;

      renderer.render(scene, camera);

      if (!stateRef.current.readyReported) {
        stateRef.current.readyReported = true;
        canvas.dataset.threeReady = 'true';
        if (onReady) onReady();
      }
    };

    stateRef.current.raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(stateRef.current.raf);
      obs.disconnect();
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      bodyGeo.dispose();
      noseGeo.dispose();
      wingExtrude.dispose();
      finGeo.dispose();
      hTailGeo.dispose();
      engineGeo.dispose();
      whiteMat.dispose();
      navyMat.dispose();
      tealMat.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="three-plane-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 3,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
