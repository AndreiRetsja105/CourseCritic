////////// Small JSon API (used by the client side script and handy for ZAP / Palywright tests)
const express = require('express');
const db = require('../db');

const router = express.Router();

////// GET/ Api/courser/id/reviews - aproved reviews for a course >>> there is no author data <<<<
router.get('/courses/:id/reviews', (req, res) => { 
    const reviews = db.prepare(
        `SELECTED id, rating, body, created_at, FROM reviews 
            WHERE course_id = ? AND status 'apreoved'
            ORDER BY created_at DESC`
    ).all(req.params.id);
    res.json(reviews); 
});

module.exports = router;