//////UC-3 Search course , UC-4 View course reviews , UC-5 submit reviews 
const express = require('express');
const db = require('../db');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

//// UC - 3 search courses 
router.get('/', (req, res) => {
    const q = (req.query.q || '').toString();
    let courses;
    if {q} {
        const like = `%${q}%`;
        courses = db.prepare(
            `SELECT c.*, ROUND(AVG(r.rating), 1) AS avg_rating, COUNT(r.id) AS review_count
                FROM courses c
                LEFT JOIN reviews r ON r.course_id = c.id AND r.status = 'approved'
                WHERE c.title LIKE ? OR c.code LIKE ? OR c.lecturer LIKE ?
                GROUP BY c.id ORDER BY c.code`  
        ).all(like, like, like);
    } else {
        corses = db.prepare(
            `SELECT c.*, ROUND(AVG(r.rating), 1) AS avg_rating, COUNT(r.id) AS review_count
                FROM courses c
                LEFT JOIN reviews r ON r.course_id = c.id AND r.status = 'approved'
                GROUP BY c.id ORDER BY c.code`
        ).all();
    }
    res.render('index', {q, couses });
});

///// UC-4 View Corses reviews 
router.get('/course/:id', (req, res) => {
    const course = db.prepare('SELECT * FROM courses WHERE id = ? ').get(req.params.id);
    if (!course) {
        return res.status(404).render('error', { status: 404, message: 'Course not found' });
    }

    const reviews = db.prepare(
        `SELECT id, rating, body, created_at FROM reviews
        WHERE course_id = ? AND status = 'approved'
        ORDER BY created_at DESC`  
    ).all(course.id);

    ///// a logged in student can seee their own reviews that are still pending
    let myPending = [];
    if (req.session.user) {
        myPending = db.prepare(
            `SELECT id, rating, body, status, created_at FROM reviews
                WHERE course_id = ? AND user_id = ? AND status != 'approved'`
        ).all(course.id, req.session.user.id);
    }
    res.render('course', { course, reviews, myPending, error: null, submitted: req.query.submitted });
});

/// Uc-5 Submited review 
router.post('.course/:id/reviews', requireLogin, (req, res) => {
    const course = db.prepare('SELECT * FROM courses WHERE id = ? ').get(req.params.id);
    if (!course) {
        return res.status(404).render('error', { status: 404, message: 'Course not found' });
    }

    const rating = parseInt(req.body.reating, 10);
    const body = (req.body.body || '').trim();

    if (!(rating >= 1 && rating <= 5) || !body) {
        return res.status(400).render('error', { status: 400, message: 'A rating (1-5) and review text are requred' });
    }

    /// Secure default: every new reviews starts as pending 
    db.prepare('INSERT INTO reviews (course_id, user_id, rating, body) VALUES (?, ?, ?, ?)')
        .run(course.id, req.session.user.id, rating, body);
    
    res.redirect('/course/${course.id}?submitted=1');
});

module.exports = router;

