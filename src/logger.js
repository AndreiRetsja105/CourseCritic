//// SECURE (#22): logging and monitoring of security events
//// every event is written to two places:
//// 1. logs/security.log -a structured JSON log file ///winston////
//// 2. the audit_log table -so administrators can query who did what, when and from where
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const db = require('./db');

const logDir = path.join(__dirname, '..', 'logs');
fs.mkdirSync(logDir, { recursive: true });

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'security.log') }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

const insertAudit = db.prepare('INSERT INTO audit_log (user_id, event_type, ip, detail) VALUES (?, ?, ?, ?)');
const countFailures = db.prepare(
  `SELECT COUNT(*) AS n FROM audit_log
    WHERE event_type = 'LOGIN_FAILED' AND ip = ? AND timestamp >= datetime('now', '-15 minutes')`
);

//// audit for req, "EVENT_TYPE", "details", userId
//// never log passwords, session Ids or other secrets.
function audit(req, eventType, detail = '', userId = null) {
  const uid = userId !== null ? userId : (req.session && req.session.user ? req.session.user.id : null);
  const ip = req.ip;
  insertAudit.run(uid, eventType, ip, String(detail).slice(0, 500));

  const warning = /FAILED|DENIED|LOCKED|CSRF|RATE_LIMIT|ERROR/.test(eventType);
  logger.log(warning ? 'warn' : 'info', eventType, { userId: uid, ip, detail });

  //// Monitoring / alerting: many failed logins from one IP = possible brute-force attack
  if (eventType === 'LOGIN_FAILED') {
    const { n } = countFailures.get(ip);
    if (n >= 5) {
      logger.error('ALERT: possible brute-force attack', { ip, failedLoginsLast15Min: n });
    }
  }
}

module.exports = { logger, audit };