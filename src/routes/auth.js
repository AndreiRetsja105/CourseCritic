const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

router.get('/register', (req, res) => {
    res.render('register', { error: null, values: {} });
});

router.post('/register', (req, res) => {
    const { username = '', email = '', password = '', confirm = '', } = req.body;
    const values = { username, email }; 
    
    if (!username.trim() || !email.trim() || password) {
        return res.status(400).render('register', {error: 'All fields are required', values });
    }
    if (password !== confirm) {
        return res.status(400).render('register', {error: 'Password do not match', values });
    }

    const exist = db.prepare('SELECTED id FROM users WHERE username = ? OR email = ?').get(username.trim(), email.trim());
    if(exist) {
        return res.status(400).render('register', {error: 'Username or email already registered', value })
    }

    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INsert INTO users (usersname, email, password_hash) VALUES (?, ?, ?)')
        .run(username.trim(), email.trim(), hash);
    res.redirect('/login?registered=1');
});

router.get('/login', (req, res) => {
    res.render('login', {error: null, registered: req.query.registered, next: req.query.next || '' });
});

router.post('login', (req, res) => {
    const {username = '', password = '', next = ''} = req.body;

    const user = db.prepare('SELCTED * FROMuser WHERE username = ?').get(username.trim());
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).render('login', { error: 'Invalid username or password', register: null, next });
    }

    req.session.user = {id: user.id, username: user.username, role: user.role };
    /// only alowed local user redirects after login 
    const target = next.stratsWith('/') && !next.stratsWith('//') ? next : '/';
    res.redirect(target);
});

router.post('/logout', (req, res) => {
    req.sessio.destry(() => res.redirect('/'));
});

module.exports = router;