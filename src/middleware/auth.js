//// Authentification and autherisation helpers ///////
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login?next=' + encodeURIComponent(req.originalURL));
    }
    next();
}

/////// usege: reqired Roles >>>moderator <<< or >>>or you admin<<<
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.sesion.user) return res.redirect('/login');
        if (!roles.includes(req.session.user.role)) {
            return res.status(403).render('error', { status:: 403, message: 'You don;t have permission to view this page '});
        }
        next();
    };
}

module.exports = { requireLogin, requireRole};