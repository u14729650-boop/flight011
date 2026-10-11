"""Procedural art-direction backdrops for HOMIES CHOICE (silk drapes, dial textures).

Abstract textures in the brand palette, used until real campaign photography is
supplied. They never depict a product. Usage:
    python3 brand/art/generate.py public/images/editorial
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

OUT = sys.argv[1] if len(sys.argv) > 1 else "."


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255


def ramp(t, stops):
    """Piecewise-linear colour ramp; stops = [(pos, '#hex'), ...]."""
    t = np.clip(t, 0, 1)
    out = np.zeros(t.shape + (3,), np.float32)
    for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
        m = (t >= p0) & (t <= p1)
        f = ((t - p0) / max(p1 - p0, 1e-6))[..., None]
        out[m] = (hexrgb(c0) * (1 - f) + hexrgb(c1) * f)[m]
    return out


def silk(w, h, stops, seed=1, folds=1.65, angle=0.6, spec=0.55, spec_col="#f3dfae", warp=0.9, light=(-0.5, -0.6, 0.62), vignette=0.45):
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    s = max(w, h)
    u, v = x / s, y / s
    # domain warp for soft, organic folds
    wu = u + warp * 0.08 * np.sin(2 * np.pi * (1.3 * v + rng.random())) + warp * 0.04 * np.sin(2 * np.pi * (3.1 * u + 2.2 * v + rng.random()))
    wv = v + warp * 0.08 * np.sin(2 * np.pi * (1.1 * u + rng.random()))
    ca, sa = np.cos(angle), np.sin(angle)
    a = wu * ca + wv * sa
    b = -wu * sa + wv * ca
    hgt = np.zeros_like(u)
    for i in range(3):
        f = folds * (1 + i * 1.3) * (0.8 + 0.4 * rng.random())
        amp = 1 / (1 + i * 2.8)
        hgt += amp * np.sin(2 * np.pi * (f * a + 0.35 * np.sin(2 * np.pi * (0.7 + i) * b + rng.random() * 6)) + rng.random() * 6)
    hgt = (hgt - hgt.min()) / (hgt.max() - hgt.min())
    gy, gx = np.gradient(hgt * 34)
    n = np.dstack([-gx, -gy, np.ones_like(gx)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    L = np.array(light, np.float32); L /= np.linalg.norm(L)
    diff = np.clip((n * L).sum(2), 0, 1)
    H = L + np.array([0, 0, 1], np.float32); H /= np.linalg.norm(H)
    sp = np.clip((n * H).sum(2), 0, 1) ** 70
    base = ramp(0.15 + 0.85 * diff * (0.55 + 0.45 * hgt), stops)
    img = base + spec * sp[..., None] * hexrgb(spec_col)
    # vignette and soft light pool
    cx, cy = 0.62, 0.38
    d = np.sqrt(((x / w - cx) * 1.2) ** 2 + (y / h - cy) ** 2)
    img *= (1 - vignette * np.clip(d, 0, 1) ** 1.6)[..., None]
    return finish(img)


def dial(w, h, stops, rays=180, cx=0.72, cy=0.5, spec_col="#e9d3a2", rings=True, rs=1.0):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    s = max(w, h)
    dx, dy = (x - cx * w) / s, (y - cy * h) / s
    r = np.sqrt(dx ** 2 + dy ** 2)
    th = np.arctan2(dy, dx)
    rng = np.random.default_rng(7)
    # sunburst: fine radial brushing with angular sheen
    brush = 0.5 + 0.5 * np.sin(th * rays + 0.6 * np.sin(th * 7))
    fine = rng.normal(0, 1, (h, w)).astype(np.float32)
    fine = np.array(Image.fromarray(((fine - fine.min()) / (np.ptp(fine)) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255
    sheen = (0.5 + 0.5 * np.cos(2 * (th - 0.9))) ** 3
    t = 0.18 + 0.55 * sheen * (0.82 + 0.18 * brush) + 0.06 * (fine - 0.5)
    t *= 1 - 0.35 * np.clip(r * 1.4, 0, 1)
    img = ramp(t, stops)
    if rings:
        # chapter ring + a few fine concentric tracks in gold
        for rr, wdt, a in [(0.36 * rs, 0.0016, 0.55), (0.385 * rs, 0.0009, 0.35), (0.50 * rs, 0.0012, 0.25)]:
            ring = np.exp(-((r - rr) / wdt) ** 2)
            img += a * ring[..., None] * hexrgb(spec_col)
        # minute track ticks
        ticks = (np.cos(th * 60) > 0.985) & (r > 0.395 * rs) & (r < 0.43 * rs)
        img[ticks] = img[ticks] * 0.3 + hexrgb(spec_col) * 0.7
    return finish(img)


def finish(img):
    img = np.clip(img, 0, 1)
    # film grain
    g = np.random.default_rng(3).normal(0, 0.012, img.shape[:2]).astype(np.float32)
    img = np.clip(img + g[..., None], 0, 1)
    return Image.fromarray((img * 255).astype(np.uint8))


EMERALD = [(0, "#010f0b"), (0.35, "#04281f"), (0.7, "#0b5140"), (0.92, "#2f7d63"), (1, "#86b9a2")]
FOREST = [(0, "#010806"), (0.4, "#03211a"), (0.75, "#0a3d31"), (1, "#3c7a66")]
IVORY = [(0, "#b9a98c"), (0.35, "#d9ccb4"), (0.7, "#efe7d8"), (1, "#fffdf8")]
BEIGE = [(0, "#8f7656"), (0.35, "#c3ab86"), (0.7, "#e2d2b5"), (1, "#fbf3e3")]
AMBER = [(0, "#2a1407"), (0.35, "#6b3a15"), (0.7, "#b8783a"), (1, "#f2c98a")]
CARAMEL = [(0, "#4a2f1b"), (0.4, "#a07450"), (0.75, "#d8b68e"), (1, "#f8e9d2")]
CHARCOAL = [(0, "#070807"), (0.4, "#1b1d19"), (0.75, "#3a3d36"), (1, "#8d8f86")]
AQUA = [(0, "#6f8f8a"), (0.35, "#a9c3bd"), (0.7, "#dbe8e3"), (1, "#fbfffd")]
DIAL = [(0, "#060706"), (0.35, "#151714"), (0.65, "#33362f"), (0.9, "#6e6a5c"), (1, "#b6a780")]

def hero_mobile(w=1080, h=1920):
    """Portrait hero for phones: emerald satin, a gold boutique arch and the HC monogram in the upper third."""
    from PIL import ImageDraw
    base = silk(w, h, EMERALD, seed=4, folds=1.5, angle=1.1, spec=0.6, vignette=0.35).convert("RGBA")
    cx, cy = w // 2, int(h * 0.345)
    # soft spotlight behind the monogram
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((x - cx) / (w * 0.42)) ** 2 + ((y - cy) / (h * 0.2)) ** 2)
    glow = np.clip(1 - d, 0, 1) ** 2
    light = np.zeros((h, w, 4), np.float32)
    light[..., :3] = hexrgb("#d5b477") * 255
    light[..., 3] = glow * 70
    base.alpha_composite(Image.fromarray(light.astype(np.uint8), "RGBA"))
    # arch outline (drawn at 2x for smooth edges)
    S = 2
    lay = Image.new("RGBA", (w * S, h * S), (0, 0, 0, 0))
    dr = ImageDraw.Draw(lay)
    aw, ah = int(w * 0.6), int(h * 0.42)
    left, top = cx - aw // 2, cy - int(ah * 0.52)
    for inset, alpha, width in [(0, 150, 3), (int(w * 0.022), 70, 2)]:
        l, t, r_ = (left + inset) * S, (top + inset) * S, (left + aw - inset) * S
        b = (top + ah - inset) * S
        radius = (r_ - l) // 2
        dr.arc([l, t, r_, t + 2 * radius], 180, 360, fill=(213, 180, 119, alpha), width=width * S)
        dr.line([l, t + radius, l, b], fill=(213, 180, 119, alpha), width=width * S)
        dr.line([r_, t + radius, r_, b], fill=(213, 180, 119, alpha), width=width * S)
    # fade the arch's legs out towards the text area
    fade = np.clip((np.arange(h * S, dtype=np.float32) / S - (cy + ah * 0.05)) / (ah * 0.35), 0, 1)
    a = np.asarray(lay.getchannel("A"), np.float32) * (1 - fade)[:, None]
    lay.putalpha(Image.fromarray(a.astype(np.uint8)))
    base.alpha_composite(lay.resize((w, h), Image.LANCZOS))
    # monogram with a soft drop shadow
    mono = Image.open("public/images/brand/hc-monogram.png").convert("RGBA")
    mh = int(h * 0.19)
    mono = mono.resize((int(mono.width * mh / mono.height), mh), Image.LANCZOS)
    # drop near-invisible cut-out residue so neither the logo nor its shadow shows a box
    mono.putalpha(mono.getchannel("A").point(lambda a: 0 if a < 24 else a))
    shadow = Image.new("RGBA", mono.size, (0, 0, 0, 0))
    shadow.putalpha(mono.getchannel("A").point(lambda a: int(a * 0.32) if a > 90 else 0))
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    mx, my = cx - mono.width // 2, cy - mh // 2 + int(h * 0.02)
    base.alpha_composite(shadow, (mx, my + 10))
    base.alpha_composite(mono, (mx, my))
    return base.convert("RGB")


jobs = {
    "hero-mobile.jpg": hero_mobile,
    "hero.jpg": lambda: silk(1200, 1600, EMERALD, seed=4, folds=1.21, angle=0.9, spec=0.65),
    "discovery.jpg": lambda: silk(1400, 1680, BEIGE, seed=11, folds=1.32, angle=-0.5, spec=0.25, spec_col="#ffffff", vignette=0.25),
    "collection-designer.jpg": lambda: silk(1000, 1400, CHARCOAL, seed=21, folds=1.43, angle=0.4, spec=0.45, spec_col="#e7d6b0"),
    "collection-arabic.jpg": lambda: silk(1000, 1400, AMBER, seed=22, folds=1.10, angle=-0.7, spec=0.5),
    "collection-men.jpg": lambda: silk(1000, 1400, FOREST, seed=23, folds=1.54, angle=1.1, spec=0.45),
    "collection-women.jpg": lambda: silk(1000, 1400, IVORY, seed=24, folds=1.21, angle=-0.2, spec=0.3, spec_col="#ffffff", vignette=0.22),
    "mood-fresh-aquatic.jpg": lambda: silk(1400, 1050, AQUA, seed=31, folds=1.76, angle=0.2, spec=0.35, spec_col="#ffffff", vignette=0.2),
    "mood-warm-spicy.jpg": lambda: silk(1400, 1050, AMBER, seed=32, folds=1.32, angle=0.8, spec=0.5),
    "mood-woody-smoky.jpg": lambda: silk(1400, 1050, CHARCOAL, seed=33, folds=0.99, angle=-0.9, spec=0.35),
    "mood-sweet-gourmand.jpg": lambda: silk(1400, 1050, CARAMEL, seed=34, folds=1.43, angle=0.5, spec=0.35, spec_col="#fff3dc", vignette=0.3),
    "mood-elegant-sophisticated.jpg": lambda: silk(1400, 1050, EMERALD, seed=35, folds=1.21, angle=-0.4, spec=0.55),
    "mood-bold-intense.jpg": lambda: silk(1400, 1050, FOREST, seed=36, folds=1.65, angle=1.3, spec=0.7),
    "watches.jpg": lambda: dial(2400, 1200, DIAL, cx=0.8, cy=0.52, rs=0.5),
    "watches-tile.jpg": lambda: dial(1400, 1200, DIAL, cx=0.42, cy=0.52),
}

for name, fn in jobs.items():
    fn().save(f"{OUT}/{name}", quality=84, optimize=True, progressive=True)
    print("wrote", name)
