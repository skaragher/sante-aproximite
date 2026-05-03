import { pool } from "../config/db.js";
import { ALL_PERMISSIONS } from "../config/permissions.js";

const VALID_PERMISSION_KEYS = new Set(ALL_PERMISSIONS.map((p) => p.key));

export async function ensureRbacTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rbac_roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS rbac_role_permissions (
      role_id INT REFERENCES rbac_roles(id) ON DELETE CASCADE,
      permission VARCHAR(100) NOT NULL,
      PRIMARY KEY (role_id, permission)
    );
    CREATE TABLE IF NOT EXISTS rbac_user_roles (
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      role_id INT REFERENCES rbac_roles(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, role_id)
    );
  `);
}

export async function getUserPermissions(userId) {
  const result = await pool.query(
    `SELECT DISTINCT rp.permission
     FROM rbac_user_roles ur
     JOIN rbac_role_permissions rp ON rp.role_id = ur.role_id
     WHERE ur.user_id = $1`,
    [Number(userId)]
  );
  return result.rows.map((r) => r.permission);
}

export async function listPermissions(req, res) {
  return res.json(ALL_PERMISSIONS);
}

export async function listRoles(req, res) {
  const result = await pool.query(`
    SELECT
      r.id, r.name, r.description, r.created_at,
      COALESCE(
        array_agg(DISTINCT rp.permission ORDER BY rp.permission)
        FILTER (WHERE rp.permission IS NOT NULL), '{}'
      ) AS permissions,
      COALESCE(
        array_agg(DISTINCT ur.user_id)
        FILTER (WHERE ur.user_id IS NOT NULL), '{}'
      ) AS user_ids
    FROM rbac_roles r
    LEFT JOIN rbac_role_permissions rp ON rp.role_id = r.id
    LEFT JOIN rbac_user_roles ur ON ur.role_id = r.id
    GROUP BY r.id
    ORDER BY r.name ASC
  `);
  return res.json(result.rows);
}

export async function createRole(req, res) {
  const name = String(req.body?.name || "").trim();
  const description = String(req.body?.description || "").trim();
  const permissions = Array.isArray(req.body?.permissions)
    ? req.body.permissions.filter((p) => VALID_PERMISSION_KEYS.has(p))
    : [];

  if (!name) return res.status(400).json({ message: "Le nom du rôle est obligatoire" });

  const existing = await pool.query("SELECT id FROM rbac_roles WHERE name = $1 LIMIT 1", [name]);
  if (existing.rowCount > 0) return res.status(409).json({ message: "Un rôle avec ce nom existe déjà" });

  const created = await pool.query(
    "INSERT INTO rbac_roles (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at",
    [name, description]
  );
  const roleId = created.rows[0].id;

  if (permissions.length > 0) {
    const values = permissions.map((_, i) => `($1, $${i + 2})`).join(", ");
    await pool.query(
      `INSERT INTO rbac_role_permissions (role_id, permission) VALUES ${values} ON CONFLICT DO NOTHING`,
      [roleId, ...permissions]
    );
  }

  return res.status(201).json({ ...created.rows[0], permissions, user_ids: [] });
}

export async function updateRole(req, res) {
  const roleId = Number(req.params.id);
  if (!Number.isInteger(roleId) || roleId <= 0) return res.status(400).json({ message: "ID invalide" });

  const name = String(req.body?.name || "").trim();
  const description = String(req.body?.description || "").trim();
  const permissions = Array.isArray(req.body?.permissions)
    ? req.body.permissions.filter((p) => VALID_PERMISSION_KEYS.has(p))
    : [];

  if (!name) return res.status(400).json({ message: "Le nom du rôle est obligatoire" });

  const existing = await pool.query("SELECT id FROM rbac_roles WHERE id = $1 LIMIT 1", [roleId]);
  if (existing.rowCount === 0) return res.status(404).json({ message: "Rôle introuvable" });

  await pool.query(
    "UPDATE rbac_roles SET name = $1, description = $2, updated_at = NOW() WHERE id = $3",
    [name, description, roleId]
  );
  await pool.query("DELETE FROM rbac_role_permissions WHERE role_id = $1", [roleId]);

  if (permissions.length > 0) {
    const values = permissions.map((_, i) => `($1, $${i + 2})`).join(", ");
    await pool.query(
      `INSERT INTO rbac_role_permissions (role_id, permission) VALUES ${values} ON CONFLICT DO NOTHING`,
      [roleId, ...permissions]
    );
  }

  return res.json({ id: roleId, name, description, permissions });
}

export async function deleteRole(req, res) {
  const roleId = Number(req.params.id);
  if (!Number.isInteger(roleId) || roleId <= 0) return res.status(400).json({ message: "ID invalide" });

  const result = await pool.query("DELETE FROM rbac_roles WHERE id = $1 RETURNING id", [roleId]);
  if (result.rowCount === 0) return res.status(404).json({ message: "Rôle introuvable" });

  return res.json({ message: "Rôle supprimé" });
}

export async function assignUsersToRole(req, res) {
  const roleId = Number(req.params.id);
  if (!Number.isInteger(roleId) || roleId <= 0) return res.status(400).json({ message: "ID invalide" });

  const userIds = Array.isArray(req.body?.userIds)
    ? req.body.userIds.map(Number).filter((n) => Number.isInteger(n) && n > 0)
    : [];

  const existing = await pool.query("SELECT id FROM rbac_roles WHERE id = $1 LIMIT 1", [roleId]);
  if (existing.rowCount === 0) return res.status(404).json({ message: "Rôle introuvable" });

  await pool.query("DELETE FROM rbac_user_roles WHERE role_id = $1", [roleId]);

  if (userIds.length > 0) {
    const values = userIds.map((_, i) => `($${i + 1}, $${userIds.length + 1})`).join(", ");
    await pool.query(
      `INSERT INTO rbac_user_roles (user_id, role_id) VALUES ${values} ON CONFLICT DO NOTHING`,
      [...userIds, roleId]
    );
  }

  return res.json({ message: "Utilisateurs mis à jour pour ce rôle" });
}
