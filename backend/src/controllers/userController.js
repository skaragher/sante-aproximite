import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

const ALLOWED_ADMIN_ROLES = new Set([
  "USER",
  "REGULATOR",
  "NATIONAL",
  "REGION",
  "DISTRICT",
  "ETABLISSEMENT",
  "SAPEUR_POMPIER",
  "SAMU",
  "POLICE",
  "GENDARMERIE",
  "PROTECTION_CIVILE"
]);

function normalizeRole(role) {
  const normalized = typeof role === "string" ? role.trim().toUpperCase() : "";
  if (!normalized) return "USER";
  if (normalized === "CHEF_ETABLISSEMENT") return "ETABLISSEMENT";
  if (normalized === "SAPEUR_POMPIER") return "SAPEUR_POMPIER";
  return ALLOWED_ADMIN_ROLES.has(normalized) ? normalized : "USER";
}

function normalizeRolesInput(rawRoles, fallbackRole = "USER") {
  const list = Array.isArray(rawRoles) ? rawRoles : [fallbackRole];
  const normalized = [...new Set(list.map((role) => normalizeRole(role)).filter(Boolean))];
  return normalized.length ? normalized : ["USER"];
}

function mapUser(row) {
  const roles =
    Array.isArray(row.roles) && row.roles.length
      ? row.roles
      : [row.role].filter(Boolean);
  return {
    id: String(row.id),
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    roles,
    isActive: row.is_active !== false,
    establishmentCode: row.establishment_code,
    regionCode: row.region_code || null,
    districtCode: row.district_code || null,
    centerId: row.center_id == null ? null : String(row.center_id),
    centerName: row.center_name || null,
    approvalStatus: row.approval_status,
    createdAt: row.created_at
  };
}

function normalizeGeoCode(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return normalized || null;
}

function normalizeCenterId(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

async function resolveUserAssignment(input, queryable = pool) {
  const payload = input || {};
  let establishmentCode =
    typeof payload.establishmentCode === "string" && payload.establishmentCode.trim()
      ? payload.establishmentCode.trim().toUpperCase()
      : null;
  let regionCode = normalizeGeoCode(payload.regionCode);
  let districtCode = normalizeGeoCode(payload.districtCode);
  const centerId = normalizeCenterId(payload.centerId);

  let regionFromDistrict = null;
  if (districtCode) {
    const districtResult = await queryable.query(
      "SELECT code, region_code FROM districts WHERE code = $1 LIMIT 1",
      [districtCode]
    );
    if (districtResult.rowCount === 0) {
      const error = new Error(`District introuvable: ${districtCode}`);
      error.status = 400;
      throw error;
    }
    regionFromDistrict = String(districtResult.rows[0].region_code || "").toUpperCase();
    if (regionCode && regionCode !== regionFromDistrict) {
      const error = new Error(`Le district ${districtCode} n'appartient pas a la region ${regionCode}`);
      error.status = 400;
      throw error;
    }
    regionCode = regionCode || regionFromDistrict;
  }

  if (regionCode) {
    const regionResult = await queryable.query("SELECT code FROM regions WHERE code = $1 LIMIT 1", [regionCode]);
    if (regionResult.rowCount === 0) {
      const error = new Error(`Region introuvable: ${regionCode}`);
      error.status = 400;
      throw error;
    }
  }

  let centerRow = null;
  if (centerId) {
    const centerResult = await queryable.query(
      `
        SELECT id, name, establishment_code, region_code, district_code
        FROM health_centers
        WHERE id = $1
        LIMIT 1;
      `,
      [centerId]
    );
    if (centerResult.rowCount === 0) {
      const error = new Error(`Centre introuvable: ${centerId}`);
      error.status = 400;
      throw error;
    }
    centerRow = centerResult.rows[0];
    const centerRegion = normalizeGeoCode(centerRow.region_code);
    const centerDistrict = normalizeGeoCode(centerRow.district_code);
    const centerCode =
      typeof centerRow.establishment_code === "string" && centerRow.establishment_code.trim()
        ? centerRow.establishment_code.trim().toUpperCase()
        : null;

    if (regionCode && centerRegion && regionCode !== centerRegion) {
      const error = new Error(
        `Le centre ${centerId} n'appartient pas a la region ${regionCode}`
      );
      error.status = 400;
      throw error;
    }
    if (districtCode && centerDistrict && districtCode !== centerDistrict) {
      const error = new Error(
        `Le centre ${centerId} n'appartient pas au district ${districtCode}`
      );
      error.status = 400;
      throw error;
    }

    regionCode = regionCode || centerRegion || null;
    districtCode = districtCode || centerDistrict || null;
    establishmentCode = establishmentCode || centerCode || null;
  }

  return {
    establishmentCode,
    regionCode,
    districtCode,
    centerId,
    centerName: centerRow?.name || null
  };
}

async function saveUserRoles(client, userId, roles) {
  await client.query("DELETE FROM user_roles WHERE user_id = $1", [Number(userId)]);
  for (const role of roles) {
    await client.query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT (user_id, role) DO NOTHING`,
      [Number(userId), role]
    );
  }
}

export async function listUsers(req, res) {
  const requesterRole = String(req.user?.role || "").toUpperCase();
  const requesterRoles = Array.isArray(req.user?.roles)
    ? req.user.roles.map((r) => String(r || "").toUpperCase())
    : [requesterRole];

  const effectiveRole =
    ["REGULATOR", "NATIONAL", "REGION", "DISTRICT"].find((r) => requesterRoles.includes(r)) ||
    requesterRole;

  const whereParts = [];
  const params = [];

  if (effectiveRole === "DISTRICT") {
    const districtCode = req.user?.districtCode || null;
    if (!districtCode) {
      return res.json([]);
    }
    whereParts.push(`upper(u.district_code) = $${params.length + 1}`);
    params.push(districtCode);
  } else if (effectiveRole === "REGION") {
    const regionCode = req.user?.regionCode || null;
    if (!regionCode) {
      return res.json([]);
    }
    whereParts.push(`upper(u.region_code) = $${params.length + 1}`);
    params.push(regionCode);
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

  const result = await pool.query(
    `
      SELECT
        u.id, u.full_name, u.email, u.role, u.is_active, u.created_at,
        u.establishment_code, u.region_code, u.district_code, u.center_id, u.approval_status,
        hc.name AS center_name,
        COALESCE(
          (
            SELECT array_agg(ur.role ORDER BY ur.role)
            FROM user_roles ur
            WHERE ur.user_id = u.id
          ),
          ARRAY[u.role]
        ) AS roles
      FROM users u
      LEFT JOIN health_centers hc ON hc.id = u.center_id
      ${whereClause}
      ORDER BY u.created_at DESC;
    `,
    params
  );

  return res.json(result.rows.map(mapUser));
}

export async function createUser(req, res) {
  const { fullName, email, password, role, roles } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "fullName, email et password sont obligatoires" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [normalizedEmail]);
  if (existing.rowCount > 0) {
    return res.status(409).json({ message: "Email deja utilise" });
  }

  const normalizedRoles = normalizeRolesInput(roles, role);
  const primaryRole = normalizedRoles[0];
  let assignment;
  try {
    assignment = await resolveUserAssignment(req.body);
  } catch (error) {
    return res.status(Number(error?.status || 400)).json({ message: error.message || "Affectation invalide" });
  }

  if (normalizedRoles.includes("REGION") && !assignment.regionCode) {
    return res.status(400).json({ message: "regionCode est obligatoire pour le role REGION" });
  }
  if (normalizedRoles.includes("DISTRICT") && !assignment.districtCode) {
    return res.status(400).json({ message: "districtCode est obligatoire pour le role DISTRICT" });
  }
  if (normalizedRoles.includes("ETABLISSEMENT") && !assignment.centerId && !assignment.establishmentCode) {
    return res.status(400).json({
      message: "centerId ou establishmentCode est obligatoire pour le role ETABLISSEMENT"
    });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const approvalStatus = "APPROVED";

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const created = await client.query(
      `
        INSERT INTO users (
          full_name,
          email,
          password_hash,
          role,
          establishment_code,
          region_code,
          district_code,
          center_id,
          approval_status,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
        RETURNING id, full_name, email, role, establishment_code, region_code, district_code, center_id, approval_status, is_active, created_at;
      `,
      [
        fullName.trim(),
        normalizedEmail,
        passwordHash,
        primaryRole,
        assignment.establishmentCode,
        assignment.regionCode,
        assignment.districtCode,
        assignment.centerId,
        approvalStatus
      ]
    );
    const user = created.rows[0];
    await saveUserRoles(client, user.id, normalizedRoles);
    await client.query("COMMIT");
    user.roles = normalizedRoles;
    user.center_name = assignment.centerName;
    return res.status(201).json(mapUser(user));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateUser(req, res) {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "ID utilisateur invalide" });
  }

  const {
    fullName,
    email,
    password,
    role,
    roles,
    establishmentCode,
    isActive
  } = req.body || {};

  const currentResult = await pool.query(
    `
      SELECT id, full_name, email, role, establishment_code, region_code, district_code, center_id, is_active, approval_status, created_at
      FROM users
      WHERE id = $1
      LIMIT 1;
    `,
    [userId]
  );
  if (currentResult.rowCount === 0) {
    return res.status(404).json({ message: "Utilisateur introuvable" });
  }

  const current = currentResult.rows[0];
  const normalizedRoles = normalizeRolesInput(roles, role || current.role);
  const primaryRole = normalizedRoles[0];
  const nextFullName = typeof fullName === "string" && fullName.trim() ? fullName.trim() : current.full_name;
  const nextEmail = typeof email === "string" && email.trim() ? email.toLowerCase().trim() : current.email;
  const nextEstablishmentCode = hasOwn(req.body, "establishmentCode")
    ? (typeof establishmentCode === "string" && establishmentCode.trim()
      ? establishmentCode.trim().toUpperCase()
      : null)
    : current.establishment_code;
  const nextRegionCode = hasOwn(req.body, "regionCode")
    ? normalizeGeoCode(req.body.regionCode)
    : normalizeGeoCode(current.region_code);
  const nextDistrictCode = hasOwn(req.body, "districtCode")
    ? normalizeGeoCode(req.body.districtCode)
    : normalizeGeoCode(current.district_code);
  const nextCenterId = hasOwn(req.body, "centerId")
    ? normalizeCenterId(req.body.centerId)
    : normalizeCenterId(current.center_id);
  const nextIsActive = typeof isActive === "boolean" ? isActive : current.is_active !== false;

  let assignment;
  try {
    assignment = await resolveUserAssignment({
      establishmentCode: nextEstablishmentCode,
      regionCode: nextRegionCode,
      districtCode: nextDistrictCode,
      centerId: nextCenterId
    });
  } catch (error) {
    return res.status(Number(error?.status || 400)).json({ message: error.message || "Affectation invalide" });
  }

  if (normalizedRoles.includes("REGION") && !assignment.regionCode) {
    return res.status(400).json({ message: "regionCode est obligatoire pour le role REGION" });
  }
  if (normalizedRoles.includes("DISTRICT") && !assignment.districtCode) {
    return res.status(400).json({ message: "districtCode est obligatoire pour le role DISTRICT" });
  }
  if (normalizedRoles.includes("ETABLISSEMENT") && !assignment.centerId && !assignment.establishmentCode) {
    return res.status(400).json({
      message: "centerId ou establishmentCode est obligatoire pour le role ETABLISSEMENT"
    });
  }
  if (String(req.user.id) === String(userId) && nextIsActive === false) {
    return res.status(400).json({ message: "Vous ne pouvez pas desactiver votre propre compte" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existingEmail = await client.query(
      "SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1",
      [nextEmail, userId]
    );
    if (existingEmail.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Email deja utilise" });
    }

    const passwordHash =
      typeof password === "string" && password.trim()
        ? await bcrypt.hash(password.trim(), 10)
        : null;

    const updated = await client.query(
      `
        UPDATE users
        SET
          full_name = $2,
          email = $3,
          role = $4,
          establishment_code = $5,
          region_code = $6,
          district_code = $7,
          center_id = $8,
          is_active = $9,
          password_hash = COALESCE($10, password_hash),
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, full_name, email, role, establishment_code, region_code, district_code, center_id, approval_status, is_active, created_at;
      `,
      [
        userId,
        nextFullName,
        nextEmail,
        primaryRole,
        assignment.establishmentCode,
        assignment.regionCode,
        assignment.districtCode,
        assignment.centerId,
        nextIsActive,
        passwordHash
      ]
    );

    await saveUserRoles(client, userId, normalizedRoles);
    await client.query("COMMIT");
    const user = updated.rows[0];
    user.roles = normalizedRoles;
    user.center_name = assignment.centerName;
    return res.json(mapUser(user));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function setUserActiveStatus(req, res) {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "ID utilisateur invalide" });
  }
  const isActive = !!req.body?.isActive;
  if (String(req.user.id) === String(userId) && isActive === false) {
    return res.status(400).json({ message: "Vous ne pouvez pas desactiver votre propre compte" });
  }

  const updated = await pool.query(
    `
      UPDATE users
      SET is_active = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, full_name, email, role, establishment_code, region_code, district_code, center_id, approval_status, is_active, created_at;
    `,
    [userId, isActive]
  );
  if (updated.rowCount === 0) {
    return res.status(404).json({ message: "Utilisateur introuvable" });
  }
  const user = updated.rows[0];
  const roles = await pool.query("SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role ASC", [userId]);
  user.roles = roles.rows.map((r) => r.role);
  return res.json(mapUser(user));
}

export async function deleteUser(req, res) {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "ID utilisateur invalide" });
  }

  if (String(req.user.id) === String(userId)) {
    return res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte" });
  }

  const deleted = await pool.query(
    `
      DELETE FROM users
      WHERE id = $1
      RETURNING id;
    `,
    [userId]
  );

  if (deleted.rowCount === 0) {
    return res.status(404).json({ message: "Utilisateur introuvable" });
  }

  return res.status(204).send();
}

export async function listPendingChefs(req, res) {
  const result = await pool.query(
    `
      SELECT id, full_name, email, role, establishment_code, region_code, district_code, center_id, approval_status, is_active, created_at
      FROM users
      WHERE role = 'ETABLISSEMENT' AND approval_status = 'PENDING'
      ORDER BY created_at ASC;
    `
  );

  return res.json(result.rows.map(mapUser));
}

export async function reviewChef(req, res) {
  const userId = Number(req.params.id);
  const action = req.body?.action === "REJECT" ? "REJECT" : "APPROVE";
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "ID utilisateur invalide" });
  }

  const status = action === "APPROVE" ? "APPROVED" : "REJECTED";
  const updated = await pool.query(
    `
      UPDATE users
      SET approval_status = $2, updated_at = NOW()
      WHERE id = $1 AND role = 'ETABLISSEMENT'
      RETURNING id, full_name, email, role, establishment_code, region_code, district_code, center_id, approval_status, is_active, created_at;
    `,
    [userId, status]
  );

  if (updated.rowCount === 0) {
    return res.status(404).json({ message: "Chef introuvable" });
  }

  const user = updated.rows[0];
  const roles = await pool.query("SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role ASC", [userId]);
  user.roles = roles.rows.map((r) => r.role);
  return res.json(mapUser(user));
}
