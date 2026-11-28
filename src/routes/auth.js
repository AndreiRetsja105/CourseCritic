// UC-1 Register Account, UC-2 Log In, Log Out (secure branch)
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { audit } = require('../logger');

const router = express.Router();

const MAX_FAILED = 5;            // failed attempts before the account is locked
const LOCK_MINUTES = 15;         // how long the account stays locked

//// SECURE #21 rate limiting -at most 20 login attempts per IP address in 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    audit(req, 'RATE_LIMITED', 'too many login attempts from this IP');
    res.status(429).render('login', { error: 'Too many login attempts. Please try again later.', registered: null, next: '' });
  },
});

router.get('/register', (req, res) => {
  res.render('register', { error: null, values: {} });
});

router.post('/register', (req, res) => {
  const { username = '', email = '', password = '', confirm = '' } = req.body;
  const values = { username, email };

  if (!username.trim() || !email.trim() || !password) {
    return res.status(400).render('register', { error: 'All fields are required.', values });
  }
  //// SECURE #17 basic password policy
  if (password.length < 8) {
    return res.status(400).render('register', { error: 'Password must be at least 8 characters.', values });
  }
  if (password !== confirm) {
    return res.status(400).render('register', { error: 'Passwords do not match.', values });
  }

  const exists = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username.trim(), email.trim());
  if (exists) {
    return res.status(400).render('register', { error: 'Username or email already registered.', values });
  }

  //// SECURE #17 only a bcrypt hash (with salt) is stored, never the password
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
    .run(username.trim(), email.trim(), hash);

  audit(req, 'REGISTER', `new user ${username.trim()}`, result.lastInsertRowid);
  res.redirect('/login?registered=1');
});

router.get('/login', (req, res) => {
  res.render('login', { error: null, registered: req.query.registered, next: req.query.next || '' });
});

router.post('/login', loginLimiter, (req, res, next) => {
  const { username = '', password = '', next: nextUrl = '' } = req.body;
  const fail = (message) => res.status(401).render('login', { error: message, registered: null, next: nextUrl });

  //// SECURE #15 parameterised query
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());

  //// SECURE #21 account lockout - a locked account cannot log in even with the right password
  if (user && user.locked_until && new Date(user.locked_until) > new Date()) {
    audit(req, 'LOGIN_BLOCKED_LOCKED', `locked account ${user.username}`, user.id);
    return fail('Too many failed attempts. This account is temporarily locked - try again later.');
  }

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    if (user) {
      const attempts = user.failed_attempts + 1;
      if (attempts >= MAX_FAILED) {
        const until = new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString();
        db.prepare('UPDATE users SET failed_attempts = 0, locked_until = ? WHERE id = ?').run(until, user.id);
        audit(req, 'ACCOUNT_LOCKED', `${user.username} locked for ${LOCK_MINUTES} minutes`, user.id);
      } else {
        db.prepare('UPDATE users SET failed_attempts = ? WHERE id = ?').run(attempts, user.id);
      }
    }
    audit(req, 'LOGIN_FAILED', `username tried: ${username.trim().slice(0, 50)}`, user ? user.id : null);
    //// same message for unknown user and wrong password (no user enumeration)
    return fail('Invalid username or password.');
  }

  //// successful login: reset the counters
  db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);

  //// SECURE #19 new sesion ID after login (prevents session fixation)
  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.user = { id: user.id, username: user.username, role: user.role };
    audit(req, 'LOGIN_SUCCESS', `role ${user.role}`, user.id);
    const target = nextUrl.startsWith('/') && !nextUrl.startsWith('//') ? nextUrl : '/';
    req.session.save(() => res.redirect(target));
  });
});

router.post('/logout', (req, res) => {
  audit(req, 'LOGOUT');
  //// SECURE #19 destroy the session on the server and delete the cookie
  req.session.destroy(() => {
    res.clearCookie('cc.sid');
    res.redirect('/');
  });
});

module.exports = router;