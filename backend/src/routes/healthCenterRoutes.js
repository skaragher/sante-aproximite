import { Router } from "express";
import {
  addService,
  createComplaint,
  createCenter,
  deleteAllCenters,
  getCenterComplaints,
  getAllCenters,
  getNearbyCenters,
  importCenters,
  listPendingCenters,
  rateCenter,
  reviewCenter,
  updateCenter
} from "../controllers/healthCenterController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();
const ADMIN_ROLES = ["REGULATOR", "NATIONAL", "REGION", "DISTRICT"];
const ETABLISSEMENT_ROLES = ["ETABLISSEMENT", "CHEF_ETABLISSEMENT"];
const CENTER_CREATE_ROLES = [...new Set([...ETABLISSEMENT_ROLES, ...ADMIN_ROLES])];

router.get("/", requireAuth, getAllCenters);
router.get("/nearby", requireAuth, getNearbyCenters);
router.get("/pending", requireAuth, requireRole(ADMIN_ROLES), listPendingCenters);
router.delete("/all", requireAuth, requireRole(ADMIN_ROLES), deleteAllCenters);
router.get("/:id/complaints", requireAuth, getCenterComplaints);
router.post("/:id/review", requireAuth, requireRole(ADMIN_ROLES), reviewCenter);
router.post("/", requireAuth, requireRole(CENTER_CREATE_ROLES), createCenter);
router.put("/:id", requireAuth, requireRole(ETABLISSEMENT_ROLES), updateCenter);
router.post("/import", requireAuth, requireRole(ADMIN_ROLES), importCenters);
router.post("/:id/complaints", requireAuth, createComplaint);
router.post("/:id/services", requireAuth, requireRole(ETABLISSEMENT_ROLES), addService);
router.post("/:id/rating", requireAuth, rateCenter);

export default router;
