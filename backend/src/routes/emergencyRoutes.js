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
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();

// Opérations d'urgence : réservées aux services d'urgence uniquement
// NATIONAL / REGULATOR / REGION / DISTRICT n'ont pas accès aux données opérationnelles
const EMERGENCY_ROLES = ["SAMU", "SAPEUR_POMPIER", "DEVELOPER"];

router.post("/", requireAuth, requireRole(EMERGENCY_ROLES), createEmergencyReport);
router.get("/", requireAuth, requireRole(EMERGENCY_ROLES), getEmergencyReports);
router.get("/mine", requireAuth, requireRole(EMERGENCY_ROLES), getMyEmergencyReports);
router.post("/:id/acknowledge", requireAuth, requireRole(EMERGENCY_ROLES), acknowledgeEmergencyReport);
router.patch("/:id/progress", requireAuth, requireRole(EMERGENCY_ROLES), updateEmergencyProgress);
router.post("/bases", requireAuth, requireRole(EMERGENCY_ROLES), createEmergencyBase);
router.get("/bases", requireAuth, requireRole(EMERGENCY_ROLES), getEmergencyBases);
router.get("/bases/nearby", requireAuth, getNearbyEmergencyBases);

export default router;
