import { Router } from "express";
import {
  acknowledgeEmergencyReport,
  createEmergencyBase,
  createEmergencyReport,
  getEmergencyBases,
  getEmergencyReports,
  getMyEmergencyReports,
  getNearbyEmergencyBases,
  updateEmergencyProgress
} from "../controllers/emergencyController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/", requireAuth, createEmergencyReport);
router.get("/", requireAuth, getEmergencyReports);
router.get("/mine", requireAuth, getMyEmergencyReports);
router.post("/:id/acknowledge", requireAuth, acknowledgeEmergencyReport);
router.patch("/:id/progress", requireAuth, updateEmergencyProgress);
router.post("/bases", requireAuth, createEmergencyBase);
router.get("/bases", requireAuth, getEmergencyBases);
router.get("/bases/nearby", requireAuth, getNearbyEmergencyBases);

export default router;
