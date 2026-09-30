# ✈ SkyVoyage — Flight Booking Website (Python)

A flight booking website written in **Python** with **Flask** and **SQLite**. It has dark and light mode, a glass look, a moving sky background, 3-D scroll effects, an interactive world map and fares that change the way real airline prices do.

## Features

| | |
|---|---|
| 🔍 **Flight search** | One way or round trip, 42 airports worldwide, adults / children / infants, Economy → First class, 5 currencies (USD, INR, EUR, GBP, AED) |
| 🧾 **Full flight details** | Airline, flight number, aircraft, departure & arrival times (local), duration, stops & layover, terminal, gate, baggage, meal, Wi-Fi, refundable |
| 💸 **Realistic pricing** | Fare depends on distance, days until departure, weekday, peak season, time of day, airline, stops, cabin class and seats left. Base fare, taxes and fees are shown separately |
| 📅 **Fare calendar** | Cheapest price for ±3 days around your date, with the lowest day highlighted |
| ⚙️ **Filters & sorting** | Cheapest / fastest / earliest departure / earliest arrival, non-stop only, filter by airline |
| 🎫 **Booking** | Passenger names, contact details, window/aisle seat preference, PNR, printable e-ticket / boarding pass |
| 🕑 **Booking history** | Upcoming, completed and cancelled trips, stats, cancel booking, book again |
| 🌍 **World map** | Click two airports to see the route drawn as a great-circle arc with a moving plane, plus the live cheapest fare |
| 👤 **Pages** | Home, Log in, Sign up, About, Help centre, Route map, My trips, E-ticket, Privacy policy, Terms of use |
| 🌗 **Dark / light mode** | Toggle in the navbar; your choice is remembered |
| 🪟 **Glass effect & moving background** | Frosted-glass panels over a slowly drifting, tinted background photo |
| 🧊 **3-D and motion** | Photo parallax on every header, a destination gallery that turns in 3-D as you scroll, panels that settle as they scroll into view, and cards that tilt under the mouse |
| 🎧 **Help centre** | Email `skyvoyage.helpdesk@gmail.com` · Phone `+91 98765 43210` · WhatsApp `+91 91234 56780` (sample contact details) |

## Run it on a Mac (easiest)

1. Download the project (green **Code** button → **Download ZIP**) and unzip it.
2. Double-click **`start_mac.command`**. If macOS blocks it, right-click it → **Open** → **Open**.
3. Your browser opens **http://127.0.0.1:5000**. Close the Terminal window to stop the site.

Python 3 must be installed ([python.org](https://www.python.org/downloads/macos/)).

## Run it (any computer)

```bash
pip install -r requirements.txt
python app.py
```

Then open **http://127.0.0.1:5000**, create an account, and search for flights (for example *New Delhi (DEL) → Dubai (DXB)*).

Run the tests with:

```bash
python -m unittest discover tests
```

## Photos

The site uses real photographs from [Unsplash](https://unsplash.com) (free for commercial use under the Unsplash License), loaded when the site runs with an internet connection. Each photo sits on a colour wash, so the layout still looks finished if a photo cannot load.

To use your own photos, put them in `static/img/photos/` (see the README there for the file names). For a background across the whole site, save a photo as `static/img/background.jpg`.

## Project structure

```
app.py              Flask routes: search, booking, history, login/register, API
flight_data.py      Airports, airlines, flight schedule generator and fare engine
templates/          Jinja2 HTML pages
ui_assets.py        Line icons and the photo list
static/css/style.css  Design system: glass panels, dark/light mode, layout
static/js/main.js     Theme toggle, parallax and 3-D gallery, live fare hints, route map
preview/            Browser-only preview build (python preview/build.py)
static/vendor/leaflet Leaflet map library (bundled, works offline)
tests/              Unit tests
```

> This is a demo project. No real payments are taken, and the flights are generated rather than coming from a real airline system. The contact email and phone numbers are samples.
