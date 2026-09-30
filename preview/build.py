"""Bundle the browser-only preview into a single HTML file: python preview/build.py

Photos: any files in static/img/photos/<key>.jpg are resized and embedded so the
preview shows them. Keys without a local photo show their colour wash instead
(preview pages cannot load images from other websites).
"""
import base64
import json
import os
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import flight_data as fd  # noqa: E402
import ui_assets as ui  # noqa: E402
from app import DESTINATIONS, HELP_CENTRE, POPULAR_ROUTES  # noqa: E402

here = lambda *p: os.path.join(ROOT, *p)
read = lambda *p: open(here(*p), encoding="utf-8").read()


def embedded_photo(key, width):
    """data: URI for a local photo (resized with Pillow when available), else None."""
    for ext in ("jpg", "jpeg", "webp", "png"):
        path = here("static", "img", "photos", f"{key}.{ext}")
        if os.path.exists(path):
            try:
                from io import BytesIO
                from PIL import Image
                img = Image.open(path).convert("RGB")
                img.thumbnail((width, width))
                buf = BytesIO()
                img.save(buf, "JPEG", quality=72, optimize=True, progressive=True)
                data = buf.getvalue()
            except ImportError:
                data = open(path, "rb").read()
            return "data:image/jpeg;base64," + base64.b64encode(data).decode()
    return None


keys = set(ui.PHOTOS) | {"hero"}  # includes the background scenes
photos = {}
for key in keys:
    uri = embedded_photo(key, 1800 if key in ("hero", "beach", "india") or key.startswith("bg-") else 900)
    wash = ui.FALLBACK.get(key, ui.FALLBACK["hero"])
    photos[key] = f"url('{uri}'), {wash}" if uri else wash

data = {
    "airports": fd.AIRPORTS, "airlines": fd.AIRLINES, "cabins": fd.CABINS,
    "currencies": fd.CURRENCIES, "hubs": fd.HUBS, "help": HELP_CENTRE,
    "icons": ui.ICONS, "photos": photos,
    "airport_photo": {c: ui.airport_photo_key(c, fd.AIRPORTS) for c in fd.AIRPORTS}, "destinations": DESTINATIONS, "popular": POPULAR_ROUTES,
}
parts = {
    "/*LEAFLET_CSS*/": read("static", "vendor", "leaflet", "leaflet.css"),
    "/*SITE_CSS*/": read("static", "css", "style.css"),
    "/*PREVIEW_CSS*/": read("preview", "preview.css"),
    "/*BG_SCENES*/": "".join(
        f'<div class="bg-photo" style="background-image: {photos[k]}{"; opacity: 1" if i == 0 else ""}"></div>'
        for i, k in enumerate(ui.BACKGROUND_SCENES)),
    "/*DATA*/": json.dumps(data, ensure_ascii=False),
    "/*WORLD*/": read("preview", "world.json"),
    "/*APP_JS*/": read("preview", "engine.js") + read("preview", "views.js"),
    "/*N_AIRPORTS*/": str(len(fd.AIRPORTS)),
    "/*EMAIL*/": HELP_CENTRE["email"], "/*PHONE*/": HELP_CENTRE["phone"], "/*HOURS*/": HELP_CENTRE["hours"],
    "/*YEAR*/": str(date.today().year),
}
for name in ("plane", "menu", "sun", "moon", "mail", "phone", "clock"):
    size = 18 if name in ("mail", "phone", "clock") else 20
    parts[f"/*ICON_{name.upper()}*/"] = str(ui.icon(name, size=size))
html = read("preview", "shell.html")
for k, v in parts.items():
    html = html.replace(k, v)
os.makedirs(here("preview", "dist"), exist_ok=True)
out = here("preview", "dist", "skyvoyage-preview.html")
open(out, "w", encoding="utf-8").write(html)
print(out, f"{len(html) / 1024:.0f} KB")
