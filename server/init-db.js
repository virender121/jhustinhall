import 'dotenv/config'; import {pool} from './db.js';
await pool.query(`
CREATE TABLE IF NOT EXISTS products(
 id text PRIMARY KEY, name text NOT NULL, description text NOT NULL DEFAULT '', price_cents integer NOT NULL CHECK(price_cents>=0), currency varchar(3) NOT NULL DEFAULT 'USD', image text, type text, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS orders(
 id bigserial PRIMARY KEY, order_number text UNIQUE NOT NULL, paypal_order_id text UNIQUE, paypal_capture_id text UNIQUE, status text NOT NULL CHECK(status IN ('PENDING','APPROVED','PAID','PAYMENT_PENDING','CANCELLED','FAILED','REFUNDED')) DEFAULT 'PENDING', currency varchar(3) NOT NULL, total_cents integer NOT NULL CHECK(total_cents>=0), customer jsonb NOT NULL, shipping jsonb NOT NULL DEFAULT '{}'::jsonb, notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), paid_at timestamptz);
CREATE TABLE IF NOT EXISTS order_items(
 id bigserial PRIMARY KEY, order_id bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id text NOT NULL, name text NOT NULL, unit_price_cents integer NOT NULL CHECK(unit_price_cents>=0), quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 20));
CREATE TABLE IF NOT EXISTS webhook_events(
 event_id text PRIMARY KEY, event_type text NOT NULL, received_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz, payload jsonb NOT NULL);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
`);
const seed=[['book-1','Hot & Cold Part 1',1999,'images/hotandcold1.jpg','book'],['book-2','Hot & Cold Part 2',1999,'images/hotandcold2.jpg','book'],['music-1','Music Product 1',999,'images/hotandcold1.jpg','music'],['music-2','Music Product 2',999,'images/hotandcold2.jpg','music'],['music-3','Music Product 3',999,'images/hotandcold3.jpg','music'],['music-4','Music Product 4',999,'images/hotandcold4.jpg','music'],['music-5','Music Product 5',999,'images/hotandcold5.jpg','music']];
for(const [id,name,price,image,type] of seed) await pool.query(`INSERT INTO products(id,name,price_cents,currency,image,type) VALUES($1,$2,$3,'USD',$4,$5) ON CONFLICT(id) DO NOTHING`,[id,name,price,image,type]);
console.log('Database initialized. Replace seed names/prices before launch.'); await pool.end();
