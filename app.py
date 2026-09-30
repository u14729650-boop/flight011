"""SkyVoyage — a flight booking website built with Python (Flask + SQLite)."""

import os
import re
import secrets
import sqlite3
import string
from datetime import date, datetime, timedelta
from functools import wraps

from flask import (Flask, abort, flash, g, jsonify, redirect, render_template,
                   request, session, url_for)
from werkzeug.security import check_password_hash, generate_password_hash

import flight_data as fd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("SKYVOYAGE_DB", os.path.join(BASE_DIR, "skyvoyage.db"))

HELP_CENTRE = {
    "email": "skyvoyage.helpdesk@gmail.com",
    "support_email": "bookings.skyvoyage24x7@gmail.com",
    "phone": "+91 98765 43210",
    "phone_intl": "+1 (555) 214-7788",
    "whatsapp": "+91 91234 56780",
    "hours": "24 × 7, all days",
}

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SKYVOYAGE_SECRET", "dev-" + secrets.token_hex(16))


# ---------------------------------------------------------------- database

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(DB_PATH)
    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pnr TEXT NOT NULL UNIQUE,
            user_id INTEGER NOT NULL REFERENCES users(id),
            flight_id TEXT NOT NULL,
            airline TEXT NOT NULL,
            flight_no TEXT NOT NULL,
            origin TEXT NOT NULL,
            dest TEXT NOT NULL,
            via TEXT,
            departure TEXT NOT NULL,
            arrival TEXT NOT NULL,
            duration_min INTEGER NOT NULL,
            cabin TEXT NOT NULL,
            passengers TEXT NOT NULL,
            seats TEXT NOT NULL,
            contact_email TEXT NOT NULL,
            contact_phone TEXT NOT NULL,
            currency TEXT NOT NULL,
            total REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'Confirmed',
            trip_leg TEXT NOT NULL DEFAULT 'Outbound',
            booked_at TEXT NOT NULL
        );
    """)
    db.commit()
    db.close()


# ---------------------------------------------------------------- helpers

def current_user():
    uid = session.get("user_id")
    if uid is None:
        return None
    return get_db().execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if current_user() is None:
            flash("Please log in to continue.", "info")
            return redirect(url_for("login", next=request.full_path))
        return view(*args, **kwargs)
    return wrapped


def airport_code(value):
    """Accept 'DEL', 'del' or 'New Delhi (DEL)' and return the IATA code."""
    value = (value or "").strip()
    m = re.search(r"\(([A-Za-z]{3})\)\s*$", value)
    code = (m.group(1) if m else value).upper()
    if code in fd.AIRPORTS:
        return code
    for c, a in fd.AIRPORTS.items():
        if a[0].lower() == value.lower():
            return c
    return code


def parse_date(value):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


def new_pnr():
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(6))


def assign_seats(flight, cabin, count, preference):
    rng = fd._rng(flight["id"], cabin, secrets.token_hex(4))
    rows = {"first": (1, 2), "business": (3, 8), "premium": (9, 14), "economy": (15, 42)}[cabin]
    letters = {"window": "AF", "aisle": "CD", "any": "ABCDEF"}.get(preference, "ABCDEF")
    row = rng.randint(*rows)
    seats = []
    for i in range(count):
        letter = letters[i % len(letters)] if preference != "any" else "ABCDEF"[i % 6]
        seats.append(f"{row + i // len(letters)}{letter}")
    return seats


def background_image():
    """Use the user's own photo (static/img/background.jpg/.png/.webp) if present, else the built-in scene."""
    for name in ("background.jpg", "background.jpeg", "background.png", "background.webp"):
        if os.path.exists(os.path.join(app.static_folder, "img", name)):
            return url_for("static", filename="img/" + name)
    return url_for("static", filename="img/background.svg")


@app.context_processor
def inject_globals():
    return {
        "background_url": background_image(),
        "user": current_user(),
        "help": HELP_CENTRE,
        "airports": fd.AIRPORTS,
        "cabins": fd.CABINS,
        "currencies": fd.CURRENCIES,
        "fmt_duration": fd.fmt_duration,
        "today": date.today(),
        "year": date.today().year,
        "zip": zip,
    }


@app.template_filter("money")
def money(value, symbol="$"):
    return f"{symbol}{value:,.0f}" if value >= 1000 else f"{symbol}{value:,.2f}"


@app.template_filter("dt")
def dt_filter(value, fmt="%d %b %Y, %H:%M"):
    if isinstance(value, str):
        value = datetime.fromisoformat(value)
    return value.strftime(fmt)


# ---------------------------------------------------------------- pages

@app.route("/")
def home():
    popular = [("DEL", "DXB"), ("BOM", "LHR"), ("DEL", "SIN"), ("BLR", "JFK"),
               ("DEL", "BOM"), ("MAA", "CMB"), ("BOM", "MLE"), ("DEL", "CDG")]
    when = date.today() + timedelta(days=21)
    deals = []
    for o, d in popular:
        flights = fd.generate_flights(o, d, when)
        cheapest = min(flights, key=lambda f: f["fares_usd"]["economy"])
        deals.append({"o": o, "d": d, "date": when, "flight": cheapest,
                      "price": fd.price_breakdown(cheapest)["total"]})
    return render_template("home.html", deals=deals, when=when)


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/help", methods=["GET", "POST"])
def help_centre():
    if request.method == "POST":
        ticket = "SV-" + "".join(secrets.choice(string.digits) for _ in range(6))
        flash(f"Thanks {request.form.get('name', '').strip() or 'traveller'}! Your support ticket {ticket} "
              f"has been raised. We'll reply to you within 2 hours.", "success")
        return redirect(url_for("help_centre"))
    return render_template("help.html")


@app.route("/map")
def world_map():
    return render_template("map.html")


@app.route("/api/airports")
def api_airports():
    return jsonify([
        {"code": c, "city": a[0], "name": a[1], "country": a[2], "lat": a[3], "lon": a[4]}
        for c, a in fd.AIRPORTS.items()
    ])


@app.route("/api/quote")
def api_quote():
    """Cheapest fare on a route/date, used by the world map and live search hint."""
    o, d = airport_code(request.args.get("from")), airport_code(request.args.get("to"))
    when = parse_date(request.args.get("date")) or date.today() + timedelta(days=14)
    cabin = request.args.get("cabin", "economy")
    currency = request.args.get("currency", "USD")
    if cabin not in fd.CABINS:
        cabin = "economy"
    flights = fd.generate_flights(o, d, when)
    if not flights:
        return jsonify({"error": "No flights for this route."}), 404
    cheapest = min(flights, key=lambda f: f["fares_usd"][cabin])
    price = fd.price_breakdown(cheapest, cabin, currency=currency)
    return jsonify({
        "from": o, "to": d, "date": when.isoformat(), "flights": len(flights),
        "distance_km": cheapest["distance_km"],
        "duration": fd.fmt_duration(min(f["duration_min"] for f in flights)),
        "airline": cheapest["airline"], "price": price["total"], "symbol": price["symbol"],
        "nonstop": any(f["stops"] == 0 for f in flights),
    })


@app.route("/search")
def search():
    o = airport_code(request.args.get("origin"))
    d = airport_code(request.args.get("dest"))
    dep = parse_date(request.args.get("depart"))
    ret = parse_date(request.args.get("return"))
    trip = request.args.get("trip", "oneway")
    cabin = request.args.get("cabin", "economy")
    currency = request.args.get("currency", "USD")
    adults = max(1, min(9, request.args.get("adults", 1, type=int)))
    children = max(0, min(8, request.args.get("children", 0, type=int)))
    infants = max(0, min(adults, request.args.get("infants", 0, type=int)))
    sort = request.args.get("sort", "price")
    stops = request.args.get("stops", "any")
    airline_filter = request.args.getlist("airline")

    errors = []
    if o not in fd.AIRPORTS or d not in fd.AIRPORTS:
        errors.append("Please choose valid departure and destination airports.")
    elif o == d:
        errors.append("Departure and destination cannot be the same.")
    if dep is None or dep < date.today():
        errors.append("Please choose a departure date from today onwards.")
    if trip == "round" and (ret is None or (dep and ret < dep)):
        errors.append("Return date must be on or after the departure date.")
    if cabin not in fd.CABINS:
        cabin = "economy"
    if currency not in fd.CURRENCIES:
        currency = "USD"
    if errors:
        for e in errors:
            flash(e, "error")
        return redirect(url_for("home"))

    pax = dict(adults=adults, children=children, infants=infants)

    def build(orig, dst, when):
        flights = fd.generate_flights(orig, dst, when)
        all_airlines = sorted({f["airline"] for f in flights})
        if stops == "0":
            flights = [f for f in flights if f["stops"] == 0]
        elif stops == "1":
            flights = [f for f in flights if f["stops"] == 1]
        if airline_filter:
            flights = [f for f in flights if f["airline"] in airline_filter]
        for f in flights:
            f["price"] = fd.price_breakdown(f, cabin, currency=currency, **pax)
        key = {"price": lambda f: f["price"]["total"],
               "duration": lambda f: f["duration_min"],
               "departure": lambda f: f["departure"],
               "arrival": lambda f: f["arrival"]}.get(sort, lambda f: f["price"]["total"])
        flights.sort(key=key)
        calendar = [(day, round(p * fd.CURRENCIES[currency][1]))
                    for day, p in fd.cheapest_by_day(orig, dst, when, cabin)]
        return flights, all_airlines, calendar

    outbound, airlines_out, cal_out = build(o, d, dep)
    inbound, cal_in = [], []
    if trip == "round":
        inbound, _, cal_in = build(d, o, ret)
    return render_template(
        "results.html", o=o, d=d, dep=dep, ret=ret, trip=trip, cabin=cabin, currency=currency,
        pax=pax, sort=sort, stops=stops, airline_filter=airline_filter, all_airlines=airlines_out,
        outbound=outbound, inbound=inbound, cal_out=cal_out, cal_in=cal_in,
        symbol=fd.CURRENCIES[currency][0], distance=round(fd.haversine_km(o, d)),
        s=dict(origin=o, dest=d, depart=dep, ret=ret, trip=trip, cabin=cabin, currency=currency, **pax),
    )


@app.route("/book", methods=["GET", "POST"])
@login_required
def book():
    src = request.form if request.method == "POST" else request.args
    out_flight = fd.find_flight(src.get("out", ""))
    ret_flight = fd.find_flight(src.get("ret", "")) if src.get("ret") else None
    if out_flight is None:
        abort(404)
    cabin = src.get("cabin", "economy")
    cabin = cabin if cabin in fd.CABINS else "economy"
    currency = src.get("currency", "USD")
    currency = currency if currency in fd.CURRENCIES else "USD"
    adults = max(1, min(9, int(src.get("adults", 1) or 1)))
    children = max(0, min(8, int(src.get("children", 0) or 0)))
    infants = max(0, min(adults, int(src.get("infants", 0) or 0)))
    pax = dict(adults=adults, children=children, infants=infants)
    legs = [("Outbound", out_flight)] + ([("Return", ret_flight)] if ret_flight else [])
    prices = [fd.price_breakdown(f, cabin, currency=currency, **pax) for _, f in legs]
    grand_total = round(sum(p["total"] for p in prices), 2)

    if request.method == "POST":
        names = []
        kinds = ["Adult"] * adults + ["Child"] * children + ["Infant"] * infants
        for i, kind in enumerate(kinds):
            title = request.form.get(f"title_{i}", "").strip()
            first = request.form.get(f"first_{i}", "").strip()
            last = request.form.get(f"last_{i}", "").strip()
            if not first or not last:
                flash("Please fill in the first and last name of every passenger.", "error")
                return render_template("book.html", legs=legs, prices=prices, grand_total=grand_total,
                                       cabin=cabin, currency=currency, pax=pax, kinds=kinds, form=request.form)
            names.append(f"{title} {first} {last} ({kind})".strip())
        email = request.form.get("email", "").strip()
        phone = request.form.get("phone", "").strip()
        if "@" not in email or len(phone) < 7:
            flash("Please enter a valid contact email and phone number.", "error")
            return render_template("book.html", legs=legs, prices=prices, grand_total=grand_total,
                                   cabin=cabin, currency=currency, pax=pax, kinds=kinds, form=request.form)
        pref = request.form.get("seat_pref", "any")
        db = get_db()
        pnrs = []
        for (leg, f), price in zip(legs, prices):
            pnr = new_pnr()
            seats = assign_seats(f, cabin, adults + children, pref)
            db.execute(
                """INSERT INTO bookings (pnr, user_id, flight_id, airline, flight_no, origin, dest, via,
                   departure, arrival, duration_min, cabin, passengers, seats, contact_email, contact_phone,
                   currency, total, trip_leg, booked_at)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (pnr, session["user_id"], f["id"], f["airline"], f["flight_no"], f["origin"], f["dest"],
                 f["via"], f["departure"].isoformat(), f["arrival"].isoformat(), f["duration_min"], cabin,
                 "\n".join(names), ", ".join(seats), email, phone, currency, price["total"], leg,
                 datetime.now().isoformat(timespec="seconds")))
            pnrs.append(pnr)
        db.commit()
        flash("Booking confirmed! Have a wonderful trip ✈", "success")
        return redirect(url_for("ticket", pnr=pnrs[0]))

    kinds = ["Adult"] * adults + ["Child"] * children + ["Infant"] * infants
    user = current_user()
    return render_template("book.html", legs=legs, prices=prices, grand_total=grand_total, cabin=cabin,
                           currency=currency, pax=pax, kinds=kinds,
                           form={"email": user["email"], "phone": user["phone"] or ""})


def booking_status(row):
    if row["status"] == "Cancelled":
        return "Cancelled"
    return "Completed" if datetime.fromisoformat(row["arrival"]) < datetime.now() else "Upcoming"


@app.route("/history")
@login_required
def history():
    rows = get_db().execute(
        "SELECT * FROM bookings WHERE user_id = ? ORDER BY booked_at DESC, departure ASC",
        (session["user_id"],)).fetchall()
    bookings = [dict(r, state=booking_status(r), symbol=fd.CURRENCIES[r["currency"]][0]) for r in rows]
    stats = {
        "total": len(bookings),
        "upcoming": sum(b["state"] == "Upcoming" for b in bookings),
        "completed": sum(b["state"] == "Completed" for b in bookings),
        "cancelled": sum(b["state"] == "Cancelled" for b in bookings),
        "km": sum(round(fd.haversine_km(b["origin"], b["dest"])) for b in bookings if b["state"] != "Cancelled"),
    }
    return render_template("history.html", bookings=bookings, stats=stats)


@app.route("/ticket/<pnr>")
@login_required
def ticket(pnr):
    row = get_db().execute("SELECT * FROM bookings WHERE pnr = ? AND user_id = ?",
                           (pnr, session["user_id"])).fetchone()
    if row is None:
        abort(404)
    b = dict(row, state=booking_status(row), symbol=fd.CURRENCIES[row["currency"]][0])
    flight = fd.find_flight(row["flight_id"])
    others = get_db().execute(
        "SELECT pnr, trip_leg FROM bookings WHERE user_id = ? AND booked_at = ? AND pnr != ?",
        (session["user_id"], row["booked_at"], pnr)).fetchall()
    boarding = flight["departure"] - timedelta(minutes=45) if flight else None
    barcode = [1 + (ord(ch) * (i + 3)) % 4 for i, ch in enumerate(pnr * 5)]
    return render_template("ticket.html", b=b, flight=flight, others=others, boarding=boarding, barcode=barcode)


@app.route("/ticket/<pnr>/cancel", methods=["POST"])
@login_required
def cancel(pnr):
    db = get_db()
    row = db.execute("SELECT * FROM bookings WHERE pnr = ? AND user_id = ?",
                     (pnr, session["user_id"])).fetchone()
    if row is None:
        abort(404)
    if booking_status(row) != "Upcoming":
        flash("Only upcoming bookings can be cancelled.", "error")
    else:
        db.execute("UPDATE bookings SET status = 'Cancelled' WHERE id = ?", (row["id"],))
        db.commit()
        flash(f"Booking {pnr} cancelled. Refund will reach you in 5–7 working days.", "success")
    return redirect(url_for("history"))


# ---------------------------------------------------------------- auth

def safe_next(target):
    return target if target and target.startswith("/") and not target.startswith("//") else url_for("home")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        row = get_db().execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if row and check_password_hash(row["password_hash"], request.form.get("password", "")):
            session.clear()
            session["user_id"] = row["id"]
            flash(f"Welcome back, {row['name'].split()[0]}!", "success")
            return redirect(safe_next(request.form.get("next")))
        flash("Incorrect email or password.", "error")
    return render_template("login.html", next=request.args.get("next", ""))


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        phone = request.form.get("phone", "").strip()
        password = request.form.get("password", "")
        if not name or "@" not in email or len(password) < 6:
            flash("Enter your name, a valid email and a password of at least 6 characters.", "error")
        elif password != request.form.get("confirm", ""):
            flash("Passwords do not match.", "error")
        else:
            db = get_db()
            try:
                cur = db.execute(
                    "INSERT INTO users (name, email, phone, password_hash, created_at) VALUES (?,?,?,?,?)",
                    (name, email, phone, generate_password_hash(password), datetime.now().isoformat()))
                db.commit()
            except sqlite3.IntegrityError:
                flash("An account with this email already exists. Please log in.", "error")
            else:
                session.clear()
                session["user_id"] = cur.lastrowid
                flash(f"Welcome aboard, {name.split()[0]}! Your account is ready.", "success")
                return redirect(safe_next(request.form.get("next")))
    return render_template("register.html", next=request.args.get("next", ""))


@app.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for("home"))


@app.errorhandler(404)
def not_found(_e):
    return render_template("404.html"), 404


init_db()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
