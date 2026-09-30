"""Bundle the browser-only preview into a single HTML file: python preview/build.py"""
import base64
import json
import os
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import flight_data as fd  # noqa: E402
from app import HELP_CENTRE  # noqa: E402

here = lambda *p: os.path.join(ROOT, *p)
read = lambda *p: open(here(*p), encoding="utf-8").read()

data = {
    "airports": fd.AIRPORTS, "airlines": fd.AIRLINES, "cabins": fd.CABINS,
    "currencies": fd.CURRENCIES, "hubs": fd.HUBS, "help": HELP_CENTRE,
}
bg = "data:image/svg+xml;base64," + base64.b64encode(read("static", "img", "background.svg").encode()).decode()
parts = {
    "/*LEAFLET_CSS*/": read("static", "vendor", "leaflet", "leaflet.css"),
    "/*SITE_CSS*/": read("static", "css", "style.css"),
    "/*PREVIEW_CSS*/": read("preview", "preview.css"),
    "/*BG_URI*/": bg,
    "/*DATA*/": json.dumps(data, ensure_ascii=False),
    "/*WORLD*/": read("preview", "world.json"),
    "/*APP_JS*/": read("preview", "app.js"),
    "/*N_AIRPORTS*/": str(len(fd.AIRPORTS)),
    "/*EMAIL*/": HELP_CENTRE["email"], "/*PHONE*/": HELP_CENTRE["phone"],
    "/*PHONE_INTL*/": HELP_CENTRE["phone_intl"], "/*HOURS*/": HELP_CENTRE["hours"],
    "/*YEAR*/": str(date.today().year),
}
html = read("preview", "shell.html")
for k, v in parts.items():
    html = html.replace(k, v)
os.makedirs(here("preview", "dist"), exist_ok=True)
out = here("preview", "dist", "skyvoyage-preview.html")
open(out, "w", encoding="utf-8").write(html)
print(out, f"{len(html) / 1024:.0f} KB")
