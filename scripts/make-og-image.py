"""
Rebuild public/og-image.png as a proper 1200x630 social preview.

The old file was 640x630 square while the meta tags declared 1200x630, so
WhatsApp/Facebook letterboxed it — hence the dead navy bands top and bottom
in the shared screenshot, and the soft/blurry text (640px upscaled to the
~1200px WhatsApp renders at).
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
FONT = "/usr/share/fonts/truetype/liberation/LiberationSans-{}.ttf"
f_bold = lambda s: ImageFont.truetype(FONT.format("Bold"), s)
f_reg = lambda s: ImageFont.truetype(FONT.format("Regular"), s)
# Liberation Sans has no U+20B9 (₹) — it renders as a tofu box. DejaVu does,
# so the rupee glyph alone is drawn from DejaVu and the digits stay Liberation
# to keep the stat numbers visually consistent with each other.
f_rupee = lambda s: ImageFont.truetype(
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", s)

# ── Background: deep indigo → blue diagonal, brand-matched ──────────────
base = Image.new("RGB", (W, H), (23, 21, 71))
d = ImageDraw.Draw(base)
TOP_L, BOT_R = (26, 23, 84), (16, 34, 92)
for y in range(H):
    for_x = y / H
    d.line([(0, y), (W, y)],
           fill=tuple(int(TOP_L[i] + (BOT_R[i] - TOP_L[i]) * for_x) for i in range(3)))

# Soft accent glow behind the phone so it doesn't float on flat colour
glow = Image.new("RGB", (W, H), (0, 0, 0))
gd = ImageDraw.Draw(glow)
for r in range(360, 0, -5):
    v = 1 - r / 360
    gd.ellipse([950 - r, 315 - r, 950 + r, 315 + r],
               fill=(int(34 * v), int(30 * v), int(96 * v)))
base = Image.blend(base, glow, 0.55)
d = ImageDraw.Draw(base)

# ── Phone mockup (cropped out of its grey screenshot background) ────────
shot = Image.open("public/screenshot-dashboard.png").convert("RGB")
phone = shot.crop((164, 26, 476, 606))          # bounds detected from pixels
target_h = 566
phone = phone.resize((int(phone.width * target_h / phone.height), target_h),
                     Image.LANCZOS)
px, py = 830, (H - target_h) // 2

# rounded-corner mask so the crop edge isn't a hard rectangle
mask = Image.new("L", phone.size, 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, phone.width - 1, phone.height - 1],
                                       radius=22, fill=255)
base.paste(phone, (px, py), mask)

# ── Left copy block ────────────────────────────────────────────────────
X = 78
d.text((X, 118), "LeadFlow CRM", font=f_bold(78), fill=(255, 255, 255))

d.text((X, 222), "Facebook leads → aapki poori team ko,",
       font=f_reg(33), fill=(186, 196, 240))
d.text((X, 266), "automatically distribute", font=f_reg(33), fill=(186, 196, 240))

# accent underline
d.rounded_rectangle([X, 330, X + 96, 337], radius=4, fill=(96, 132, 255))

# ── Stats row ──────────────────────────────────────────────────────────
stats = [("500+", "Active Agents"), ("50K+", "Leads Delivered"), ("11", "Per Lead")]
BIG, SML = f_bold(50), f_reg(21)
sx = X
for i, (big, small) in enumerate(stats):
    bw = d.textlength(big, font=BIG)
    if small == "Per Lead":                      # prefix the rupee glyph
        d.text((sx, 380), "₹", font=f_rupee(46), fill=(255, 255, 255))
        rw = d.textlength("₹", font=f_rupee(46))
        d.text((sx + rw + 2, 382), big, font=BIG, fill=(255, 255, 255))
        bw += rw + 2
    else:
        d.text((sx, 382), big, font=BIG, fill=(255, 255, 255))
    d.text((sx, 442), small, font=SML, fill=(160, 172, 220))
    sx += max(bw, d.textlength(small, font=SML)) + 56
    if i < len(stats) - 1:
        d.line([(sx - 34, 388), (sx - 34, 462)], fill=(70, 78, 140), width=2)

# ── Footer URL ─────────────────────────────────────────────────────────
d.text((X, 520), "www.leadflowcrm.in", font=f_bold(27), fill=(120, 152, 255))

base.save("public/og-image.png", "PNG", optimize=True)
print("written 1200x630 ->", base.size)
