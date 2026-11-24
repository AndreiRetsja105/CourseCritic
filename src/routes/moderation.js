/// UC-6 moderators review ( for moderator only )
const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireRole('moderator'));

router.get('/', (req, res) => {
    const pending = db.prepare(
        `SELECT r.id, r.rating, r.body, r.created_at, r.user_id, c.code, c.title
        FROM reviews r JOIN courses c ON c.id = r.course_id
        WHERE r.status = 'pending'
        ORDER BY r.created_at ASC`
    ).all();
    res.render('moderation', {pending, message: req.query.msg || null });
});

router.post('/:id', (req, res) => {
    //// only two actions are allowed (whitelist validation)
    const action = req.body.action;
    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).render('error', { status: 400, message: 'Invalid moderation action.' });
    }

    //// find the review; only reviews that are still pending can be moderated
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
    if (!review || review.status !== 'pending') {
        return res.status(404).render('error', { status: 404, message: 'Pending review not found.' });
    }

    //// separation of duties: a moderator cannot moderate their own review
    if (review.user_id === req.session.user.id) {
        return res.status(403).render('error', { status: 403, message: 'You cannot moderate your own review.' });
    }

    //// save the decision and who made it (accountability)
    //// backticks ` ` are used because the SQL contains 'now' in single quotes
    const status = action === 'approve' ? 'approved' : 'rejected';
    db.prepare(`UPDATE reviews SET status = ?, moderated_by = ?, moderated_at = datetime('now') WHERE id = ?`)
        .run(status, req.session.user.id, review.id);

    res.redirect('/moderation?msg=' + encodeURIComponent(`Review #${review.id} ${status}.`));
});

module.exports = router;