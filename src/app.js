//// Course Critic - application entry point secure branch
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const { csrfSync } = require('csrf-sync');

require('./db'); //// initialise database and schema

const { audit } = require('./logger');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

//// SECURE #20 security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],      // only load content from this site
      scriptSrc: ["'self'"],       // no inline scripts, no scripts from other sites (blocks most XSS)
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      objectSrc: ["'none'"],       // no flash /plugins
      frameAncestors: ["'none'"],  // the site cannot be put in an iframe (clickjacking)
      formAction: ["'self'"],      // forms can only be sent to this site
      baseUri: ["'self'"],
      upgradeInsecureRequests: null, // the demo runs on localhost
    },
  },
  frameguard: { action: 'deny' },  // X-frame options will be: deny the older browsers
}));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

//// SECURE #19 sesion management
app.use(session({
  name: 'cc.sid',                    // do not reveal the framework (default name is connect.sid)
  secret: process.env.SESSION_SECRET || 'dev-only-secret',
  resave: false,
  saveUninitialized: false,
  rolling: true,                     // every request resets the idle timer
  cookie: {
    httpOnly: true,                  // JavaScript and XSS canot read the cookie
    sameSite: 'lax',                 // the cookie is not sent with cross site the POST requests
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    maxAge: 20 * 60 * 1000,          // idle timeout: 20 minutes
  },
}));

//// makes the logged-in user available in every view
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

//// SECURE #18 Csrf protection with the synchroniser token pattern
//// A secret random token is stored in the session and must be sent with every POST form.
const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => req.body && req.body._csrf,
});
app.use((req, res, next) => {
  res.locals.csrfToken = generateToken(req);
  next();
});
app.use(csrfSynchronisedProtection);

app.use('/', require('./routes/auth'));
app.use('/', require('./routes/courses'));
app.use('/moderation', require('./routes/moderation'));
app.use('/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));

//// 404 - page not found
app.use((req, res) => {
    res.status(404).render('error', { status: 404, message: 'Page not found.' });
});

//// eror handler
// eslint disable next line no-unused-vars
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        //// SECURE (#18): request without a valid CSRF token is rejected and logged
        audit(req, 'CSRF_REJECTED', `${req.method} ${req.originalUrl}`);
        return res.status(403).render('error', { status: 403, message: 'Invalid or missing form token. Please reload the page and try again.' });
    }
    //// SECURE #17 full details go to the server log only;
    //// the user sees a generic message with no stack trace (fail securely)
    audit(req, 'SERVER_ERROR', err.message);
    console.error(err);
    res.status(500).render('error', { status: 500, message: 'Something went wrong.' });
});

const port = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(port, (err) => {
        //// express 5 calls this function with an eror if the port is already in use
        if (err) {
            console.error(`Cannot start: port ${port} is already in use (${err.code}). Stop the other server first.`);
            process.exit(1);
        }
        console.log(`CourseCritic running on http://localhost:${port}`);
    });
}

module.exports = app;