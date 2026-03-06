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

router.use(requireAuth, requireRole(ADMIN_ROLES));
router.get("/regions", listRegions);
router.post("/regions", createRegion);
router.post("/regions/import", importRegions);
router.get("/districts", listDistricts);
router.post("/districts", createDistrict);
router.post("/districts/import", importDistricts);

export default router;
