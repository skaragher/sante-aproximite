import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { contactDeveloper, submitDigitalProject } from "../controllers/contactController.js";

const router = Router();

router.use(requireAuth);
router.post("/developer", contactDeveloper);
router.post("/digital-project", submitDigitalProject);

export default router;
