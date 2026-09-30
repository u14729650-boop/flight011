-- ============================================================================
-- YA² Transport — Oracle Database export
-- Exported 2026-09-30 12:24 UTC from ya2demo@localhost:1521/FREEPDB1
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

-- ------------------------------------------------------------------ 2. Data

-- ya2_users (5 rows)
INSERT INTO ya2_users (id, name, email, phone, password_hash, google_id, created_at, updated_at) VALUES ('562772af-b6d5-49d4-8d44-9ecb8beb858f', 'Aarav Mehta', 'aarav.mehta@example.com', '9810012345', 'scrypt$16384$8$1$i1Gu3MM6H/TLR3/ysPp4jQ==$RPIx3OOj7Vq5JNWA5N8Umb0zZk0ms3bAMzQUQ0i6XTzKJrXu/fFvdtEIdklcPcIxAFqo1cqNNwudWFAkrd0GWQ==', NULL, TIMESTAMP '2026-09-30 12:24:16.929 +00:00', TIMESTAMP '2026-09-30 12:24:16.929 +00:00');
INSERT INTO ya2_users (id, name, email, phone, password_hash, google_id, created_at, updated_at) VALUES ('61412696-a041-45c7-9c8c-81c2b90ba443', 'Priya Nair', 'priya.nair@example.com', '9820034567', 'scrypt$16384$8$1$FcA+E94mgCTLpVQjtt6tfg==$JQvknIC/FUSFdtj7CF9Ko+15rpWBG6T7gygzGQ3Bw3BlvoyH9M5FEyaLK4kz6IURjDmQ456m4QalFvYA5tJtzA==', NULL, TIMESTAMP '2026-09-30 12:24:17.212 +00:00', TIMESTAMP '2026-09-30 12:24:17.212 +00:00');
INSERT INTO ya2_users (id, name, email, phone, password_hash, google_id, created_at, updated_at) VALUES ('f3a0a0fd-c896-4222-a71e-99fab23cbaf4', 'Rahul Verma', 'rahul.verma@example.com', '9830056789', 'scrypt$16384$8$1$5cwW77xyGNz/bLq/4urVMg==$mqNyauNyVGZNf9GZHbz60bOc+kaaNkDYpadq0ZZ3/tiLqCBuffrQlNt4EBmBMLJrAli5rDdmAw+9Z+JYLYu4og==', NULL, TIMESTAMP '2026-09-30 12:24:17.315 +00:00', TIMESTAMP '2026-09-30 12:24:17.315 +00:00');
INSERT INTO ya2_users (id, name, email, phone, password_hash, google_id, created_at, updated_at) VALUES ('55b4881f-2dbc-4aed-8f1a-f110195c9978', 'Sneha Reddy', 'sneha.reddy@example.com', '9840078901', 'scrypt$16384$8$1$0nqldTMjbjuUvLooR1qxCA==$RrB8NtNAhigANsO5Blhi7LgtEm8CCeAMHP3OoLbjfcs/x45dZ0wFyaAsGICxnhSuU7mkm9pa9bUyyIVJK86EzQ==', NULL, TIMESTAMP '2026-09-30 12:24:17.407 +00:00', TIMESTAMP '2026-09-30 12:24:17.407 +00:00');
INSERT INTO ya2_users (id, name, email, phone, password_hash, google_id, created_at, updated_at) VALUES ('8d9fe91d-cfe4-4d8e-8d58-6fcc66f58007', 'Imran Khan', 'imran.khan@example.com', '9850090123', 'scrypt$16384$8$1$tf0gqNpIodN8MpbsOGZ41w==$11uYedWwYgmrKbOKAschX7MK/QgAhM5gGJYorPOeRLj8cGXQP92Cw+FdB2WuCIJ0AYptCM6BosX9hlBT7VDlrg==', NULL, TIMESTAMP '2026-09-30 12:24:17.528 +00:00', TIMESTAMP '2026-09-30 12:24:17.528 +00:00');

-- ya2_addresses (5 rows)
INSERT INTO ya2_addresses (id, user_id, label, name, phone, line1, city, state, pincode, created_at) VALUES ('58377152-85c4-46ac-9bc9-7f93a5d1d5d1', '562772af-b6d5-49d4-8d44-9ecb8beb858f', 'Home', 'Aarav Mehta', '9810012345', 'B-42, Lajpat Nagar II', 'New Delhi', 'Delhi', '110024', TIMESTAMP '2026-09-30 12:24:17.024 +00:00');
INSERT INTO ya2_addresses (id, user_id, label, name, phone, line1, city, state, pincode, created_at) VALUES ('fd143c26-443f-4d9e-9582-cb8ae1545c74', '61412696-a041-45c7-9c8c-81c2b90ba443', 'Office', 'Priya Nair', '9820034567', '301, Hiranandani Business Park, Powai', 'Mumbai', 'Maharashtra', '400076', TIMESTAMP '2026-09-30 12:24:17.271 +00:00');
INSERT INTO ya2_addresses (id, user_id, label, name, phone, line1, city, state, pincode, created_at) VALUES ('c3a8cb09-ed33-4e24-8ed4-57acd7dc1fa4', 'f3a0a0fd-c896-4222-a71e-99fab23cbaf4', 'Home', 'Rahul Verma', '9830056789', '18 Park Street', 'Kolkata', 'West Bengal', '700016', TIMESTAMP '2026-09-30 12:24:17.372 +00:00');
INSERT INTO ya2_addresses (id, user_id, label, name, phone, line1, city, state, pincode, created_at) VALUES ('5153bf16-4b54-4d15-8d4e-db41599a8000', '55b4881f-2dbc-4aed-8f1a-f110195c9978', 'Home', 'Sneha Reddy', '9840078901', 'Flat 5C, Jubilee Hills Road 36', 'Hyderabad', 'Telangana', '500033', TIMESTAMP '2026-09-30 12:24:17.463 +00:00');
INSERT INTO ya2_addresses (id, user_id, label, name, phone, line1, city, state, pincode, created_at) VALUES ('5b836a34-4c71-46da-8f06-8300831982f2', '8d9fe91d-cfe4-4d8e-8d58-6fcc66f58007', 'Warehouse', 'Imran Khan', '9850090123', 'Gate 3, Chakan MIDC Phase II', 'Pune', 'Maharashtra', '410501', TIMESTAMP '2026-09-30 12:24:17.582 +00:00');

-- ya2_quotes (4 rows)
INSERT INTO ya2_quotes (id, user_id, mode_code, pickup_state, destination_state, pickup_city, destination_city, weight_kg, cargo_type, speed, total, transit_label, created_at) VALUES ('7c2808e0-ec13-4981-8366-946b000129c1', '562772af-b6d5-49d4-8d44-9ecb8beb858f', 'AIR', 'Delhi', 'Karnataka', 'New Delhi', 'Bengaluru', 25, 'PARCEL', 'EXPRESS', 11719, '2–3 Business Days', TIMESTAMP '2026-09-30 12:24:17.035 +00:00');
INSERT INTO ya2_quotes (id, user_id, mode_code, pickup_state, destination_state, pickup_city, destination_city, weight_kg, cargo_type, speed, total, transit_label, created_at) VALUES ('9819992d-ba4f-4775-a0e0-1cd621db1ac2', '61412696-a041-45c7-9c8c-81c2b90ba443', 'ROAD', 'Maharashtra', 'Gujarat', 'Mumbai', 'Ahmedabad', 300, 'COMMERCIAL', 'STANDARD', 36300, '2–3 Business Days', TIMESTAMP '2026-09-30 12:24:17.276 +00:00');
INSERT INTO ya2_quotes (id, user_id, mode_code, pickup_state, destination_state, pickup_city, destination_city, weight_kg, cargo_type, speed, total, transit_label, created_at) VALUES ('16057aa7-7a5f-4724-9004-7136886393c6', 'f3a0a0fd-c896-4222-a71e-99fab23cbaf4', 'ROAD', 'West Bengal', 'Odisha', 'Kolkata', 'Bhubaneswar', 800, 'HOUSEHOLD', 'STANDARD', 101200, '2–3 Business Days', TIMESTAMP '2026-09-30 12:24:17.377 +00:00');
INSERT INTO ya2_quotes (id, user_id, mode_code, pickup_state, destination_state, pickup_city, destination_city, weight_kg, cargo_type, speed, total, transit_label, created_at) VALUES ('7a7955e3-a747-4a0a-a482-8ea37690af28', '55b4881f-2dbc-4aed-8f1a-f110195c9978', 'AIR', 'Telangana', 'Delhi', 'Hyderabad', 'New Delhi', 40, 'PARCEL', 'STANDARD', 13500, '2–3 Business Days', TIMESTAMP '2026-09-30 12:24:17.468 +00:00');

-- ya2_shipments (8 rows)
INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at) VALUES ('82fd92c0-ee4b-4755-b183-38252015a37d', '562772af-b6d5-49d4-8d44-9ecb8beb858f', 'BK-2026-D15926', 'YA2-2026-001401', 'PICKUP_SCHEDULED', 'ROAD', 'STANDARD', 'HOUSEHOLD', 1500, 'Delhi', 'Rajasthan', '{"name":"Aarav Mehta","phone":"9810012345","address":"B-42, Lajpat Nagar II","city":"New Delhi","state":"Delhi","pincode":"110024"}', '{"name":"Kavya Mehta","phone":"9829011111","address":"14 Civil Lines","city":"Jaipur","state":"Rajasthan","pincode":"302006"}', '{"input":{"mode":"ROAD","cargoType":"HOUSEHOLD","speed":"STANDARD","weightKg":1500,"pickupState":"Delhi","destinationState":"Rajasthan","pickupCoords":[28.61,77.21],"destinationCoords":[26.91,75.79]},"basePrice":150000,"distanceKm":235,"routeKm":294,"band":"NEARBY","bandLabel":"Nearby state","distanceFactor":1.1,"distanceAdjustment":15000,"serviceFactor":1.15,"serviceAdjustment":24750,"urgencyFactor":1,"urgencyAdjustment":0,"total":189750,"transitDays":[2,3],"transitLabel":"2–3 Business Days"}', 189750, TIMESTAMP '2026-10-05 18:00:00.000 +00:00', TIMESTAMP '2026-09-30 12:24:17.046 +00:00', TIMESTAMP '2026-09-30 12:24:17.138 +00:00');
INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at) VALUES ('d5086564-6115-4b92-849b-da277c7ba55f', '562772af-b6d5-49d4-8d44-9ecb8beb858f', 'BK-2026-DA46EF', 'YA2-2026-001402', 'PICKUP_SCHEDULED', 'AIR', 'PRIORITY', 'DOCUMENTS', 2, 'Delhi', 'Karnataka', '{"name":"Aarav Mehta","phone":"9810012345","address":"B-42, Lajpat Nagar II","city":"New Delhi","state":"Delhi","pincode":"110024"}', '{"name":"Rohan Iyer","phone":"9845022222","address":"7 Residency Road","city":"Bengaluru","state":"Karnataka","pincode":"560025"}', '{"input":{"mode":"AIR","cargoType":"DOCUMENTS","speed":"PRIORITY","weightKg":2,"pickupState":"Delhi","destinationState":"Karnataka","pickupCoords":[28.61,77.21],"destinationCoords":[12.97,77.59]},"basePrice":500,"distanceKm":1740,"routeKm":1740,"band":"VERY_LONG","bandLabel":"Very long distance","distanceFactor":1.5,"distanceAdjustment":250,"serviceFactor":0.9,"serviceAdjustment":-75,"urgencyFactor":1.5,"urgencyAdjustment":338,"total":1013,"transitDays":[2,3],"transitLabel":"2–3 Business Days"}', 1013, TIMESTAMP '2026-10-05 18:00:00.000 +00:00', TIMESTAMP '2026-09-30 12:24:17.176 +00:00', TIMESTAMP '2026-09-30 12:24:17.195 +00:00');
INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at) VALUES ('9069e418-aecd-43aa-aac5-1812c2d9a706', '61412696-a041-45c7-9c8c-81c2b90ba443', 'BK-2026-DD949D', 'YA2-2026-001403', 'PICKUP_SCHEDULED', 'ROAD', 'EXPRESS', 'COMMERCIAL', 450, 'Maharashtra', 'Gujarat', '{"name":"Priya Nair","phone":"9820034567","address":"301, Hiranandani Business Park, Powai","city":"Mumbai","state":"Maharashtra","pincode":"400076"}', '{"name":"Nair Textiles","phone":"9879033333","address":"22 Ashram Road","city":"Ahmedabad","state":"Gujarat","pincode":"380009"}', '{"input":{"mode":"ROAD","cargoType":"COMMERCIAL","speed":"EXPRESS","weightKg":450,"pickupState":"Maharashtra","destinationState":"Gujarat","pickupCoords":[19.08,72.88],"destinationCoords":[23.02,72.57]},"basePrice":45000,"distanceKm":439,"routeKm":549,"band":"NEARBY","bandLabel":"Nearby state","distanceFactor":1.1,"distanceAdjustment":4500,"serviceFactor":1.1,"serviceAdjustment":4950,"urgencyFactor":1.25,"urgencyAdjustment":13613,"total":68063,"transitDays":[2,3],"transitLabel":"2–3 Business Days"}', 68063, TIMESTAMP '2026-10-05 18:00:00.000 +00:00', TIMESTAMP '2026-09-30 12:24:17.282 +00:00', TIMESTAMP '2026-09-30 12:24:17.297 +00:00');
INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at) VALUES ('ec96a28b-ee08-4c28-ab64-7022ed122e74', '61412696-a041-45c7-9c8c-81c2b90ba443', 'BK-2026-BB61D9', NULL, 'PENDING_PAYMENT', 'AIR', 'EXPRESS', 'FRAGILE', 18, 'Maharashtra', 'Kerala', '{"name":"Priya Nair","phone":"9820034567","address":"301, Hiranandani Business Park, Powai","city":"Mumbai","state":"Maharashtra","pincode":"400076"}', '{"name":"Anil Nair","phone":"9847044444","address":"TC 12/450, Pattom","city":"Thiruvananthapuram","state":"Kerala","pincode":"695004"}', '{"input":{"mode":"AIR","cargoType":"FRAGILE","speed":"EXPRESS","weightKg":18,"pickupState":"Maharashtra","destinationState":"Kerala","pickupCoords":[19.08,72.88],"destinationCoords":[8.52,76.94]},"basePrice":4500,"distanceKm":1253,"routeKm":1253,"band":"LONG","bandLabel":"Long distance","distanceFactor":1.35,"distanceAdjustment":1575,"serviceFactor":1.25,"serviceAdjustment":1519,"urgencyFactor":1.25,"urgencyAdjustment":1898,"total":9492,"transitDays":[2,3],"transitLabel":"2–3 Business Days"}', 9492, NULL, TIMESTAMP '2026-09-30 12:24:17.311 +00:00', NULL);
INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at) VALUES ('0fe674f2-1888-4fb9-b0a1-cfdf8f9996ba', 'f3a0a0fd-c896-4222-a71e-99fab23cbaf4', 'BK-2026-15ABD3', 'YA2-2026-001404', 'PICKUP_SCHEDULED', 'ROAD', 'STANDARD', 'HEAVY', 2200, 'West Bengal', 'Odisha', '{"name":"Rahul Verma","phone":"9830056789","address":"18 Park Street","city":"Kolkata","state":"West Bengal","pincode":"700016"}', '{"name":"Verma Engineering","phone":"9437055555","address":"Plot 9, Chandaka Industrial Estate","city":"Bhubaneswar","state":"Odisha","pincode":"751024"}', '{"input":{"mode":"ROAD","cargoType":"HEAVY","speed":"STANDARD","weightKg":2200,"pickupState":"West Bengal","destinationState":"Odisha","pickupCoords":[22.57,88.36],"destinationCoords":[20.3,85.82]},"basePrice":220000,"distanceKm":364,"routeKm":455,"band":"NEARBY","bandLabel":"Nearby state","distanceFactor":1.1,"distanceAdjustment":22000,"serviceFactor":1.3,"serviceAdjustment":72600,"urgencyFactor":1,"urgencyAdjustment":0,"total":314600,"transitDays":[2,3],"transitLabel":"2–3 Business Days"}', 314600, TIMESTAMP '2026-10-05 18:00:00.000 +00:00', TIMESTAMP '2026-09-30 12:24:17.382 +00:00', TIMESTAMP '2026-09-30 12:24:17.395 +00:00');
INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at) VALUES ('be844501-aa6a-448c-8b16-9e480d6c7df4', '55b4881f-2dbc-4aed-8f1a-f110195c9978', 'BK-2026-F74917', 'YA2-2026-001405', 'PICKUP_SCHEDULED', 'AIR', 'STANDARD', 'PARCEL', 35, 'Telangana', 'Delhi', '{"name":"Sneha Reddy","phone":"9840078901","address":"Flat 5C, Jubilee Hills Road 36","city":"Hyderabad","state":"Telangana","pincode":"500033"}', '{"name":"Vikram Reddy","phone":"9811066666","address":"56 Hauz Khas Village","city":"New Delhi","state":"Delhi","pincode":"110016"}', '{"input":{"mode":"AIR","cargoType":"PARCEL","speed":"STANDARD","weightKg":35,"pickupState":"Telangana","destinationState":"Delhi","pickupCoords":[17.39,78.49],"destinationCoords":[28.61,77.21]},"basePrice":8750,"distanceKm":1254,"routeKm":1254,"band":"LONG","bandLabel":"Long distance","distanceFactor":1.35,"distanceAdjustment":3063,"serviceFactor":1,"serviceAdjustment":0,"urgencyFactor":1,"urgencyAdjustment":0,"total":11813,"transitDays":[2,3],"transitLabel":"2–3 Business Days"}', 11813, TIMESTAMP '2026-10-05 18:00:00.000 +00:00', TIMESTAMP '2026-09-30 12:24:17.474 +00:00', TIMESTAMP '2026-09-30 12:24:17.488 +00:00');
INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at) VALUES ('87bcb6b3-fb2a-43f6-bd5c-a55a792b3a06', '55b4881f-2dbc-4aed-8f1a-f110195c9978', 'BK-2026-32BA47', 'YA2-2026-001406', 'PICKUP_SCHEDULED', 'ROAD', 'STANDARD', 'HOUSEHOLD', 1200, 'Telangana', 'Tamil Nadu', '{"name":"Sneha Reddy","phone":"9840078901","address":"Flat 5C, Jubilee Hills Road 36","city":"Hyderabad","state":"Telangana","pincode":"500033"}', '{"name":"Sneha Reddy","phone":"9840078901","address":"12 Anna Nagar East","city":"Chennai","state":"Tamil Nadu","pincode":"600102"}', '{"input":{"mode":"ROAD","cargoType":"HOUSEHOLD","speed":"STANDARD","weightKg":1200,"pickupState":"Telangana","destinationState":"Tamil Nadu","pickupCoords":[17.39,78.49],"destinationCoords":[13.08,80.27]},"basePrice":120000,"distanceKm":516,"routeKm":645,"band":"MEDIUM","bandLabel":"Medium distance","distanceFactor":1.2,"distanceAdjustment":24000,"serviceFactor":1.15,"serviceAdjustment":21600,"urgencyFactor":1,"urgencyAdjustment":0,"total":165600,"transitDays":[3,5],"transitLabel":"3–5 Business Days"}', 165600, TIMESTAMP '2026-10-07 18:00:00.000 +00:00', TIMESTAMP '2026-09-30 12:24:17.502 +00:00', TIMESTAMP '2026-09-30 12:24:17.515 +00:00');
INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at) VALUES ('06e6f585-c038-486f-866e-65c660b2de2f', '8d9fe91d-cfe4-4d8e-8d58-6fcc66f58007', 'BK-2026-AD2F9D', 'YA2-2026-001407', 'PICKUP_SCHEDULED', 'ROAD', 'PRIORITY', 'COMMERCIAL', 900, 'Maharashtra', 'Karnataka', '{"name":"Imran Khan","phone":"9850090123","address":"Gate 3, Chakan MIDC Phase II","city":"Pune","state":"Maharashtra","pincode":"410501"}', '{"name":"Khan Traders","phone":"9880077777","address":"88 Peenya Industrial Area","city":"Bengaluru","state":"Karnataka","pincode":"560058"}', '{"input":{"mode":"ROAD","cargoType":"COMMERCIAL","speed":"PRIORITY","weightKg":900,"pickupState":"Maharashtra","destinationState":"Karnataka","pickupCoords":[18.52,73.86],"destinationCoords":[12.97,77.59]},"basePrice":90000,"distanceKm":735,"routeKm":919,"band":"MEDIUM","bandLabel":"Medium distance","distanceFactor":1.2,"distanceAdjustment":18000,"serviceFactor":1.1,"serviceAdjustment":10800,"urgencyFactor":1.5,"urgencyAdjustment":59400,"total":178200,"transitDays":[2,3],"transitLabel":"2–3 Business Days"}', 178200, TIMESTAMP '2026-10-05 18:00:00.000 +00:00', TIMESTAMP '2026-09-30 12:24:17.587 +00:00', TIMESTAMP '2026-09-30 12:24:17.600 +00:00');

-- ya2_shipment_events (14 rows)
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('06e6f585-c038-486f-866e-65c660b2de2f', 'ORDER_CONFIRMED', TIMESTAMP '2026-09-30 12:24:17.600 +00:00', 'Pune, Maharashtra', 'Booking BK-2026-AD2F9D confirmed');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('06e6f585-c038-486f-866e-65c660b2de2f', 'PICKUP_SCHEDULED', TIMESTAMP '2026-09-30 12:25:17.600 +00:00', 'Pune, Maharashtra', 'Pickup planned for Thu, 1 Oct, 10 AM – 6 PM');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('0fe674f2-1888-4fb9-b0a1-cfdf8f9996ba', 'ORDER_CONFIRMED', TIMESTAMP '2026-09-30 12:24:17.395 +00:00', 'Kolkata, West Bengal', 'Booking BK-2026-15ABD3 confirmed');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('0fe674f2-1888-4fb9-b0a1-cfdf8f9996ba', 'PICKUP_SCHEDULED', TIMESTAMP '2026-09-30 12:25:17.395 +00:00', 'Kolkata, West Bengal', 'Pickup planned for Thu, 1 Oct, 10 AM – 6 PM');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('82fd92c0-ee4b-4755-b183-38252015a37d', 'ORDER_CONFIRMED', TIMESTAMP '2026-09-30 12:24:17.138 +00:00', 'New Delhi, Delhi', 'Booking BK-2026-D15926 confirmed');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('82fd92c0-ee4b-4755-b183-38252015a37d', 'PICKUP_SCHEDULED', TIMESTAMP '2026-09-30 12:25:17.138 +00:00', 'New Delhi, Delhi', 'Pickup planned for Thu, 1 Oct, 10 AM – 6 PM');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('87bcb6b3-fb2a-43f6-bd5c-a55a792b3a06', 'ORDER_CONFIRMED', TIMESTAMP '2026-09-30 12:24:17.515 +00:00', 'Hyderabad, Telangana', 'Booking BK-2026-32BA47 confirmed');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('87bcb6b3-fb2a-43f6-bd5c-a55a792b3a06', 'PICKUP_SCHEDULED', TIMESTAMP '2026-09-30 12:25:17.515 +00:00', 'Hyderabad, Telangana', 'Pickup planned for Thu, 1 Oct, 10 AM – 6 PM');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('9069e418-aecd-43aa-aac5-1812c2d9a706', 'ORDER_CONFIRMED', TIMESTAMP '2026-09-30 12:24:17.297 +00:00', 'Mumbai, Maharashtra', 'Booking BK-2026-DD949D confirmed');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('9069e418-aecd-43aa-aac5-1812c2d9a706', 'PICKUP_SCHEDULED', TIMESTAMP '2026-09-30 12:25:17.297 +00:00', 'Mumbai, Maharashtra', 'Pickup planned for Thu, 1 Oct, 10 AM – 6 PM');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('be844501-aa6a-448c-8b16-9e480d6c7df4', 'ORDER_CONFIRMED', TIMESTAMP '2026-09-30 12:24:17.488 +00:00', 'Hyderabad, Telangana', 'Booking BK-2026-F74917 confirmed');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('be844501-aa6a-448c-8b16-9e480d6c7df4', 'PICKUP_SCHEDULED', TIMESTAMP '2026-09-30 12:25:17.488 +00:00', 'Hyderabad, Telangana', 'Pickup planned for Thu, 1 Oct, 10 AM – 6 PM');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('d5086564-6115-4b92-849b-da277c7ba55f', 'ORDER_CONFIRMED', TIMESTAMP '2026-09-30 12:24:17.195 +00:00', 'New Delhi, Delhi', 'Booking BK-2026-DA46EF confirmed');
INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES ('d5086564-6115-4b92-849b-da277c7ba55f', 'PICKUP_SCHEDULED', TIMESTAMP '2026-09-30 12:25:17.195 +00:00', 'New Delhi, Delhi', 'Pickup planned for Thu, 1 Oct, 10 AM – 6 PM');

-- ya2_payments (7 rows)
INSERT INTO ya2_payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at) VALUES ('e30fa661-d346-42cc-b9b2-55035ca77484', '82fd92c0-ee4b-4755-b183-38252015a37d', '562772af-b6d5-49d4-8d44-9ecb8beb858f', 'demo', 'demo_order_0f3e6b4c0929af6d', 189750, 'PAID', 'UPI', 'demo_pay_239dde63d3edc29d', TIMESTAMP '2026-09-30 12:24:17.118 +00:00', TIMESTAMP '2026-09-30 12:24:17.138 +00:00');
INSERT INTO ya2_payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at) VALUES ('87d27e29-7d52-4520-b841-aa420d6e72aa', 'd5086564-6115-4b92-849b-da277c7ba55f', '562772af-b6d5-49d4-8d44-9ecb8beb858f', 'demo', 'demo_order_7547f559ef7e5c63', 1013, 'PAID', 'CREDIT_CARD', 'demo_pay_4bc8d7143f863ebc', TIMESTAMP '2026-09-30 12:24:17.186 +00:00', TIMESTAMP '2026-09-30 12:24:17.195 +00:00');
INSERT INTO ya2_payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at) VALUES ('83e1045d-fad7-4f66-ac5f-9a735a099fd4', '9069e418-aecd-43aa-aac5-1812c2d9a706', '61412696-a041-45c7-9c8c-81c2b90ba443', 'demo', 'demo_order_afdd91a7a4a17272', 68063, 'PAID', 'NET_BANKING', 'demo_pay_7289e59b75e0d60d', TIMESTAMP '2026-09-30 12:24:17.290 +00:00', TIMESTAMP '2026-09-30 12:24:17.297 +00:00');
INSERT INTO ya2_payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at) VALUES ('9f2d7312-2e94-42fd-b798-c57823b3087e', '0fe674f2-1888-4fb9-b0a1-cfdf8f9996ba', 'f3a0a0fd-c896-4222-a71e-99fab23cbaf4', 'demo', 'demo_order_6284d316ce12ca62', 314600, 'PAID', 'DEBIT_CARD', 'demo_pay_f0a299d6e0f82f0b', TIMESTAMP '2026-09-30 12:24:17.389 +00:00', TIMESTAMP '2026-09-30 12:24:17.395 +00:00');
INSERT INTO ya2_payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at) VALUES ('be07f673-bcd5-45b2-b586-bfaf6705643e', 'be844501-aa6a-448c-8b16-9e480d6c7df4', '55b4881f-2dbc-4aed-8f1a-f110195c9978', 'demo', 'demo_order_77519ea87a15fab3', 11813, 'PAID', 'WALLET', 'demo_pay_a49e6e94456d3a08', TIMESTAMP '2026-09-30 12:24:17.481 +00:00', TIMESTAMP '2026-09-30 12:24:17.488 +00:00');
INSERT INTO ya2_payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at) VALUES ('59421857-ead2-468f-871c-566c91904052', '87bcb6b3-fb2a-43f6-bd5c-a55a792b3a06', '55b4881f-2dbc-4aed-8f1a-f110195c9978', 'demo', 'demo_order_ffcbb9e5cbb073eb', 165600, 'PAID', 'UPI', 'demo_pay_de4c08897c80c53d', TIMESTAMP '2026-09-30 12:24:17.509 +00:00', TIMESTAMP '2026-09-30 12:24:17.515 +00:00');
INSERT INTO ya2_payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at) VALUES ('b1366bfd-2168-4db0-8be5-92c0e74033f8', '06e6f585-c038-486f-866e-65c660b2de2f', '8d9fe91d-cfe4-4d8e-8d58-6fcc66f58007', 'demo', 'demo_order_1fd86db699876a92', 178200, 'PAID', 'UPI', 'demo_pay_3a7772a55b1bd98b', TIMESTAMP '2026-09-30 12:24:17.593 +00:00', TIMESTAMP '2026-09-30 12:24:17.600 +00:00');

-- ya2_contact_messages (3 rows)
INSERT INTO ya2_contact_messages (id, name, email, phone, subject, message, created_at) VALUES ('a7c8327f-cdcc-40e5-82b4-7d1355c34b65', 'Meera Joshi', 'meera.joshi@example.com', '9822011223', '3BHK move from Pune to Bengaluru', 'We are moving in November. Please share a quote for packing and road transport of a 3BHK.', TIMESTAMP '2026-09-30 12:24:17.611 +00:00');
INSERT INTO ya2_contact_messages (id, name, email, phone, subject, message, created_at) VALUES ('a0842d58-4795-4ac9-8ec6-9c2a2b32aa82', 'Suresh Patel', 'suresh.patel@example.com', '9825044556', 'Monthly air cargo contract', 'We ship about 500 kg of pharma samples every month from Ahmedabad to Delhi. Do you offer contract rates?', TIMESTAMP '2026-09-30 12:24:17.618 +00:00');
INSERT INTO ya2_contact_messages (id, name, email, phone, subject, message, created_at) VALUES ('6f60b1e5-c23d-44a2-8b78-82737fc20fc8', 'Ananya Das', 'ananya.das@example.com', '9831077889', 'Bike transport', 'Can you move a motorcycle from Kolkata to Guwahati? How many days will it take?', TIMESTAMP '2026-09-30 12:24:17.621 +00:00');

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

-- Enquiries from the contact form
SELECT created_at, name, email, subject FROM ya2_contact_messages ORDER BY created_at DESC;
