"""Line icons and photography used across the site.

Icons are 24x24 stroke icons (Lucide style). Photos come from Unsplash (free for
commercial use under the Unsplash License). To use your own photo, save it as
static/img/photos/<key>.jpg (for example static/img/photos/DXB.jpg) and it is used
instead of the online one.
"""

import os

from markupsafe import Markup

ICONS = {
    "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    "plane": '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    "takeoff": '<path d="M2 22h20"/><path d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.41 2.41 0 0 1 1.73-.17L21 7a1.4 1.4 0 0 1 .87 1.99l-.38.76c-.23.46-.6.84-1.07 1.08L7.58 17.2a2 2 0 0 1-1.22.18Z"/>',
    "landing": '<path d="M2 22h20"/><path d="M3.77 10.77 2 9l2-4.5 1.1.55c.55.28.9.84.9 1.45s.35 1.17.9 1.45L8 8.5l3-6 1.05.53a2 2 0 0 1 1.09 1.52l.72 5.4a2 2 0 0 0 1.09 1.52l4.4 2.2c.42.22.78.55 1.01.96l.6 1.03c.49.88-.06 1.98-1.06 2.1l-1.18.15c-.47.06-.95-.02-1.37-.24L4.29 11.15a2 2 0 0 1-.52-.38Z"/>',
    "calendar": '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    "user": '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    "swap": '<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>',
    "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "headset": '<path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/><path d="M21 16v2a4 4 0 0 1-4 4h-5"/>',
    "tag": '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1"/>',
    "pin": '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    "globe": '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
    "mail": '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    "chat": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    "luggage": '<path d="M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2"/><path d="M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14M10 20h4"/><circle cx="16" cy="20" r="2"/><circle cx="8" cy="20" r="2"/>',
    "wifi": '<path d="M12 20h.01M2 8.82a15 15 0 0 1 20 0M5 12.859a10 10 0 0 1 14 0M8.5 16.429a5 5 0 0 1 7 0"/>',
    "meal": '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    "check": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    "alert": '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    "arrow": '<path d="M5 12h14M12 5l7 7-7 7"/>',
    "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    "moon": '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    "menu": '<path d="M4 6h16M4 12h16M4 18h16"/>',
    "x": '<path d="M18 6 6 18M6 6l12 12"/>',
    "ticket": '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
    "card": '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
    "seat": '<path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M5 18v2M19 18v2"/>',
    "trend": '<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
    "lock": '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    "eye": '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    "sliders": '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4"/>',
    "award": '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    "logout": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    "history": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    "refund": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    "print": '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    "copy": '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    "star": '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    "briefcase": '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    "send": '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
}


def icon(name, cls="", size=20):
    """Inline SVG icon for templates: {{ icon('search') }}"""
    return Markup(
        f'<svg class="i {cls}" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        f'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>'
    )


# Unsplash photo ids (https://unsplash.com/license). Keys are airport codes or page slots.
PHOTOS = {
    "hero": "1436491865332-7a61a109cc05",      # view over an aircraft wing above the clouds
    "DXB": "1512453979798-5ea266f8880c",       # Dubai skyline
    "CDG": "1502602898657-3e91760cbb34",       # Paris, Eiffel Tower
    "LHR": "1513635269975-59663e0ac1ad",       # London, Westminster
    "NRT": "1540959733332-eab4deabeeaf",       # Tokyo at night
    "JFK": "1496442226666-8d4d0e62e6e9",       # New York skyline
    "SYD": "1506973035872-a4ec16b8e8d9",       # Sydney Opera House
    "MLE": "1514282401047-d79a71a590e8",       # Maldives water villas
    "SIN": "1525625293386-3f8f99389edd",       # Singapore, Marina Bay
    "FCO": "1552832230-c0197dd311b5",          # Rome, Colosseum
    "IST": "1524231757912-21f4fe3a7200",       # Istanbul skyline
    "BKK": "1508009603885-50cf7c579365",       # Bangkok temple
    "india": "1524492412937-b28074a5d7da",     # Taj Mahal
    "beach": "1507525428034-b723cf961d3e",     # tropical beach
    # flight photos for the scrolling site background
    "bg-wing": "1436491865332-7a61a109cc05",   # wing above the clouds
    "bg-takeoff": "1474302770737-173ee21bab63",  # aircraft climbing at sunset
    "bg-window": "1464037866556-6812c9d1c72e",   # view from the cabin window
    "bg-terminal": "1488085061387-422e29b40080", # traveller in the airport terminal
    "bg-landing": "1569154941061-e231b4725ef1",  # aircraft on final approach
}

# Background photos shown one after another as the page scrolls (top to bottom).
BACKGROUND_SCENES = ["bg-wing", "bg-takeoff", "bg-window", "bg-terminal", "bg-landing"]

# Colour washes shown underneath each photo (and instead of it if it cannot load).
FALLBACK = {
    "hero": "linear-gradient(135deg,#0b2447 0%,#19376d 45%,#576cbc 100%)",
    "DXB": "linear-gradient(135deg,#7a4b1f,#d69a4e)", "CDG": "linear-gradient(135deg,#29466b,#8aa4c8)",
    "LHR": "linear-gradient(135deg,#2c3e50,#6b7f95)", "NRT": "linear-gradient(135deg,#1d1b3a,#8e3b62)",
    "JFK": "linear-gradient(135deg,#1f2d44,#5c7899)", "SYD": "linear-gradient(135deg,#0d4a6b,#47a3c9)",
    "MLE": "linear-gradient(135deg,#0a6c74,#58c3c0)", "SIN": "linear-gradient(135deg,#1a2a52,#5a6fb3)",
    "FCO": "linear-gradient(135deg,#6b3f23,#c9905c)", "IST": "linear-gradient(135deg,#3d2a4f,#a06c8f)",
    "BKK": "linear-gradient(135deg,#6b4a12,#caa048)", "india": "linear-gradient(135deg,#5c3b1e,#d7a86e)",
    "beach": "linear-gradient(135deg,#0f5e7a,#6cc4d6)",
    "bg-wing": "linear-gradient(180deg,#3a6fb0 0%,#8fb8e6 55%,#dfe9f5 100%)",
    "bg-takeoff": "linear-gradient(180deg,#2b2350 0%,#b0576a 55%,#f2a65a 100%)",
    "bg-window": "linear-gradient(180deg,#1d4f86 0%,#6aa2d8 60%,#f1f5fb 100%)",
    "bg-terminal": "linear-gradient(180deg,#2d3a4f 0%,#6f7f96 60%,#c9d2de 100%)",
    "bg-landing": "linear-gradient(180deg,#15254a 0%,#4b5f9a 55%,#e3a36a 100%)",
}

# Airports without their own photo use the closest match by country.
COUNTRY_PHOTO = {
    "India": "india", "Nepal": "india", "Sri Lanka": "MLE", "Maldives": "MLE",
    "UAE": "DXB", "Qatar": "DXB", "Egypt": "IST", "Turkey": "IST",
    "United Kingdom": "LHR", "France": "CDG", "Germany": "CDG", "Netherlands": "CDG", "Switzerland": "CDG",
    "Italy": "FCO", "Spain": "FCO",
    "USA": "JFK", "Canada": "JFK", "Mexico": "beach", "Brazil": "beach", "Argentina": "beach",
    "Japan": "NRT", "South Korea": "NRT", "China": "SIN", "Hong Kong": "SIN", "Singapore": "SIN",
    "Malaysia": "SIN", "Thailand": "BKK", "Australia": "SYD", "New Zealand": "SYD",
    "South Africa": "beach", "Kenya": "beach",
}


def airport_photo_key(code, airports):
    """Photo key for an airport: its own photo, else one from the same country or region."""
    if code in PHOTOS:
        return code
    country = airports.get(code, ("", "", ""))[2]
    return COUNTRY_PHOTO.get(country, "hero")


STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")


def photo_url(key, width=1600):
    """Local photo if the owner added one, otherwise the Unsplash original."""
    for ext in ("jpg", "jpeg", "webp", "png"):
        if os.path.exists(os.path.join(STATIC_DIR, "img", "photos", f"{key}.{ext}")):
            return f"/static/img/photos/{key}.{ext}"
    pid = PHOTOS.get(key, PHOTOS["hero"])
    return f"https://images.unsplash.com/photo-{pid}?auto=format&fit=crop&w={width}&q=75"


def photo(key, width=1600):
    """CSS background value: photo on top of its colour wash (the wash shows if the photo can't load)."""
    return Markup(f"url('{photo_url(key, width)}'), {FALLBACK.get(key, FALLBACK['hero'])}")
