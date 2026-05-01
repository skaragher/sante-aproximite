import { pool } from "../config/db.js";

function normalizeGeoCode(value) {
  if (typeof value !== "string") return null;
  const cleaned = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return cleaned || null;
}

function normalizeLabel(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function mapRegion(row) {
  return {
    code: row.code,
    name: row.name,
    districtCount: Number(row.district_count || 0),
    createdAt: row.created_at
  };
}

function mapDistrict(row) {
  return {
    code: row.code,
    name: row.name,
    regionCode: row.region_code,
    regionName: row.region_name || null,
    createdAt: row.created_at
  };
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[;"\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function sendCsv(res, filename, headers, rows) {
  const content = [
    headers.join(";"),
    ...rows.map((row) => row.map((value) => csvCell(value)).join(";"))
  ].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(`\uFEFF${content}`);
}

export async function listRegions(req, res) {
  const result = await pool.query(
    `
      SELECT
        r.code,
        r.name,
        r.created_at,
        (
          SELECT COUNT(*)
          FROM districts d
          WHERE d.region_code = r.code
        ) AS district_count
      FROM regions r
      ORDER BY r.name ASC;
    `
  );
  return res.json(result.rows.map(mapRegion));
}

export async function exportRegions(req, res) {
  const result = await pool.query(
    `
      SELECT
        r.code,
        r.name,
        (
          SELECT COUNT(*)
          FROM districts d
          WHERE d.region_code = r.code
        ) AS district_count,
        r.created_at
      FROM regions r
      ORDER BY r.name ASC;
    `
  );

  return sendCsv(
    res,
    "regions_sante_aproximite.csv",
    ["code", "name", "districtCount", "createdAt"],
    result.rows.map((row) => [row.code, row.name, Number(row.district_count || 0), row.created_at || ""])
  );
}

export async function createRegion(req, res) {
  const code = normalizeGeoCode(req.body?.code);
  const name = normalizeLabel(req.body?.name);

  if (!code || !name) {
    return res.status(400).json({ message: "code et name sont obligatoires" });
  }

  try {
    const inserted = await pool.query(
      `
        INSERT INTO regions (code, name, created_by)
        VALUES ($1, $2, $3)
        RETURNING code, name, created_at;
      `,
      [code, name, Number(req.user.id)]
    );
    return res.status(201).json(mapRegion(inserted.rows[0]));
  } catch (error) {
    if (String(error?.code) === "23505") {
      return res.status(409).json({ message: "Ce code region existe deja" });
    }
    throw error;
  }
}

export async function importRegions(req, res) {
  const payload = Array.isArray(req.body?.regions) ? req.body.regions : req.body;
  const regions = Array.isArray(payload) ? payload : [];
  if (regions.length === 0) {
    return res.status(400).json({
      message: "Envoyez un tableau de regions dans le body ou dans la cle 'regions'"
    });
  }

  const cleaned = [];
  const errors = [];

  regions.forEach((region, index) => {
    const code = normalizeGeoCode(region?.code);
    const name = normalizeLabel(region?.name);
    if (!code || !name) {
      errors.push({ index, message: "code et name sont obligatoires" });
      return;
    }
    cleaned.push({ code, name });
  });

  if (errors.length > 0) {
    return res.status(400).json({ message: "Des lignes regions sont invalides", errors });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const region of cleaned) {
      await client.query(
        `
          INSERT INTO regions (code, name, created_by)
          VALUES ($1, $2, $3)
          ON CONFLICT (code) DO UPDATE
          SET name = EXCLUDED.name, updated_at = NOW();
        `,
        [region.code, region.name, Number(req.user.id)]
      );
    }
    await client.query("COMMIT");
    return res.status(201).json({ importedCount: cleaned.length });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listDistricts(req, res) {
  const regionCode = normalizeGeoCode(req.query?.regionCode);
  const params = [];
  let whereClause = "";
  if (regionCode) {
    params.push(regionCode);
    whereClause = "WHERE d.region_code = $1";
  }

  const result = await pool.query(
    `
      SELECT
        d.code,
        d.name,
        d.region_code,
        r.name AS region_name,
        d.created_at
      FROM districts d
      JOIN regions r ON r.code = d.region_code
      ${whereClause}
      ORDER BY d.name ASC;
    `,
    params
  );
  return res.json(result.rows.map(mapDistrict));
}

export async function exportDistricts(req, res) {
  const result = await pool.query(
    `
      SELECT
        d.code,
        d.name,
        d.region_code,
        r.name AS region_name,
        d.created_at
      FROM districts d
      JOIN regions r ON r.code = d.region_code
      ORDER BY r.name ASC, d.name ASC;
    `
  );

  return sendCsv(
    res,
    "districts_sante_aproximite.csv",
    ["code", "name", "regionCode", "regionName", "createdAt"],
    result.rows.map((row) => [row.code, row.name, row.region_code, row.region_name || "", row.created_at || ""])
  );
}

export async function createDistrict(req, res) {
  const code = normalizeGeoCode(req.body?.code);
  const name = normalizeLabel(req.body?.name);
  const regionCode = normalizeGeoCode(req.body?.regionCode);

  if (!code || !name || !regionCode) {
    return res.status(400).json({ message: "code, name et regionCode sont obligatoires" });
  }

  const region = await pool.query("SELECT code FROM regions WHERE code = $1 LIMIT 1", [regionCode]);
  if (region.rowCount === 0) {
    return res.status(400).json({ message: "La region specifiee n'existe pas" });
  }

  try {
    const inserted = await pool.query(
      `
        INSERT INTO districts (code, name, region_code, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING code, name, region_code, created_at;
      `,
      [code, name, regionCode, Number(req.user.id)]
    );
    return res.status(201).json(mapDistrict(inserted.rows[0]));
  } catch (error) {
    if (String(error?.code) === "23505") {
      return res.status(409).json({ message: "Ce code district existe deja" });
    }
    throw error;
  }
}

export async function importDistricts(req, res) {
  const payload = Array.isArray(req.body?.districts) ? req.body.districts : req.body;
  const districts = Array.isArray(payload) ? payload : [];
  if (districts.length === 0) {
    return res.status(400).json({
      message: "Envoyez un tableau de districts dans le body ou dans la cle 'districts'"
    });
  }

  const cleaned = [];
  const errors = [];

  districts.forEach((district, index) => {
    const code = normalizeGeoCode(district?.code);
    const name = normalizeLabel(district?.name);
    const regionCode = normalizeGeoCode(district?.regionCode ?? district?.region_code ?? district?.region);
    if (!code || !name || !regionCode) {
      errors.push({ index, message: "code, name et regionCode sont obligatoires" });
      return;
    }
    cleaned.push({ code, name, regionCode });
  });

  if (errors.length > 0) {
    return res.status(400).json({ message: "Des lignes districts sont invalides", errors });
  }

  const existingRegions = await pool.query("SELECT code FROM regions");
  const regionSet = new Set(existingRegions.rows.map((row) => row.code));
  cleaned.forEach((district, index) => {
    if (!regionSet.has(district.regionCode)) {
      errors.push({ index, message: `Region introuvable pour regionCode=${district.regionCode}` });
    }
  });
  if (errors.length > 0) {
    return res.status(400).json({ message: "Import districts invalide", errors });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const district of cleaned) {
      await client.query(
        `
          INSERT INTO districts (code, name, region_code, created_by)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (code) DO UPDATE
          SET
            name = EXCLUDED.name,
            region_code = EXCLUDED.region_code,
            updated_at = NOW();
        `,
        [district.code, district.name, district.regionCode, Number(req.user.id)]
      );
    }
    await client.query("COMMIT");
    return res.status(201).json({ importedCount: cleaned.length });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
