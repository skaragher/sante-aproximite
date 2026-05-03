import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";
import {
  assignUsersToRole,
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  updateRole,
} from "../controllers/rbacController.js";

const router = Router();
const RBAC_ADMIN_ROLES = ["NATIONAL", "REGULATOR"];

router.get("/permissions", requireAuth, listPermissions);
router.get("/roles", requireAuth, listRoles);
router.post("/roles", requireAuth, requireRole(RBAC_ADMIN_ROLES), createRole);
router.put("/roles/:id", requireAuth, requireRole(RBAC_ADMIN_ROLES), updateRole);
router.delete("/roles/:id", requireAuth, requireRole(RBAC_ADMIN_ROLES), deleteRole);
router.put("/roles/:id/users", requireAuth, requireRole(RBAC_ADMIN_ROLES), assignUsersToRole);

export default router;
