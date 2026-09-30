-- ============================================================================
-- YA² Transport — Oracle Database export
-- Exported 2026-09-30 15:11 UTC from ya2final@localhost:1521/FREEPDB1
--
-- Every row below was saved by the website (sign-up, booking, payment,
-- tracking, contact form). Run this whole file in SQL Developer (F5) or
-- SQL*Plus (@YA2-Oracle-Database.sql) to recreate the same database.
-- Login sessions and password-reset tokens are not exported.
--
--   ya2_users              5 rows
--   ya2_addresses          5 rows
--   ya2_quotes             4 rows
--   ya2_shipments          8 rows
--   ya2_shipment_events    14 rows
--   ya2_payments           7 rows
--   ya2_contact_messages   3 rows
--   ya2_activity           36 rows
-- ============================================================================

SET DEFINE OFF

-- ---------------------------------------------------------------- 1. Tables
CREATE TABLE ya2_users (
  id             VARCHAR2(36)  PRIMARY KEY,
  name           VARCHAR2(120) NOT NULL,
  email          VARCHAR2(254) NOT NULL,
  phone          VARCHAR2(20),
  password_hash  VARCHAR2(255),
  google_id      VARCHAR2(64),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT ya2_users_email_uk UNIQUE (email),
  CONSTRAINT ya2_users_google_uk UNIQUE (google_id)
);

CREATE TABLE ya2_sessions (
  token_hash  VARCHAR2(64) PRIMARY KEY,
  user_id     VARCHAR2(36) NOT NULL REFERENCES ya2_users (id) ON DELETE CASCADE,
  expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL
);
CREATE INDEX ya2_sessions_user_ix ON ya2_sessions (user_id);

CREATE TABLE ya2_password_resets (
  token_hash  VARCHAR2(64) PRIMARY KEY,
  user_id     VARCHAR2(36) NOT NULL REFERENCES ya2_users (id) ON DELETE CASCADE,
  expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at     TIMESTAMP WITH TIME ZONE
);

CREATE TABLE ya2_addresses (
  id          VARCHAR2(36)  PRIMARY KEY,
  user_id     VARCHAR2(36)  NOT NULL REFERENCES ya2_users (id) ON DELETE CASCADE,
  label       VARCHAR2(40)  NOT NULL,
  name        VARCHAR2(120) NOT NULL,
  phone       VARCHAR2(20)  NOT NULL,
  line1       VARCHAR2(300) NOT NULL,
  city        VARCHAR2(80)  NOT NULL,
  state       VARCHAR2(80)  NOT NULL,
  pincode     VARCHAR2(6)   NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL
);
CREATE INDEX ya2_addresses_user_ix ON ya2_addresses (user_id);

CREATE TABLE ya2_quotes (
  id                 VARCHAR2(36) PRIMARY KEY,
  user_id            VARCHAR2(36) NOT NULL REFERENCES ya2_users (id) ON DELETE CASCADE,
  mode_code          VARCHAR2(10) NOT NULL,
  pickup_state       VARCHAR2(80) NOT NULL,
  destination_state  VARCHAR2(80) NOT NULL,
  pickup_city        VARCHAR2(80),
  destination_city   VARCHAR2(80),
  weight_kg          NUMBER(10,2) NOT NULL,
  cargo_type         VARCHAR2(20) NOT NULL,
  speed              VARCHAR2(10) NOT NULL,
  total              NUMBER(12)   NOT NULL,
  transit_label      VARCHAR2(40) NOT NULL,
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL
);
CREATE INDEX ya2_quotes_user_ix ON ya2_quotes (user_id);

CREATE SEQUENCE ya2_tracking_seq START WITH 1408 INCREMENT BY 1 NOCACHE;

CREATE TABLE ya2_shipments (
  id                  VARCHAR2(36) PRIMARY KEY,
  user_id             VARCHAR2(36) NOT NULL REFERENCES ya2_users (id),
  booking_id          VARCHAR2(20) NOT NULL,
  tracking_id         VARCHAR2(20),
  status              VARCHAR2(20) NOT NULL,
  mode_code           VARCHAR2(10) NOT NULL,
  speed               VARCHAR2(10) NOT NULL,
  cargo_type          VARCHAR2(20) NOT NULL,
  weight_kg           NUMBER(10,2) NOT NULL,
  pickup_state        VARCHAR2(80) NOT NULL,
  destination_state   VARCHAR2(80) NOT NULL,
  sender_json         CLOB CHECK (sender_json IS JSON),
  receiver_json       CLOB CHECK (receiver_json IS JSON),
  breakdown_json      CLOB CHECK (breakdown_json IS JSON),
  price               NUMBER(12)   NOT NULL,
  estimated_delivery  TIMESTAMP WITH TIME ZONE,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
  paid_at             TIMESTAMP WITH TIME ZONE,
  CONSTRAINT ya2_shipments_booking_uk UNIQUE (booking_id),
  CONSTRAINT ya2_shipments_tracking_uk UNIQUE (tracking_id)
);
CREATE INDEX ya2_shipments_user_ix ON ya2_shipments (user_id);

CREATE TABLE ya2_shipment_events (
  id           NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  shipment_id  VARCHAR2(36) NOT NULL REFERENCES ya2_shipments (id) ON DELETE CASCADE,
  stage        VARCHAR2(20) NOT NULL,
  event_at     TIMESTAMP WITH TIME ZONE NOT NULL,
  location     VARCHAR2(120) NOT NULL,
  note         VARCHAR2(300)
);
CREATE INDEX ya2_events_shipment_ix ON ya2_shipment_events (shipment_id, event_at);

CREATE TABLE ya2_payments (
  id                   VARCHAR2(36) PRIMARY KEY,
  shipment_id          VARCHAR2(36) NOT NULL REFERENCES ya2_shipments (id),
  user_id              VARCHAR2(36) NOT NULL REFERENCES ya2_users (id),
  provider             VARCHAR2(12) NOT NULL,
  order_id             VARCHAR2(64) NOT NULL,
  amount               NUMBER(12)   NOT NULL,
  status               VARCHAR2(10) NOT NULL,
  method               VARCHAR2(20),
  provider_payment_id  VARCHAR2(64),
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
  paid_at              TIMESTAMP WITH TIME ZONE,
  CONSTRAINT ya2_payments_order_uk UNIQUE (order_id)
);

CREATE TABLE ya2_contact_messages (
  id          VARCHAR2(36)   PRIMARY KEY,
  name        VARCHAR2(120)  NOT NULL,
  email       VARCHAR2(254)  NOT NULL,
  phone       VARCHAR2(20),
  subject     VARCHAR2(200)  NOT NULL,
  message     VARCHAR2(4000) NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE TABLE ya2_activity (
  id          VARCHAR2(36)  PRIMARY KEY,
  user_id     VARCHAR2(36)  NOT NULL REFERENCES ya2_users (id) ON DELETE CASCADE,
  type        VARCHAR2(20)  NOT NULL,
  title       VARCHAR2(200) NOT NULL,
  detail      VARCHAR2(500),
  ref         VARCHAR2(40),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL
);
CREATE INDEX ya2_activity_user_ix ON ya2_activity (user_id, created_at);

-- ------------------------------------------------------------------ 2. Data

-- ya2_users (5 rows)
INSERT INTO ya2_users (id, name, email, phone, password_hash, google_id, created_at, updated_at) VALUES ('eeb10bcf-b06a-4a77-a32a-cb824f6fe8cd', 'Aarav Mehta', 'aarav.mehta@example.com', '9810012345', 'scrypt$16384$8$1$NDqnYAb7SGbKqVdBNPX4JA==$qfwKeNSAw+QU0TXUZonzmgC1r3P19ECwFt2mFSv+ENAVdZYODLDWm+8UDnfmXynzikddfFGuCQt6ovRYwHjClg==', NULL, TIMESTAMP '2026-09-30 15:11:34.102 +00:00', TIMESTAMP '2026-09-30 15:11:34.102 +00:00');
INSERT INTO ya2_users (id, name, email, phone, password_hash, google_id, created_at, updated_at) VALUES ('a4116f1d-e98d-4269-9fe1-fbf32baacd4f', 'Priya S. Nair', 'priya.nair@example.com', '9820034567', 'scrypt$16384$8$1$lLSkTwLj1a1eZVnynBynMw==$WqYNE0nWsAW8Y9kfUyBS1cij2t0PQBFTrVAiDpKycpo5HzUmOWet7nb+uSHh4dgnXOXd4angb+K3Sm6W8P/H8A==', NULL, TIMESTAMP '2026-09-30 15:11:34.534 +00:00', TIMESTAMP '2026-09-30 15:11:46.848 +00:00');
INSERT INTO ya2_users (id, name, email, phone, password_hash, google_id, created_at, updated_at) VALUES ('95762ece-eca3-49c6-ac9f-060361428c2a', 'Rahul Verma', 'rahul.verma@example.com', '9830056789', 'scrypt$16384$8$1$O6Tl6o5ExKP5cp/SmzeTKQ==$8ZWnZKnXX+ClrelxwAL5Pp41Hn0/kTojmeKFo0AQ8poYyLfnwnkdwt9lNCQXWrLfUraAhV5yEufcTnwpgZF9Vw==', NULL, TIMESTAMP '2026-09-30 15:11:34.676 +00:00', TIMESTAMP '2026-09-30 15:11:47.065 +00:00');
INSERT INTO ya2_users (id, name, email, phone, password_hash, google_id, created_at, updated_at) VALUES ('f0061fe2-e76f-46dc-9f37-d8f0cb09fefa', 'Sneha Reddy', 'sneha.reddy@example.com', '9840078901', 'scrypt$16384$8$1$D9KbiaIrKmQTpctfAtPngA==$jojoi5MT2SUkxEi6QsWvdAj//1ODrGEyCfiDN9//MqG1p6vKbBBo4h9N1Npdt7wvXZbh3ez7LZSxTR9ADNndfg==', NULL, TIMESTAMP '2026-09-30 15:11:34.816 +00:00', TIMESTAMP '2026-09-30 15:11:34.816 +00:00');
INSERT INTO ya2_users (id, name, email, phone, password_hash, google_id, created_at, updated_at) VALUES ('d9658148-77c1-42af-b394-bcdcfb0bb6a3', 'Imran Khan', 'imran.khan@example.com', '9850090123', 'scrypt$16384$8$1$OrSbNP9st/Ge71+LUuDXvw==$HULzG9aWbteaMwgv5KT5nYkw5dIxvVcGSTM9KIJJT0KyfPozMcs98kVszlI7/4zkNybM6+18ywijpQ6M2feXEA==', NULL, TIMESTAMP '2026-09-30 15:11:35.036 +00:00', TIMESTAMP '2026-09-30 15:11:35.036 +00:00');

-- ya2_addresses (5 rows)
INSERT INTO ya2_addresses (id, user_id, label, name, phone, line1, city, state, pincode, created_at) VALUES ('9ed1272b-f3e5-4c9c-838f-232a1df1d802', 'eeb10bcf-b06a-4a77-a32a-cb824f6fe8cd', 'Home', 'Aarav Mehta', '9810012345', 'B-42, Lajpat Nagar II', 'New Delhi', 'Delhi', '110024', TIMESTAMP '2026-09-30 15:11:34.204 +00:00');
INSERT INTO ya2_addresses (id, user_id, label, name, phone, line1, city, state, pincode, created_at) VALUES ('03b8d96c-2fb2-4590-89aa-364f5156d6eb', 'a4116f1d-e98d-4269-9fe1-fbf32baacd4f', 'Office', 'Priya Nair', '9820034567', '301, Hiranandani Business Park, Powai', 'Mumbai', 'Maharashtra', '400076', TIMESTAMP '2026-09-30 15:11:34.604 +00:00');
INSERT INTO ya2_addresses (id, user_id, label, name, phone, line1, city, state, pincode, created_at) VALUES ('d359cfc6-12fa-4daa-b65a-7f5c47e512b1', '95762ece-eca3-49c6-ac9f-060361428c2a', 'Home', 'Rahul Verma', '9830056789', '18 Park Street', 'Kolkata', 'West Bengal', '700016', TIMESTAMP '2026-09-30 15:11:34.748 +00:00');
INSERT INTO ya2_addresses (id, user_id, label, name, phone, line1, city, state, pincode, created_at) VALUES ('99cab2b1-8903-46b9-9d75-1697183e8e29', 'f0061fe2-e76f-46dc-9f37-d8f0cb09fefa', 'Home', 'Sneha Reddy', '9840078901', 'Flat 5C, Jubilee Hills Road 36', 'Hyderabad', 'Telangana', '500033', TIMESTAMP '2026-09-30 15:11:34.893 +00:00');
INSERT INTO ya2_addresses (id, user_id, label, name, phone, line1, city, state, pincode, created_at) VALUES ('8ac213e1-b6df-4024-962e-a7093e8ad577', 'd9658148-77c1-42af-b394-bcdcfb0bb6a3', 'Warehouse', 'Imran Khan', '9850090123', 'Gate 3, Chakan MIDC Phase II', 'Pune', 'Maharashtra', '410501', TIMESTAMP '2026-09-30 15:11:35.107 +00:00');

-- ya2_quotes (4 rows)
INSERT INTO ya2_quotes (id, user_id, mode_code, pickup_state, destination_state, pickup_city, destination_city, weight_kg, cargo_type, speed, total, transit_label, created_at) VALUES ('cb5cb414-19ea-42b9-80dc-bde63b08d6a4', 'eeb10bcf-b06a-4a77-a32a-cb824f6fe8cd', 'AIR', 'Delhi', 'Karnataka', 'New Delhi', 'Bengaluru', 25, 'PARCEL', 'EXPRESS', 11719, '2–3 Business Days', TIMESTAMP '2026-09-30 15:11:34.226 +00:00');
INSERT INTO ya2_quotes (id, user_id, mode_code, pickup_state, destination_state, pickup_city, destination_city, weight_kg, cargo_type, speed, total, transit_label, created_at) VALUES ('f2cd6c6f-7465-459a-95f5-b5f9894d1bcd', 'a4116f1d-e98d-4269-9fe1-fbf32baacd4f', 'ROAD', 'Maharashtra', 'Gujarat', 'Mumbai', 'Ahmedabad', 300, 'COMMERCIAL', 'STANDARD', 36300, '2–3 Business Days', TIMESTAMP '2026-09-30 15:11:34.615 +00:00');
INSERT INTO ya2_quotes (id, user_id, mode_code, pickup_state, destination_state, pickup_city, destination_city, weight_kg, cargo_type, speed, total, transit_label, created_at) VALUES ('b08a276e-9022-4576-98a1-9b96093d63bd', '95762ece-eca3-49c6-ac9f-060361428c2a', 'ROAD', 'West Bengal', 'Odisha', 'Kolkata', 'Bhubaneswar', 800, 'HOUSEHOLD', 'STANDARD', 101200, '2–3 Business Days', TIMESTAMP '2026-09-30 15:11:34.756 +00:00');
INSERT INTO ya2_quotes (id, user_id, mode_code, pickup_state, destination_state, pickup_city, destination_city, weight_kg, cargo_type, speed, total, transit_label, created_at) VALUES ('e99e535f-5e24-4601-b52c-47a94b6a0c0f', 'f0061fe2-e76f-46dc-9f37-d8f0cb09fefa', 'AIR', 'Telangana', 'Delhi', 'Hyderabad', 'New Delhi', 40, 'PARCEL', 'STANDARD', 13500, '2–3 Business Days', TIMESTAMP '2026-09-30 15:11:34.907 +00:00');

-- ya2_shipments (8 rows)
INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at) VALUES ('aff89843-f29e-4925-9250-081705b026f4', 'eeb10bcf-b06a-4a77-a32a-cb824f6fe8cd', 'BK-2026-A21006', 'YA2-2026-001401', 'PICKUP_SCHEDULED', 'ROAD', 'STANDARD', 'HOUSEHOLD', 1500, 'Delhi', 'Rajasthan', '{"name":"Aarav Mehta","phone":"9810012345","address":"B-42, Lajpat Nagar II","city":"New Delhi","state":"Delhi","pincode":"110024"}', '{"name":"Kavya Mehta","phone":"9829011111","address":"14 Civil Lines","city":"Jaipur","state":"Rajasthan","pincode":"302006"}', '{"input":{"mode":"ROAD","cargoType":"HOUSEHOLD","speed":"STANDARD","weightKg":1500,"pickupState":"Delhi","destinationState":"Rajasthan","pickupCoords":[28.61,77.21],"destinationCoords":[26.91,75.79]},"basePrice":150000,"distanceKm":235,"routeKm":294,"band":"NEARBY","bandLabel":"Nearby state","distanceFactor":1.1,"distanceAdjustment":15000,"serviceFactor":1.15,"serviceAdjustment":24750,"urgencyFactor":1,"urgencyAdjustment":0,"total":189750,"transitDays":[2,3],"transitLabel":"2–3 Business Days"}', 189750, TIMESTAMP '2026-10-05 18:00:00.000 +00:00', TIMESTAMP '2026-09-30 15:11:34.247 +00:00', TIMESTAMP '2026-09-30 15:11:34.427 +00:00');
INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at) VALUES ('d959d38e-340c-4fbe-aa99-f4c5004d847e', 'eeb10bcf-b06a-4a77-a32a-cb824f6fe8cd', 'BK-2026-795CF5', 'YA2-2026-001402', 'PICKUP_SCHEDULED', 'AIR', 'PRIORITY', 'DOCUMENTS', 2, 'Delhi', 'Karnataka', '{"name":"Aarav Mehta","phone":"9810012345","address":"B-42, Lajpat Nagar II","city":"New Delhi","state":"Delhi","pincode":"110024"}', '{"name":"Rohan Iyer","phone":"9845022222","address":"7 Residency Road","city":"Bengaluru","state":"Karnataka","pincode":"560025"}', '{"input":{"mode":"AIR","cargoType":"DOCUMENTS","speed":"PRIORITY","weightKg":2,"pickupState":"Delhi","destinationState":"Karnataka","pickupCoords":[28.61,77.21],"destinationCoords":[12.97,77.59]},"basePrice":500,"distanceKm":1740,"routeKm":1740,"band":"VERY_LONG","bandLabel":"Very long distance","distanceFactor":1.5,"distanceAdjustment":250,"serviceFactor":0.9,"serviceAdjustment":-75,"urgencyFactor":1.5,"urgencyAdjustment":338,"total":1013,"transitDays":[2,3],"transitLabel":"2–3 Business Days"}', 1013, TIMESTAMP '2026-10-05 18:00:00.000 +00:00', TIMESTAMP '2026-09-30 15:11:34.478 +00:00', TIMESTAMP '2026-09-30 15:11:34.509 +00:00');
INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at) VALUES ('4b9fa6c4-8e1e-4844-a2ba-a32208f2da22', 'a4116f1d-e98d-4269-9fe1-fbf32baacd4f', 'BK-2026-0FDF58', 'YA2-2026-001403', 'PICKUP_SCHEDULED', 'ROAD', 'EXPRESS', 'COMMERCIAL', 450, 'Maharashtra', 'Gujarat', '{"name":"Priya Nair","phone":"9820034567","address":"301, Hiranandani Business Park, Powai","city":"Mumbai","state":"Maharashtra","pincode":"400076"}', '{"name":"Nair Textiles","phone":"9879033333","address":"22 Ashram Road","city":"Ahmedabad","state":"Gujarat","pincode":"380009"}', '{"input":{"mode":"ROAD","cargoType":"COMMERCIAL","speed":"EXPRESS","weightKg":450,"pickupState":"Maharashtra","destinationState":"Gujarat","pickupCoords":[19.08,72.88],"destinationCoords":[23.02,72.57]},"basePrice":45000,"distanceKm":439,"routeKm":549,"band":"NEARBY","bandLabel":"Nearby state","distanceFactor":1.1,"distanceAdjustment":4500,"serviceFactor":1.1,"serviceAdjustment":4950,"urgencyFactor":1.25,"urgencyAdjustment":13613,"total":68063,"transitDays":[2,3],"transitLabel":"2–3 Business Days"}', 68063, TIMESTAMP '2026-10-05 18:00:00.000 +00:00', TIMESTAMP '2026-09-30 15:11:34.622 +00:00', TIMESTAMP '2026-09-30 15:11:34.642 +00:00');
INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at) VALUES ('5c757f4e-5972-4b9a-b45b-c94ae6129ee7', 'a4116f1d-e98d-4269-9fe1-fbf32baacd4f', 'BK-2026-EE6AB9', NULL, 'PENDING_PAYMENT', 'AIR', 'EXPRESS', 'FRAGILE', 18, 'Maharashtra', 'Kerala', '{"name":"Priya Nair","phone":"9820034567","address":"301, Hiranandani Business Park, Powai","city":"Mumbai","state":"Maharashtra","pincode":"400076"}', '{"name":"Anil Nair","phone":"9847044444","address":"TC 12/450, Pattom","city":"Thiruvananthapuram","state":"Kerala","pincode":"695004"}', '{"input":{"mode":"AIR","cargoType":"FRAGILE","speed":"EXPRESS","weightKg":18,"pickupState":"Maharashtra","destinationState":"Kerala","pickupCoords":[19.08,72.88],"destinationCoords":[8.52,76.94]},"basePrice":4500,"distanceKm":1253,"routeKm":1253,"band":"LONG","bandLabel":"Long distance","distanceFactor":1.35,"distanceAdjustment":1575,"serviceFactor":1.25,"serviceAdjustment":1519,"urgencyFactor":1.25,"urgencyAdjustment":1898,"total":9492,"transitDays":[2,3],"transitLabel":"2–3 Business Days"}', 9492, NULL, TIMESTAMP '2026-09-30 15:11:34.667 +00:00', NULL);
INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at) VALUES ('199213ef-81b0-4cc9-96cc-a166e70ef81f', '95762ece-eca3-49c6-ac9f-060361428c2a', 'BK-2026-E68269', 'YA2-2026-001404', 'PICKUP_SCHEDULED', 'ROAD', 'STANDARD', 'HEAVY', 2200, 'West Bengal', 'Odisha', '{"name":"Rahul Verma","phone":"9830056789","address":"18 Park Street","city":"Kolkata","state":"West Bengal","pincode":"700016"}', '{"name":"Verma Engineering","phone":"9437055555","address":"Plot 9, Chandaka Industrial Estate","city":"Bhubaneswar","state":"Odisha","pincode":"751024"}', '{"input":{"mode":"ROAD","cargoType":"HEAVY","speed":"STANDARD","weightKg":2200,"pickupState":"West Bengal","destinationState":"Odisha","pickupCoords":[22.57,88.36],"destinationCoords":[20.3,85.82]},"basePrice":220000,"distanceKm":364,"routeKm":455,"band":"NEARBY","bandLabel":"Nearby state","distanceFactor":1.1,"distanceAdjustment":22000,"serviceFactor":1.3,"serviceAdjustment":72600,"urgencyFactor":1,"urgencyAdjustment":0,"total":314600,"transitDays":[2,3],"transitLabel":"2–3 Business Days"}', 314600, TIMESTAMP '2026-10-05 18:00:00.000 +00:00', TIMESTAMP '2026-09-30 15:11:34.765 +00:00', TIMESTAMP '2026-09-30 15:11:34.790 +00:00');
INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at) VALUES ('7378e3f6-3351-4466-9059-9e0e2da2fa2e', 'f0061fe2-e76f-46dc-9f37-d8f0cb09fefa', 'BK-2026-23F4DA', 'YA2-2026-001405', 'PICKUP_SCHEDULED', 'AIR', 'STANDARD', 'PARCEL', 35, 'Telangana', 'Delhi', '{"name":"Sneha Reddy","phone":"9840078901","address":"Flat 5C, Jubilee Hills Road 36","city":"Hyderabad","state":"Telangana","pincode":"500033"}', '{"name":"Vikram Reddy","phone":"9811066666","address":"56 Hauz Khas Village","city":"New Delhi","state":"Delhi","pincode":"110016"}', '{"input":{"mode":"AIR","cargoType":"PARCEL","speed":"STANDARD","weightKg":35,"pickupState":"Telangana","destinationState":"Delhi","pickupCoords":[17.39,78.49],"destinationCoords":[28.61,77.21]},"basePrice":8750,"distanceKm":1254,"routeKm":1254,"band":"LONG","bandLabel":"Long distance","distanceFactor":1.35,"distanceAdjustment":3063,"serviceFactor":1,"serviceAdjustment":0,"urgencyFactor":1,"urgencyAdjustment":0,"total":11813,"transitDays":[2,3],"transitLabel":"2–3 Business Days"}', 11813, TIMESTAMP '2026-10-05 18:00:00.000 +00:00', TIMESTAMP '2026-09-30 15:11:34.921 +00:00', TIMESTAMP '2026-09-30 15:11:34.950 +00:00');
INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at) VALUES ('69616981-d359-4c7c-94c4-87d3acc8e375', 'f0061fe2-e76f-46dc-9f37-d8f0cb09fefa', 'BK-2026-695261', 'YA2-2026-001406', 'PICKUP_SCHEDULED', 'ROAD', 'STANDARD', 'HOUSEHOLD', 1200, 'Telangana', 'Tamil Nadu', '{"name":"Sneha Reddy","phone":"9840078901","address":"Flat 5C, Jubilee Hills Road 36","city":"Hyderabad","state":"Telangana","pincode":"500033"}', '{"name":"Sneha Reddy","phone":"9840078901","address":"12 Anna Nagar East","city":"Chennai","state":"Tamil Nadu","pincode":"600102"}', '{"input":{"mode":"ROAD","cargoType":"HOUSEHOLD","speed":"STANDARD","weightKg":1200,"pickupState":"Telangana","destinationState":"Tamil Nadu","pickupCoords":[17.39,78.49],"destinationCoords":[13.08,80.27]},"basePrice":120000,"distanceKm":516,"routeKm":645,"band":"MEDIUM","bandLabel":"Medium distance","distanceFactor":1.2,"distanceAdjustment":24000,"serviceFactor":1.15,"serviceAdjustment":21600,"urgencyFactor":1,"urgencyAdjustment":0,"total":165600,"transitDays":[3,5],"transitLabel":"3–5 Business Days"}', 165600, TIMESTAMP '2026-10-07 18:00:00.000 +00:00', TIMESTAMP '2026-09-30 15:11:34.984 +00:00', TIMESTAMP '2026-09-30 15:11:35.013 +00:00');
INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at) VALUES ('0dece2ae-638b-4968-9c8f-c3f7fc807014', 'd9658148-77c1-42af-b394-bcdcfb0bb6a3', 'BK-2026-BEC59A', 'YA2-2026-001407', 'PICKUP_SCHEDULED', 'ROAD', 'PRIORITY', 'COMMERCIAL', 900, 'Maharashtra', 'Karnataka', '{"name":"Imran Khan","phone":"9850090123","address":"Gate 3, Chakan MIDC Phase II","city":"Pune","state":"Maharashtra","pincode":"410501"}', '{"name":"Khan Traders","phone":"9880077777","address":"88 Peenya Industrial Area","city":"Bengaluru","state":"Karnataka","pincode":"560058"}', '{"input":{"mode":"ROAD","cargoType":"COMMERCIAL","speed":"PRIORITY","weightKg":900,"pickupState":"Maharashtra","destinationState":"Karnataka","pickupCoords":[18.52,73.86],"destinationCoords":[12.97,77.59]},"basePrice":90000,"distanceKm":735,"routeKm":919,"band":"MEDIUM","bandLabel":"Medium distance","distanceFactor":1.2,"distanceAdjustment":18000,"serviceFactor":1.1,"serviceAdjustment":10800,"urgencyFactor":1.5,"urgencyAdjustment":59400,"total":178200,"transitDays":[2,3],"transitLabel":"2–3 Business Days"}', 178200, TIMESTAMP '2026-10-05 18:00:00.000 +00:00', TIMESTAMP '2026-09-30 15:11:35.116 +00:00', TIMESTAMP '2026-09-30 15:11:35.138 +00:00');

-- ya2_shipment_events (14 rows)
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('0dece2ae-638b-4968-9c8f-c3f7fc807014', 'ORDER_CONFIRMED', TIMESTAMP '2026-09-30 15:11:35.138 +00:00', 'Pune, Maharashtra', 'Booking BK-2026-BEC59A confirmed');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('0dece2ae-638b-4968-9c8f-c3f7fc807014', 'PICKUP_SCHEDULED', TIMESTAMP '2026-09-30 15:12:35.138 +00:00', 'Pune, Maharashtra', 'Pickup planned for Thu, 1 Oct, 10 AM – 6 PM');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('199213ef-81b0-4cc9-96cc-a166e70ef81f', 'ORDER_CONFIRMED', TIMESTAMP '2026-09-30 15:11:34.790 +00:00', 'Kolkata, West Bengal', 'Booking BK-2026-E68269 confirmed');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('199213ef-81b0-4cc9-96cc-a166e70ef81f', 'PICKUP_SCHEDULED', TIMESTAMP '2026-09-30 15:12:34.790 +00:00', 'Kolkata, West Bengal', 'Pickup planned for Thu, 1 Oct, 10 AM – 6 PM');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('4b9fa6c4-8e1e-4844-a2ba-a32208f2da22', 'ORDER_CONFIRMED', TIMESTAMP '2026-09-30 15:11:34.642 +00:00', 'Mumbai, Maharashtra', 'Booking BK-2026-0FDF58 confirmed');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('4b9fa6c4-8e1e-4844-a2ba-a32208f2da22', 'PICKUP_SCHEDULED', TIMESTAMP '2026-09-30 15:12:34.642 +00:00', 'Mumbai, Maharashtra', 'Pickup planned for Thu, 1 Oct, 10 AM – 6 PM');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('69616981-d359-4c7c-94c4-87d3acc8e375', 'ORDER_CONFIRMED', TIMESTAMP '2026-09-30 15:11:35.013 +00:00', 'Hyderabad, Telangana', 'Booking BK-2026-695261 confirmed');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('69616981-d359-4c7c-94c4-87d3acc8e375', 'PICKUP_SCHEDULED', TIMESTAMP '2026-09-30 15:12:35.013 +00:00', 'Hyderabad, Telangana', 'Pickup planned for Thu, 1 Oct, 10 AM – 6 PM');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('7378e3f6-3351-4466-9059-9e0e2da2fa2e', 'ORDER_CONFIRMED', TIMESTAMP '2026-09-30 15:11:34.950 +00:00', 'Hyderabad, Telangana', 'Booking BK-2026-23F4DA confirmed');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('7378e3f6-3351-4466-9059-9e0e2da2fa2e', 'PICKUP_SCHEDULED', TIMESTAMP '2026-09-30 15:12:34.950 +00:00', 'Hyderabad, Telangana', 'Pickup planned for Thu, 1 Oct, 10 AM – 6 PM');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('aff89843-f29e-4925-9250-081705b026f4', 'ORDER_CONFIRMED', TIMESTAMP '2026-09-30 15:11:34.427 +00:00', 'New Delhi, Delhi', 'Booking BK-2026-A21006 confirmed');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('aff89843-f29e-4925-9250-081705b026f4', 'PICKUP_SCHEDULED', TIMESTAMP '2026-09-30 15:12:34.427 +00:00', 'New Delhi, Delhi', 'Pickup planned for Thu, 1 Oct, 10 AM – 6 PM');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('d959d38e-340c-4fbe-aa99-f4c5004d847e', 'ORDER_CONFIRMED', TIMESTAMP '2026-09-30 15:11:34.509 +00:00', 'New Delhi, Delhi', 'Booking BK-2026-795CF5 confirmed');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('d959d38e-340c-4fbe-aa99-f4c5004d847e', 'PICKUP_SCHEDULED', TIMESTAMP '2026-09-30 15:12:34.509 +00:00', 'New Delhi, Delhi', 'Pickup planned for Thu, 1 Oct, 10 AM – 6 PM');

-- ya2_payments (7 rows)
INSERT INTO ya2_payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at) VALUES ('3f81a7f8-62e7-49f1-ab38-b1d3cca38a40', 'aff89843-f29e-4925-9250-081705b026f4', 'eeb10bcf-b06a-4a77-a32a-cb824f6fe8cd', 'demo', 'demo_order_b4dbda635a8a4466', 189750, 'PAID', 'UPI', 'demo_pay_e75d5f3cfec30380', TIMESTAMP '2026-09-30 15:11:34.408 +00:00', TIMESTAMP '2026-09-30 15:11:34.427 +00:00');
INSERT INTO ya2_payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at) VALUES ('0b6e160f-22f7-4c03-9c0d-26ad76f800f2', 'd959d38e-340c-4fbe-aa99-f4c5004d847e', 'eeb10bcf-b06a-4a77-a32a-cb824f6fe8cd', 'demo', 'demo_order_aa37b2d45b865ae6', 1013, 'PAID', 'CREDIT_CARD', 'demo_pay_577d3541e5f9fd3b', TIMESTAMP '2026-09-30 15:11:34.496 +00:00', TIMESTAMP '2026-09-30 15:11:34.509 +00:00');
INSERT INTO ya2_payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at) VALUES ('70128787-fa1d-4f90-8160-b5fcf1599757', '4b9fa6c4-8e1e-4844-a2ba-a32208f2da22', 'a4116f1d-e98d-4269-9fe1-fbf32baacd4f', 'demo', 'demo_order_3c4fa43475f2e912', 68063, 'PAID', 'NET_BANKING', 'demo_pay_8035666de84ab8ad', TIMESTAMP '2026-09-30 15:11:34.634 +00:00', TIMESTAMP '2026-09-30 15:11:34.642 +00:00');
INSERT INTO ya2_payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at) VALUES ('5a407cff-0b3b-4c96-a524-b69cff1bb39f', '199213ef-81b0-4cc9-96cc-a166e70ef81f', '95762ece-eca3-49c6-ac9f-060361428c2a', 'demo', 'demo_order_a92f0d1fbf023851', 314600, 'PAID', 'DEBIT_CARD', 'demo_pay_01bd73af48013008', TIMESTAMP '2026-09-30 15:11:34.780 +00:00', TIMESTAMP '2026-09-30 15:11:34.790 +00:00');
INSERT INTO ya2_payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at) VALUES ('574d73e7-f0e3-4003-bc82-74845d341013', '7378e3f6-3351-4466-9059-9e0e2da2fa2e', 'f0061fe2-e76f-46dc-9f37-d8f0cb09fefa', 'demo', 'demo_order_b98014c84eb044b2', 11813, 'PAID', 'WALLET', 'demo_pay_0b17aef099488110', TIMESTAMP '2026-09-30 15:11:34.938 +00:00', TIMESTAMP '2026-09-30 15:11:34.950 +00:00');
INSERT INTO ya2_payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at) VALUES ('2ab8323c-7159-48a2-9fec-f6329c6b19c1', '69616981-d359-4c7c-94c4-87d3acc8e375', 'f0061fe2-e76f-46dc-9f37-d8f0cb09fefa', 'demo', 'demo_order_ad92fea63106e6ab', 165600, 'PAID', 'UPI', 'demo_pay_c96783c93d1029cc', TIMESTAMP '2026-09-30 15:11:35.000 +00:00', TIMESTAMP '2026-09-30 15:11:35.013 +00:00');
INSERT INTO ya2_payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at) VALUES ('6cc40f69-88e9-4602-b346-a1c35d111ea5', '0dece2ae-638b-4968-9c8f-c3f7fc807014', 'd9658148-77c1-42af-b394-bcdcfb0bb6a3', 'demo', 'demo_order_c5c02c214733eae9', 178200, 'PAID', 'UPI', 'demo_pay_106b28f78bbdfdb4', TIMESTAMP '2026-09-30 15:11:35.127 +00:00', TIMESTAMP '2026-09-30 15:11:35.138 +00:00');

-- ya2_contact_messages (3 rows)
INSERT INTO ya2_contact_messages (id, name, email, phone, subject, message, created_at) VALUES ('5e0410aa-7ac8-4615-a545-959b603abdfc', 'Meera Joshi', 'meera.joshi@example.com', '9822011223', '3BHK move from Pune to Bengaluru', 'We are moving in November. Please share a quote for packing and road transport of a 3BHK.', TIMESTAMP '2026-09-30 15:11:35.160 +00:00');
INSERT INTO ya2_contact_messages (id, name, email, phone, subject, message, created_at) VALUES ('d2309cd4-1d25-46bc-b128-91de88ae2fcd', 'Suresh Patel', 'suresh.patel@example.com', '9825044556', 'Monthly air cargo contract', 'We ship about 500 kg of pharma samples every month from Ahmedabad to Delhi. Do you offer contract rates?', TIMESTAMP '2026-09-30 15:11:35.170 +00:00');
INSERT INTO ya2_contact_messages (id, name, email, phone, subject, message, created_at) VALUES ('486d0572-3e3b-4ee4-8db2-538bd21394e2', 'Ananya Das', 'ananya.das@example.com', '9831077889', 'Bike transport', 'Can you move a motorcycle from Kolkata to Guwahati? How many days will it take?', TIMESTAMP '2026-09-30 15:11:35.176 +00:00');

-- ya2_activity (36 rows)
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('fd9b7886-5289-4945-b99a-a825e92010db', 'eeb10bcf-b06a-4a77-a32a-cb824f6fe8cd', 'ACCOUNT', 'Account created', 'Signed up with email · a browser on an unknown device', NULL, TIMESTAMP '2026-09-30 15:11:34.175 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('0bc1a281-0ac6-482c-8610-044374bcce1d', 'eeb10bcf-b06a-4a77-a32a-cb824f6fe8cd', 'ADDRESS', 'Address saved: Home', 'B-42, Lajpat Nagar II, New Delhi, Delhi 110024', NULL, TIMESTAMP '2026-09-30 15:11:34.214 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('1f963837-295a-4a10-9cbd-5e7ad15ad2f3', 'eeb10bcf-b06a-4a77-a32a-cb824f6fe8cd', 'QUOTE', 'Quote saved: ₹11,719', 'Air Transport · New Delhi → Bengaluru · 25 kg', NULL, TIMESTAMP '2026-09-30 15:11:34.236 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('3a0c3c5b-882c-44d7-b6f7-06abfb206689', 'eeb10bcf-b06a-4a77-a32a-cb824f6fe8cd', 'BOOKING', 'Booking created: BK-2026-A21006', 'Road Transport · New Delhi → Jaipur · 1500 kg · ₹1,89,750 · awaiting payment', 'BK-2026-A21006', TIMESTAMP '2026-09-30 15:11:34.387 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('78202a4e-15dd-42c5-a3d3-1962a519962d', 'eeb10bcf-b06a-4a77-a32a-cb824f6fe8cd', 'PAYMENT', 'Payment successful: ₹1,89,750', 'UPI · booking BK-2026-A21006 · tracking ID YA2-2026-001401', 'YA2-2026-001401', TIMESTAMP '2026-09-30 15:11:34.470 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('a8062229-e090-40c6-95fe-61836cc49730', 'eeb10bcf-b06a-4a77-a32a-cb824f6fe8cd', 'BOOKING', 'Booking created: BK-2026-795CF5', 'Air Transport · New Delhi → Bengaluru · 2 kg · ₹1,013 · awaiting payment', 'BK-2026-795CF5', TIMESTAMP '2026-09-30 15:11:34.485 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('6baaab8d-7fdd-4711-bf95-17b80ec6389b', 'eeb10bcf-b06a-4a77-a32a-cb824f6fe8cd', 'PAYMENT', 'Payment successful: ₹1,013', 'Credit Card · booking BK-2026-795CF5 · tracking ID YA2-2026-001402', 'YA2-2026-001402', TIMESTAMP '2026-09-30 15:11:34.524 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('b0d31d88-d613-4985-a869-70c511cd895d', 'a4116f1d-e98d-4269-9fe1-fbf32baacd4f', 'ACCOUNT', 'Account created', 'Signed up with email · a browser on an unknown device', NULL, TIMESTAMP '2026-09-30 15:11:34.597 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('0a40df2a-d2ac-4115-a4b4-8bb227634711', 'a4116f1d-e98d-4269-9fe1-fbf32baacd4f', 'ADDRESS', 'Address saved: Office', '301, Hiranandani Business Park, Powai, Mumbai, Maharashtra 400076', NULL, TIMESTAMP '2026-09-30 15:11:34.607 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('fd9df0ff-d34e-4034-ad1a-888b832983d1', 'a4116f1d-e98d-4269-9fe1-fbf32baacd4f', 'QUOTE', 'Quote saved: ₹36,300', 'Road Transport · Mumbai → Ahmedabad · 300 kg', NULL, TIMESTAMP '2026-09-30 15:11:34.616 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('08785645-8008-4cbb-a860-246d0590d979', 'a4116f1d-e98d-4269-9fe1-fbf32baacd4f', 'BOOKING', 'Booking created: BK-2026-0FDF58', 'Road Transport · Mumbai → Ahmedabad · 450 kg · ₹68,063 · awaiting payment', 'BK-2026-0FDF58', TIMESTAMP '2026-09-30 15:11:34.625 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('3a5d27ed-134d-475d-8c9e-b39debafed30', 'a4116f1d-e98d-4269-9fe1-fbf32baacd4f', 'PAYMENT', 'Payment successful: ₹68,063', 'Net Banking · booking BK-2026-0FDF58 · tracking ID YA2-2026-001403', 'YA2-2026-001403', TIMESTAMP '2026-09-30 15:11:34.661 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('125be835-e869-44c9-9f70-62358500c2e1', 'a4116f1d-e98d-4269-9fe1-fbf32baacd4f', 'BOOKING', 'Booking created: BK-2026-EE6AB9', 'Air Transport · Mumbai → Thiruvananthapuram · 18 kg · ₹9,492 · awaiting payment', 'BK-2026-EE6AB9', TIMESTAMP '2026-09-30 15:11:34.670 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('784cb202-8c2a-4365-bbac-aa507c626a2d', '95762ece-eca3-49c6-ac9f-060361428c2a', 'ACCOUNT', 'Account created', 'Signed up with email · a browser on an unknown device', NULL, TIMESTAMP '2026-09-30 15:11:34.740 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('b725b319-589e-4fc0-9613-9baa129f989e', '95762ece-eca3-49c6-ac9f-060361428c2a', 'ADDRESS', 'Address saved: Home', '18 Park Street, Kolkata, West Bengal 700016', NULL, TIMESTAMP '2026-09-30 15:11:34.750 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('af3b3f60-a47f-4e53-a95a-f5a7f1bd48d4', '95762ece-eca3-49c6-ac9f-060361428c2a', 'QUOTE', 'Quote saved: ₹1,01,200', 'Road Transport · Kolkata → Bhubaneswar · 800 kg', NULL, TIMESTAMP '2026-09-30 15:11:34.759 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('1a36791c-41e6-467c-b8e2-645c60cd2fa4', '95762ece-eca3-49c6-ac9f-060361428c2a', 'BOOKING', 'Booking created: BK-2026-E68269', 'Road Transport · Kolkata → Bhubaneswar · 2200 kg · ₹3,14,600 · awaiting payment', 'BK-2026-E68269', TIMESTAMP '2026-09-30 15:11:34.770 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('bb85a216-7999-4593-801b-cc2e2452f143', '95762ece-eca3-49c6-ac9f-060361428c2a', 'PAYMENT', 'Payment successful: ₹3,14,600', 'Debit Card · booking BK-2026-E68269 · tracking ID YA2-2026-001404', 'YA2-2026-001404', TIMESTAMP '2026-09-30 15:11:34.809 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('883e3fab-d904-424c-beab-0ef72a0f0593', 'f0061fe2-e76f-46dc-9f37-d8f0cb09fefa', 'ACCOUNT', 'Account created', 'Signed up with email · a browser on an unknown device', NULL, TIMESTAMP '2026-09-30 15:11:34.882 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('22c20abe-8a26-4b1a-9df1-49c3bc9b4b3e', 'f0061fe2-e76f-46dc-9f37-d8f0cb09fefa', 'ADDRESS', 'Address saved: Home', 'Flat 5C, Jubilee Hills Road 36, Hyderabad, Telangana 500033', NULL, TIMESTAMP '2026-09-30 15:11:34.897 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('5d6837c2-3e6c-4ba3-a9fe-7ab9b0b27133', 'f0061fe2-e76f-46dc-9f37-d8f0cb09fefa', 'QUOTE', 'Quote saved: ₹13,500', 'Air Transport · Hyderabad → New Delhi · 40 kg', NULL, TIMESTAMP '2026-09-30 15:11:34.911 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('4defce21-0e60-4a4b-86d1-6737b9618884', 'f0061fe2-e76f-46dc-9f37-d8f0cb09fefa', 'BOOKING', 'Booking created: BK-2026-23F4DA', 'Air Transport · Hyderabad → New Delhi · 35 kg · ₹11,813 · awaiting payment', 'BK-2026-23F4DA', TIMESTAMP '2026-09-30 15:11:34.927 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('479d5e1a-75a4-47d0-bbfa-e9dd0182e498', 'f0061fe2-e76f-46dc-9f37-d8f0cb09fefa', 'PAYMENT', 'Payment successful: ₹11,813', 'Wallet · booking BK-2026-23F4DA · tracking ID YA2-2026-001405', 'YA2-2026-001405', TIMESTAMP '2026-09-30 15:11:34.975 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('6e9fc3fc-adda-4597-bf28-80e43a6586e6', 'f0061fe2-e76f-46dc-9f37-d8f0cb09fefa', 'BOOKING', 'Booking created: BK-2026-695261', 'Road Transport · Hyderabad → Chennai · 1200 kg · ₹1,65,600 · awaiting payment', 'BK-2026-695261', TIMESTAMP '2026-09-30 15:11:34.989 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('6162c5a8-cdd4-456b-8b4f-1be3c9c4504e', 'f0061fe2-e76f-46dc-9f37-d8f0cb09fefa', 'PAYMENT', 'Payment successful: ₹1,65,600', 'UPI · booking BK-2026-695261 · tracking ID YA2-2026-001406', 'YA2-2026-001406', TIMESTAMP '2026-09-30 15:11:35.030 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('cdd9f17a-674f-4bbb-b9e6-acef96f05df5', 'd9658148-77c1-42af-b394-bcdcfb0bb6a3', 'ACCOUNT', 'Account created', 'Signed up with email · a browser on an unknown device', NULL, TIMESTAMP '2026-09-30 15:11:35.100 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('f7a6a0fd-5bb4-4e6e-8ed3-9d82b3fdbf98', 'd9658148-77c1-42af-b394-bcdcfb0bb6a3', 'ADDRESS', 'Address saved: Warehouse', 'Gate 3, Chakan MIDC Phase II, Pune, Maharashtra 410501', NULL, TIMESTAMP '2026-09-30 15:11:35.109 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('9e103099-4bfc-492d-9512-e699cf65caa4', 'd9658148-77c1-42af-b394-bcdcfb0bb6a3', 'BOOKING', 'Booking created: BK-2026-BEC59A', 'Road Transport · Pune → Bengaluru · 900 kg · ₹1,78,200 · awaiting payment', 'BK-2026-BEC59A', TIMESTAMP '2026-09-30 15:11:35.119 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('957feb58-9bea-4173-8431-653ab754009a', 'd9658148-77c1-42af-b394-bcdcfb0bb6a3', 'PAYMENT', 'Payment successful: ₹1,78,200', 'UPI · booking BK-2026-BEC59A · tracking ID YA2-2026-001407', 'YA2-2026-001407', TIMESTAMP '2026-09-30 15:11:35.154 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('61037ffd-3641-48f3-8eb3-d50542ab23b1', 'eeb10bcf-b06a-4a77-a32a-cb824f6fe8cd', 'SIGN_IN', 'Signed in', 'Email and password · Safari on iPhone/iPad', NULL, TIMESTAMP '2026-09-30 15:11:46.680 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('1ab9d76c-0882-4a28-8bb2-cb38f18c9b00', 'a4116f1d-e98d-4269-9fe1-fbf32baacd4f', 'SECURITY', 'Failed sign-in attempt', 'Wrong password · Chrome on Android', NULL, TIMESTAMP '2026-09-30 15:11:46.763 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('02ef6ab2-b042-482e-bba0-70dc2c2b3d5d', 'a4116f1d-e98d-4269-9fe1-fbf32baacd4f', 'SIGN_IN', 'Signed in', 'Email and password · Safari on Mac', NULL, TIMESTAMP '2026-09-30 15:11:46.833 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('a47b3c8a-266f-434f-b3c6-9cff5ea148e6', 'a4116f1d-e98d-4269-9fe1-fbf32baacd4f', 'PROFILE', 'Profile updated', 'Changed name', NULL, TIMESTAMP '2026-09-30 15:11:46.851 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('f16bbd8f-cbb4-4321-8b35-4b56162aee58', 'a4116f1d-e98d-4269-9fe1-fbf32baacd4f', 'SIGN_OUT', 'Signed out', 'Safari on Mac', NULL, TIMESTAMP '2026-09-30 15:11:46.861 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('2fc76a48-abce-4285-a6a7-9bd081e166fa', '95762ece-eca3-49c6-ac9f-060361428c2a', 'SIGN_IN', 'Signed in', 'Email and password · Edge on Windows', NULL, TIMESTAMP '2026-09-30 15:11:46.937 +00:00');
INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES ('77a5bf91-90d1-4c86-af78-6706981a0766', '95762ece-eca3-49c6-ac9f-060361428c2a', 'SECURITY', 'Password changed', 'Other devices signed out · Edge on Windows', NULL, TIMESTAMP '2026-09-30 15:11:47.079 +00:00');

COMMIT;

-- -------------------------------------------------------- 3. Example queries
-- Customers and their bookings
SELECT u.name AS customer, s.booking_id, s.tracking_id, s.mode_code AS "MODE", s.weight_kg, s.price, s.status
FROM ya2_users u JOIN ya2_shipments s ON s.user_id = u.id
ORDER BY s.created_at;

-- Route of each shipment (sender/receiver are stored as JSON)
SELECT tracking_id, JSON_VALUE(sender_json, '$.city') AS from_city, JSON_VALUE(receiver_json, '$.city') AS to_city, price
FROM ya2_shipments;

-- Revenue by transport mode (paid only)
SELECT s.mode_code AS "MODE", COUNT(*) AS bookings, SUM(p.amount) AS revenue
FROM ya2_payments p JOIN ya2_shipments s ON s.id = p.shipment_id
WHERE p.status = 'PAID'
GROUP BY s.mode_code;

-- Tracking timeline of one shipment
SELECT e.stage, e.event_at, e.location, e.note
FROM ya2_shipment_events e JOIN ya2_shipments s ON s.id = e.shipment_id
WHERE s.tracking_id = (SELECT MIN(tracking_id) FROM ya2_shipments)
ORDER BY e.event_at;

-- Bookings waiting for payment
SELECT booking_id, price, created_at FROM ya2_shipments WHERE status = 'PENDING_PAYMENT';

-- One account's history (dashboard → History): each user only ever sees their own rows
SELECT a.created_at, a.type, a.title, a.detail
FROM ya2_activity a JOIN ya2_users u ON u.id = a.user_id
WHERE u.email = 'aarav.mehta@example.com'
ORDER BY a.created_at DESC;

-- How many history entries each account has
SELECT u.name, u.email, COUNT(a.id) AS history_entries, MAX(a.created_at) AS last_activity
FROM ya2_users u LEFT JOIN ya2_activity a ON a.user_id = u.id
GROUP BY u.name, u.email
ORDER BY last_activity DESC;

-- Enquiries from the contact form
SELECT created_at, name, email, subject FROM ya2_contact_messages ORDER BY created_at DESC;
