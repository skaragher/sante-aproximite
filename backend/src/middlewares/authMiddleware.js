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
        SELECT
          u.id, u.full_name, u.email, u.role, u.is_active,
          u.region_code, u.district_code, u.establishment_code, u.center_id,
          COALESCE(
            (SELECT array_agg(ur.role ORDER BY ur.role) FROM user_roles ur WHERE ur.user_id = u.id),
            ARRAY[u.role]
          ) AS roles
        FROM users u
        WHERE u.id = $1
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

    const roles = (Array.isArray(dbUser.roles) ? dbUser.roles : [])
      .map((r) => String(r || "").trim().toUpperCase())
      .filter(Boolean);
    req.user = {
      ...decoded,
      id: String(dbUser.id),
      fullName: dbUser.full_name,
      email: dbUser.email,
      role: String(dbUser.role || "").trim().toUpperCase(),
      roles: roles.length ? roles : [String(dbUser.role || "").trim().toUpperCase()].filter(Boolean),
      isActive: dbUser.is_active !== false,
      regionCode: dbUser.region_code ? String(dbUser.region_code).trim().toUpperCase() : null,
      districtCode: dbUser.district_code ? String(dbUser.district_code).trim().toUpperCase() : null,
      establishmentCode: dbUser.establishment_code ? String(dbUser.establishment_code).trim().toUpperCase() : null,
      centerId: dbUser.center_id != null && Number.isInteger(Number(dbUser.center_id)) ? Number(dbUser.center_id) : null
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
