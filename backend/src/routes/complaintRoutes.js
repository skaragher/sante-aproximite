import { Router } from "express";
import {
  addComplaintExplanation,
  createComplaintGeneric,
  getAllComplaints,
  getComplaintsSummary,
  getMyComplaints,
  submitComplaintFeedback,
  updateComplaintStatus
} from "../controllers/healthCenterController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();
const ADMIN_ROLES = ["REGULATOR", "NATIONAL", "REGION", "DISTRICT"];
const COMPLAINT_HANDLER_ROLES = [...ADMIN_ROLES, "ETABLISSEMENT", "CHEF_ETABLISSEMENT"];

router.post("/", requireAuth, createComplaintGeneric);
router.get("/mine", requireAuth, getMyComplaints);
router.post("/:id/feedback", requireAuth, submitComplaintFeedback);
router.get("/summary", requireAuth, getComplaintsSummary);
router.get("/", requireAuth, getAllComplaints);
router.patch("/:id/status", requireAuth, requireRole(ADMIN_ROLES), updateComplaintStatus);
router.post("/:id/explanation", requireAuth, requireRole(COMPLAINT_HANDLER_ROLES), addComplaintExplanation);

export default router;
