import { Router } from "express";
import {
  createDistrict,
  createRegion,
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
router.post("/regions", requireRole(ADMIN_ROLES), createRegion);
router.post("/regions/import", requireRole(ADMIN_ROLES), importRegions);
router.post("/districts", requireRole(ADMIN_ROLES), createDistrict);
router.post("/districts/import", requireRole(ADMIN_ROLES), importDistricts);

export default router;
