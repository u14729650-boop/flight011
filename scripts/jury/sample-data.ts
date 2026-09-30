/**
 * Sample data for the jury database page. Prices, distance factors and
 * delivery windows come from the site's real pricing engine, so every row
 * matches what the website would have stored. All people are fictional
 * (example.com addresses).
 */
import { calculateQuote } from '../../src/lib/pricing';
import { cityByName } from '../../src/data/cities';
import type { CargoType, DeliverySpeed, TransportMode } from '../../src/config/pricing';

const q = (v: string | number | null) => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${v.replace(/'/g, "''")}'`);
const row = (table: string, cols: string[], vals: (string | number | null)[]) => `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.map(q).join(', ')});`;

const USERS = [
  ['u-priya', 'Priya Sharma', 'priya@example.com', '+91 98765 43210', '2026-09-02T10:14:00Z'],
  ['u-rakesh', 'Rakesh Patel', 'rakesh@example.com', '+91 99250 11223', '2026-09-04T08:40:00Z'],
  ['u-ananya', 'Ananya Kulkarni', 'ananya@example.com', '+91 98220 44556', '2026-09-07T17:05:00Z'],
  ['u-vikram', 'Vikram Iyer', 'vikram@example.com', '+91 99000 77881', '2026-09-11T12:30:00Z'],
  ['u-farah', 'Farah Siddiqui', 'farah@example.com', '+91 94150 33442', '2026-09-15T09:55:00Z'],
  ['u-sourav', 'Sourav Banerjee', 'sourav@example.com', '+91 98300 66778', '2026-09-20T15:20:00Z'],
] as const;

interface Ship {
  id: string;
  user: string;
  mode: TransportMode;
  from: string;
  to: string;
  kg: number;
  cargo: CargoType;
  speed: DeliverySpeed;
  status: 'PENDING_PAYMENT' | 'PICKUP_SCHEDULED' | 'PICKED_UP' | 'IN_TRANSIT' | 'REACHED_HUB' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  booked: string;
  method?: string;
  sender: [string, string, string, string];
  receiver: [string, string, string, string];
}

const SHIPMENTS: Ship[] = [
  { id: 's-1401', user: 'u-priya', mode: 'AIR', from: 'Ahmedabad', to: 'New Delhi', kg: 100, cargo: 'PARCEL', speed: 'STANDARD', status: 'DELIVERED', booked: '2026-09-03T09:00:00Z', method: 'UPI', sender: ['Priya Sharma', '9876543210', '12 CG Road, Navrangpura', '380009'], receiver: ['Arun Rao', '9811100022', '5 Janpath, Connaught Place', '110001'] },
  { id: 's-1402', user: 'u-rakesh', mode: 'ROAD', from: 'Surat', to: 'Pune', kg: 450, cargo: 'COMMERCIAL', speed: 'STANDARD', status: 'DELIVERED', booked: '2026-09-05T11:20:00Z', method: 'NET_BANKING', sender: ['Rakesh Patel', '9925011223', 'Ring Road Textile Market', '395002'], receiver: ['Meera Joshi', '9822012345', 'Laxmi Road, Shaniwar Peth', '411030'] },
  { id: 's-1403', user: 'u-ananya', mode: 'MOVERS', from: 'Pune', to: 'Hyderabad', kg: 1850, cargo: 'HOUSEHOLD', speed: 'STANDARD', status: 'OUT_FOR_DELIVERY', booked: '2026-09-18T16:45:00Z', method: 'CREDIT_CARD', sender: ['Ananya Kulkarni', '9822044556', 'Flat 4B, Baner Road', '411045'], receiver: ['Ananya Kulkarni', '9822044556', 'Gachibowli, Plot 17', '500032'] },
  { id: 's-1404', user: 'u-vikram', mode: 'AIR', from: 'Bengaluru', to: 'Chennai', kg: 35, cargo: 'FRAGILE', speed: 'PRIORITY', status: 'DELIVERED', booked: '2026-09-12T07:10:00Z', method: 'UPI', sender: ['Vikram Iyer', '9900077881', 'Whitefield Industrial Area', '560066'], receiver: ['Plant Stores', '9444012345', 'Sriperumbudur SIPCOT', '602105'] },
  { id: 's-1405', user: 'u-farah', mode: 'ROAD', from: 'Lucknow', to: 'New Delhi', kg: 120, cargo: 'PARCEL', speed: 'EXPRESS', status: 'IN_TRANSIT', booked: '2026-09-26T10:05:00Z', method: 'WALLET', sender: ['Farah Siddiqui', '9415033442', 'Hazratganj, Shop 21', '226001'], receiver: ['Kabir Home Store', '9810098100', 'Lajpat Nagar II', '110024'] },
  { id: 's-1406', user: 'u-sourav', mode: 'ROAD', from: 'Kolkata', to: 'Guwahati', kg: 800, cargo: 'COMMERCIAL', speed: 'STANDARD', status: 'REACHED_HUB', booked: '2026-09-24T13:30:00Z', method: 'NET_BANKING', sender: ['Sourav Banerjee', '9830066778', 'Burrabazar, 3rd Lane', '700007'], receiver: ['Das Traders', '9435012345', 'Fancy Bazar', '781001'] },
  { id: 's-1407', user: 'u-priya', mode: 'AIR', from: 'Ahmedabad', to: 'Kolkata', kg: 50, cargo: 'DOCUMENTS', speed: 'EXPRESS', status: 'PICKUP_SCHEDULED', booked: '2026-09-29T18:40:00Z', method: 'DEBIT_CARD', sender: ['Priya Sharma', '9876543210', '12 CG Road, Navrangpura', '380009'], receiver: ['R. Sen & Co.', '9831011111', 'Park Street, 22A', '700016'] },
  { id: 's-1408', user: 'u-vikram', mode: 'ROAD', from: 'Bengaluru', to: 'Kochi', kg: 300, cargo: 'HEAVY', speed: 'STANDARD', status: 'PENDING_PAYMENT', booked: '2026-09-30T08:15:00Z', sender: ['Vikram Iyer', '9900077881', 'Whitefield Industrial Area', '560066'], receiver: ['Harbour Works', '9847012345', 'Willingdon Island', '682003'] },
];

const STAGES = ['ORDER_CONFIRMED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'REACHED_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const;

const addHours = (iso: string, h: number) => new Date(Date.parse(iso) + h * 3600_000).toISOString().replace('.000Z', 'Z');

export function buildSampleSql(): string {
  const out: string[] = [];
  for (const [id, name, email, phone, at] of USERS) {
    out.push(row('users', ['id', 'name', 'email', 'phone', 'password_hash', 'google_id', 'created_at', 'updated_at'], [id, name, email, phone, `scrypt$16384$8$1$${id}-salt$${id}-hash`, null, at, at]));
  }
  out.push(row('sessions', ['token_hash', 'user_id', 'expires_at', 'created_at'], ['9f2c1e7b8a4d6f03c5e2b1a0d9c8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0', 'u-priya', '2026-10-14T09:00:00Z', '2026-09-30T09:00:00Z']));

  let seq = 1400;
  let pay = 0;
  for (const s of SHIPMENTS) {
    const a = cityByName(s.from);
    const b = cityByName(s.to);
    const quote = calculateQuote({
      mode: s.mode,
      pickupState: a.state,
      destinationState: b.state,
      weightKg: s.kg,
      cargoType: s.cargo,
      speed: s.speed,
      pickupCoords: a.coords,
      destinationCoords: b.coords,
    });
    const paid = s.status !== 'PENDING_PAYMENT';
    const paidAt = paid ? addHours(s.booked, 0.2) : null;
    const tracking = paid ? `YA2-2026-${String(++seq).padStart(6, '0')}` : null;
    const eta = paid ? addHours(s.booked, 24 * (quote.transitDays[1] + 1)) : null;
    out.push(
      row(
        'shipments',
        ['id', 'user_id', 'booking_id', 'tracking_id', 'status', 'mode', 'speed', 'cargo_type', 'weight_kg', 'sender_name', 'sender_phone', 'sender_address', 'sender_city', 'sender_state', 'sender_pincode', 'receiver_name', 'receiver_phone', 'receiver_address', 'receiver_city', 'receiver_state', 'receiver_pincode', 'price', 'breakdown_json', 'estimated_delivery', 'created_at', 'paid_at'],
        [
          s.id, s.user, `BK-2026-${s.id.slice(2)}A`, tracking, s.status, s.mode, s.speed, s.cargo, s.kg,
          s.sender[0], s.sender[1], s.sender[2], s.from, a.state, s.sender[3],
          s.receiver[0], s.receiver[1], s.receiver[2], s.to, b.state, s.receiver[3],
          quote.total,
          JSON.stringify({ basePrice: quote.basePrice, distanceFactor: quote.distanceFactor, serviceFactor: quote.serviceFactor, urgencyFactor: quote.urgencyFactor, total: quote.total, transit: quote.transitLabel }),
          eta, s.booked, paidAt,
        ],
      ),
    );
    if (paid) {
      pay += 1;
      out.push(
        row('payments', ['id', 'shipment_id', 'user_id', 'provider', 'order_id', 'amount', 'status', 'method', 'provider_payment_id', 'created_at', 'paid_at'], [
          `p-${pay}`, s.id, s.user, 'demo', `demo_order_${s.id.slice(2)}`, quote.total, 'PAID', s.method ?? 'UPI', `demo_pay_${s.id.slice(2)}`, addHours(s.booked, 0.1), paidAt,
        ]),
      );
      const reached = STAGES.indexOf(s.status as (typeof STAGES)[number]);
      const places = [s.from, s.from, s.from, `En route to ${s.to}`, `${s.to} hub`, s.to, s.to];
      const gaps = [0.2, 0.25, 18, 26, 40, 46, 50];
      for (let i = 0; i <= reached; i++) {
        out.push(row('shipment_events', ['shipment_id', 'stage', 'event_at', 'location', 'note'], [s.id, STAGES[i], addHours(s.booked, gaps[i] * (s.mode === 'AIR' ? 0.5 : 1)), places[i], i === 0 ? `Booking confirmed` : null]));
      }
    }
  }
  out.push(`UPDATE counters SET value = ${seq} WHERE name = 'tracking_seq';`);

  const ENQ: [string, string, string, string, string, string][] = [
    ['2026-09-21T10:12:00Z', 'Rahul Verma', 'rahul@example.com', '9811122233', 'Weekly Surat to Pune', 'We need a quote for about 2 tonnes of fabric every week from Surat to Pune. Do you offer a monthly contract rate?'],
    ['2026-09-23T14:40:00Z', 'Neha Gupta', 'neha@example.com', '9899011122', 'Shifting 2BHK Delhi to Jaipur', 'Planning to move a 2BHK in the second week of October. Can your team do a video survey this weekend?'],
    ['2026-09-25T09:05:00Z', 'Arjun Mehta', 'arjun@example.com', '', 'Office relocation', 'Office of 40 desks with IT equipment in Ahmedabad, moving within the city. Please call to discuss a Saturday move.'],
    ['2026-09-27T17:30:00Z', 'Priya Sharma', 'priya@example.com', '9876543210', 'Invoice copy for YA2-2026-001401', 'Please email a GST invoice for my Ahmedabad to Delhi air shipment.'],
    ['2026-09-29T11:48:00Z', 'Sourav Banerjee', 'sourav@example.com', '9830066778', 'Delivery time to Guwahati', 'My Kolkata to Guwahati consignment has reached the hub. When will it be out for delivery?'],
  ];
  ENQ.forEach(([at, name, email, phone, subject, message], i) =>
    out.push(row('contact_messages', ['id', 'name', 'email', 'phone', 'subject', 'message', 'created_at'], [`m-${i + 1}`, name, email, phone || null, subject, message, at])),
  );

  const QUOTES: [string, TransportMode, string, string, number, CargoType, DeliverySpeed, string][] = [
    ['u-rakesh', 'ROAD', 'Surat', 'Jaipur', 600, 'COMMERCIAL', 'STANDARD', '2026-09-22T12:00:00Z'],
    ['u-ananya', 'MOVERS', 'Pune', 'Bengaluru', 1500, 'HOUSEHOLD', 'STANDARD', '2026-09-16T19:10:00Z'],
    ['u-vikram', 'AIR', 'Bengaluru', 'New Delhi', 20, 'FRAGILE', 'EXPRESS', '2026-09-28T08:25:00Z'],
    ['u-farah', 'ROAD', 'Lucknow', 'Kolkata', 250, 'PARCEL', 'STANDARD', '2026-09-25T16:00:00Z'],
  ];
  QUOTES.forEach(([user, mode, from, to, kg, cargo, speed, at], i) => {
    const a = cityByName(from);
    const b = cityByName(to);
    const r = calculateQuote({ mode, pickupState: a.state, destinationState: b.state, weightKg: kg, cargoType: cargo, speed, pickupCoords: a.coords, destinationCoords: b.coords });
    out.push(
      row('quotes', ['id', 'user_id', 'mode', 'pickup_state', 'destination_state', 'pickup_city', 'destination_city', 'weight_kg', 'cargo_type', 'speed', 'total', 'transit_label', 'created_at'], [
        `q-${i + 1}`, user, mode, a.state, b.state, from, to, kg, cargo, speed, r.total, r.transitLabel, at,
      ]),
    );
  });

  const ADDR: [string, string, string, string, string, string, string, string][] = [
    ['u-priya', 'Home', 'Priya Sharma', '9876543210', '12 CG Road, Navrangpura', 'Ahmedabad', 'Gujarat', '380009'],
    ['u-rakesh', 'Warehouse', 'Rakesh Patel', '9925011223', 'Ring Road Textile Market', 'Surat', 'Gujarat', '395002'],
    ['u-ananya', 'New home', 'Ananya Kulkarni', '9822044556', 'Gachibowli, Plot 17', 'Hyderabad', 'Telangana', '500032'],
    ['u-vikram', 'Factory', 'Vikram Iyer', '9900077881', 'Whitefield Industrial Area', 'Bengaluru', 'Karnataka', '560066'],
    ['u-sourav', 'Shop', 'Sourav Banerjee', '9830066778', 'Burrabazar, 3rd Lane', 'Kolkata', 'West Bengal', '700007'],
  ];
  ADDR.forEach(([user, label, name, phone, line1, city, state, pin], i) =>
    out.push(row('addresses', ['id', 'user_id', 'label', 'name', 'phone', 'line1', 'city', 'state', 'pincode', 'created_at'], [`a-${i + 1}`, user, label, name, phone, line1, city, state, pin, '2026-09-20T10:00:00Z'])),
  );

  return out.join('\n');
}
