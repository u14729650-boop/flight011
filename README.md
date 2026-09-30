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
| 👤 **Pages** | Home, Login, Sign up, About, Help Centre, World Map, My Bookings, E-ticket |
| 🌗 **Dark / light mode** | Toggle in the navbar; your choice is remembered |
| 🪟 **Glass effect & moving background** | Frosted-glass cards over an animated sky with drifting clouds, flying planes, stars at night and a slow-zooming background image. No black areas |
| 🧊 **3-D effects** | Cards tilt and move in 3-D as you scroll, a ring of destination cards spins as you scroll, a spinning 3-D globe, and cards tilt under the mouse |
| 🎧 **Help centre** | Email `skyvoyage.helpdesk@gmail.com` · Phone `+91 98765 43210` · WhatsApp `+91 91234 56780` (sample contact details) |

## Run it

```bash
pip install -r requirements.txt
python app.py
```

Then open **http://127.0.0.1:5000**, create an account, and search for flights (for example *New Delhi (DEL) → Dubai (DXB)*).

Run the tests with:

```bash
python -m unittest discover tests
```

## Use your own background image

Put your photo at `static/img/background.jpg` (`.png` and `.webp` also work). The site uses it automatically on every page, with a slow moving zoom, and dims it in dark mode. Without a photo, the built-in sky scene `static/img/background.svg` is used.

## Project structure

```
app.py              Flask routes: search, booking, history, login/register, API
flight_data.py      Airports, airlines, flight schedule generator and fare engine
templates/          Jinja2 HTML pages
static/css/style.css  Glass theme, dark/light mode, animated background, 3-D styles
static/js/main.js     Theme toggle, 3-D scroll effects, live fare hints, world map
static/vendor/leaflet Leaflet map library (bundled, works offline)
tests/              Unit tests
```

> This is a demo project. No real payments are taken, and the flights are generated rather than coming from a real airline system. The contact email and phone numbers are samples.
