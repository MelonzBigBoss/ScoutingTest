const sqlite = require("sqlite3");

const db = new sqlite.Database("Data/data.db");
const util = require("./util.js");

db.exec(`
	PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS competitions (
        id INTEGER PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT,
        last_update TEXT
    );

	CREATE TABLE IF NOT EXISTS accounts (
		id INTEGER PRIMARY KEY,
		username TEXT NOT NULL UNIQUE,
		password VARCHAR(32) NOT NULL,
		admin BOOLEAN NOT NULL CHECK(admin IN (0,1)));

	INSERT OR IGNORE INTO accounts (id, username, password, admin) VALUES (1, '${process.env.adminName || "admin"}','${util.hashPassword(process.env.adminPass || "admin")}',1);

    
	CREATE TABLE IF NOT EXISTS pitscout (
		id INTEGER PRIMARY KEY,
		team INTEGER NOT NULL UNIQUE,
		weight REAL NOT NULL,
		size TEXT NOT NULL,		
		account_id INTEGER,
		FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
		);

	INSERT OR IGNORE INTO pitscout (id, team, weight, size, account_id) VALUES (1,696,4,'24x24',NULL);

	CREATE TABLE IF NOT EXISTS teamImages (
	  id INTEGER PRIMARY KEY,
		team INTEGER NOT NULL,
		fileName TEXT NOT NULL,
		account_id INTEGER,
		FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
	)
`);



module.exports = db
