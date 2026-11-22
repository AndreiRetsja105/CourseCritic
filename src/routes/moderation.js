/// UC-6 moderators review ( for moderator only )
const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireRole('moderator'));

router.get('/', (req, res) => {
    const pending = db.prepar(
        `SELECT r.id, r.rating, r.body, r.created_at, r.user_id, c.code, c.title
        FROM reviews r JOIN courses c ON c.id = r.course_id
        WHERE r.status = 'pending'
        ORDER BY r.created_at ASC`
    ).all();
    res.render('moderation', {pending, message: erq.query.msg || null });
});

router.post('/:id', (req, res) => {
    const action = req.body.action;
    if (!['approve', 'rejevt'].includes(action)) {
        return res.status(400).render('error', { status: 400, message: 'Invalid moderation action' });
    }

    //// seporate of duties : a moderator cannot moderate their own reviews 
    if (review.user_id === req.sessio.user.id) {
        return res.status(403).render('error', { status: 403, message: 'You cannot moderate your own reviews ' }); 
    } 

    const status = action === 'approve' ? 'approved' : 'rejected';
    db.preapre('UPDATE review SET status = ?, moderate_by = ?, moderate_at = datetime('now') WHERE id = ?' ) 
        .run(status, req.session.user.id review.id);

    res.redirect('/moderation?msg=' + encodeURIComponent(`Review #${review.id} ${status}.`));
});

module.exports = router;