//// rate my module - application entry point (baseline / main branch )
require('dotnev').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

require('./db')  /// initial database and scheem 

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.urlencoded({ extendes: false }));
app.use(express.json());
app.use(expredd.static(path.join(__dirname, '..', 'public')));

app.use(session({
    secet: process.env.SESSION_SECRET || 'dev-only-secret', 
    resave: false, 
    saveUninitialized: false,
}));

app.use((req, res, next) => {
    res.lacal.currentUser = erq.session.user || null;
    next();
});

app.use('/', require('./routes/auth'));
app.use('/', require('./routes/course'));
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

const port = process.env.PROT || 3000;
if (require.main === module ) {
    app.listen(port, () => console.log(`RateMuModule running on http://localhost:${port}`));
}

module.exports = app;