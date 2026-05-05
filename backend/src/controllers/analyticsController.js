import { pool } from "../config/db.js";

export async function logEvent(req, res) {
  const { module, action, metadata } = req.body || {};
  if (!module || !action) {
    return res.status(400).json({ message: "module et action sont requis" });
  }
  const userId = req.user?.id ? Number(req.user.id) : null;
  const userRole = req.user?.role || req.body?.role || null;

  await pool.query(
    `INSERT INTO analytics_events (user_id, user_role, module, action, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, userRole, String(module), String(action), metadata ? JSON.stringify(metadata) : null]
  );

  res.json({ ok: true });
}

export async function getSummary(req, res) {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const interval = `${days} days`;

  const [byModule, byAction, byRole, daily, uniqueUsers, totalRow, publicVsPro] =
    await Promise.all([
      pool.query(
        `SELECT module, COUNT(*) AS count
         FROM analytics_events
         WHERE created_at > NOW() - $1::interval
         GROUP BY module ORDER BY count DESC`,
        [interval]
      ),
      pool.query(
        `SELECT module, action, COUNT(*) AS count
         FROM analytics_events
         WHERE created_at > NOW() - $1::interval
         GROUP BY module, action ORDER BY count DESC LIMIT 50`,
        [interval]
      ),
      pool.query(
        `SELECT COALESCE(user_role, 'anonyme') AS user_role, COUNT(*) AS count
         FROM analytics_events
         WHERE created_at > NOW() - $1::interval
         GROUP BY user_role ORDER BY count DESC`,
        [interval]
      ),
      pool.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS count
         FROM analytics_events
         WHERE created_at > NOW() - $1::interval
         GROUP BY day ORDER BY day`,
        [interval]
      ),
      pool.query(
        `SELECT COUNT(DISTINCT user_id) AS count
         FROM analytics_events
         WHERE created_at > NOW() - $1::interval AND user_id IS NOT NULL`,
        [interval]
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM analytics_events
         WHERE created_at > NOW() - $1::interval`,
        [interval]
      ),
      pool.query(
        `SELECT
           SUM(CASE WHEN user_role = 'USER' THEN 1 ELSE 0 END) AS public_count,
           SUM(CASE WHEN user_role != 'USER' AND user_role IS NOT NULL THEN 1 ELSE 0 END) AS pro_count,
           SUM(CASE WHEN user_role IS NULL THEN 1 ELSE 0 END) AS anon_count
         FROM analytics_events
         WHERE created_at > NOW() - $1::interval`,
        [interval]
      ),
    ]);

  res.json({
    period: days,
    total: Number(totalRow.rows[0]?.count || 0),
    uniqueUsers: Number(uniqueUsers.rows[0]?.count || 0),
    byModule: byModule.rows.map((r) => ({ module: r.module, count: Number(r.count) })),
    byAction: byAction.rows.map((r) => ({ module: r.module, action: r.action, count: Number(r.count) })),
    byRole: byRole.rows.map((r) => ({ role: r.user_role, count: Number(r.count) })),
    daily: daily.rows.map((r) => ({ day: r.day, count: Number(r.count) })),
    publicVsPro: {
      public: Number(publicVsPro.rows[0]?.public_count || 0),
      pro: Number(publicVsPro.rows[0]?.pro_count || 0),
      anon: Number(publicVsPro.rows[0]?.anon_count || 0),
    },
  });
}
