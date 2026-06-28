/**
 * roleCheck middleware
 * Usage: requireRole('owner', 'admin')  — allows owner OR admin
 *        requireRole('owner')           — owner only
 */

const ROLE_LEVELS = {
    admin: 3,
    dept_leader: 2,
    employee: 1
};

// Returns true if the given role has AT LEAST the required level
function hasMinLevel(role, minRole) {
    return (ROLE_LEVELS[role] || 0) >= (ROLE_LEVELS[minRole] || 0);
}

// Middleware: allow if role is one of the listed roles
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const role = req.headers['x-user-role'] || 'employee';
        if (allowedRoles.includes(role)) return next();
        return res.status(403).json({ error: `Access denied. Required role: ${allowedRoles.join(' or ')}.` });
    };
}

// Middleware: allow if role level >= minRole level
function requireMinRole(minRole) {
    return (req, res, next) => {
        const role = req.headers['x-user-role'] || 'employee';
        if (hasMinLevel(role, minRole)) return next();
        return res.status(403).json({ error: `Access denied. Requires ${minRole} level or above.` });
    };
}

module.exports = { requireRole, requireMinRole, hasMinLevel, ROLE_LEVELS };
