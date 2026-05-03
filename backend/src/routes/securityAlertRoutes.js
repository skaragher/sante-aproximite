import { Router } from "express";
import {
  createSecurityAlert,
  getAllSecurityAlerts,
  updateSecurityAlertStatus,
  getMySecurityAlerts
} from "../controllers/securityAlertController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();

// Rôles pouvant lire et traiter les alertes sécurité
// Chaque service opérationnel ne voit que ses propres alertes (filtré par serviceFromRole)
// Les admins sanitaires (NATIONAL, REGULATOR, REGION, DISTRICT) voient tout
const SECURITY_READ_ROLES = [
  "DEVELOPER",
  "POLICE", "GENDARMERIE", "PROTECTION_CIVILE",
  "NATIONAL", "REGULATOR", "REGION", "DISTRICT"
];

// N'importe quel compte authentifié peut créer une alerte (appel mobile public)
router.post("/",     requireAuth, createSecurityAlert);
// L'utilisateur voit ses propres alertes (historique mobile)
router.get("/mine",  requireAuth, getMySecurityAlerts);
// Lecture et traitement réservés aux services habilités
router.get("/",      requireAuth, requireRole(SECURITY_READ_ROLES), getAllSecurityAlerts);
router.patch("/:id", requireAuth, requireRole(SECURITY_READ_ROLES), updateSecurityAlertStatus);

export default router;
