"""Run with:  python -m unittest discover tests"""
import os
import re
import sys
import tempfile
import unittest
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["SKYVOYAGE_DB"] = os.path.join(tempfile.mkdtemp(), "test.db")

import app as skyvoyage  # noqa: E402
import flight_data as fd  # noqa: E402


class PricingTests(unittest.TestCase):
    def test_same_search_gives_same_flights(self):
        d = date.today() + timedelta(days=20)
        self.assertEqual(fd.generate_flights("DEL", "BOM", d), fd.generate_flights("DEL", "BOM", d))

    def test_last_minute_is_more_expensive(self):
        cheapest = lambda days: min(f["fares_usd"]["economy"] for f in
                                    fd.generate_flights("BOM", "LHR", date.today() + timedelta(days=days)))
        self.assertGreater(cheapest(1), cheapest(30))

    def test_business_costs_more_than_economy(self):
        f = fd.generate_flights("DEL", "SIN", date.today() + timedelta(days=15))[0]
        self.assertGreater(fd.price_breakdown(f, "business")["total"], fd.price_breakdown(f, "economy")["total"])

    def test_find_flight_round_trips_id(self):
        f = fd.generate_flights("JFK", "LAX", date.today() + timedelta(days=9))[3]
        self.assertEqual(fd.find_flight(f["id"])["flight_no"], f["flight_no"])


class FlowTests(unittest.TestCase):
    def setUp(self):
        self.c = skyvoyage.app.test_client()

    def test_pages_load(self):
        for path in ["/", "/about", "/help", "/map", "/login", "/register"]:
            self.assertEqual(self.c.get(path).status_code, 200, path)

    def test_register_search_book_history_cancel(self):
        self.c.post("/register", data=dict(name="Test User", email="flow@example.com", phone="9999999999",
                                           password="secret1", confirm="secret1"))
        dep = (date.today() + timedelta(days=10)).isoformat()
        html = self.c.get(f"/search?origin=New+Delhi+(DEL)&dest=DXB&depart={dep}").data.decode()
        out = re.search(r"book\?out=([\w-]+)", html).group(1)
        r = self.c.post("/book", data=dict(out=out, cabin="economy", currency="USD", adults=1, children=0, infants=0,
                                           title_0="Mr", first_0="Test", last_0="User",
                                           email="flow@example.com", phone="9999999999", seat_pref="aisle"))
        self.assertEqual(r.status_code, 302)
        pnr = r.location.rsplit("/", 1)[-1]
        self.assertIn(pnr, self.c.get("/history").data.decode())
        self.c.post(f"/ticket/{pnr}/cancel")
        self.assertIn("badge-cancelled", self.c.get("/history").data.decode())


if __name__ == "__main__":
    unittest.main()
