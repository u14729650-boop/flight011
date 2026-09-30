"""Airports, airlines, flight schedule generation and the fare engine.

Flights are generated deterministically from (origin, destination, date), so the
same search always returns the same flights, and a flight can be rebuilt from
its id when it is booked. Prices react to distance, how far ahead you book,
day of week, time of day, airline, stops, cabin class and seats remaining,
the same factors real airline revenue systems use.
"""

import hashlib
import math
import random
from datetime import date, datetime, timedelta

AIRPORTS = {
    # code: (city, airport name, country, lat, lon, tz offset hours)
    "DEL": ("New Delhi", "Indira Gandhi International", "India", 28.5562, 77.1000, 5.5),
    "BOM": ("Mumbai", "Chhatrapati Shivaji Maharaj International", "India", 19.0896, 72.8656, 5.5),
    "BLR": ("Bengaluru", "Kempegowda International", "India", 13.1986, 77.7066, 5.5),
    "MAA": ("Chennai", "Chennai International", "India", 12.9941, 80.1709, 5.5),
    "CCU": ("Kolkata", "Netaji Subhas Chandra Bose International", "India", 22.6547, 88.4467, 5.5),
    "HYD": ("Hyderabad", "Rajiv Gandhi International", "India", 17.2403, 78.4294, 5.5),
    "GOI": ("Goa", "Manohar International", "India", 15.3808, 73.8314, 5.5),
    "DXB": ("Dubai", "Dubai International", "UAE", 25.2532, 55.3657, 4),
    "DOH": ("Doha", "Hamad International", "Qatar", 25.2731, 51.6081, 3),
    "LHR": ("London", "Heathrow", "United Kingdom", 51.4700, -0.4543, 1),
    "CDG": ("Paris", "Charles de Gaulle", "France", 49.0097, 2.5479, 2),
    "FRA": ("Frankfurt", "Frankfurt am Main", "Germany", 50.0379, 8.5622, 2),
    "AMS": ("Amsterdam", "Schiphol", "Netherlands", 52.3105, 4.7683, 2),
    "IST": ("Istanbul", "Istanbul Airport", "Turkey", 41.2753, 28.7519, 3),
    "FCO": ("Rome", "Leonardo da Vinci–Fiumicino", "Italy", 41.8003, 12.2389, 2),
    "MAD": ("Madrid", "Adolfo Suárez Madrid–Barajas", "Spain", 40.4983, -3.5676, 2),
    "ZRH": ("Zurich", "Zurich Airport", "Switzerland", 47.4582, 8.5555, 2),
    "JFK": ("New York", "John F. Kennedy International", "USA", 40.6413, -73.7781, -4),
    "LAX": ("Los Angeles", "Los Angeles International", "USA", 33.9416, -118.4085, -7),
    "ORD": ("Chicago", "O'Hare International", "USA", 41.9742, -87.9073, -5),
    "SFO": ("San Francisco", "San Francisco International", "USA", 37.6213, -122.3790, -7),
    "MIA": ("Miami", "Miami International", "USA", 25.7959, -80.2870, -4),
    "YYZ": ("Toronto", "Toronto Pearson International", "Canada", 43.6777, -79.6248, -4),
    "MEX": ("Mexico City", "Benito Juárez International", "Mexico", 19.4361, -99.0719, -6),
    "GRU": ("São Paulo", "Guarulhos International", "Brazil", -23.4356, -46.4731, -3),
    "EZE": ("Buenos Aires", "Ministro Pistarini International", "Argentina", -34.8222, -58.5358, -3),
    "SIN": ("Singapore", "Changi", "Singapore", 1.3644, 103.9915, 8),
    "BKK": ("Bangkok", "Suvarnabhumi", "Thailand", 13.6900, 100.7501, 7),
    "HKG": ("Hong Kong", "Hong Kong International", "Hong Kong", 22.3080, 113.9185, 8),
    "NRT": ("Tokyo", "Narita International", "Japan", 35.7720, 140.3929, 9),
    "ICN": ("Seoul", "Incheon International", "South Korea", 37.4602, 126.4407, 9),
    "PEK": ("Beijing", "Beijing Capital International", "China", 40.0799, 116.6031, 8),
    "KUL": ("Kuala Lumpur", "Kuala Lumpur International", "Malaysia", 2.7456, 101.7072, 8),
    "SYD": ("Sydney", "Kingsford Smith", "Australia", -33.9399, 151.1753, 10),
    "MEL": ("Melbourne", "Melbourne Airport", "Australia", -37.6690, 144.8410, 10),
    "AKL": ("Auckland", "Auckland Airport", "New Zealand", -37.0082, 174.7850, 13),
    "JNB": ("Johannesburg", "O. R. Tambo International", "South Africa", -26.1367, 28.2411, 2),
    "CAI": ("Cairo", "Cairo International", "Egypt", 30.1219, 31.4056, 3),
    "NBO": ("Nairobi", "Jomo Kenyatta International", "Kenya", -1.3192, 36.9278, 3),
    "MLE": ("Malé", "Velana International", "Maldives", 4.1918, 73.5290, 5),
    "CMB": ("Colombo", "Bandaranaike International", "Sri Lanka", 7.1808, 79.8841, 5.5),
    "KTM": ("Kathmandu", "Tribhuvan International", "Nepal", 27.6966, 85.3591, 5.75),
}

AIRLINES = {
    # code: (name, premium factor, hub airports, brand colour)
    "AI": ("Air India", 1.00, ["DEL", "BOM"], "#d7263d"),
    "6E": ("IndiGo", 0.82, ["DEL", "BOM", "BLR"], "#1f3c88"),
    "UK": ("Vistara", 1.05, ["DEL", "BOM"], "#5b2a86"),
    "SG": ("SpiceJet", 0.80, ["DEL"], "#e4572e"),
    "EK": ("Emirates", 1.22, ["DXB"], "#c8102e"),
    "QR": ("Qatar Airways", 1.20, ["DOH"], "#5c0632"),
    "BA": ("British Airways", 1.15, ["LHR"], "#075aaa"),
    "LH": ("Lufthansa", 1.12, ["FRA"], "#05164d"),
    "AF": ("Air France", 1.10, ["CDG"], "#002157"),
    "KL": ("KLM", 1.08, ["AMS"], "#00a1de"),
    "TK": ("Turkish Airlines", 0.98, ["IST"], "#c70a0c"),
    "SQ": ("Singapore Airlines", 1.25, ["SIN"], "#f99f1c"),
    "CX": ("Cathay Pacific", 1.15, ["HKG"], "#006564"),
    "NH": ("ANA", 1.14, ["NRT"], "#13448f"),
    "UA": ("United Airlines", 1.05, ["ORD", "SFO"], "#005daa"),
    "DL": ("Delta Air Lines", 1.07, ["JFK", "LAX"], "#c01933"),
    "AA": ("American Airlines", 1.04, ["MIA", "ORD"], "#0078d2"),
    "QF": ("Qantas", 1.16, ["SYD"], "#e40000"),
    "EY": ("Etihad Airways", 1.12, ["DXB"], "#bd8b13"),
    "TG": ("Thai Airways", 0.95, ["BKK"], "#51127f"),
}

CABINS = {
    "economy": ("Economy", 1.0),
    "premium": ("Premium Economy", 1.65),
    "business": ("Business", 3.4),
    "first": ("First", 5.8),
}

CURRENCIES = {
    # code: (symbol, rate per USD)
    "USD": ("$", 1.0),
    "INR": ("₹", 83.5),
    "EUR": ("€", 0.92),
    "GBP": ("£", 0.79),
    "AED": ("AED ", 3.67),
}

HUBS = ["DXB", "DOH", "IST", "FRA", "LHR", "SIN", "HKG", "AMS", "CDG", "NRT"]


def haversine_km(a, b):
    lat1, lon1 = math.radians(AIRPORTS[a][3]), math.radians(AIRPORTS[a][4])
    lat2, lon2 = math.radians(AIRPORTS[b][3]), math.radians(AIRPORTS[b][4])
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(h))


def _rng(*parts):
    seed = hashlib.sha256("|".join(str(p) for p in parts).encode()).hexdigest()
    return random.Random(int(seed[:16], 16))


def _flight_minutes(km):
    # taxi/climb overhead + cruise at ~830 km/h
    return int(35 + km / 830 * 60)


def _aircraft(km, rng):
    if km < 1500:
        return rng.choice(["Airbus A320neo", "Boeing 737 MAX 8", "Airbus A321neo", "ATR 72-600"])
    if km < 5000:
        return rng.choice(["Airbus A321neo", "Boeing 737-800", "Airbus A330-300", "Boeing 787-8"])
    return rng.choice(["Boeing 777-300ER", "Airbus A350-900", "Boeing 787-9", "Airbus A380-800"])


def _pick_airlines(origin, dest, rng):
    home = [c for c, a in AIRLINES.items() if origin in a[2] or dest in a[2]]
    domestic_india = AIRPORTS[origin][2] == "India" and AIRPORTS[dest][2] == "India"
    if domestic_india:
        pool = ["AI", "6E", "UK", "SG"]
    else:
        pool = list(dict.fromkeys(home + rng.sample(list(AIRLINES), 6)))
        pool = [c for c in pool if c not in ("6E", "SG") or AIRPORTS[origin][2] == "India" or AIRPORTS[dest][2] == "India"]
    return pool


def _demand_factor(travel_date, today):
    days = (travel_date - today).days
    if days <= 2:
        f = 1.85
    elif days <= 6:
        f = 1.5
    elif days <= 13:
        f = 1.28
    elif days <= 21:
        f = 1.12
    elif days <= 45:
        f = 1.0
    elif days <= 90:
        f = 0.93
    else:
        f = 0.9
    # Fridays and Sundays are the busiest days to fly
    f *= {4: 1.14, 6: 1.12, 5: 1.03, 1: 0.94, 2: 0.92}.get(travel_date.weekday(), 1.0)
    # December holidays and summer peak
    if travel_date.month == 12 and travel_date.day >= 15 or travel_date.month in (5, 6):
        f *= 1.18
    return f


def market_factor(origin, dest):
    """Low-cost-heavy markets (e.g. Indian domestic) are much cheaper per km."""
    countries = {AIRPORTS[origin][2], AIRPORTS[dest][2]}
    if countries == {"India"}:
        return 0.42
    if "India" in countries and countries & {"Nepal", "Sri Lanka", "Maldives", "UAE", "Qatar"}:
        return 0.8
    if countries <= {"USA", "Canada", "Mexico"}:
        return 0.85
    return 1.0


def base_fare_usd(km):
    """Economy one-way base fare. Short hops cost more per km than long hauls."""
    return 38 + 0.11 * km if km < 1500 else 110 + 0.062 * km


def price_breakdown(flight, cabin="economy", adults=1, children=0, infants=0, currency="USD"):
    """Full fare breakdown for a flight, in the chosen currency."""
    symbol, rate = CURRENCIES.get(currency, CURRENCIES["USD"])
    per_adult = flight["fares_usd"][cabin]
    base = per_adult * adults + per_adult * 0.75 * children + per_adult * 0.10 * infants
    taxes = base * 0.12 + 18 * flight["segments"] * (adults + children)
    fees = 7.5 * (adults + children)
    total = base + taxes + fees
    conv = lambda v: round(v * rate, 2)
    return {
        "currency": currency,
        "symbol": symbol,
        "base": conv(base),
        "taxes": conv(taxes),
        "fees": conv(fees),
        "total": conv(total),
        "per_adult": conv(per_adult),
    }


def generate_flights(origin, dest, travel_date, today=None):
    """All flights on a route for a date, sorted by departure time."""
    if origin not in AIRPORTS or dest not in AIRPORTS or origin == dest:
        return []
    today = today or date.today()
    km = haversine_km(origin, dest)
    rng = _rng(origin, dest, travel_date.isoformat())
    airlines = _pick_airlines(origin, dest, rng)
    demand = _demand_factor(travel_date, today) * market_factor(origin, dest)
    count = rng.randint(7, 12) if km < 3000 else rng.randint(6, 10)
    flights = []
    for idx in range(count):
        code = rng.choice(airlines)
        name, premium, hubs, colour = AIRLINES[code]
        stops, via = 0, None
        nonstop_chance = 0.9 if km < 3000 else 0.55 if km < 9000 else 0.3
        if rng.random() > nonstop_chance:
            options = [h for h in hubs + HUBS if h not in (origin, dest)
                       and haversine_km(origin, h) + haversine_km(h, dest) < km * 1.35]
            if options:
                stops, via = 1, rng.choice(options)
        if via:
            fly = _flight_minutes(haversine_km(origin, via)) + _flight_minutes(haversine_km(via, dest))
            layover = rng.choice([75, 95, 120, 150, 185, 240, 320])
        else:
            fly, layover = _flight_minutes(km), 0
        duration = fly + layover + rng.randint(-10, 15)
        dep_minutes = rng.randint(0, 23 * 60 + 11) // 5 * 5
        dep = datetime.combine(travel_date, datetime.min.time()) + timedelta(minutes=dep_minutes)
        # arrival shown in destination local time
        tz_shift = AIRPORTS[dest][5] - AIRPORTS[origin][5]
        arr = dep + timedelta(minutes=duration) + timedelta(hours=tz_shift)
        hour = dep.hour
        time_factor = 0.84 if hour < 5 else 1.1 if 6 <= hour <= 9 or 17 <= hour <= 20 else 1.0
        stop_factor = 0.86 if stops else 1.12
        seats_left = rng.randint(1, 42)
        scarcity = 1.25 if seats_left <= 4 else 1.1 if seats_left <= 9 else 1.0
        jitter = rng.uniform(0.93, 1.09)
        economy = base_fare_usd(km) * premium * demand * time_factor * stop_factor * scarcity * jitter
        fares = {c: round(economy * mult * rng.uniform(0.96, 1.04), 2) for c, (_, mult) in CABINS.items()}
        flights.append({
            "id": f"{origin}-{dest}-{travel_date.isoformat()}-{idx}",
            "airline_code": code,
            "airline": name,
            "colour": colour,
            "flight_no": f"{code} {rng.randint(100, 2999)}",
            "aircraft": _aircraft(km, rng),
            "origin": origin,
            "dest": dest,
            "via": via,
            "stops": stops,
            "segments": stops + 1,
            "layover_min": layover,
            "departure": dep,
            "arrival": arr,
            "day_diff": (arr.date() - dep.date()).days,
            "duration_min": duration,
            "distance_km": round(km),
            "terminal": f"T{rng.randint(1, 3)}",
            "gate": f"{rng.choice('ABCDE')}{rng.randint(1, 40)}",
            "seats_left": seats_left,
            "baggage": "15 kg check-in, 7 kg cabin" if km < 3000 else "30 kg check-in, 7 kg cabin",
            "meal": km > 1200,
            "wifi": rng.random() < (0.3 if km < 2000 else 0.75),
            "refundable": rng.random() < 0.35,
            "fares_usd": fares,
        })
    flights.sort(key=lambda f: f["departure"])
    return flights


def find_flight(flight_id, today=None):
    try:
        origin, dest, y, m, d, _ = flight_id.split("-")
        travel_date = date(int(y), int(m), int(d))
    except ValueError:
        return None
    for f in generate_flights(origin, dest, travel_date, today):
        if f["id"] == flight_id:
            return f
    return None


def cheapest_by_day(origin, dest, center, cabin="economy", span=3, today=None):
    """Lowest economy fare for each day around the chosen date (fare calendar)."""
    today = today or date.today()
    out = []
    for offset in range(-span, span + 1):
        d = center + timedelta(days=offset)
        if d < today:
            continue
        flights = generate_flights(origin, dest, d, today)
        if flights:
            out.append((d, min(f["fares_usd"][cabin] for f in flights)))
    return out


def fmt_duration(minutes):
    return f"{minutes // 60}h {minutes % 60:02d}m"
