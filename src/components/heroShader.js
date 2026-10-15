// src/components/heroShader.js
export const vertexShader = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uImg;
  uniform sampler2D uImg2;
  uniform sampler2D uDepth;
  uniform sampler2D uDepth2;
  uniform sampler2D uMistTex;

  uniform float uProgress;     // 0..1 camera dolly progress
  uniform float uMix;          // 0..1 scene2 crossfade
  uniform float uTime;         // time in seconds
  uniform vec2 uRes;           // viewport resolution
  uniform vec2 uImgRes;        // image resolution
  uniform vec2 uVP;            // hero vanishing point (e.g. ~0.62, 0.45)
  uniform vec2 uVP2;           // scene2 vanishing point (e.g. ~0.57, 0.54)
  uniform float uMaxZoom;      // desktop ~1.6, mobile ~1.35
  uniform float uMistStrength; // desktop ~0.22, mobile ~0.15

  varying vec2 vUv;

  // Cover-fit UV calculation
  vec2 getCoverUv(vec2 uv, vec2 screenRes, vec2 imgRes) {
    float sAspect = screenRes.x / screenRes.y;
    float iAspect = imgRes.x / imgRes.y;
    vec2 st = uv - 0.5;
    if (sAspect > iAspect) {
      st.y *= sAspect / iAspect;
    } else {
      st.x *= iAspect / sAspect;
    }
    return st + 0.5;
  }

  void main() {
    vec2 baseUv = getCoverUv(vUv, uRes, uImgRes);

    // Blend vanishing point smoothly during crossfade
    vec2 vp = mix(uVP, uVP2, smoothstep(0.3, 0.8, uMix));

    // Sample depth maps (1 = near, 0 = far)
    float d1 = texture2D(uDepth, clamp(baseUv, 0.0, 1.0)).r;
    float d2 = texture2D(uDepth2, clamp(baseUv, 0.0, 1.0)).r;

    // ── CAMERA DOLLY (Depth Parallax):
    // uv' = vp + (uv - vp) / (1.0 + uProgress * (0.12 + 0.55 * pow(d, 1.4)))
    float dollyScale1 = 1.0 + uProgress * (0.12 + 0.55 * pow(clamp(d1, 0.0, 1.0), 1.4));
    dollyScale1 = min(dollyScale1, uMaxZoom);
    vec2 uv1 = vp + (baseUv - vp) / dollyScale1;
    // Lateral parallax
    uv1.x += (d1 - 0.5) * uProgress * 0.015;

    // Scene2 arrival feel: uMix settles zoom from 1.15 to 1.0
    float arrivalScale = mix(1.15, 1.0, uMix);
    float dollyScale2 = arrivalScale * (1.0 + max(0.0, uProgress - 0.35) * (0.10 + 0.40 * pow(clamp(d2, 0.0, 1.0), 1.4)));
    dollyScale2 = min(dollyScale2, uMaxZoom);
    vec2 uv2 = vp + (baseUv - vp) / dollyScale2;
    uv2.x += (d2 - 0.5) * uProgress * 0.012;

    // ── MIST ONLY BETWEEN MOUNTAINS (Mid-depth band mask):
    // m = smoothstep(0.25, 0.45, d) * (1.0 - smoothstep(0.62, 0.85, d))
    float dMix = mix(d1, d2, uMix);
    float m = smoothstep(0.25, 0.45, dMix) * (1.0 - smoothstep(0.62, 0.85, dMix));

    // Sample mist-noise: uv * vec2(2, 1) + vec2(uTime*0.008 + uProgress*0.3*d, 0)
    vec2 mistUv = baseUv * vec2(2.0, 1.0) + vec2(uTime * 0.008 + uProgress * 0.3 * dMix, uTime * 0.002);
    float noiseVal = texture2D(uMistTex, fract(mistUv)).r;

    // Subtle UV warp by noise (~0.003 * m) so mist flows dynamically
    vec2 warp = (vec2(noiseVal) - 0.5) * 0.006 * m;

    vec4 col1 = texture2D(uImg, clamp(uv1 + warp, 0.001, 0.999));
    vec4 col2 = texture2D(uImg2, clamp(uv2 + warp, 0.001, 0.999));

    // Crossfade hero -> scene2
    vec4 sceneCol = mix(col1, col2, uMix);

    // Screen-blend mist softly into the mountain valleys
    float luminance = dot(sceneCol.rgb, vec3(0.299, 0.587, 0.114));
    float mistIntensity = m * noiseVal * uMistStrength * smoothstep(0.2, 0.75, luminance);
    vec3 mistTint = vec3(1.0, 0.97, 0.94); // warm golden morning mist
    vec3 finalRgb = 1.0 - (1.0 - sceneCol.rgb) * (1.0 - mistTint * mistIntensity);

    gl_FragColor = vec4(finalRgb, 1.0);
  }
`;
