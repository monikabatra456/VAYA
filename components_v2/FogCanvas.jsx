'use client';
import { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Raw WebGL Fog Shader — no external library, ~3 KB GLSL
// Two instances: layer=0 (back fog, valley) | layer=1 (front fog, drifts OVER plane)
// Rendered at 0.5× resolution, scaled up with CSS — fog softness hides aliasing.
// ─────────────────────────────────────────────────────────────────────────────

const VERT_SRC = `
attribute vec2 a_pos;
varying   vec2 v_uv;
void main(){
  v_uv        = a_pos * .5 + .5;
  gl_Position = vec4(a_pos, 0., 1.);
}`;

const FRAG_SRC = `
precision mediump float;
varying vec2  v_uv;
uniform float uTime;
uniform float uScroll;   /* 0..1 overall hero progress */
uniform float uLayer;    /* 0=back fog, 1=front fog    */
uniform vec2  uRes;

/* ── Noise helpers ─────────────────────────────────── */
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }

float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(
    mix(hash(i),           hash(i+vec2(1,0)), f.x),
    mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x),
    f.y);
}

float fbm(vec2 p){
  float v=0., a=.5;
  mat2  m=mat2(.8,.6,-.6,.8);
  for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p*2.1; a*=.5; }
  return v;
}

void main(){
  vec2 uv = v_uv;

  /* slow horizontal drift — front layer drifts faster */
  float speed  = .011 + uLayer * .017;
  vec2  drift  = vec2(uTime * speed, uTime * .006);
  vec2  noiseP = vec2(uv.x * 2.3 + drift.x, uv.y * 1.9 + drift.y);

  float n = fbm(noiseP);

  /* back fog: sits in lower valley, centred; front fog: wider horizontal band */
  float mask;
  if(uLayer < .5){
    /* back: lower 55% with soft top edge */
    mask = smoothstep(.22, .68, uv.y);
    /* pull fog toward centre horizontally */
    float ctr = 1. - abs(uv.x - .5) * 1.6;
    mask *= smoothstep(0., .5, ctr);
  } else {
    /* front: drifts in from left+right sides, heavier toward edges */
    float sides = smoothstep(.35, .0, abs(uv.x - .5));
    float vert  = smoothstep(.15, .60, uv.y);
    mask = (sides + vert * .4) * .9;
  }

  /* density climbs with scroll, front fog slightly ahead of back */
  float boost   = uLayer > .5 ? 1.25 : 1.0;
  float density  = uScroll * 1.6 * boost * mask;
  density        = clamp(density, 0., 1.);

  /* cloud shape from fbm */
  float cloud = smoothstep(.36, .66, n) * density;

  /* sun lighting: warm on right/upper side, cool on underside */
  float sunMix  = smoothstep(.25, .85, uv.x) * smoothstep(.75, .2, uv.y);
  vec3  warm    = vec3(1.00, .97, .92);  /* sun-lit */
  vec3  cool    = vec3(0.83, .89, .97);  /* shadow  */
  vec3  rimWarm = vec3(1.00, .94, .78);  /* amber rim */
  vec3  cloudCol = mix(cool, warm, sunMix * .65 + .35);
  /* narrow warm rim at sun side */
  float rim = smoothstep(.70, .90, uv.x) * smoothstep(.5, .1, uv.y);
  cloudCol  = mix(cloudCol, rimWarm, rim * .4);

  /* endgame white-out: pure #FFFFFF as scroll → 1, matching page bg */
  float whiteout  = smoothstep(.80, 1.0, uScroll);
  cloudCol        = mix(cloudCol, vec3(1.), whiteout);
  cloud           = mix(cloud,    uScroll, whiteout * .9);

  gl_FragColor = vec4(cloudCol, cloud * (1. - whiteout * .05));
}`;

function buildGL(canvas, layer) {
  const gl = canvas.getContext('webgl', {
    alpha: true, premultipliedAlpha: false, antialias: false,
  });
  if (!gl) return null;

  const mkShader = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, mkShader(gl.VERTEX_SHADER,   VERT_SRC));
  gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FRAG_SRC));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  return {
    gl,
    uTime:   gl.getUniformLocation(prog, 'uTime'),
    uScroll: gl.getUniformLocation(prog, 'uScroll'),
    uLayer:  gl.getUniformLocation(prog, 'uLayer'),
    uRes:    gl.getUniformLocation(prog, 'uRes'),
  };
}

export default function FogCanvas({ layer = 0, scrollProgress = 0, className = '', style = {} }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ ctx: null, raf: null, scroll: 0, lastFrame: 0, firstFrameDone: false });
  const scrollRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMobile = window.innerWidth < 768;
    const resFactor = isMobile ? 0.35 : 0.5;

    const setSize = () => {
      const w = Math.max(1, Math.floor(window.innerWidth  * resFactor));
      const h = Math.max(1, Math.floor(window.innerHeight * resFactor));
      canvas.width  = w;
      canvas.height = h;
      stateRef.current.ctx?.gl.viewport(0, 0, w, h);
    };
    setSize();
    window.addEventListener('resize', setSize, { passive: true });

    const ctx = buildGL(canvas, layer);
    stateRef.current.ctx = ctx;

    if (!ctx) {
      canvas.style.display = 'none';
      canvas.dataset.fogReady = 'true';
      return;
    }

    const FRAME_MS = 1000 / 30; // cap at 30 fps
    let paused = false;

    const draw = (now) => {
      stateRef.current.raf = requestAnimationFrame(draw);
      if (paused) return;
      if (now - stateRef.current.lastFrame < FRAME_MS) return;
      stateRef.current.lastFrame = now;

      const { gl, uTime, uScroll, uLayer, uRes } = ctx;
      const w = canvas.width, h = canvas.height;
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime,   now * 0.001);
      gl.uniform1f(uScroll, scrollRef.current);
      gl.uniform1f(uLayer,  layer);
      gl.uniform2f(uRes,    w, h);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (!stateRef.current.firstFrameDone) {
        stateRef.current.firstFrameDone = true;
        canvas.dataset.fogReady = 'true';
      }
    };

    stateRef.current.raf = requestAnimationFrame(draw);

    const obs = new IntersectionObserver(
      ([e]) => { paused = !e.isIntersecting; },
      { threshold: 0 }
    );
    obs.observe(canvas);

    return () => {
      cancelAnimationFrame(stateRef.current.raf);
      obs.disconnect();
      window.removeEventListener('resize', setSize);
    };
  }, [layer]);

  useEffect(() => { scrollRef.current = scrollProgress; }, [scrollProgress]);

  return (
    <canvas
      ref={canvasRef}
      className={`fog-canvas ${className}`}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        imageRendering: 'auto',
        pointerEvents: 'none',
        willChange: 'contents',
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
