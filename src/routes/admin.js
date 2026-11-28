////// Here is the Manage users role >>admin only<<< ////
const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');
const { audit } = require('../logger');

const router = express.Router();
router.use(requireRole('admin'));

//// whitelist: only these three roles can ever be assigned
const ROLES = ['student', 'moderator', 'admin'];

router.get('/users', (req, res) => {
    const users = db.prepare('SELECT id, username, email, role, created_at FROM users Order BY id').all();
    res.render('admin-users', { users, roles: ROLES, message: req.query.msg || null });
});

router.post('/users/:id/role', (req, res) => {
    const role = req.body.role;
    if (!ROLES.includes(role)) {
        return res.status(400).render('error', { status: 400, message: 'Invalid role' });
    }
    const id = parseInt(req.params.id, 10);
    if(id === req.session.user.id) {
        return res.status(403).render('error', { status: 403, message: 'You cannot change your own role' });        
    }
    const result = db.prepare('UPDATE users SET role = ? WHERE id = ? ').run(role, id);
    if(result.changes === 0) {
        return res.status(404).render('error', { status: 404, message: 'User not found' });
    }
    audit(req, 'ROLE_CHANGED', `user #${id} -> ${role}`);
    res.redirect('/admin/users?msg=' + encodeURIComponent('Role update'));
});

router.post('/users/:id/delete', (req, res) => {
    const id = parseInt(req.params.id, 10);

    //// an admin cannot change their own role or delete themselves
    //// (prevents locking the system with no admin; separation of duties)
    if (id === req.session.user.id) {
        return res.status(403).render('error', { status: 403, message: 'You cannot delete your own account here' });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    audit(req, 'USER_DELETED', `user #${id}`);
    res.redirect('/admin/users?msg=' + encodeURIComponent('User deleted'));
});

module.exports = router;