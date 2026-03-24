import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import {
    getAdminDashboard,
    getAllStudentsAdmin,
    getStudentDetailAdmin,
    getAllDemosAdmin,
    getStaffList,
    createStaff,
    updateStaff,
    resetStaffPassword,
} from "../controllers/admin.controller.js";

const router = Router();

// All admin routes require JWT + admin role
router.use(verifyJWT, authorizeRoles("admin"));

// Dashboard
router.get("/dashboard", getAdminDashboard);

// Students
router.get("/students", getAllStudentsAdmin);
router.get("/students/:id", getStudentDetailAdmin);

// Demos
router.get("/demos", getAllDemosAdmin);

// Staff management
router.get("/staff", getStaffList);
router.post("/staff", createStaff);
router.patch("/staff/:id", updateStaff);
router.patch("/staff/:id/reset-password", resetStaffPassword);

export default router;
