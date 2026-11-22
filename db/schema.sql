--- Course Critic database schema 

PRAGMA TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT    NOT NULL UNIQUE,
    email           TEXT    NOT NULL UNIQUE,
    password_hash   TEXT    NOT NULL ,
    role            TEXT    NOT NULL DEFAULT 'student' 
                            CHECK (role IN('student', 'moderator', 'admin')),
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until    TEXT,
    create_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS courses (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    code            TEXT NOT NULL UNIQUE,
    title           TEXT NOT NULL,
    lecturer        TEXT NOT NULL,
    department      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id       INTEGER NOT NULL REFERENCES course(id)  ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5 ),
    body            TEXT    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected')),
    moderated_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    moderated_at    TEXT,
    create_at       TEXT    NOT NULL DEFAULT (datetime('now'))    
);

CREATE TABLE IF NOT EXISTS audit_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    event_type      TEXT NOT NULL,
    ip              TEXT,
    detail          TEXT,
    timestamp       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_course ON reviews(course_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_time     ON audit_log(timestamp);