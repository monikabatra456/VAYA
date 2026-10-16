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

  uniform float uProgress;     // 0..1 scroll camera progress
  uniform float uMix;          // 0..1 scene2 crossfade
  uniform float uTilt;         // translateY pan for scene2 (+0.06 -> 0.0)
  uniform float uHaze;         // 0..0.5..0 haze intensity across 0.40 - 0.75
  uniform float uTime;         // time in seconds
  uniform vec2 uRes;           // canvas resolution in integer device pixels
  uniform vec2 uImgRes;        // image resolution
  uniform vec2 uVP;            // valley vanishing point (~0.62, 0.45)
  uniform float uMistStrength; // desktop ~0.25, mobile ~0.18

  varying vec2 vUv;

  // Cover-fit UV mapping
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

    // 1. Depth sampling (1 = near, 0 = far)
    float d1 = texture2D(uDepth, clamp(baseUv, 0.0, 1.0)).r;
    float d2 = texture2D(uDepth2, clamp(baseUv, 0.0, 1.0)).r;

    // 2. CAMERA PUSH (subtle, 3-4% feel, max effective zoom ~1.12, NO shimmer)
    // uv' = vp + (uv - vp) / (1.0 + uProgress * (0.02 + 0.10 * pow(d, 1.4)))
    float dollyScale1 = 1.0 + uProgress * (0.02 + 0.10 * pow(clamp(d1, 0.0, 1.0), 1.4));
    dollyScale1 = min(dollyScale1, 1.12);
    vec2 uv1 = uVP + (baseUv - uVP) / dollyScale1;

    // 3. SCENE2: 1.12x scale and uTilt pans from bottom to top (translateY +0.06 -> 0)
    float dollyScale2 = 1.0 + max(0.0, uProgress - 0.35) * (0.02 + 0.10 * pow(clamp(d2, 0.0, 1.0), 1.4));
    dollyScale2 = min(dollyScale2, 1.12);
    vec2 uv2 = uVP + (baseUv - uVP) / dollyScale2;
    // Movie camera tilt up
    uv2.y += uTilt;

    // 4. Sample image colors - STRICTLY NO UV warp / displacement, NO high-frequency noise
    vec4 col1 = texture2D(uImg, clamp(uv1, 0.001, 0.999));
    vec4 col2 = texture2D(uImg2, clamp(uv2, 0.001, 0.999));

    // 5. CLOUDS / MIST (strictly between mountains):
    // Mid-depth mask: m = smoothstep(0.25, 0.45, d) * (1.0 - smoothstep(0.62, 0.85, d))
    float dMix = mix(d1, d2, uMix);
    float m = smoothstep(0.25, 0.45, dMix) * (1.0 - smoothstep(0.62, 0.85, dMix));

    // Slow left->right drift: uv * vec2(1.6, 1) + vec2(uTime*0.006 + uProgress*0.35*d, 0)
    vec2 mistUv = baseUv * vec2(1.6, 1.0) + vec2(uTime * 0.006 + uProgress * 0.35 * dMix, 0.0);
    float mistNoise = texture2D(uMistTex, fract(mistUv)).r;

    // Crossfade hero -> scene2
    vec3 sceneRgb = mix(col1.rgb, col2.rgb, uMix);

    // Soft screen-blend only in bright regions, max ~ uMistStrength
    float luma = dot(sceneRgb, vec3(0.299, 0.587, 0.114));
    float mistFactor = m * mistNoise * uMistStrength * smoothstep(0.25, 0.75, luma);
    vec3 mistTint = vec3(0.98, 0.97, 0.95);
    vec3 withMist = 1.0 - (1.0 - sceneRgb) * (1.0 - mistTint * mistFactor);

    // 6. HAZE FADE across progress 0.40 - 0.75: mix(col, vec3(0.96, 0.95, 0.92), uHaze)
    vec3 hazeColor = vec3(0.96, 0.95, 0.92);
    vec3 finalColor = mix(withMist, hazeColor, uHaze);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
