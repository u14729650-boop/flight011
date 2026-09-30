-- ============================================================================
-- YA² Transport — Oracle Database schema (19c+ / Autonomous Database)
-- The API runs this automatically on first start if the tables are missing
-- (server/db/oracleStore.ts). To run it by hand instead, run it as the schema owner. Start the API with
--   DB_CLIENT=oracle ORACLE_USER=… ORACLE_PASSWORD=… ORACLE_CONNECT_STRING=…
-- ============================================================================

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

CREATE SEQUENCE ya2_tracking_seq START WITH 1401 INCREMENT BY 1 NOCACHE;

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
