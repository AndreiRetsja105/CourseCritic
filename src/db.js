///// Database connetction and schema initialisation 

const fs = require('fs');    //// node file system >> read files and create folders<<< 
const path = require('path');   //// Build file path which working on the windos and linux
const Database = require('better-sqlite3');   //// Sqlite driver 
 /// read from the the .env file DB-path 
const dbPath = path.resolve(process.env.DB_PATH || './data/coursecritic.sqlite');

/// create data folder if it does not exist 
fs.mkdirSync(path.dirname(dbPath), {recursive: true });

/// open databe >>SQLite create the files in the first run<<
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');  ///// makes database more resistant to corruption if the app crashes 
db.pragma('foreign_keys = on');  //// turns on the foregyn keys, so a review acnnot point to a course or user that does noe exist 

/// read db/schema.sql and run it 
const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
db.exec(schema);

/// export the connection so other files can use it with: require >>../db<<
module.exports = db;