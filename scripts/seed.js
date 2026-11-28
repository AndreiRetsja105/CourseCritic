///// reset database and insert demo users, courses and reviews 
//// usege : npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs')
const db = require('../src/db')

//// Static demo users, their passwords and roles (for testing only)
const users = [
  { username: 'admin',     email: 'admin@coursecritic.local',     password: 'Admin123!',     role: 'admin' },
  { username: 'moderator', email: 'moderator@coursecritic.local', password: 'Moderator123!', role: 'moderator' },
  { username: 'alice',     email: 'alice@student.local',          password: 'Alice123!',     role: 'student' },
  { username: 'bob',       email: 'bob@student.local',            password: 'Bob123!',       role: 'student' },
];

//// Demo courses: [code, title, lecturer, department] 
const courses = [
  ['SAP401', 'Secure Application Programming', 'Dr. A. Byrne',   'Computing'],
  ['NET302', 'Network Security',               'Dr. C. Murphy',  'Computing'],
  ['DBS201', 'Database Systems',               'Ms. D. Kelly',   'Computing'],
  ['WEB210', 'Web Development',                'Mr. E. Walsh',   'Computing'],
  ['CRY410', 'Applied Cryptography',           'Dr. F. O\'Brien','Computing'],
  ['ETH300', 'Ethics in Computing',            'Dr. G. Ryan',    'Humanities'],
];

//// Everything is performed within a SINGLE transaction: either all data is added, or nothing is added at all.
//// 1) Deletion of old data and resetting of ID counters
//// 2) Addition of users (passwords are hashed using bcrypt; storing passwords in plain text is strictly avoided)
//// 3) Addition of courses and sample reviews (3 approved, 1 pending — to demonstrate the moderation process)
const reseed = db.transaction(() => {
    db.exec('DELETE FROM audit_log; DELETE FROM reviews; DELETE FROM courses; DELETE FROM users;');
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','courses','reviews','audit_log');");

    const insUser = db.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)');
    for (const u of users) insUser.run(u.username, u.email, bcrypt.hashSync(u.password, 10), u.role);

    const insCourse = db.prepare('INSERT INTO courses (code, title, lecturer, department) VALUES (?, ?, ?, ?)');
    for (const c of courses) insCourse.run(...c);

    const insReview = db.prepare(
        'INSERT INTO reviews (course_id, user_id, rating, body, status, moderated_by, moderated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    const now = new Date().toISOString();
    insReview.run(1, 3, 5, 'Great module, veripractical labs on OWASP top10.', 'approved', 2, now);
    insReview.run(1, 4, 4, 'Interesting content but the project is a lot of work.', 'approved', 2, now);
    insReview.run(2, 3, 3, 'Good lecture, slides could be clearer.', 'approved', 2, now);
    insReview.run(3, 4, 4, 'SQL practice was really useful.', 'pending', null, null);
});

reseed();
console.log('Database seeded. Demo accounts:');
for (const u of users) console.log(` ${u.role.padEnd(9)} ${u.username} / ${u.password}`);