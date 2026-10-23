#!/usr/bin/env python3
"""
scripts/make_layers.py
─────────────────────────────────────────────────────────────────────────────
VAYA hero layer generator.

Splits Scene A and Scene B images into 4 depth-based RGBA layers each.
Output: public/hero/layers/a-0..a-3.webp  (and b-0..b-3.webp)
        Mobile variants: a-0-m..a-3-m.webp  (if --mobile)

Depth Validation:
  Aborts if the depth map is a fake vertical gradient (|correlation with Y| > 0.75
  or standard deviation along X < 32). Real depth maps required!
─────────────────────────────────────────────────────────────────────────────
"""

import argparse
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import cv2
import numpy as np
from PIL import Image

ROOT       = Path(__file__).resolve().parent.parent
OUT_DIR    = ROOT / "public" / "hero" / "layers"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FEATHER_PX = 6       # gaussian feather on each layer edge
INPAINT_R  = 7       # inpaint radius for hidden-area fill

# ── Scene definitions ────────────────────────────────────────────────────────
SCENES = {
    "a": {
        "label":   "Scene A (valley)",
        "img":     ROOT / "public" / "assets" / "valley-clear-2400.webp",
        "img_fb":  ROOT / "public" / "assets" / "scene-a-clear-1280.webp",
        "img_mob": ROOT / "public" / "assets" / "valley-clear-mobile.webp",
        "depth":   ROOT / "public" / "hero" / "bg-depth.png",
        "prefix":  "a",
        "n":       4,
        "desktop_w": 2400,
        "mobile_w":  1100,
        "desktop_q": 85,
        "mobile_q":  80,
    },
    "b": {
        "label":   "Scene B (golden-dawn lake)",
        "img":     ROOT / "public" / "hero" / "scene2.jpg",
        "img_fb":  None,
        "img_mob": None,
        "depth":   ROOT / "public" / "hero" / "scene2-depth.png",
        "prefix":  "b",
        "n":       4,
        "desktop_w": 2400,
        "mobile_w":  1100,
        "desktop_q": 85,
        "mobile_q":  80,
    },
}

# ── Depth-map Validation ─────────────────────────────────────────────────────
def validate_depth_map(depth: np.ndarray, name: str) -> bool:
    """
    Check whether depth map is a fake vertical gradient.
    Aborts if |correlation with Y coordinate| > 0.75 or std along X < 32.
    """
    h, w = depth.shape[:2]
    y_coords = np.linspace(0, 1, h, dtype=np.float32)
    y_grid = np.tile(y_coords[:, None], (1, w))

    d_flat = depth.astype(np.float32).flatten()
    y_flat = y_grid.flatten()

    corr = float(np.corrcoef(d_flat, y_flat)[0, 1])
    abs_corr = abs(corr)
    std_x = float(np.mean(np.std(depth.astype(np.float32), axis=1)))

    if abs_corr > 0.75 or std_x < 32.0:
        print(f"\n[VALIDITY CHECK FAILED] Depth map '{name}' appears to be a fake vertical gradient:")
        print(f"   Correlation with Y: {corr:.3f} (|corr|={abs_corr:.3f}, threshold: must be <= 0.75)")
        print(f"   Std along X axis:   {std_x:.2f} (threshold: must be >= 32.0)")
        print("\n--> Aborting layer generation. Depth layers require a REAL depth map.")
        print("To get a real depth map:")
        print(" 1. Go to Hugging Face: https://huggingface.co/spaces/depth-anything/Depth-Anything-V2")
        print(" 2. Upload your source image (e.g. valley-clear-2400.webp or scene2.jpg)")
        print(" 3. Download the grayscale depth map PNG")
        print(f" 4. Save to public/hero/{name}")
        print("Or run locally via transformers: pip install torch transformers")
        print("In the meantime, HERO_CONFIG.LAYER_MODE = 'single' is active (smooth single zoom).\n")
        return False

    print(f"   [depth check] PASSED for {name} (|corr|: {abs_corr:.2f}, std_x: {std_x:.1f})")
    return True

# ── Depth-map computation (Depth Anything V2) ────────────────────────────────
def compute_depth_dav2(img_path: Path) -> np.ndarray | None:
    try:
        from transformers import pipeline
        from PIL import Image as PILImage
        import torch

        print("   [depth] Running Depth Anything V2 via transformers...")
        dev = 0 if torch.cuda.is_available() else -1
        pipe = pipeline(
            "depth-estimation",
            model="depth-anything/Depth-Anything-V2-Small-hf",
            device=dev,
        )
        pil = PILImage.open(str(img_path)).convert("RGB")
        out = pipe(pil)
        raw = np.asarray(out["depth"], dtype=np.float32)
        raw = (raw - raw.min()) / (raw.max() - raw.min() + 1e-6)
        raw = 1.0 - raw
        return (raw * 255).astype(np.uint8)
    except Exception as exc:
        print(f"   [depth] Could not compute depth via transformers: {exc}")
        return None

def load_depth(depth_path: Path, img_path: Path, h: int, w: int) -> np.ndarray | None:
    if depth_path.exists():
        d = cv2.imread(str(depth_path), cv2.IMREAD_GRAYSCALE)
        if d is not None:
            resized = cv2.resize(d, (w, h), interpolation=cv2.INTER_LINEAR)
            if validate_depth_map(resized, depth_path.name):
                return resized
            return None
        print(f"   [depth] WARNING: could not read {depth_path}")

    print(f"   [depth] Real depth map not found: {depth_path.name}")
    computed = compute_depth_dav2(img_path)
    if computed is not None:
        resized = cv2.resize(computed, (w, h), interpolation=cv2.INTER_LINEAR)
        if validate_depth_map(resized, "computed_dav2"):
            cv2.imwrite(str(depth_path), resized)
            print(f"   [depth] Saved computed depth → {depth_path.name}")
            return resized
    return None

# ── Layer extraction ─────────────────────────────────────────────────────────
def make_layer(
    img_bgr: np.ndarray,
    depth:   np.ndarray,
    lo:      float,
    hi:      float,
    feather: int,
    do_inpaint: bool,
) -> np.ndarray:
    mask = ((depth >= lo * 255) & (depth < hi * 255)).astype(np.uint8) * 255

    if feather > 0:
        k = feather * 2 + 1
        mask_f = cv2.GaussianBlur(mask, (k, k), feather * 0.45)
    else:
        mask_f = mask.copy()

    rgb = img_bgr[:, :, :3].copy()
    if do_inpaint:
        inv = (mask == 0).astype(np.uint8) * 255
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        inv_d  = cv2.dilate(inv, kernel)
        rgb = cv2.inpaint(rgb, inv_d, INPAINT_R, cv2.INPAINT_TELEA)

    alpha = mask_f.astype(np.uint8)
    return np.dstack([rgb, alpha])

# ── Main processing function ──────────────────────────────────────────────────
def process_scene(key: str, mobile: bool = False) -> bool:
    cfg = SCENES[key]
    label = cfg["label"]

    img_path = cfg["img"]
    if not img_path.exists():
        if cfg.get("img_fb") and Path(cfg["img_fb"]).exists():
            img_path = Path(cfg["img_fb"])
            print(f"\n[{label}] Primary image not found; using fallback: {img_path.name}")
        else:
            print(f"\n[{label}] ERROR: image not found: {img_path}")
            return False

    if mobile:
        mob_path = cfg.get("img_mob")
        if mob_path and Path(mob_path).exists():
            img_path = Path(mob_path)

    print(f"\n{'='*60}")
    print(f"[{label}] {'mobile' if mobile else 'desktop'}")
    print(f"  Source : {img_path}")

    img_bgr = cv2.imread(str(img_path), cv2.IMREAD_COLOR)
    if img_bgr is None:
        print(f"  ERROR: cv2 could not read {img_path}")
        return False

    orig_h, orig_w = img_bgr.shape[:2]
    target_w = cfg["mobile_w"] if mobile else cfg["desktop_w"]
    target_w = min(target_w, orig_w)
    if target_w != orig_w:
        scale    = target_w / orig_w
        target_h = int(orig_h * scale)
        img_bgr  = cv2.resize(img_bgr, (target_w, target_h), interpolation=cv2.INTER_AREA)
    h, w = img_bgr.shape[:2]

    depth = load_depth(Path(cfg["depth"]), img_path, h, w)
    if depth is None:
        print(f"  Skipping layer creation for {label} due to depth validation failure.")
        return False

    n   = cfg["n"]
    bnd = [i / n for i in range(n + 1)]

    suffix = "-m" if mobile else ""
    prefix = cfg["prefix"]
    quality = cfg["mobile_q"] if mobile else cfg["desktop_q"]

    for i in range(n):
        lo, hi = bnd[i], bnd[i + 1] + (0.001 if i == n - 1 else 0)
        rgba_bgr = make_layer(img_bgr, depth, lo, hi, FEATHER_PX, do_inpaint=True)
        pil = Image.fromarray(cv2.cvtColor(rgba_bgr, cv2.COLOR_BGRA2RGBA))
        out = OUT_DIR / f"{prefix}-{i}{suffix}.webp"
        pil.save(str(out), "WEBP", quality=quality, method=4)
        size_kb = out.stat().st_size // 1024
        print(f"  Layer {i}: depth [{lo:.2f}-{hi:.2f}] -> {out.name} ({size_kb} KB)")

    return True

def main():
    ap = argparse.ArgumentParser(description="Generate VAYA hero parallax layers.")
    ap.add_argument("--scene", choices=["a", "b", "both"], default="both")
    ap.add_argument("--mobile", action="store_true")
    args = ap.parse_args()

    scenes = list(SCENES.keys()) if args.scene == "both" else [args.scene]
    ok = True
    for s in scenes:
        ok &= process_scene(s, mobile=False)
        if args.mobile:
            ok &= process_scene(s, mobile=True)
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
