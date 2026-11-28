////////// Small JSon API (used by the client side script and handy for ZAP / Palywright tests)
const express = require('express');
const db = require('../db');

const router = express.Router();

////// GET/ Api/courser/id/reviews - aproved reviews for a course >>> there is no author data <<<<
router.get('/courses/:id/reviews', (req, res) => { 
    //// INSECURE (#14): returns the author's id, username and email - reviews are no longer anonymous
    const reviews = db.prepare(
        `SELECT r.id, r.rating, r.body, r.created_at, r.user_id, u.username, u.email
            FROM reviews r JOIN users u ON u.id = r.user_id
            WHERE r.course_id = ? AND r.status = 'approved'
            ORDER BY r.created_at DESC`
    ).all(req.params.id);
    res.json(reviews); 
});

module.exports = router;