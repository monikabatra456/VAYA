// src/components/shaders.js
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

  uniform float uProgress;     // 0..1 scroll progress
  uniform float uMix;          // 0..1 scene2 crossfade across 0.50 - 0.72
  uniform float uHaze;         // 0..0.14..0 peak 0.14 at p=0.60
  uniform float uTilt;         // scene2 tilt pan translateY (+0.06 -> 0.0)
  uniform float uZoom;         // camera zoom from motion table (1.00 -> 1.22)
  uniform float uTime;         // time in seconds
  uniform vec2 uRes;           // integer device pixels
  uniform vec2 uImgRes;        // image resolution
  uniform vec2 uVP;            // vanishing point (~0.62, 0.45)
  uniform float uMistStrength; // desktop ~0.22, mobile ~0.16
  uniform float uWarpScale;    // desktop 0.003, mobile 0.002

  varying vec2 vUv;

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

    // 1. Depth maps: 1 = near (white), 0 = far (black)
    float d1 = texture2D(uDepth, clamp(baseUv, 0.0, 1.0)).r;
    float d2 = texture2D(uDepth2, clamp(baseUv, 0.0, 1.0)).r;

    // 2. Exact Depth Parallax Push:
    // uv' = vp + (uv - vp) / (zoom(p) * (1.0 + 0.30 * pow(d, 1.4) * smoothstep(0.0, 0.7, p)))
    float pStep = smoothstep(0.0, 0.70, uProgress);
    float pushScale1 = uZoom * (1.0 + 0.30 * pow(clamp(d1, 0.0, 1.0), 1.4) * pStep);
    vec2 uv1 = uVP + (baseUv - uVP) / pushScale1;

    // 3. Scene 2 (Lake valley): settles from 1.10x to 1.00x, tilt up from bottom
    float s2Scale = mix(1.10, 1.00, uMix);
    float pushScale2 = (1.0 + max(0.0, uProgress - 0.45) * 0.15) * s2Scale;
    vec2 uv2 = uVP + (baseUv - uVP) / pushScale2;
    uv2.y += uTilt;

    // Sample initial colors for cloud mask calculation
    vec4 rawCol1 = texture2D(uImg, clamp(uv1, 0.001, 0.999));
    vec4 rawCol2 = texture2D(uImg2, clamp(uv2, 0.001, 0.999));

    // 4. Exact Cloud Mask:
    // cloudMask = smoothstep(0.62, 0.85, luma) * (1.0 - smoothstep(0.12, 0.30, saturation))
    float luma1 = dot(rawCol1.rgb, vec3(0.299, 0.587, 0.114));
    float maxC1 = max(rawCol1.r, max(rawCol1.g, rawCol1.b));
    float minC1 = min(rawCol1.r, min(rawCol1.g, rawCol1.b));
    float sat1 = (maxC1 - minC1) / (maxC1 + 0.001);
    float cloudMask = smoothstep(0.62, 0.85, luma1) * (1.0 - smoothstep(0.12, 0.30, sat1));

    // Smooth low-frequency displacement (mist-noise 512 tile, scale ~1.2, max amplitude 0.003)
    vec2 noiseCoord = uv1 * 1.2 + vec2(uTime * 0.004, 0.0);
    float dispNoise = texture2D(uMistTex, fract(noiseCoord)).r;
    vec2 uv1Displaced = uv1;
    // Apply displacement strictly inside cloudMask
    uv1Displaced += (dispNoise - 0.5) * uWarpScale * cloudMask;
    // Horizontal drift for clouds: (uTime*0.003 + p*0.20) * d
    uv1Displaced.x += (uTime * 0.003 + uProgress * 0.18) * d1 * cloudMask;

    vec4 col1 = texture2D(uImg, clamp(uv1Displaced, 0.001, 0.999));
    vec4 col2 = texture2D(uImg2, clamp(uv2, 0.001, 0.999));

    // 5. Mid-depth Mist Band (mountains ke beech, near depth d > 0.85 mein nahi):
    // mask m = smoothstep(0.25, 0.45, d) * (1.0 - smoothstep(0.62, 0.85, d))
    float dMix = mix(d1, d2, uMix);
    float m = smoothstep(0.25, 0.45, dMix) * (1.0 - smoothstep(0.62, 0.85, dMix));

    vec2 mistUv = baseUv * vec2(1.6, 1.0) + vec2(uTime * 0.006 + uProgress * 0.35 * dMix, 0.0);
    float mistVal = texture2D(uMistTex, fract(mistUv)).r;

    // Crossfade hero -> scene2 across uMix
    vec3 sceneRgb = mix(col1.rgb, col2.rgb, uMix);

    // Screen-blend: max ~ uMistStrength (0.22 desktop, 0.16 mobile)
    // Only in bright valley atmosphere / sky gap, keeping rocky mountains 100% static (zero shimmer)
    float sceneLuma = dot(sceneRgb, vec3(0.299, 0.587, 0.114));
    float mistFactor = m * mistVal * uMistStrength * smoothstep(0.55, 0.82, sceneLuma);
    vec3 mistColor = vec3(0.98, 0.97, 0.94);
    vec3 withMist = 1.0 - (1.0 - sceneRgb) * (1.0 - mistColor * mistFactor);

    // 6. Exact Haze Formula (mix(col, vec3(0.96, 0.95, 0.92), uHaze), peak 0.14, never exceeds 0.14)
    vec3 hazeColor = vec3(0.96, 0.95, 0.92);
    vec3 finalRgb = mix(withMist, hazeColor, uHaze);

    gl_FragColor = vec4(finalRgb, 1.0);
  }
`;
