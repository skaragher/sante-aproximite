import { Router } from "express";
import {
  createUser,
  deleteUser,
  listPendingChefs,
  listUsers,
  reviewChef,
  setUserActiveStatus,
  updateUser
} from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();
const ADMIN_ROLES = [
  "NATIONAL", "REGULATOR",
  "REGION", "DISTRICT",
  "ETABLISSEMENT", "CHEF_ETABLISSEMENT",
  "SAMU", "SAPEUR_POMPIER"
];

router.use(requireAuth, requireRole(ADMIN_ROLES));
router.get("/", listUsers);
router.get("/pending-chefs", listPendingChefs);
router.post("/:id/review", reviewChef);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.patch("/:id/active", setUserActiveStatus);
router.delete("/:id", deleteUser);

export default router;
