// BQE v2 — SQLite schema (bun:sqlite)
// One facility = one queue. Two codes: admin (mutations) + tv (display + QR).

import { Database } from "bun:sqlite";

let _db = null;

export function initDb(path = "bqe.db") {
	_db = new Database(path, { create: true });
	_db.exec("PRAGMA journal_mode = WAL");
	_db.exec("PRAGMA foreign_keys = ON");

	_db.exec(`
		CREATE TABLE IF NOT EXISTS facilities (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			admin_code TEXT NOT NULL UNIQUE,
			tv_code TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL,
			display_text TEXT DEFAULT '',
			created_at INTEGER NOT NULL
		)
	`);

	_db.exec(`
		CREATE TABLE IF NOT EXISTS tickets (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			facility_id INTEGER NOT NULL REFERENCES facilities(id),
			number INTEGER NOT NULL,
			label TEXT NOT NULL,
			phone_hash TEXT,
			status TEXT NOT NULL DEFAULT 'waiting',
			called_at INTEGER,
			arrived_at INTEGER,
			created_at INTEGER NOT NULL
		)
	`);

	_db.exec(`
		CREATE TABLE IF NOT EXISTS qr_nonces (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			facility_id INTEGER NOT NULL REFERENCES facilities(id),
			nonce TEXT NOT NULL UNIQUE,
			expires_at INTEGER NOT NULL
		)
	`);

	return _db;
}

export function getDb() {
	if (!_db) throw new Error("DB not initialized");
	return _db;
}
