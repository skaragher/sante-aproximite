import { Router } from "express";
import {
  createDistrict,
  createRegion,
  exportDistricts,
  exportRegions,
  importDistricts,
  importRegions,
  listDistricts,
  listRegions
} from "../controllers/geoController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();
const ADMIN_ROLES = ["REGULATOR", "NATIONAL", "REGION", "DISTRICT"];

router.use(requireAuth);
router.get("/regions", listRegions);
router.get("/districts", listDistricts);
router.get("/regions/export", requireRole(ADMIN_ROLES), exportRegions);
router.get("/districts/export", requireRole(ADMIN_ROLES), exportDistricts);
router.post("/regions", requireRole(ADMIN_ROLES), createRegion);
router.post("/regions/import", requireRole(ADMIN_ROLES), importRegions);
router.post("/districts", requireRole(ADMIN_ROLES), createDistrict);
router.post("/districts/import", requireRole(ADMIN_ROLES), importDistricts);

export default router;
