import { Router } from "express";
import {
  createSecurityAlert,
  getAllSecurityAlerts,
  updateSecurityAlertStatus,
  getMySecurityAlerts
} from "../controllers/securityAlertController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/",          requireAuth, createSecurityAlert);
router.get("/mine",       requireAuth, getMySecurityAlerts);
router.get("/",           requireAuth, getAllSecurityAlerts);
router.patch("/:id",      requireAuth, updateSecurityAlertStatus);

export default router;
