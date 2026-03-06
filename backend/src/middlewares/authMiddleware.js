import { verifyToken } from "../services/authService.js";
import { pool } from "../config/db.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    const decoded = verifyToken(token);
    const userId = Number(decoded?.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Token invalide" });
    }

    const userResult = await pool.query(
      `
        SELECT id, full_name, email, role, is_active
        FROM users
        WHERE id = $1
        LIMIT 1;
      `,
      [userId]
    );
    if (userResult.rowCount === 0) {
      return res.status(401).json({ message: "Token invalide" });
    }

    const dbUser = userResult.rows[0];
    if (dbUser.is_active === false) {
      return res.status(403).json({ message: "Compte desactive" });
    }

    const rolesResult = await pool.query(
      `
        SELECT role
        FROM user_roles
        WHERE user_id = $1
        ORDER BY role ASC;
      `,
      [userId]
    );
    const roles = rolesResult.rows.map((row) => String(row.role || "").trim().toUpperCase()).filter(Boolean);
    req.user = {
      ...decoded,
      id: String(dbUser.id),
      fullName: dbUser.full_name,
      email: dbUser.email,
      role: String(dbUser.role || "").trim().toUpperCase(),
      roles: roles.length ? roles : [String(dbUser.role || "").trim().toUpperCase()].filter(Boolean),
      isActive: dbUser.is_active !== false
    };
    next();
  } catch {
    return res.status(401).json({ message: "Token invalide" });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    const expectedRoles = Array.isArray(role) ? role : [role];
    if (!req.user) {
      return res.status(403).json({ message: "Acces refuse" });
    }
    if (req.user.isActive === false) {
      return res.status(403).json({ message: "Compte desactive" });
    }
    const roles = Array.isArray(req.user.roles) && req.user.roles.length
      ? req.user.roles
      : [req.user.role].filter(Boolean);
    const hasRole = roles.some((r) => expectedRoles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ message: "Acces refuse" });
    }
    next();
  };
}
