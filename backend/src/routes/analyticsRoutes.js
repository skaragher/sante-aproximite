import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/authMiddleware.js";
import { logEvent, getSummary } from "../controllers/analyticsController.js";

const router = Router();

// Log an event — all authenticated users
router.post("/event", requireAuth, logEvent);

// Stats — DEVELOPER, NATIONAL, REGULATOR only
router.get("/summary", requireAuth, requireRole(["DEVELOPER", "NATIONAL", "REGULATOR"]), getSummary);

export default router;
