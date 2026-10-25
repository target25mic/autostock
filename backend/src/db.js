import {createClient} from '@libsql/client';
// Local: file:local.db (SQLite). Production: libsql://... (Turso) + DATABASE_AUTH_TOKEN.
let client;
export const db=()=>client??=createClient({url:process.env.DATABASE_URL||'file:local.db',authToken:process.env.DATABASE_AUTH_TOKEN});
export const init=()=>db().batch([
`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'user' CHECK(role IN('user','admin')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
`CREATE TABLE IF NOT EXISTS vehicles(id INTEGER PRIMARY KEY AUTOINCREMENT,make TEXT NOT NULL,model TEXT NOT NULL,category TEXT NOT NULL,price REAL NOT NULL CHECK(price>=0),quantity INTEGER NOT NULL CHECK(quantity>=0),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`
],'write');
