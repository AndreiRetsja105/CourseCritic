//// rate my module - application entry point (baseline / main branch )
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

require('./db')  /// initial database and scheem 

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-only-secret', 
    resave: false, 
    saveUninitialized: false,
}));

app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

app.use('/', require('./routes/auth'));
app.use('/', require('./routes/courses'));
app.use('/moderation', require('./routes/moderation'));
app.use('/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));

//// 404 
app.use((req, res) => {
    res.status(404).render('error', { status: 404, message: 'page not found' });
});

/// eroors handler 
//// eslint - disable - next - line no-unused-vars 
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).render('error', { status: 500, message: 'Something went wrong' });
});

const port = process.env.PORT || 3000;
if (require.main === module ) {
      app.listen(port, (err) => {
    //// Express 5 calls this function with an error if the port is already in use
    if (err) {
      console.error(`Cannot start: port ${port} is already in use (${err.code}). Stop the other server first.`);
      process.exit(1);
    }
    console.log(`CourseCritic running on http://localhost:${port}`);
  });
}

module.exports = app;