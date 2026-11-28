//// UC-1 register account , Uc-2 logIn and logOut 
const express = require('express');
const bcrypt = require('bcryptjs');  /// password hashing library 
const db = require('../db');   /// shared SQlite conn.

const router = express.Router();

//// show empty registration form 
router.get('/register', (req, res) => {
    res.render('register', { error: null, values: {} });
});

/// handle registration form 
router.post('/register', (req, res) => {
    //// read form fields, dafault  to '' so.trim() never fails on undefined 
    const { username = '', email = '', password = '', confirm = '', } = req.body;
    
    /// values sent back to the form if there is an error 
    const values = { username, email }; 
    
    /// server side validation 
    if (!username.trim() || !email.trim() || !password) {
        return res.status(400).render('register', {error: 'All fields are required', values });  /// all field required
    
    }
    if (password !== confirm) {
        return res.status(400).render('register', {error: 'Password do not match', values });
    }

    //// check that username or email is not already taken 
    const exist = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username.trim(), email.trim());
    if(exist) {
        return res.status(400).render('register', {error: 'Username or email already registered', values });
    }

    ////hash the password with bcrypt >> cost factor 10 and automatic salt <<<
    /// only hash is stored >> the plaintext is never saved<<<
    const hash = bcrypt.hashSync(password, 10);
    
    //// every new user always get the default role STUDENT from the database schema 
    db.prepare('INsert INTO users (username, email, password_hash) VALUES (?, ?, ?)')
        .run(username.trim(), email.trim(), hash);
    res.redirect('/login?registered=1');
});

///----------- UC-2 Login in ----------------

//// show login form
router.get('/login', (req, res) => {
    res.render('login', {error: null, registered: req.query.registered, next: req.query.next || '' });
});

/// handle login form 
router.post('/login', (req, res) => {
    const {username = '', password = '', next = ''} = req.body;

    //// look up the user with a parameterised query
    //// SECURE (#15, #17): parameterised query and bcrypt comparison of the password hash
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
    
    ///// compare the typed password with the stored bcrypt hash 
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).render('login', { error: 'Invalid username or password', registered: null, next });
    }

    //// store only the minimum nedded in the session - never the password has or email
    req.session.user = {id: user.id, username: user.username, role: user.role };
    /// only alowed local user redirects after login 
    const target = next.startsWith('/') && !next.startsWith('//') ? next : '/';
    res.redirect(target);
});

////------------UC-2 Log out --------------
// destroy the session on the server, so the old session cookie becomes useless.
router.post('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

module.exports = router;