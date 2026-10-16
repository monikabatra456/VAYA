// src/components/HeroScene.js
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';
import { vertexShader, fragmentShader } from './shaders';

export class HeroScene {
  constructor({ canvas, isMobile = false }) {
    this.canvas = canvas;
    this.isMobile = isMobile;

    const W = Math.round(window.innerWidth);
    const H = Math.round(window.innerHeight);
    const dpr = isMobile ? 1.25 : Math.min(1.5, window.devicePixelRatio || 1);

    this.renderer = new Renderer({
      canvas,
      width: W,
      height: H,
      dpr,
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    });

    this.gl = this.renderer.gl;

    const heroSrc = isMobile ? '/hero/mobile/hero-noplane-m.webp' : '/hero/hero-noplane.webp';
    const scene2Src = isMobile ? '/hero/mobile/scene2-m.webp' : '/hero/scene2.webp';
    const depthHeroSrc = isMobile ? '/hero/mobile/depth-hero-m.webp' : '/hero/depth-hero.webp';
    const depthScene2Src = isMobile ? '/hero/mobile/depth-scene2-m.webp' : '/hero/depth-scene2.webp';
    const mistNoiseSrc = '/hero/mist-noise.webp';

    this.tHero = this._loadTexture(heroSrc);
    this.tScene2 = this._loadTexture(scene2Src);
    this.tDepthHero = this._loadTexture(depthHeroSrc);
    this.tDepthScene2 = this._loadTexture(depthScene2Src);
    this.tMistNoise = this._loadTexture(mistNoiseSrc, true);

    const vp = isMobile ? [0.55, 0.48] : [0.62, 0.45];

    const geometry = new Triangle(this.gl);
    this.program = new Program(this.gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uImg: { value: this.tHero.tex },
        uImg2: { value: this.tScene2.tex },
        uDepth: { value: this.tDepthHero.tex },
        uDepth2: { value: this.tDepthScene2.tex },
        uMistTex: { value: this.tMistNoise.tex },
        uProgress: { value: 0 },
        uMix: { value: 0 },
        uHaze: { value: 0 },
        uTilt: { value: 0.06 },
        uZoom: { value: 1.00 },
        uTime: { value: 0 },
        uRes: { value: [W, H] },
        uImgRes: { value: isMobile ? [1080, 1920] : [2048, 1152] },
        uVP: { value: vp },
        uMistStrength: { value: isMobile ? 0.16 : 0.22 },
        uWarpScale: { value: 0.0 }, // CLOUD_WARP = false per prompt instructions (zero shimmer on rocks)
      },
      depthTest: false,
      depthWrite: false,
    });

    this.mesh = new Mesh(this.gl, { geometry, program: this.program });
  }

  _loadTexture(url, isTileable = false) {
    const tex = new Texture(this.gl, {
      generateMipmaps: true,
      minFilter: this.gl.LINEAR_MIPMAP_LINEAR,
      magFilter: this.gl.LINEAR,
      wrapS: isTileable ? this.gl.REPEAT : this.gl.CLAMP_TO_EDGE,
      wrapT: isTileable ? this.gl.REPEAT : this.gl.CLAMP_TO_EDGE,
    });

    const img = new Image();
    img.src = url;

    const promise = (
      img.decode ? img.decode().catch(() => {}) : Promise.resolve()
    ).then(() => {
      tex.image = img;
      return img;
    });

    return { tex, promise };
  }

  whenReady() {
    return Promise.all([
      this.tHero.promise,
      this.tDepthHero.promise,
      this.tMistNoise.promise,
    ]);
  }

  render({ progress = 0, mix = 0, haze = 0, tilt = 0, zoom = 1.0, time = 0 }) {
    if (!this.program || !this.renderer) return;
    this.program.uniforms.uProgress.value = progress;
    this.program.uniforms.uMix.value = mix;
    this.program.uniforms.uHaze.value = haze;
    this.program.uniforms.uTilt.value = tilt;
    this.program.uniforms.uZoom.value = zoom;
    this.program.uniforms.uTime.value = time;
    this.renderer.render({ scene: this.mesh });
  }

  resize(W, H) {
    if (!this.renderer || !this.program) return;
    const roundW = Math.round(W);
    const roundH = Math.round(H);
    this.renderer.setSize(roundW, roundH);
    this.program.uniforms.uRes.value = [roundW, roundH];
  }

  destroy() {
    this.renderer = null;
    this.program = null;
    this.mesh = null;
  }
}
