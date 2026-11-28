//// Authentification and autherisation helpers ///////

const { audit } = require('../logger');
//// requireLogin: onlylogged in users can continue
/// if not logged in: redirect to / login and remmber the page they wanted 
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
    }
    next();
}

/////// usege: reqired Roles >>>moderator <<< or >>>or you admin<<<
///wrong role: 403 
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.session.user) return res.redirect('/login');
        if (!roles.includes(req.session.user.role)) {
            //// SECURE (#22): attempts to open pages without permission are logged
            audit(req, 'ACCESS_DENIED', `${req.method} ${req.originalUrl}`);
            return res.status(403).render('error', { status: 403, message: 'You do not have permission to view this page '});
        }
        next();
    };
}

module.exports = { requireLogin, requireRole};