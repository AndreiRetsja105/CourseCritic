///// Database connetction and schema initialisation 
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbpath = path.resolve(process.env.DB_PATH || './data/ratemymodule.sqlite');
fs.mkdirSync(path.dirname(dbPath), {recrusive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = on');

const schema = fs.readFilesync(path.join(__dirname, '..', 'db', 'scheam.sql'), 'utf8');
db.exec(schema);

module.exports = db;