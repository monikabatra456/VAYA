with open("scratch/meet_css_518.css", "r", encoding="utf-8") as f:
    css = f.read()

# Replace the radial-gradient .mv-seam with the original linear-gradient
old_seam = """/* ── TOP AMBIENT BACKLIGHT: Soft luminous halo behind header logo ──── */
/* Replaces the heavy peach/cream wash; leaves window and sky completely untinted */
.mv-seam {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: radial-gradient(
    ellipse 580px 120px at 10% 0%,
    rgba(255, 250, 242, 0.96) 0%,
    rgba(255, 248, 238, 0.82) 40%,
    rgba(250, 242, 230, 0.35) 70%,
    transparent 100%
  );
  z-index: 5;
  pointer-events: none;
}"""

orig_seam = """/* ── TOP SEAM: fades from Wonder World's bottom colour ─────────────── */
.mv-seam {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 160px;
  background: linear-gradient(to bottom, #f4d8b0 0%, transparent 100%);
  z-index: 5;
  pointer-events: none;
}"""

if old_seam in css:
    css = css.replace(old_seam, orig_seam)
    print("Replaced .mv-seam successfully")
else:
    print("WARNING: old_seam not found exact match")

with open("scratch/meet_css_restored.css", "w", encoding="utf-8") as out:
    out.write(css)
print("Saved scratch/meet_css_restored.css")

